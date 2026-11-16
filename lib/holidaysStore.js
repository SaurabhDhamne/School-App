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

export let sharedCustomHolidays = [...INITIAL_CUSTOM_HOLIDAYS];

export function getSharedCustomHolidays() {
  return sharedCustomHolidays;
}

export function setSharedCustomHolidays(list) {
  sharedCustomHolidays = Array.isArray(list) ? list : [];
  return sharedCustomHolidays;
}

export function addSharedCustomHoliday(holiday) {
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
  return sharedCustomHolidays;
}

export function deleteSharedCustomHoliday(id) {
  sharedCustomHolidays = sharedCustomHolidays.filter(h => h.id !== id);
  return sharedCustomHolidays;
}

export function resetSharedCustomHolidays() {
  sharedCustomHolidays = [...INITIAL_CUSTOM_HOLIDAYS];
  return sharedCustomHolidays;
}

