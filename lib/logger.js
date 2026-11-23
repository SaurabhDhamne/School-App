import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'data', 'system_logs.json');
const MAX_LOGS = 150;

function ensureLogFile() {
  try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, JSON.stringify([]), 'utf8');
    }
  } catch (e) {
    // Quiet fail on restricted environments
  }
}

// Read recent logs from disk (server-only)
export function getSystemLogs(limit = 100) {
  ensureLogFile();
  try {
    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, limit);
        }
      }
    }
  } catch (err) {
    console.error('Failed to read system logs from disk:', err.message);
  }
  return [];
}

// Clear all system logs from disk
export function clearSystemLogs() {
  ensureLogFile();
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify([]), 'utf8');
    return true;
  } catch (err) {
    return false;
  }
}

// Core append log function
export function writeLog(level, tag, message, meta = null) {
  const timestamp = new Date().toISOString();
  const readableTime = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const entry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp,
    readableTime,
    level: level.toUpperCase(), // 'INFO' | 'WARN' | 'ERROR'
    tag: tag ? tag.toUpperCase() : 'SYSTEM',
    message,
    meta: meta ? (typeof meta === 'object' ? meta : { value: String(meta) }) : null
  };

  // 1. Formatted Terminal Console Output
  const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m';
  const reset = '\x1b[0m';
  console.log(`${color}[${entry.readableTime}] [${entry.level}] [${entry.tag}]${reset} ${message}`);
  if (meta) {
    try {
      console.log('   ↳', JSON.stringify(meta));
    } catch (_) {}
  }

  // 2. Persist to Disk File (Capped at MAX_LOGS entries)
  try {
    ensureLogFile();
    let currentLogs = [];
    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) currentLogs = parsed;
      }
    }

    currentLogs.unshift(entry);
    if (currentLogs.length > MAX_LOGS) {
      currentLogs = currentLogs.slice(0, MAX_LOGS);
    }

    fs.writeFileSync(LOG_FILE, JSON.stringify(currentLogs, null, 2), 'utf8');
  } catch (e) {
    // Disk write fail fallback
  }

  return entry;
}

// Convenience Logger Exports
export const logger = {
  info: (tag, message, meta) => writeLog('info', tag, message, meta),
  warn: (tag, message, meta) => writeLog('warn', tag, message, meta),
  error: (tag, message, meta) => writeLog('error', tag, message, meta),
};

export default logger;
