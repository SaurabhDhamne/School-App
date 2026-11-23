// Centralized Timetable Configuration & Subject Metadata (Clean, emoji-free)

export const DEFAULT_TIMETABLE_PERIODS = [
  { id: 'p1', type: 'period', number: 1, label: 'Lecture 1', time: '08:00 - 08:45', startTime: '08:00', endTime: '08:45', duration: '45m' },
  { id: 'p2', type: 'period', number: 2, label: 'Lecture 2', time: '08:45 - 09:30', startTime: '08:45', endTime: '09:30', duration: '45m' },
  { id: 'b1', type: 'break', label: 'Short Break', time: '09:30 - 09:45', startTime: '09:30', endTime: '09:45', duration: '15m', isBreak: true },
  { id: 'p3', type: 'period', number: 3, label: 'Lecture 3', time: '09:45 - 10:30', startTime: '09:45', endTime: '10:30', duration: '45m' },
  { id: 'p4', type: 'period', number: 4, label: 'Lecture 4', time: '10:30 - 11:15', startTime: '10:30', endTime: '11:15', duration: '45m' },
  { id: 'b2', type: 'break', label: 'Lunch Break', time: '11:15 - 11:45', startTime: '11:15', endTime: '11:45', duration: '30m', isBreak: true },
  { id: 'p5', type: 'period', number: 5, label: 'Lecture 5', time: '11:45 - 12:30', startTime: '11:45', endTime: '12:30', duration: '45m' },
  { id: 'p6', type: 'period', number: 6, label: 'Lecture 6', time: '12:30 - 01:15', startTime: '12:30', endTime: '01:15', duration: '45m' },
];

export const TIMETABLE_PERIODS = DEFAULT_TIMETABLE_PERIODS;

export const TIMETABLE_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const AVAILABLE_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Marathi',
  'Hindi',
  'Games',
  'Social Studies',
  'Free Period'
];

export const SUBJECT_METADATA = {
  'Mathematics': {
    code: 'MATH',
    label: 'Mathematics',
    color: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
    headerColor: 'bg-blue-600 text-white',
    badge: 'bg-blue-100 text-blue-800'
  },
  'English': {
    code: 'ENG',
    label: 'English',
    color: 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100',
    headerColor: 'bg-amber-600 text-white',
    badge: 'bg-amber-100 text-amber-900'
  },
  'Science': {
    code: 'SCI',
    label: 'Science',
    color: 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100',
    headerColor: 'bg-emerald-600 text-white',
    badge: 'bg-emerald-100 text-emerald-900'
  },
  'Marathi': {
    code: 'MAR',
    label: 'Marathi',
    color: 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100',
    headerColor: 'bg-purple-600 text-white',
    badge: 'bg-purple-100 text-purple-900'
  },
  'Hindi': {
    code: 'HIN',
    label: 'Hindi',
    color: 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100',
    headerColor: 'bg-rose-600 text-white',
    badge: 'bg-rose-100 text-rose-900'
  },
  'Games': {
    code: 'GMS',
    label: 'Games',
    color: 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100',
    headerColor: 'bg-teal-600 text-white',
    badge: 'bg-teal-100 text-teal-900'
  },
  'Social Studies': {
    code: 'SST',
    label: 'Social Studies',
    color: 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100',
    headerColor: 'bg-orange-600 text-white',
    badge: 'bg-orange-100 text-orange-900'
  },
  'Free Period': {
    code: 'FREE',
    label: 'Free Period',
    color: 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100',
    headerColor: 'bg-slate-400 text-white',
    badge: 'bg-slate-100 text-slate-600'
  }
};

// Default balanced schedule for Class 8-A (Mon-Sat)
export const DEFAULT_WEEKLY_SCHEDULE = {
  'Monday': {
    p1: { subject: 'Mathematics' },
    p2: { subject: 'English' },
    p3: { subject: 'Science' },
    p4: { subject: 'Marathi' },
    p5: { subject: 'Hindi' },
    p6: { subject: 'Games' }
  },
  'Tuesday': {
    p1: { subject: 'Science' },
    p2: { subject: 'Mathematics' },
    p3: { subject: 'English' },
    p4: { subject: 'Hindi' },
    p5: { subject: 'Marathi' },
    p6: { subject: 'Science' }
  },
  'Wednesday': {
    p1: { subject: 'Marathi' },
    p2: { subject: 'English' },
    p3: { subject: 'Mathematics' },
    p4: { subject: 'Science' },
    p5: { subject: 'Games' },
    p6: { subject: 'Hindi' }
  },
  'Thursday': {
    p1: { subject: 'English' },
    p2: { subject: 'Hindi' },
    p3: { subject: 'Science' },
    p4: { subject: 'Mathematics' },
    p5: { subject: 'Marathi' },
    p6: { subject: 'Mathematics' }
  },
  'Friday': {
    p1: { subject: 'Science' },
    p2: { subject: 'Marathi' },
    p3: { subject: 'English' },
    p4: { subject: 'Hindi' },
    p5: { subject: 'Games' },
    p6: { subject: 'Mathematics' }
  },
  'Saturday': {
    p1: { subject: 'Mathematics' },
    p2: { subject: 'Science' },
    p3: { subject: 'English' },
    p4: { subject: 'Marathi' },
    p5: { subject: 'Hindi' },
    p6: { subject: 'Games' }
  }
};

