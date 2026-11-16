/**
 * School Holiday Management Engine
 * Handles automatic Sunday holidays, 2nd & 4th Saturday off-days,
 * gazetted national holidays, and admin-declared custom school holidays.
 */

// Common national and school holidays
export const DEFAULT_GAZETTED_HOLIDAYS = [
  // Fixed annual dates (MM-DD)
  { dateMatch: '-01-26', name: 'Republic Day' },
  { dateMatch: '-05-01', name: 'May Day' },
  { dateMatch: '-08-15', name: 'Independence Day' },
  { dateMatch: '-10-02', name: 'Gandhi Jayanti' },
  { dateMatch: '-12-25', name: 'Christmas Day' },

  // Notable calendar holidays (2025 - 2027)
  { date: '2025-03-14', name: 'Holi' },
  { date: '2025-03-31', name: 'Eid ul-Fitr' },
  { date: '2025-10-20', name: 'Diwali' },
  { date: '2025-10-21', name: 'Govardhan Puja' },

  { date: '2026-03-04', name: 'Holi' },
  { date: '2026-03-20', name: 'Eid ul-Fitr' },
  { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-11-08', name: 'Diwali' },
  { date: '2026-11-09', name: 'Govardhan Puja' },

  { date: '2027-03-22', name: 'Holi' },
  { date: '2027-03-10', name: 'Eid ul-Fitr' },
  { date: '2027-10-29', name: 'Diwali' }
];

export const HOLIDAYS_STORAGE_KEY = 'myschool_custom_holidays';

/**
 * Checks if a given date is a 2nd or 4th Saturday of the month
 * Day 8-14 is always the 2nd week (2nd Saturday)
 * Day 22-28 is always the 4th week (4th Saturday)
 */
export function isSecondOrFourthSaturday(d) {
  if (d.getDay() !== 6) return false;
  const dayOfMonth = d.getDate();
  if (dayOfMonth >= 8 && dayOfMonth <= 14) return { isMatch: true, label: '2nd Saturday' };
  if (dayOfMonth >= 22 && dayOfMonth <= 28) return { isMatch: true, label: '4th Saturday' };
  return false;
}

/**
 * Returns comprehensive holiday details for any given date
 * @param {string|Date} dateInput - ISO date string ('YYYY-MM-DD') or Date object
 * @param {Array} customHolidays - Array of custom holiday objects [{ id, date, name }]
 * @returns {{ isHoliday: boolean, reason: string|null, type: string|null, icon: string }}
 */
export function getHolidayInfo(dateInput, customHolidays = []) {
  if (!dateInput) return { isHoliday: false, reason: null, type: null, icon: '' };

  const dateStr = typeof dateInput === 'string' 
    ? dateInput.split('T')[0] 
    : dateInput.toISOString().split('T')[0];

  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) {
    return { isHoliday: false, reason: null, type: null, icon: '' };
  }

  // 1. Every Sunday
  if (d.getDay() === 0) {
    return {
      isHoliday: true,
      reason: 'Sunday (Weekly Off)',
      type: 'sunday',
      icon: 'palmtree'
    };
  }

  // 2. 2nd & 4th Saturday
  const satCheck = isSecondOrFourthSaturday(d);
  if (satCheck && satCheck.isMatch) {
    return {
      isHoliday: true,
      reason: `${satCheck.label} (School Off)`,
      type: 'saturday',
      icon: 'coffee'
    };
  }

  // 3. Admin-declared custom holidays (highest priority for calendar days)
  if (Array.isArray(customHolidays)) {
    const customMatch = customHolidays.find(h => h.date === dateStr);
    if (customMatch) {
      return {
        isHoliday: true,
        reason: customMatch.name || 'School Holiday',
        type: 'custom',
        icon: 'palmtree'
      };
    }
  }

  // 4. Gazetted / National holidays
  const gazetted = DEFAULT_GAZETTED_HOLIDAYS.find(h => {
    if (h.date && h.date === dateStr) return true;
    if (h.dateMatch && dateStr.endsWith(h.dateMatch)) return true;
    return false;
  });

  if (gazetted) {
    return {
      isHoliday: true,
      reason: gazetted.name,
      type: 'national',
      icon: 'palmtree'
    };
  }

  return { isHoliday: false, reason: null, type: null, icon: '' };
}

/**
 * Boolean helper to quickly check if a date is a school holiday
 */
export function isSchoolHoliday(dateInput, customHolidays = []) {
  return getHolidayInfo(dateInput, customHolidays).isHoliday;
}

/**
 * Load custom school holidays from localStorage cache
 */
export function getLocalCustomHolidays() {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(HOLIDAYS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local custom holidays:', e);
  }
  return [];
}

/**
 * Save custom holidays to localStorage
 */
export function saveLocalCustomHolidays(holidays) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HOLIDAYS_STORAGE_KEY, JSON.stringify(holidays));
  } catch (e) {
    console.warn('Failed to save local custom holidays:', e);
  }
}

