import fs from 'fs';
import path from 'path';
import { SAMPLE_WORKSHEET_PDF } from './pdfUtils';

// Central persistent fallback store for homework posts synced across routes and clients
export const INITIAL_DEFAULT_POSTS = [
  {
    id: 'hw_1',
    className: 'Class 8-A',
    subject: 'Mathematics',
    teacherName: 'Mrs. Priya Sharma',
    teacherRole: 'class_teacher',
    message: 'Complete Exercise 4.2 (Questions 1 to 8) on Linear Equations. Refer to the attached PDF worksheet for extra practice.',
    link: 'https://myschool.edu/resources/maths-ch4',
    attachment: {
      type: 'pdf',
      name: 'Class8_Maths_LinearEquations_Practice.pdf',
      size: '245 KB',
      url: SAMPLE_WORKSHEET_PDF
    },
    imageUrl: null,
    postedAt: '12 Nov 2026, 09:30 AM',
    hasDeadline: true,
    deadlineDate: '2026-11-14'
  },
  {
    id: 'hw_2',
    className: 'Class 8-A',
    subject: 'Science',
    teacherName: 'Mr. Rajesh Patel',
    teacherRole: 'subject_teacher',
    message: 'Read Chapter 6 on Cellular Structure and draw the labeled plant cell diagram in your homework sheet.',
    link: '',
    attachment: null,
    imageUrl: null,
    postedAt: '11 Nov 2026, 02:15 PM',
    hasDeadline: true,
    deadlineDate: '2026-11-15'
  }
];

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'homework.json');

// Helper to ensure data directory exists
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('Failed to create data directory:', e.message);
  }
}

// Load persisted posts from disk, or initialize with defaults
function loadPostsFromDisk() {
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
    console.warn('Failed to load homework from disk:', e.message);
  }
  // Initialize file with default posts
  savePostsToDisk(INITIAL_DEFAULT_POSTS);
  return [...INITIAL_DEFAULT_POSTS];
}

// Save posts permanently to disk
function savePostsToDisk(posts) {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to save homework to disk:', e.message);
  }
}

// In-memory cache synced with disk
let sharedHomework = loadPostsFromDisk();

export function getSharedHomework(className = null) {
  // Always refresh from disk in case another process/worker updated it
  sharedHomework = loadPostsFromDisk();

  if (!className || className === 'all' || className === 'All Classes') {
    return sharedHomework;
  }
  return sharedHomework.filter(
    h => !h.className || h.className === 'All Classes' || h.className.toLowerCase() === className.toLowerCase()
  );
}

export function setSharedHomework(newList) {
  sharedHomework = Array.isArray(newList) ? newList : [];
  savePostsToDisk(sharedHomework);
  return sharedHomework;
}

export function addSharedHomework(newPost) {
  sharedHomework = loadPostsFromDisk();
  // Prevent duplicate IDs
  sharedHomework = [newPost, ...sharedHomework.filter(h => h.id !== newPost.id)];
  savePostsToDisk(sharedHomework);
  return sharedHomework;
}

export function deleteSharedHomework(id) {
  sharedHomework = loadPostsFromDisk();
  sharedHomework = sharedHomework.filter(h => h.id !== id);
  savePostsToDisk(sharedHomework);
  return sharedHomework;
}

export function clearAllSharedHomework() {
  sharedHomework = [];
  savePostsToDisk(sharedHomework);
  return sharedHomework;
}

export function resetDemoHomework() {
  sharedHomework = [...INITIAL_DEFAULT_POSTS];
  savePostsToDisk(sharedHomework);
  return sharedHomework;
}

// Save an AI explanation into persistent storage for this homework ID and language
export function saveHomeworkAiExplanation(hwId, lang, explanation) {
  if (!hwId || !lang || !explanation) return null;
  const posts = loadPostsFromDisk();
  const idx = posts.findIndex(p => String(p.id) === String(hwId));
  if (idx !== -1) {
    if (!posts[idx].aiExplanations || typeof posts[idx].aiExplanations !== 'object') {
      posts[idx].aiExplanations = {};
    }
    posts[idx].aiExplanations[lang] = explanation;
    savePostsToDisk(posts);
    return posts[idx].aiExplanations;
  }
  return null;
}

// Retrieve an AI explanation from persistent storage for this homework ID and language
export function getHomeworkAiExplanation(hwId, lang) {
  if (!hwId || !lang) return null;
  const posts = loadPostsFromDisk();
  const post = posts.find(p => String(p.id) === String(hwId));
  if (post?.aiExplanations && typeof post.aiExplanations === 'object' && post.aiExplanations[lang]) {
    return post.aiExplanations[lang];
  }
  return null;
}