// Dedicated, realistic starter schedules for each class
export const CLASS_DEFAULT_SCHEDULES = {
  'Class 8-A': DEFAULT_WEEKLY_SCHEDULE,
  'Class 8-B': {
    'Monday': {
      p1: { subject: 'Science' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'English' },
      p4: { subject: 'Hindi' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Games' }
    },
    'Tuesday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'English' },
      p3: { subject: 'Science' },
      p4: { subject: 'Marathi' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Social Studies' }
    },
    'Wednesday': {
      p1: { subject: 'English' },
      p2: { subject: 'Science' },
      p3: { subject: 'Mathematics' },
      p4: { subject: 'Marathi' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Games' }
    },
    'Thursday': {
      p1: { subject: 'Science' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'Marathi' },
      p4: { subject: 'English' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Social Studies' }
    },
    'Friday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'English' },
      p3: { subject: 'Science' },
      p4: { subject: 'Hindi' },
      p5: { subject: 'Games' },
      p6: { subject: 'Marathi' }
    },
    'Saturday': {
      p1: { subject: 'Science' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'English' },
      p4: { subject: 'Marathi' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Games' }
    }
  },
  'Class 9-A': {
    'Monday': {
      p1: { subject: 'Science' },
      p2: { subject: 'English' },
      p3: { subject: 'Mathematics' },
      p4: { subject: 'Social Studies' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Marathi' }
    },
    'Tuesday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'Science' },
      p3: { subject: 'Social Studies' },
      p4: { subject: 'English' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Games' }
    },
    'Wednesday': {
      p1: { subject: 'Social Studies' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'Science' },
      p4: { subject: 'English' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Marathi' }
    },
    'Thursday': {
      p1: { subject: 'Science' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'English' },
      p4: { subject: 'Social Studies' },
      p5: { subject: 'Games' },
      p6: { subject: 'Hindi' }
    },
    'Friday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'Science' },
      p3: { subject: 'English' },
      p4: { subject: 'Marathi' },
      p5: { subject: 'Social Studies' },
      p6: { subject: 'Hindi' }
    },
    'Saturday': {
      p1: { subject: 'English' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'Science' },
      p4: { subject: 'Social Studies' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Games' }
    }
  },
  'Class 9-B': {
    'Monday': {
      p1: { subject: 'English' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'Science' },
      p4: { subject: 'Marathi' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Social Studies' }
    },
    'Tuesday': {
      p1: { subject: 'Science' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'English' },
      p4: { subject: 'Social Studies' },
      p5: { subject: 'Games' },
      p6: { subject: 'Marathi' }
    },
    'Wednesday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'Science' },
      p3: { subject: 'English' },
      p4: { subject: 'Hindi' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Social Studies' }
    },
    'Thursday': {
      p1: { subject: 'Social Studies' },
      p2: { subject: 'English' },
      p3: { subject: 'Mathematics' },
      p4: { subject: 'Science' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Games' }
    },
    'Friday': {
      p1: { subject: 'Science' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'English' },
      p4: { subject: 'Marathi' },
      p5: { subject: 'Social Studies' },
      p6: { subject: 'Hindi' }
    },
    'Saturday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'English' },
      p3: { subject: 'Science' },
      p4: { subject: 'Hindi' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Games' }
    }
  },
  'Class 10-A': {
    'Monday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'Science' },
      p3: { subject: 'English' },
      p4: { subject: 'Social Studies' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Marathi' }
    },
    'Tuesday': {
      p1: { subject: 'Science' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'Social Studies' },
      p4: { subject: 'English' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Games' }
    },
    'Wednesday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'English' },
      p3: { subject: 'Science' },
      p4: { subject: 'Social Studies' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Marathi' }
    },
    'Thursday': {
      p1: { subject: 'Science' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'English' },
      p4: { subject: 'Hindi' },
      p5: { subject: 'Social Studies' },
      p6: { subject: 'Games' }
    },
    'Friday': {
      p1: { subject: 'Social Studies' },
      p2: { subject: 'Science' },
      p3: { subject: 'Mathematics' },
      p4: { subject: 'English' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Hindi' }
    },
    'Saturday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'Science' },
      p3: { subject: 'English' },
      p4: { subject: 'Social Studies' },
      p5: { subject: 'Games' },
      p6: { subject: 'Marathi' }
    }
  },
  'Class 10-B': {
    'Monday': {
      p1: { subject: 'Science' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'Social Studies' },
      p4: { subject: 'English' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Hindi' }
    },
    'Tuesday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'Science' },
      p3: { subject: 'English' },
      p4: { subject: 'Social Studies' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Games' }
    },
    'Wednesday': {
      p1: { subject: 'English' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'Science' },
      p4: { subject: 'Social Studies' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Hindi' }
    },
    'Thursday': {
      p1: { subject: 'Social Studies' },
      p2: { subject: 'Science' },
      p3: { subject: 'Mathematics' },
      p4: { subject: 'English' },
      p5: { subject: 'Games' },
      p6: { subject: 'Marathi' }
    },
    'Friday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'English' },
      p3: { subject: 'Science' },
      p4: { subject: 'Social Studies' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Marathi' }
    },
    'Saturday': {
      p1: { subject: 'Science' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'English' },
      p4: { subject: 'Social Studies' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Games' }
    }
  },
  'Class 7-A': {
    'Monday': {
      p1: { subject: 'English' },
      p2: { subject: 'Hindi' },
      p3: { subject: 'Mathematics' },
      p4: { subject: 'Science' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Games' }
    },
    'Tuesday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'English' },
      p3: { subject: 'Science' },
      p4: { subject: 'Hindi' },
      p5: { subject: 'Games' },
      p6: { subject: 'Marathi' }
    },
    'Wednesday': {
      p1: { subject: 'Science' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'English' },
      p4: { subject: 'Marathi' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Games' }
    },
    'Thursday': {
      p1: { subject: 'Hindi' },
      p2: { subject: 'English' },
      p3: { subject: 'Science' },
      p4: { subject: 'Mathematics' },
      p5: { subject: 'Social Studies' },
      p6: { subject: 'Marathi' }
    },
    'Friday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'Science' },
      p3: { subject: 'English' },
      p4: { subject: 'Hindi' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Games' }
    },
    'Saturday': {
      p1: { subject: 'English' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'Science' },
      p4: { subject: 'Marathi' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Social Studies' }
    }
  },
  'Class 7-B': {
    'Monday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'English' },
      p3: { subject: 'Science' },
      p4: { subject: 'Hindi' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Games' }
    },
    'Tuesday': {
      p1: { subject: 'Science' },
      p2: { subject: 'Hindi' },
      p3: { subject: 'Mathematics' },
      p4: { subject: 'English' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Games' }
    },
    'Wednesday': {
      p1: { subject: 'English' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'Science' },
      p4: { subject: 'Hindi' },
      p5: { subject: 'Social Studies' },
      p6: { subject: 'Marathi' }
    },
    'Thursday': {
      p1: { subject: 'Mathematics' },
      p2: { subject: 'Science' },
      p3: { subject: 'English' },
      p4: { subject: 'Marathi' },
      p5: { subject: 'Hindi' },
      p6: { subject: 'Games' }
    },
    'Friday': {
      p1: { subject: 'Science' },
      p2: { subject: 'English' },
      p3: { subject: 'Mathematics' },
      p4: { subject: 'Hindi' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Social Studies' }
    },
    'Saturday': {
      p1: { subject: 'Hindi' },
      p2: { subject: 'Mathematics' },
      p3: { subject: 'English' },
      p4: { subject: 'Science' },
      p5: { subject: 'Marathi' },
      p6: { subject: 'Games' }
    }
  }
};

export function getFallbackScheduleForClass(className = 'Class 8-A') {
  if (CLASS_DEFAULT_SCHEDULES[className]) {
    return JSON.parse(JSON.stringify(CLASS_DEFAULT_SCHEDULES[className]));
  }
  const matchKey = Object.keys(CLASS_DEFAULT_SCHEDULES).find(
    k => k.toLowerCase() === (className || '').toLowerCase().trim()
  );
  if (matchKey && CLASS_DEFAULT_SCHEDULES[matchKey]) {
    return JSON.parse(JSON.stringify(CLASS_DEFAULT_SCHEDULES[matchKey]));
  }
  return JSON.parse(JSON.stringify(DEFAULT_WEEKLY_SCHEDULE));
}

const TIMETABLE_STORAGE_KEY = 'myschool_class_timetables';

export function getClassTimetable(className = 'Class 8-A') {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(TIMETABLE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[className]) {
          return JSON.parse(JSON.stringify(parsed[className]));
        }
        const matchKey = Object.keys(parsed).find(
          k => k.toLowerCase() === (className || '').toLowerCase().trim()
        );
        if (matchKey && parsed[matchKey]) {
          return JSON.parse(JSON.stringify(parsed[matchKey]));
        }
      }
    } catch (e) {}
  }
  return getFallbackScheduleForClass(className);
}

export function saveClassTimetableLocal(className, scheduleData) {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(TIMETABLE_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      parsed[className] = JSON.parse(JSON.stringify(scheduleData));
      localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(parsed));
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}
