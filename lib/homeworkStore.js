// Central in-memory fallback store for homework posts synced across routes and clients
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
      url: null
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

export let sharedHomework = [...INITIAL_DEFAULT_POSTS];

export function getSharedHomework(className = null) {
  if (!className || className === 'all' || className === 'All Classes') {
    return sharedHomework;
  }
  return sharedHomework.filter(
    h => !h.className || h.className === 'All Classes' || h.className.toLowerCase() === className.toLowerCase()
  );
}

export function setSharedHomework(newList) {
  sharedHomework = Array.isArray(newList) ? newList : [];
}

export function addSharedHomework(newPost) {
  sharedHomework = [newPost, ...sharedHomework];
  return sharedHomework;
}

export function deleteSharedHomework(id) {
  sharedHomework = sharedHomework.filter(h => h.id !== id);
  return sharedHomework;
}

export function clearAllSharedHomework() {
  sharedHomework = [];
  return sharedHomework;
}

export function resetDemoHomework() {
  sharedHomework = [...INITIAL_DEFAULT_POSTS];
  return sharedHomework;
}

