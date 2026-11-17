import fs from 'fs';
import path from 'path';

// Central store for admin-declared custom school holidays synced across routes
export const INITIAL_CUSTOM_HOLIDAYS = [
  {
    id: 'hol_1',
    date: '2026-11-20',
    name: 'School Sports Meet (Off Day)',
    declaredBy: 'School Administrator'
  },
  {
    id: 'hol_2',
    date: '2026-12-05',
    name: 'Annual Day Preparation Break',
    declaredBy: 'School Administrator'
  }
];

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'holidays.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('Failed to create data directory:', e.message);
  }
}

function loadHolidaysFromDisk() {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load holidays from disk:', e.message);
  }
  saveHolidaysToDisk(INITIAL_CUSTOM_HOLIDAYS);
  return [...INITIAL_CUSTOM_HOLIDAYS];
}

function saveHolidaysToDisk(holidays) {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(holidays, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to save holidays to disk:', e.message);
  }
}

let sharedCustomHolidays = loadHolidaysFromDisk();

export function getSharedCustomHolidays() {
  sharedCustomHolidays = loadHolidaysFromDisk();
  return sharedCustomHolidays;
}

export function setSharedCustomHolidays(list) {
  sharedCustomHolidays = Array.isArray(list) ? list : [];
  saveHolidaysToDisk(sharedCustomHolidays);
  return sharedCustomHolidays;
}

export function addSharedCustomHoliday(holiday) {
  sharedCustomHolidays = loadHolidaysFromDisk();
  const newHoliday = {
    id: holiday.id || `hol_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    date: holiday.date,
    name: holiday.name || 'School Holiday',
    declaredBy: holiday.declaredBy || 'School Administrator',
    createdAt: new Date().toISOString()
  };
  // Prevent duplicate dates
  sharedCustomHolidays = sharedCustomHolidays.filter(h => h.date !== holiday.date);
  sharedCustomHolidays = [newHoliday, ...sharedCustomHolidays];
  saveHolidaysToDisk(sharedCustomHolidays);
  return sharedCustomHolidays;
}

export function deleteSharedCustomHoliday(id) {
  sharedCustomHolidays = loadHolidaysFromDisk();
  sharedCustomHolidays = sharedCustomHolidays.filter(h => h.id !== id);
  saveHolidaysToDisk(sharedCustomHolidays);
  return sharedCustomHolidays;
}

export function resetSharedCustomHolidays() {
  sharedCustomHolidays = [...INITIAL_CUSTOM_HOLIDAYS];
  saveHolidaysToDisk(sharedCustomHolidays);
  return sharedCustomHolidays;
}
