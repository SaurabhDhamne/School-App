import fs from 'fs';
import path from 'path';
import { DEFAULT_WEEKLY_SCHEDULE, TIMETABLE_PERIODS, getFallbackScheduleForClass } from './timetableData';

const DATA_DIR = path.join(process.cwd(), 'data');
const TIMETABLE_FILE = path.join(DATA_DIR, 'timetables.json');

const STANDARD_CLASSES = [
  'Class 8-A',
  'Class 8-B',
  'Class 9-A',
  'Class 9-B',
  'Class 10-A',
  'Class 10-B',
  'Class 7-A',
  'Class 7-B'
];

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(TIMETABLE_FILE)) {
      const initialSchedules = {};
      for (const cls of STANDARD_CLASSES) {
        initialSchedules[cls] = getFallbackScheduleForClass(cls);
      }
      const initial = {
        periods: TIMETABLE_PERIODS,
        schedules: initialSchedules
      };
      fs.writeFileSync(TIMETABLE_FILE, JSON.stringify(initial, null, 2), 'utf8');
    }
  } catch (e) {
    console.warn('Failed to initialize timetable store:', e.message);
  }
}

export function loadAllTimetableData() {
  ensureDataFile();
  try {
    if (fs.existsSync(TIMETABLE_FILE)) {
      const content = fs.readFileSync(TIMETABLE_FILE, 'utf8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        const schedules = parsed.schedules || {};
        
        // Ensure all standard classes have an entry
        for (const cls of STANDARD_CLASSES) {
          if (!schedules[cls]) {
            schedules[cls] = getFallbackScheduleForClass(cls);
          }
        }

        return {
          periods: Array.isArray(parsed.periods) && parsed.periods.length > 0 ? parsed.periods : TIMETABLE_PERIODS,
          schedules
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load timetables from disk:', e.message);
  }

  const fallbackSchedules = {};
  for (const cls of STANDARD_CLASSES) {
    fallbackSchedules[cls] = getFallbackScheduleForClass(cls);
  }

  return {
    periods: TIMETABLE_PERIODS,
    schedules: fallbackSchedules
  };
}

export function saveTimetableData(className, newSchedule = null, newPeriods = null) {
  ensureDataFile();
  try {
    const current = loadAllTimetableData();
    if (newSchedule && className) {
      current.schedules[className] = JSON.parse(JSON.stringify(newSchedule));
    }
    if (newPeriods && Array.isArray(newPeriods)) {
      current.periods = JSON.parse(JSON.stringify(newPeriods));
    }
    fs.writeFileSync(TIMETABLE_FILE, JSON.stringify(current, null, 2), 'utf8');
    return current;
  } catch (e) {
    console.warn('Failed to save timetables to disk:', e.message);
    return null;
  }
}
