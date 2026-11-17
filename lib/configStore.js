import fs from 'fs';
import path from 'path';
import { DEFAULT_SCHOOL_CONFIG } from './schoolConfig';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'schoolConfig.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('Failed to create data directory for config:', e.message);
  }
}

export function loadSchoolConfigFromDisk() {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        return {
          ...DEFAULT_SCHOOL_CONFIG,
          ...parsed,
          // Ensure exams has at least 1 exam
          exams: Array.isArray(parsed.exams) && parsed.exams.length > 0
            ? parsed.exams
            : DEFAULT_SCHOOL_CONFIG.exams || [
                { id: 'exam_1', name: 'Unit Test 1' },
                { id: 'exam_2', name: 'Mid-Term Exam' },
                { id: 'exam_3', name: 'Unit Test 2' },
                { id: 'exam_4', name: 'Final Exam' }
              ],
          subjects: Array.isArray(parsed.subjects) && parsed.subjects.length > 0
            ? parsed.subjects
            : DEFAULT_SCHOOL_CONFIG.subjects
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load schoolConfig from disk:', e.message);
  }

  saveSchoolConfigToDisk(DEFAULT_SCHOOL_CONFIG);
  return { ...DEFAULT_SCHOOL_CONFIG };
}

export function saveSchoolConfigToDisk(config) {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to save schoolConfig to disk:', e.message);
  }
}
