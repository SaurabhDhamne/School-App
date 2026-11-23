import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { loadAllTimetableData, saveTimetableData } from '@/lib/timetableStore';
import { getFallbackScheduleForClass } from '@/lib/timetableData';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawClass = searchParams.get('class') || 'Class 8-A';
    const className = rawClass.trim();

    // 1. Try reading from Supabase if table exists
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('school_timetables')
          .select('*')
          .eq('class_name', className)
          .maybeSingle();

        if (!error && data && data.schedule) {
          return NextResponse.json({
            success: true,
            className,
            schedule: data.schedule,
            periods: data.periods || null,
            source: 'supabase'
          });
        }
      } catch (sbErr) {
        // Table may not exist yet, fallback smoothly
      }
    }

    // 2. Fallback to server disk store
    const diskData = loadAllTimetableData();
    let schedule = diskData.schedules[className];
    if (!schedule) {
      const matchKey = Object.keys(diskData.schedules).find(
        k => k.toLowerCase() === className.toLowerCase()
      );
      if (matchKey) {
        schedule = diskData.schedules[matchKey];
      }
    }
    if (!schedule) {
      schedule = getFallbackScheduleForClass(className);
    }

    return NextResponse.json({
      success: true,
      className,
      schedule,
      periods: diskData.periods,
      source: 'disk'
    });
  } catch (err) {
    logger.error('TIMETABLE_GET_FAIL', 'Failed to retrieve timetable', { error: err.message });
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { className, schedule, periods } = body;

    if (!className) {
      return NextResponse.json({ success: false, error: 'className is required' }, { status: 400 });
    }

    const trimmedClass = className.trim();

    // 1. Save to disk store first
    const updated = saveTimetableData(trimmedClass, schedule, periods);

    // 2. Try persisting to Supabase
    if (supabase) {
      try {
        const upsertPayload = {
          class_name: trimmedClass,
          updated_at: new Date().toISOString()
        };
        if (schedule) upsertPayload.schedule = schedule;
        if (periods) upsertPayload.periods = periods;

        const { error } = await supabase
          .from('school_timetables')
          .upsert(upsertPayload, { onConflict: 'class_name' });

        if (error) {
          logger.warn('TIMETABLE_SUPABASE_UPSERT_WARN', 'Supabase upsert note: ' + error.message);
        } else {
          logger.info('TIMETABLE_SYNC', `Synchronized timetable for ${trimmedClass} with Supabase`);
        }
      } catch (sbErr) {
        logger.warn('TIMETABLE_SUPABASE_FAIL', 'Supabase error during timetable upsert: ' + sbErr.message);
      }
    }

    logger.info('TIMETABLE_UPDATE', `Updated timetable for ${trimmedClass}`, {
      hasSchedule: Boolean(schedule),
      hasPeriods: Boolean(periods)
    });

    return NextResponse.json({
      success: true,
      className: trimmedClass,
      schedule: updated?.schedules?.[trimmedClass] || schedule,
      periods: updated?.periods || periods
    });
  } catch (err) {
    logger.error('TIMETABLE_POST_FAIL', 'Failed to update timetable', { error: err.message });
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
