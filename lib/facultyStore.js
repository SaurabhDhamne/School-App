import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'faculty.json');

export const INITIAL_FACULTY = [
  {
    id: 'admin_1',
    name: 'School Administrator',
    email: 'admin@myschool.com',
    password: 'admin@123',
    role: 'admin',
    class_name: 'All Classes',
    classes: ['Class 8-A', 'Class 8-B', 'Class 9-A', 'Class 9-B', 'Class 10-A', 'Class 10-B', 'Class 7-A', 'Class 7-B'],
    classTeacherOf: null,
    subject: 'All Subjects',
    school: 'MySchool'
  },
  {
    id: 't1',
    name: 'Mrs. Priya Sharma',
    email: 'priya@myschool.com',
    password: 'priya@123',
    role: 'class_teacher',
    class_name: 'Class 8-A (CT), Class 8-B, Class 9-A, Class 9-B, Class 10-A, Class 10-B',
    classes: ['Class 8-A', 'Class 8-B', 'Class 9-A', 'Class 9-B', 'Class 10-A', 'Class 10-B'],
    classTeacherOf: 'Class 8-A',
    subject: 'Mathematics',
    school: 'MySchool'
  },
  {
    id: 't2',
    name: 'Mr. Rajesh Patel',
    email: 'rajesh@myschool.com',
    password: 'rajesh@123',
    role: 'class_teacher',
    class_name: 'Class 8-B (CT), Class 8-A, Class 9-A, Class 9-B, Class 10-A, Class 10-B',
    classes: ['Class 8-A', 'Class 8-B', 'Class 9-A', 'Class 9-B', 'Class 10-A', 'Class 10-B'],
    classTeacherOf: 'Class 8-B',
    subject: 'Science',
    school: 'MySchool'
  },
  {
    id: 't3',
    name: 'Mrs. Sunita Verma',
    email: 'sunita@myschool.com',
    password: 'sunita@123',
    role: 'subject_teacher',
    class_name: 'Class 8-A, Class 8-B, Class 9-A, Class 9-B, Class 10-A, Class 10-B',
    classes: ['Class 8-A', 'Class 8-B', 'Class 9-A', 'Class 9-B', 'Class 10-A', 'Class 10-B'],
    classTeacherOf: null,
    subject: 'English',
    school: 'MySchool'
  }
];

function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {}
}

export function getStoredFaculty() {
  ensureDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {}
  saveStoredFaculty(INITIAL_FACULTY);
  return INITIAL_FACULTY;
}

export function saveStoredFaculty(facultyList) {
  ensureDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(facultyList, null, 2), 'utf-8');
  } catch (e) {}
}
