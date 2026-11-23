import { NextResponse } from 'next/server';
import { getSystemLogs, clearSystemLogs, writeLog } from '@/lib/logger';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

// GET: Fetch system logs & live health diagnostics
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  // 1. Check Supabase Connectivity
  let supabaseStatus = { ok: false, status: 'error', latencyMs: null, message: 'Unchecked' };
  const startPing = Date.now();
  try {
    const { error } = await supabase.from('homework').select('id').limit(1);
    const latency = Date.now() - startPing;
    if (!error) {
      supabaseStatus = { ok: true, status: 'connected', latencyMs: latency, message: `Connected (${latency}ms)` };
    } else {
      supabaseStatus = { ok: false, status: 'error', latencyMs: latency, message: error.message };
    }
  } catch (err) {
    supabaseStatus = { ok: false, status: 'error', latencyMs: Date.now() - startPing, message: err.message };
  }

  // 2. Check Gemini AI Key Configuration
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);

  // 3. Read Persistent Logs
  const logs = getSystemLogs(limit);

  return NextResponse.json({
    success: true,
    health: {
      supabase: supabaseStatus,
      gemini: {
        configured: hasGeminiKey,
        mode: hasGeminiKey ? 'Gemini Flash 2.0 API' : 'Smart Rule Engine (Zero-Token Fallback)'
      },
      server: {
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      }
    },
    count: logs.length,
    data: logs
  });
}

// POST: Client-side error telemetry ingest
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { level = 'error', tag = 'CLIENT', message = 'Client reported event', meta = {} } = body;

    const entry = writeLog(level, tag, message, meta);

    return NextResponse.json({ success: true, entry });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Clear all logs
export async function DELETE() {
  const ok = clearSystemLogs();
  writeLog('info', 'SYSTEM', 'Admin cleared system logs.');
  return NextResponse.json({ success: ok, message: 'Logs cleared.' });
}
