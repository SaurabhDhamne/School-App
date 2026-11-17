'use client';

/**
 * Centralized Multi-Tenancy / School Configuration
 * Configures school branding, academic exams (max 4), and subject offerings (max 10).
 */

export const DEFAULT_SCHOOL_CONFIG = {
  // Brand Identity
  schoolName: 'MySchool',
  schoolShortName: 'MySchool',
  schoolTagline: 'Classroom & Academic Management Portal',
  schoolMotto: 'Excellence in Education',
  schoolPhone: '+91 98765 43210',
  schoolEmail: 'contact@myschool.edu',
  schoolAddress: 'Campus Avenue, Knowledge City',
  schoolLogo: null,
  
  // Academic Configuration
  academicYear: '2026-2027',
  activeExam: 'Unit Test 1',
  exams: [
    { id: 'exam_1', name: 'Unit Test 1' },
    { id: 'exam_2', name: 'Mid-Term Exam' },
    { id: 'exam_3', name: 'Unit Test 2' },
    { id: 'exam_4', name: 'Final Exam' }
  ],
  
  // Available Classes in School
  classes: [
    'Class 8-A',
    'Class 8-B',
    'Class 9-A',
    'Class 9-B',
    'Class 10-A',
    'Class 10-B',
    'Class 7-A',
    'Class 7-B'
  ],
  defaultClass: 'Class 8-A',

  // Standard School Subjects (Max 10)
  subjects: [
    { key: 'maths', label: 'Mathematics', max: 25, assignedTeacherName: 'Mrs. Priya Sharma' },
    { key: 'science', label: 'Science', max: 25, assignedTeacherName: 'Mr. Rajesh Patel' },
    { key: 'english', label: 'English', max: 25, assignedTeacherName: 'Mrs. Sunita Verma' },
    { key: 'social', label: 'Social Studies', max: 25, assignedTeacherName: null },
    { key: 'hindi', label: 'Hindi', max: 25, assignedTeacherName: null }
  ]
};

const STORAGE_KEY = 'myschool_branding_config';

export function getSchoolConfig() {
  if (typeof window === 'undefined') return DEFAULT_SCHOOL_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SCHOOL_CONFIG,
        ...parsed,
        exams: Array.isArray(parsed.exams) && parsed.exams.length > 0
          ? parsed.exams
          : DEFAULT_SCHOOL_CONFIG.exams,
        subjects: Array.isArray(parsed.subjects) && parsed.subjects.length > 0
          ? parsed.subjects
          : DEFAULT_SCHOOL_CONFIG.subjects
      };
    }
  } catch (e) {
    console.warn('Failed to read school config:', e);
  }
  return DEFAULT_SCHOOL_CONFIG;
}

export function saveSchoolConfig(config) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save school config:', e);
  }
}
