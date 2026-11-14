// Central in-memory fallback store for student records when database is offline
// Automatically stays in sync between /api/students, /api/auth, and the UI

export const DEMO_STUDENTS = [
  {
    rollNo: '01',
    name: 'Aakash Verma',
    className: 'Class 8-A',
    parentEmail: 'parent.verma@example.com',
    parentPhone: '9876543201',
    attendance: 'P',
    emailed: false,
    marks: { maths: 21, science: 23, english: 20, social: 19, hindi: 22 }
  },
  {
    rollNo: '02',
    name: 'Ananya Gupta',
    className: 'Class 8-A',
    parentEmail: 'parent.gupta@example.com',
    parentPhone: '9876543202',
    attendance: 'P',
    emailed: false,
    marks: { maths: 25, science: 25, english: 24, social: 23, hindi: 24 }
  },
  {
    rollNo: '03',
    name: 'Devendra Patel',
    className: 'Class 8-A',
    parentEmail: 'parent.patel@example.com',
    parentPhone: '9876543203',
    attendance: 'A',
    emailed: false,
    marks: { maths: 15, science: 16, english: 14, social: 15, hindi: 17 }
  },
  {
    rollNo: '04',
    name: 'Diya Sen',
    className: 'Class 8-A',
    parentEmail: 'parent.sen@example.com',
    parentPhone: '9876543204',
    attendance: 'P',
    emailed: false,
    marks: { maths: 23, science: 22, english: 24, social: 21, hindi: 23 }
  },
  {
    rollNo: '05',
    name: 'Ishaan Reddy',
    className: 'Class 8-A',
    parentEmail: 'parent.reddy@example.com',
    parentPhone: '9876543205',
    attendance: 'A',
    emailed: false,
    marks: { maths: 12, science: 13, english: 15, social: 11, hindi: 14 }
  },
  {
    rollNo: '06',
    name: 'Kavya Nair',
    className: 'Class 8-A',
    parentEmail: 'parent.nair@example.com',
    parentPhone: '9876543206',
    attendance: 'P',
    emailed: false,
    marks: { maths: 22, science: 24, english: 23, social: 22, hindi: 21 }
  },
  {
    rollNo: '07',
    name: 'Manish Kumar',
    className: 'Class 8-A',
    parentEmail: 'parent.kumar@example.com',
    parentPhone: '9876543207',
    attendance: 'P',
    emailed: false,
    marks: { maths: 18, science: 19, english: 17, social: 18, hindi: 20 }
  },
  {
    rollNo: '08',
    name: 'Meera Iyer',
    className: 'Class 8-A',
    parentEmail: 'parent.iyer@example.com',
    parentPhone: '9876543208',
    attendance: 'P',
    emailed: false,
    marks: { maths: 24, science: 25, english: 23, social: 24, hindi: 25 }
  },
  {
    rollNo: '09',
    name: 'Rohan Joshi',
    className: 'Class 8-A',
    parentEmail: 'parent.joshi@example.com',
    parentPhone: '9876543209',
    attendance: 'P',
    emailed: false,
    marks: { maths: 19, science: 20, english: 18, social: 19, hindi: 21 }
  },
  {
    rollNo: '10',
    name: 'Tanvi Deshmukh',
    className: 'Class 8-A',
    parentEmail: 'parent.deshmukh@example.com',
    parentPhone: '9876543210',
    attendance: 'P',
    emailed: false,
    marks: { maths: 23, science: 24, english: 22, social: 23, hindi: 24 }
  }
];

export let sharedStudents = [...DEMO_STUDENTS];

export function getSharedStudents() {
  return sharedStudents;
}

export function setSharedStudents(newList) {
  sharedStudents = Array.isArray(newList) ? newList : [];
}

export function clearAllSharedStudents() {
  sharedStudents = [];
  return sharedStudents;
}

export function resetToDemoStudents() {
  sharedStudents = [...DEMO_STUDENTS];
  return sharedStudents;
}
