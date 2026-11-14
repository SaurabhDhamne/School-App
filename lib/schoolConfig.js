'use client';

/**
 * Centralized Multi-Tenancy / School Whitelabel Configuration
 * To rebrand or deploy for a new client school:
 * Edit this file or let the administrator configure it from the Admin Branding tab!
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
  schoolLogo: null, // Custom image URL if available, else uses default SVG icon
  
  // Academic Configuration
  academicYear: '2026-2027',
  activeTerm: 'Unit Test 1',
  
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

  // Standard School Subjects
  subjects: [
    { key: 'all', label: 'All Subjects' },
    { key: 'maths', label: 'Mathematics', max: 25 },
    { key: 'science', label: 'Science', max: 25 },
    { key: 'english', label: 'English', max: 25 },
    { key: 'social', label: 'Social Studies', max: 25 },
    { key: 'hindi', label: 'Hindi', max: 25 }
  ]
};

const STORAGE_KEY = 'myschool_branding_config';

export function getSchoolConfig() {
  if (typeof window === 'undefined') return DEFAULT_SCHOOL_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SCHOOL_CONFIG, ...JSON.parse(saved) };
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

