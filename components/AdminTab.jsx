'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  UserCheck, 
  GraduationCap, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Check, 
  X, 
  Mail, 
  Phone,
  KeyRound,
  Sparkles,
  AlertTriangle,
  Lock,
  Upload,
  Download,
  FileSpreadsheet,
  Layers,
  Filter,
  CheckSquare,
  Square,
  ChevronDown,
  Palmtree,
  Coffee,
  CalendarCheck,
  CalendarPlus,
  Calendar,
  Award,
  BookOpen,
  Plus
} from 'lucide-react';
import { getSchoolConfig, saveSchoolConfig } from '@/lib/schoolConfig';
import { DEFAULT_GAZETTED_HOLIDAYS, getLocalCustomHolidays, saveLocalCustomHolidays } from '@/lib/holidays';

export default function AdminTab({ 
  students, 
  onRefreshStudents, 
  showToast,
  customHolidays = [],
  onRefreshHolidays,
  schoolConfig: externalSchoolConfig,
  onUpdateConfig,
  selectedClass = 'Class 8-A',
  onChangeClass,
  initialSubTab = 'teachers'
}) {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState(() => initialSubTab || 'teachers'); // 'teachers' | 'students' | 'holidays' | 'academics'
  const [selectedClassFilter, setSelectedClassFilter] = useState(() => selectedClass || 'all');
  const [academicClassFilter, setAcademicClassFilter] = useState(() => selectedClass || 'all');
  const studentFileInputRef = useRef(null);

  // Sync initialSubTab whenever passed dynamically (e.g. from Timetable Manage Subjects)
  useEffect(() => {
    if (initialSubTab) {
      setActiveAdminSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Sync selectedClassFilter and academicClassFilter whenever selectedClass prop changes from the top Navbar
  useEffect(() => {
    if (selectedClass) {
      setSelectedClassFilter(selectedClass);
      setAcademicClassFilter(selectedClass);
    }
  }, [selectedClass]);

  const handleSelectClassFilter = (cls) => {
    setSelectedClassFilter(cls);
    if (cls !== 'all' && typeof onChangeClass === 'function') {
      onChangeClass(cls);
    }
  };

  // Centralized School & Academic Configuration State
  const [localConfig, setLocalConfig] = useState(() => externalSchoolConfig || getSchoolConfig());

  useEffect(() => {
    if (externalSchoolConfig) {
      setLocalConfig(externalSchoolConfig);
    }
  }, [externalSchoolConfig]);

  // Exam Modals & Academic State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examNameInput, setExamNameInput] = useState('');
  const [setAsActiveOnSave, setSetAsActiveOnSave] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [isSavingExam, setIsSavingExam] = useState(false);

  // Subject Modals State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectLabelInput, setSubjectLabelInput] = useState('');
  const [subjectMaxMarksInput, setSubjectMaxMarksInput] = useState(25);
  const [subjectTeacherInput, setSubjectTeacherInput] = useState('');
  const [subjectClassesInput, setSubjectClassesInput] = useState(['All Classes']);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isSavingSubject, setIsSavingSubject] = useState(false);

  // Holidays state
  const [localHolidays, setLocalHolidays] = useState(() => customHolidays.length > 0 ? customHolidays : getLocalCustomHolidays());
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayDate, setHolidayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [holidayName, setHolidayName] = useState('');
  const [isSavingHoliday, setIsSavingHoliday] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState(null);

  useEffect(() => {
    if (customHolidays && customHolidays.length > 0) {
      setLocalHolidays(customHolidays);
    }
  }, [customHolidays]);

  // Available classes in School from centralized config
  const schoolConfig = getSchoolConfig();
  const schoolClasses = localConfig.classes && localConfig.classes.length > 0
    ? localConfig.classes
    : (schoolConfig.classes && schoolConfig.classes.length > 0
      ? schoolConfig.classes
      : [
          'Class 8-A',
          'Class 8-B',
          'Class 9-A',
          'Class 9-B',
          'Class 10-A',
          'Class 10-B',
          'Class 7-A',
          'Class 7-B',
        ]);

  // Class Management State
  const [newClassNameInput, setNewClassNameInput] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [classToRename, setClassToRename] = useState(null);
  const [renamedClassNameInput, setRenamedClassNameInput] = useState('');
  const [isRenamingClass, setIsRenamingClass] = useState(false);

  // Fallback Faculty Roster to ensure dropdowns are never blank
  const DEFAULT_TEACHERS = [
    { id: 't1', name: 'Mrs. Priya Sharma', email: 'priya@myschool.com', role: 'class_teacher', class_name: 'Class 8-A (CT), Class 8-B, Class 9-A, Class 9-B', classTeacherOf: 'Class 8-A', classes: ['Class 8-A', 'Class 8-B', 'Class 9-A', 'Class 9-B'], subject: 'Mathematics' },
    { id: 't2', name: 'Mr. Rajesh Patel', email: 'rajesh@myschool.com', role: 'class_teacher', class_name: 'Class 8-B (CT), Class 8-A, Class 9-A, Class 9-B', classTeacherOf: 'Class 8-B', classes: ['Class 8-A', 'Class 8-B', 'Class 9-A', 'Class 9-B'], subject: 'Science' },
    { id: 't3', name: 'Mrs. Sunita Verma', email: 'sunita@myschool.com', role: 'subject_teacher', class_name: 'Class 8-A, Class 8-B, Class 9-A, Class 9-B', classTeacherOf: null, classes: ['Class 8-A', 'Class 8-B', 'Class 9-A', 'Class 9-B'], subject: 'English' }
  ];

  // Normalization helpers for multi-class teaching & 1 class teacher per class rule
  const getTeacherClasses = (t) => {
    if (Array.isArray(t?.classes) && t.classes.length > 0) return t.classes;
    if (typeof t?.class_name === 'string' && t.class_name) {
      const parts = t.class_name
        .split(',')
        .map(c => c.replace(/\(CT\)/i, '').trim())
        .filter(Boolean);
      if (parts.length > 1) return parts;
      if (parts.length === 1 && !['t1', 't2', 't3'].includes(t?.id)) return parts;
    }
    return ['Class 8-A', 'Class 8-B', 'Class 9-A', 'Class 9-B'];
  };

  const getTeacherClassTeacherOf = (t) => {
    if (t?.classTeacherOf) return t.classTeacherOf;
    if (t?.class_teacher_of) return t.class_teacher_of;
    if (typeof t?.class_name === 'string' && t.class_name.includes('(CT)')) {
      const match = t.class_name.match(/(.+?)\s*\(CT\)/i);
      if (match) return match[1].trim();
    }
    if (t?.role === 'class_teacher') {
      const list = getTeacherClasses(t);
      return list[0] || 'Class 8-A';
    }
    return null;
  };

  // Teachers State with localStorage cache & default fallback
  const [teachers, setTeachers] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('myschool_teachers_cache');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_TEACHERS;
  });
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  // Clean Slate & Demo Onboarding Modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Teacher Modals
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherRole, setTeacherRole] = useState('subject_teacher');
  const [isClassTeacherChecked, setIsClassTeacherChecked] = useState(false);
  const [teacherClassTeacherOf, setTeacherClassTeacherOf] = useState(() => selectedClass || schoolClasses[0] || 'Class 8-A');
  const [teacherAssignedClasses, setTeacherAssignedClasses] = useState(() => [selectedClass || schoolClasses[0] || 'Class 8-A']);
  const [teacherSubject, setTeacherSubject] = useState('Mathematics');

  // Confirmation Delete Modal
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [understandChecked, setUnderstandChecked] = useState(false);
  const [isDeletingClass, setIsDeletingClass] = useState(false);

  // Student Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentRollNo, setStudentRollNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('Class 8-A');
  const [studentParentEmail, setStudentParentEmail] = useState('');
  const [studentParentPhone, setStudentParentPhone] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setIsLoadingTeachers(true);
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.success && Array.isArray(data.teachers) && data.teachers.length > 0) {
        setTeachers(data.teachers);
        try {
          localStorage.setItem('myschool_teachers_cache', JSON.stringify(data.teachers));
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Could not fetch remote teachers, using local fallback:', e);
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  // Helper for firstname@123
  const getFirstNamePassword = (name = '') => {
    const clean = name.replace(/^(mrs\.|mr\.|dr\.|ms\.|prof\.)\s+/i, '').trim();
    const first = clean.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${first || 'teacher'}@123`;
  };

  // ---------------- Clean Slate & Onboarding Actions ----------------
  const handleCleanSlate = async () => {
    setIsResetting(true);
    try {
      // 1. Clear all students, marks, attendance
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_clear_all_students' })
      });

      // 2. Clear all teachers (keeping master admin)
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_clear_all_teachers' })
      });

      // 2.5 Clear all homework posts from server & database
      await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all' })
      });

      // 3. Clear local storage caches
      try {
        localStorage.removeItem('myschool_students_cache');
        localStorage.removeItem('myschool_attendance_history');
        localStorage.setItem('myschool_homework_posts', '[]');
      } catch (e) {}

      // 4. Update UI states
      setTeachers([]);
      if (typeof onRefreshStudents === 'function') {
        await onRefreshStudents();
      }

      showToast('🎉 Clean Slate Initialized! 0 records. Ready to onboard your new school.');
      setIsResetModalOpen(false);
    } catch (e) {
      console.error(e);
      showToast('⚠️ Error clearing database records.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleRestoreDemo = async () => {
    setIsResetting(true);
    try {
      // 1. Restore demo students
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_load_demo_students' })
      });

      // 2. Restore demo teachers
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_load_demo_teachers' })
      });

      // 2.5 Restore demo homework on server
      await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore_demo' })
      });

      // 3. Clear local storage caches so fresh demo syncs
      try {
        localStorage.removeItem('myschool_students_cache');
        localStorage.removeItem('myschool_attendance_history');
        localStorage.removeItem('myschool_homework_posts');
      } catch (e) {}

      // 4. Update UI states
      await fetchTeachers();
      if (typeof onRefreshStudents === 'function') {
        await onRefreshStudents();
      }

      showToast('✨ Demo records (Class 8-A & Faculty) restored for presentation.');
      setIsDemoModalOpen(false);
    } catch (e) {
      console.error(e);
      showToast('⚠️ Error restoring demo records.');
    } finally {
      setIsResetting(false);
    }
  };

  // ---------------- Teacher Actions ----------------
  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherName('');
    setTeacherEmail('');
    setTeacherPassword('');
    setIsClassTeacherChecked(false);
    const targetCls = selectedClassFilter !== 'all' ? selectedClassFilter : (selectedClass || 'Class 8-A');
    setTeacherClassTeacherOf(targetCls);
    setTeacherAssignedClasses([targetCls]);
    setTeacherSubject('Mathematics');
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (t) => {
    setEditingTeacher(t);
    setTeacherName(t.name);
    setTeacherEmail(t.email);
    setTeacherPassword(t.password || getFirstNamePassword(t.name));

    const ctClass = getTeacherClassTeacherOf(t);
    const isCT = !!ctClass || t.role === 'class_teacher';
    setIsClassTeacherChecked(isCT);
    setTeacherClassTeacherOf(ctClass || selectedClass || 'Class 8-A');

    let parsedClasses = getTeacherClasses(t);
    if (isCT && ctClass && !parsedClasses.includes(ctClass)) {
      parsedClasses = [ctClass, ...parsedClasses];
    }
    setTeacherAssignedClasses(parsedClasses.length > 0 ? parsedClasses : ['Class 8-A']);
    setTeacherSubject(t.subject || 'Mathematics');
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    const role = isClassTeacherChecked ? 'class_teacher' : 'subject_teacher';
    const classTeacherOf = isClassTeacherChecked ? teacherClassTeacherOf : null;
    let finalClasses = [...teacherAssignedClasses];
    if (classTeacherOf && !finalClasses.includes(classTeacherOf)) {
      finalClasses.push(classTeacherOf);
    }
    if (finalClasses.length === 0) {
      finalClasses = [classTeacherOf || selectedClass || 'Class 8-A'];
    }

    // 1. Optimistic instant React state update
    setTeachers(prev => {
      const updated = prev.map(t => {
        if (t.id === editingTeacher?.id) {
          return {
            ...t,
            name: teacherName,
            email: teacherEmail,
            role,
            classTeacherOf,
            class_teacher_of: classTeacherOf,
            classes: finalClasses,
            class_name: classTeacherOf 
              ? `${classTeacherOf} (CT), ${finalClasses.filter(c => c !== classTeacherOf).join(', ')}`
              : finalClasses.join(', '),
            subject: teacherSubject,
            ...(teacherPassword ? { password: teacherPassword } : {})
          };
        }
        // Enforce 1 Class Teacher per class: if another teacher was CT of this class, make them subject teacher
        if (classTeacherOf && (getTeacherClassTeacherOf(t) === classTeacherOf)) {
          const theirClasses = getTeacherClasses(t);
          return {
            ...t,
            role: 'subject_teacher',
            classTeacherOf: null,
            class_teacher_of: null,
            class_name: theirClasses.join(', ')
          };
        }
        return t;
      });
      try {
        localStorage.setItem('myschool_teachers_cache', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    try {
      const payload = {
        action: editingTeacher ? 'admin_update_teacher' : 'admin_add_teacher',
        id: editingTeacher?.id,
        name: teacherName,
        email: teacherEmail,
        role,
        classTeacherOf,
        classes: finalClasses,
        className: classTeacherOf || finalClasses[0],
        subject: teacherSubject,
        password: teacherPassword
      };

      if (editingTeacher) {
        await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        showToast(`✅ Updated profile & credentials for ${teacherName}`);
      } else {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        showToast(`🎉 Added ${teacherName}! Default password: ${data.defaultPassword || 'firstname@123'}`);
      }
      setIsTeacherModalOpen(false);
      fetchTeachers();
    } catch (e) {
      showToast('⚠️ Failed to save teacher');
    }
  };

  const confirmDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_delete_teacher', id: teacherToDelete.id })
      });
      showToast(`Removed teacher ${teacherToDelete.name}`);
      setTeacherToDelete(null);
      fetchTeachers();
    } catch (e) {
      showToast('⚠️ Failed to delete teacher');
    }
  };

  // ---------------- Student Actions ----------------
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    const targetClass = selectedClassFilter !== 'all' ? selectedClassFilter : 'Class 8-A';
    const countInClass = students.filter(s => (s.className || 'Class 8-A') === targetClass).length;
    setStudentRollNo(String(countInClass + 1).padStart(2, '0'));
    setStudentName('');
    setStudentClass(targetClass);
    setStudentParentEmail('');
    setStudentParentPhone('');
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (st) => {
    setEditingStudent(st);
    setStudentRollNo(st.rollNo);
    setStudentName(st.name);
    setStudentClass(st.className || 'Class 8-A');
    setStudentParentEmail(st.parentEmail || '');
    setStudentParentPhone(st.parentPhone || '');
    setIsStudentModalOpen(true);
  };

  // Bulk Student Upload from Excel / CSV
  const handleBulkStudentUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });

        if (!rows || rows.length === 0) {
          showToast('⚠️ The uploaded spreadsheet is empty.');
          return;
        }

        const fallbackClass = selectedClassFilter !== 'all' ? selectedClassFilter : 'Class 8-A';
        const parsed = rows.map((r, i) => {
          const roll = String(r['Roll No'] || r['Roll'] || r['rollNo'] || r['roll'] || i + 1).padStart(2, '0');
          const name = String(r['Student Name'] || r['Name'] || r['name'] || `Student ${roll}`).trim();
          const cls = String(r['Class'] || r['ClassName'] || r['className'] || fallbackClass).trim();
          const email = String(r['Parent Email'] || r['Email'] || r['email'] || '').trim();
          const phone = String(r['Parent Phone'] || r['Phone'] || r['phone'] || '').trim();

          return {
            rollNo: roll,
            name,
            className: cls,
            parentEmail: email,
            parentPhone: phone
          };
        });

        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'admin_bulk_add_students',
            students: parsed
          })
        });

        const json = await res.json();
        if (json.success) {
          showToast(`🎉 Enrolled ${parsed.length} students across classes successfully!`);
          onRefreshStudents();
        } else {
          showToast(`⚠️ Upload failed: ${json.error || 'Server error'}`);
        }
      } catch (err) {
        console.error('Bulk student upload error:', err);
        showToast('⚠️ Could not parse file. Please use the sample Excel template.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Download Student Enrollment Sample Template
  const handleDownloadStudentTemplate = () => {
    const sampleData = [
      {
        'Roll No': '01',
        'Student Name': 'Aarav Mehta',
        'Class': selectedClassFilter !== 'all' ? selectedClassFilter : 'Class 8-B',
        'Parent Email': 'parent.mehta@example.com',
        'Parent Phone': '9876543210'
      },
      {
        'Roll No': '02',
        'Student Name': 'Ananya Das',
        'Class': selectedClassFilter !== 'all' ? selectedClassFilter : 'Class 8-B',
        'Parent Email': 'parent.das@example.com',
        'Parent Phone': '9876543211'
      },
      {
        'Roll No': '03',
        'Student Name': 'Kabir Sharma',
        'Class': selectedClassFilter !== 'all' ? selectedClassFilter : 'Class 8-B',
        'Parent Email': 'parent.ksharma@example.com',
        'Parent Phone': '9876543212'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student_Enrollment');
    XLSX.writeFile(wb, 'MySchool_Student_Enrollment_Template.xlsx');
    showToast('📥 Downloaded Student Enrollment Excel Template!');
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'admin_update_student',
            student: {
              rollNo: studentRollNo,
              name: studentName,
              className: studentClass,
              parentEmail: studentParentEmail,
              parentPhone: studentParentPhone
            }
          })
        });
        showToast(`✅ Updated student ${studentName}`);
      } else {
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'admin_add_student',
            student: {
              rollNo: studentRollNo,
              name: studentName,
              className: studentClass,
              parentEmail: studentParentEmail,
              parentPhone: studentParentPhone
            }
          })
        });
        showToast(`🎉 Added student ${studentName} to ${studentClass}`);
      }
      setIsStudentModalOpen(false);
      onRefreshStudents();
    } catch (e) {
      showToast('⚠️ Failed to save student');
    }
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_delete_student', rollNo: studentToDelete.rollNo })
      });
      showToast(`Removed student ${studentToDelete.name}`);
      setStudentToDelete(null);
      onRefreshStudents();
    } catch (e) {
      showToast('⚠️ Failed to remove student');
    }
  };

  // ---------------- Holiday Actions ----------------
  const handleOpenAddHoliday = () => {
    setHolidayDate(new Date().toISOString().split('T')[0]);
    setHolidayName('');
    setIsHolidayModalOpen(true);
  };

  const handleSaveHoliday = async (e) => {
    e.preventDefault();
    if (!holidayDate || !holidayName.trim()) {
      showToast('⚠️ Please enter both holiday date and name.');
      return;
    }
    setIsSavingHoliday(true);
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          holiday: {
            date: holidayDate,
            name: holidayName.trim(),
            declaredBy: 'Administrator'
          }
        })
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLocalHolidays(json.data);
        saveLocalCustomHolidays(json.data);
        onRefreshHolidays?.(json.data);
      }
      showToast(`🌴 Declared holiday: "${holidayName.trim()}" for ${holidayDate}`);
      setIsHolidayModalOpen(false);
    } catch (e) {
      showToast('⚠️ Failed to save holiday');
    } finally {
      setIsSavingHoliday(false);
    }
  };

  const confirmDeleteHoliday = async () => {
    if (!holidayToDelete) return;
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id: holidayToDelete.id
        })
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLocalHolidays(json.data);
        saveLocalCustomHolidays(json.data);
        onRefreshHolidays?.(json.data);
      }
      showToast(`Removed holiday: ${holidayToDelete.name}`);
      setHolidayToDelete(null);
    } catch (e) {
      showToast('⚠️ Failed to delete holiday');
    }
  };

  // ---------------- Academic & Exam Management Handlers ----------------
  const handleOpenAddExam = () => {
    const currentExams = localConfig.exams || [];
    if (currentExams.length >= 4) {
      showToast('⚠️ Maximum limit reached: You can configure up to 4 exams for this academic year.');
      return;
    }
    setEditingExam(null);
    setExamNameInput('');
    setSetAsActiveOnSave(false);
    setIsExamModalOpen(true);
  };

  const handleOpenEditExam = (exam) => {
    setEditingExam(exam);
    setExamNameInput(exam.name);
    setSetAsActiveOnSave(localConfig.activeExam === exam.name);
    setIsExamModalOpen(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!examNameInput.trim()) {
      showToast('⚠️ Please enter an examination name');
      return;
    }
    const trimmedExamName = examNameInput.trim();

    // 1. Instant Optimistic UI Update
    let updatedExams = [...(localConfig.exams || [])];
    if (editingExam) {
      updatedExams = updatedExams.map(ex => ex.id === editingExam.id ? { ...ex, name: trimmedExamName } : ex);
    } else {
      updatedExams.push({
        id: `exam_${Date.now()}`,
        name: trimmedExamName
      });
    }

    let updatedConfig = {
      ...localConfig,
      exams: updatedExams
    };

    if (setAsActiveOnSave) {
      updatedConfig.activeExam = trimmedExamName;
    }

    setLocalConfig(updatedConfig);
    saveSchoolConfig(updatedConfig);
    onUpdateConfig?.('save_all', { config: updatedConfig });
    setIsExamModalOpen(false);
    showToast(editingExam ? `✅ Renamed examination to "${trimmedExamName}"` : `🎉 Added examination "${trimmedExamName}"`);

    // 2. Background Sync to Server & Database
    setIsSavingExam(true);
    try {
      if (editingExam) {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'rename_exam', id: editingExam.id, name: trimmedExamName })
        });
        const data = await res.json();
        if (data.success && data.config) {
          let syncedConfig = data.config;
          if (setAsActiveOnSave && data.config.activeExam !== trimmedExamName) {
            await fetch('/api/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'set_active_exam', examName: trimmedExamName })
            });
            syncedConfig = { ...syncedConfig, activeExam: trimmedExamName };
          }
          setLocalConfig(syncedConfig);
          saveSchoolConfig(syncedConfig);
          onUpdateConfig?.('save_all', { config: syncedConfig });
        }
      } else {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_exam', name: trimmedExamName })
        });
        const data = await res.json();
        if (data.success && data.config) {
          let syncedConfig = data.config;
          if (setAsActiveOnSave && data.newExam) {
            await fetch('/api/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'set_active_exam', examName: data.newExam.name })
            });
            syncedConfig = { ...syncedConfig, activeExam: data.newExam.name };
          }
          setLocalConfig(syncedConfig);
          saveSchoolConfig(syncedConfig);
          onUpdateConfig?.('save_all', { config: syncedConfig });
        }
      }
    } catch (err) {
      console.warn('Background sync for exam (saved locally):', err);
    } finally {
      setIsSavingExam(false);
    }
  };

  const handleSetActiveExam = async (examName) => {
    // 1. Instant Optimistic UI Update: badge and button switch immediately
    const updatedConfig = {
      ...localConfig,
      activeExam: examName
    };
    setLocalConfig(updatedConfig);
    saveSchoolConfig(updatedConfig);
    onUpdateConfig?.('save_all', { config: updatedConfig });
    showToast(`🎯 Active examination set to "${examName}" across all classes`);

    // 2. Background Sync to Server & Database
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_active_exam', examName })
      });
      const data = await res.json();
      if (data.success && data.config) {
        setLocalConfig(data.config);
        saveSchoolConfig(data.config);
        onUpdateConfig?.('save_all', { config: data.config });
      }
    } catch (err) {
      console.warn('Background server sync for active exam (saved locally):', err);
    }
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    const currentExams = localConfig.exams || [];
    if (currentExams.length <= 1) {
      showToast('⚠️ Cannot delete: At least one exam must remain in the school calendar.');
      setExamToDelete(null);
      return;
    }

    // 1. Instant optimistic update
    const filteredExams = currentExams.filter(ex => ex.id !== examToDelete.id);
    let newActive = localConfig.activeExam;
    if (localConfig.activeExam === examToDelete.name) {
      newActive = filteredExams[0]?.name || 'Final Exam';
    }
    const updatedConfig = {
      ...localConfig,
      exams: filteredExams,
      activeExam: newActive
    };
    setLocalConfig(updatedConfig);
    saveSchoolConfig(updatedConfig);
    onUpdateConfig?.('save_all', { config: updatedConfig });
    showToast(`🗑️ Removed examination: "${examToDelete.name}"`);
    const examToRemove = examToDelete;
    setExamToDelete(null);

    // 2. Background sync
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_exam', id: examToRemove.id })
      });
      const data = await res.json();
      if (data.success && data.config) {
        setLocalConfig(data.config);
        saveSchoolConfig(data.config);
        onUpdateConfig?.('save_all', { config: data.config });
      }
    } catch (err) {
      console.warn('Background sync for delete exam:', err);
    }
  };

  // ---------------- Subject & Max Marks Management Handlers ----------------
  const handleOpenAddSubject = () => {
    const currentSubs = localConfig.subjects || [];
    if (currentSubs.length >= 10) {
      showToast('⚠️ Maximum limit reached: You can configure up to 10 curriculum subjects.');
      return;
    }
    setEditingSubject(null);
    setSubjectLabelInput('');
    setSubjectMaxMarksInput(25);
    setSubjectTeacherInput('');
    setSubjectClassesInput(academicClassFilter !== 'all' ? [academicClassFilter] : ['All Classes']);
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub) => {
    setEditingSubject(sub);
    setSubjectLabelInput(sub.label);
    setSubjectMaxMarksInput(sub.max || 25);
    // Auto-detect and pre-fill the teacher currently assigned:
    const assigned = sub.assignedTeacherName || 
      teachers.find(t => (t.subject || '').toLowerCase() === (sub.label || '').toLowerCase())?.name || 
      '';
    setSubjectTeacherInput(assigned);
    setSubjectClassesInput(Array.isArray(sub.classes) && sub.classes.length > 0 ? sub.classes : ['All Classes']);
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!subjectLabelInput.trim()) {
      showToast('⚠️ Please enter a subject name');
      return;
    }
    const maxMarksNum = Number(subjectMaxMarksInput);
    if (isNaN(maxMarksNum) || maxMarksNum <= 0) {
      showToast('⚠️ Please enter a valid maximum marks number (e.g. 25, 50, 100)');
      return;
    }

    const trimmedLabel = subjectLabelInput.trim();
    const assignedTeacher = subjectTeacherInput || null;
    const classesToSave = Array.isArray(subjectClassesInput) && subjectClassesInput.length > 0 
      ? subjectClassesInput 
      : ['All Classes'];

    // 1. Instant optimistic UI update
    let updatedSubjects = [...(localConfig.subjects || [])];
    if (editingSubject) {
      updatedSubjects = updatedSubjects.map(s => 
        s.key === editingSubject.key 
          ? { ...s, label: trimmedLabel, max: maxMarksNum, assignedTeacherName: assignedTeacher, classes: classesToSave }
          : s
      );
    } else {
      const newKey = trimmedLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
      updatedSubjects.push({
        key: newKey,
        label: trimmedLabel,
        max: maxMarksNum,
        assignedTeacherName: assignedTeacher,
        classes: classesToSave
      });
    }

    const updatedConfig = { ...localConfig, subjects: updatedSubjects };
    setLocalConfig(updatedConfig);
    saveSchoolConfig(updatedConfig);
    onUpdateConfig?.('save_all', { config: updatedConfig });
    setIsSubjectModalOpen(false);
    showToast(editingSubject ? `✅ Updated subject "${trimmedLabel}" (${maxMarksNum} marks)` : `🎉 Added subject "${trimmedLabel}" (${maxMarksNum} marks)`);

    // 2. Background sync to server & persistent storage
    setIsSavingSubject(true);
    try {
      if (editingSubject) {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_subject',
            key: editingSubject.key,
            label: trimmedLabel,
            maxMarks: maxMarksNum,
            assignedTeacherName: assignedTeacher
          })
        });
        const data = await res.json();
        if (data.success && data.config) {
          setLocalConfig(data.config);
          saveSchoolConfig(data.config);
          onUpdateConfig?.('save_all', { config: data.config });
        }
      } else {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_subject',
            label: trimmedLabel,
            maxMarks: maxMarksNum,
            assignedTeacherName: assignedTeacher
          })
        });
        const data = await res.json();
        if (data.success && data.config) {
          setLocalConfig(data.config);
          saveSchoolConfig(data.config);
          onUpdateConfig?.('save_all', { config: data.config });
        }
      }
    } catch (err) {
      console.warn('Background sync for subject (saved locally):', err);
    } finally {
      setIsSavingSubject(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;
    const currentSubs = localConfig.subjects || [];
    if (currentSubs.length <= 1) {
      showToast('⚠️ Cannot delete: At least one subject must remain in the curriculum.');
      setSubjectToDelete(null);
      return;
    }

    // 1. Instant optimistic update
    const filteredSubs = currentSubs.filter(s => s.key !== subjectToDelete.key);
    const updatedConfig = {
      ...localConfig,
      subjects: filteredSubs
    };
    setLocalConfig(updatedConfig);
    saveSchoolConfig(updatedConfig);
    onUpdateConfig?.('save_all', { config: updatedConfig });
    showToast(`🗑️ Removed subject: "${subjectToDelete.label}"`);
    const subToRemove = subjectToDelete;
    setSubjectToDelete(null);

    // 2. Background sync
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_subject', key: subToRemove.key })
      });
      const data = await res.json();
      if (data.success && data.config) {
        setLocalConfig(data.config);
        saveSchoolConfig(data.config);
        onUpdateConfig?.('save_all', { config: data.config });
      }
    } catch (err) {
      console.warn('Background sync for delete subject:', err);
    }
  };

  // ---------------- Class Management Handlers ----------------
  const handleAddClass = async (e) => {
    e?.preventDefault();
    const trimmed = newClassNameInput.trim();
    if (!trimmed) return;
    if (schoolClasses.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      showToast('⚠️ This class already exists in the school.');
      return;
    }

    setIsAddingClass(true);
    try {
      const updatedClasses = [...schoolClasses, trimmed];
      const newConfig = { ...localConfig, classes: updatedClasses };
      setLocalConfig(newConfig);
      saveSchoolConfig(newConfig);
      if (typeof onUpdateConfig === 'function') {
        onUpdateConfig('save_all', { config: newConfig });
      }

      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_class', className: trimmed })
      });

      setNewClassNameInput('');
      showToast(`🎉 Added ${trimmed} to school classes!`);
    } catch (err) {
      showToast('⚠️ Error adding class');
    } finally {
      setIsAddingClass(false);
    }
  };

  const handleOpenRenameClass = (cls) => {
    setClassToRename(cls);
    setRenamedClassNameInput(cls);
  };

  const handleConfirmRenameClass = async (e) => {
    e?.preventDefault();
    if (!classToRename) return;
    const oldName = classToRename;
    const newName = renamedClassNameInput.trim();

    if (!newName) {
      showToast('⚠️ Class name cannot be empty.');
      return;
    }

    if (oldName.toLowerCase() === newName.toLowerCase() && oldName === newName) {
      setClassToRename(null);
      return;
    }

    if (oldName.toLowerCase() !== newName.toLowerCase() && schoolClasses.some(c => c.toLowerCase() === newName.toLowerCase())) {
      showToast('⚠️ A class with this name already exists in the school.');
      return;
    }

    setIsRenamingClass(true);
    try {
      // 1. Update school config classes list
      const updatedClasses = schoolClasses.map(c => c === oldName ? newName : c);
      let updatedSubjects = Array.isArray(localConfig.subjects) ? localConfig.subjects.map(s => {
        if (Array.isArray(s.classes)) {
          return { ...s, classes: s.classes.map(c => c === oldName ? newName : c) };
        }
        return s;
      }) : [];

      const newConfig = { 
        ...localConfig, 
        classes: updatedClasses,
        defaultClass: localConfig.defaultClass === oldName ? newName : localConfig.defaultClass,
        subjects: updatedSubjects
      };
      setLocalConfig(newConfig);
      saveSchoolConfig(newConfig);
      if (typeof onUpdateConfig === 'function') {
        onUpdateConfig('save_all', { config: newConfig });
      }

      // 2. Update active class if needed
      if (selectedClass === oldName && typeof onChangeClass === 'function') {
        onChangeClass(newName);
      }
      if (selectedClassFilter === oldName) {
        setSelectedClassFilter(newName);
      }
      if (academicClassFilter === oldName) {
        setAcademicClassFilter(newName);
      }

      // 3. Update students belonging to this class
      const updatedStudents = students.map(s => (s.className === oldName ? { ...s, className: newName } : s));
      if (students.some(s => s.className === oldName)) {
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'bulk_replace', students: updatedStudents })
        });
        if (typeof onRefreshStudents === 'function') {
          onRefreshStudents();
        }
      }

      // 4. Update teachers assigned to this class
      const updatedTeachers = teachers.map(t => {
        let changed = false;
        let newCT = t.classTeacherOf;
        let newClasses = Array.isArray(t.classes) ? [...t.classes] : [];
        let newClassName = t.class_name || '';

        if (t.classTeacherOf === oldName) {
          newCT = newName;
          changed = true;
        }
        if (newClasses.includes(oldName)) {
          newClasses = newClasses.map(c => c === oldName ? newName : c);
          changed = true;
        }
        if (newClassName.includes(oldName)) {
          newClassName = newClassName.replaceAll(oldName, newName);
          changed = true;
        }
        return changed ? { ...t, classTeacherOf: newCT, classes: newClasses, class_name: newClassName } : t;
      });
      setTeachers(updatedTeachers);
      if (typeof window !== 'undefined') {
        localStorage.setItem('myschool_teachers_cache', JSON.stringify(updatedTeachers));
      }

      // 5. Sync to server config
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename_class', oldName, newName })
      });

      showToast(`✅ Successfully renamed "${oldName}" to "${newName}"!`);
      setClassToRename(null);
    } catch (err) {
      console.error('Error renaming class:', err);
      showToast('⚠️ Error renaming class');
    } finally {
      setIsRenamingClass(false);
    }
  };

  const confirmDeleteClass = async () => {
    if (!classToDelete) return;
    if (schoolClasses.length <= 1) {
      showToast('⚠️ At least one class must remain in the school.');
      setClassToDelete(null);
      return;
    }

    if (!understandChecked || deleteConfirmText.trim().toLowerCase() !== classToDelete.toLowerCase()) {
      showToast('⚠️ Please complete both confirmation steps to delete this class.');
      return;
    }

    setIsDeletingClass(true);
    const targetClass = classToDelete;

    try {
      const updatedClasses = schoolClasses.filter(c => c !== targetClass);
      const newConfig = { ...localConfig, classes: updatedClasses };
      setLocalConfig(newConfig);
      saveSchoolConfig(newConfig);
      if (typeof onUpdateConfig === 'function') {
        onUpdateConfig('save_all', { config: newConfig });
      }

      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_class', className: targetClass })
      });

      showToast(`Permanently deleted ${targetClass}`);
      setClassToDelete(null);
      setDeleteConfirmText('');
      setUnderstandChecked(false);
    } catch (err) {
      showToast('⚠️ Error removing class');
    } finally {
      setIsDeletingClass(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      
      {/* Top Admin Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 bg-gradient-to-r from-amber-600 via-amber-700 to-indigo-950 p-4 sm:p-6 rounded-3xl text-white shadow-xl shadow-amber-900/15 border border-amber-500/25">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-xl font-black text-white leading-tight">
                MySchool Administrator Control
              </h2>
              {/* Master Admin Badge with prominent clean border */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border-2 border-amber-300/80 text-[10px] font-black uppercase tracking-wider shadow-sm backdrop-blur-md shrink-0">
                <ShieldCheck className="w-3 h-3 text-amber-300" />
                <span>Master Admin</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-100/80 leading-relaxed">
              Manage faculty roster, edit teacher credentials, and control student enrollment.
            </p>
          </div>
        </div>

        {/* Sub-tab Pill Toggles: Perfectly balanced 2x2 grid on mobile, 4-col on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-black/30 p-1.5 rounded-2xl border border-white/15 w-full lg:w-auto shrink-0 shadow-inner">
          <button
            onClick={() => setActiveAdminSubTab('teachers')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all ${
              activeAdminSubTab === 'teachers'
                ? 'bg-white text-slate-900 shadow-md shadow-black/10'
                : 'text-amber-100/90 hover:text-white hover:bg-white/10'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Teachers <span className="opacity-70 text-[10px]">({teachers.length})</span></span>
          </button>
          <button
            onClick={() => setActiveAdminSubTab('students')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all ${
              activeAdminSubTab === 'students'
                ? 'bg-white text-slate-900 shadow-md shadow-black/10'
                : 'text-amber-100/90 hover:text-white hover:bg-white/10'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Students <span className="opacity-70 text-[10px]">({students.length})</span></span>
          </button>
          <button
            onClick={() => setActiveAdminSubTab('holidays')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all ${
              activeAdminSubTab === 'holidays'
                ? 'bg-white text-slate-900 shadow-md shadow-black/10'
                : 'text-amber-100/90 hover:text-white hover:bg-white/10'
            }`}
          >
            <Palmtree className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Holidays <span className="opacity-70 text-[10px]">({localHolidays.length})</span></span>
          </button>
          <button
            onClick={() => setActiveAdminSubTab('academics')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all ${
              activeAdminSubTab === 'academics'
                ? 'bg-white text-slate-900 shadow-md shadow-black/10'
                : 'text-amber-100/90 hover:text-white hover:bg-white/10'
            }`}
          >
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Academics <span className="opacity-70 text-[10px]">({localConfig?.subjects?.length || 5})</span></span>
          </button>
        </div>
      </div>

      {/* Quick School Onboarding & Data Management Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5 sm:py-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700">School Onboarding & State:</span>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200/60">
            {students.length} Students &bull; {teachers.length} Teachers
          </span>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
            title="Clear all demo students and teachers to onboard a brand new school"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Clean Slate</span>
          </button>
          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
            title="Restore sample demo data for presentation and testing"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Load Demo</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. TEACHER MANAGEMENT SECTION                             */}
      {/* ========================================================= */}
      {activeAdminSubTab === 'teachers' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">Registered Faculty & Staff</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {teachers.length} Teachers
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Click edit on any teacher to change their role, subject, assigned classes, or password.</p>
            </div>
            <button
              onClick={handleOpenAddTeacher}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Teacher</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[540px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Teacher Name</th>
                  <th className="py-3.5 px-3 sm:px-4">Role</th>
                  <th className="py-3.5 px-3 sm:px-4">Assigned Class</th>
                  <th className="py-3.5 px-3 sm:px-4">Subject</th>
                  <th className="py-3.5 px-3 sm:px-4 hidden md:table-cell">Email</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <p className="font-bold text-slate-700 text-xs">No faculty accounts registered yet</p>
                        <p className="text-[11px] text-slate-400">Click &ldquo;Add New Teacher&rdquo; to create teacher logins for this school.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  teachers.map(t => {
                    const activeCls = selectedClass || 'Class 8-A';
                    const ctOf = getTeacherClassTeacherOf(t);
                    const assignedList = getTeacherClasses(t);
                    const isCtForActive = ctOf === activeCls;
                    const teachesActive = assignedList.includes(activeCls);
                    const displayedClass = teachesActive ? activeCls : (assignedList[0] || ctOf || activeCls);
                    const otherCount = assignedList.filter(c => c !== displayedClass).length;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-800 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {t.name.charAt(0)}
                          </div>
                          <div className="truncate max-w-[140px] sm:max-w-none">
                            <p className="truncate whitespace-nowrap">{t.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal md:hidden">{t.email}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            isCtForActive
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {isCtForActive ? 'Class Teacher' : 'Subject Teacher'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 sm:px-4 font-semibold text-slate-600 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-bold text-[11px] whitespace-nowrap shadow-2xs">
                            {displayedClass}
                            {otherCount > 0 && (
                              <span className="text-[10px] font-medium text-indigo-500/80 ml-1">
                                (+{otherCount})
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 sm:px-4 font-semibold text-slate-600">
                          {t.subject || 'General'}
                        </td>
                        <td className="py-3.5 px-3 sm:px-4 text-slate-500 font-mono text-[11px] hidden md:table-cell">
                          {t.email}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditTeacher(t)}
                              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1 font-semibold text-xs"
                              title="Edit Teacher Profile & Password"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => setTeacherToDelete(t)}
                              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 font-semibold text-xs"
                              title="Remove Teacher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. STUDENT ROSTER MANAGEMENT SECTION                      */}
      {/* ========================================================= */}
      {activeAdminSubTab === 'students' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          
          {/* Hidden File Input for Bulk Student Import */}
          <input 
            type="file" 
            ref={studentFileInputRef} 
            onChange={handleBulkStudentUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />

          {/* Section Header with Action Buttons */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">Student Enrollment Roster</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {students.length} Total Enrolled
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Filter by class or bulk-enroll students with Excel / CSV upload.</p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadStudentTemplate}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-xs transition-all"
                title="Download Sample Student Enrollment Excel Template"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template</span>
              </button>

              <button
                onClick={() => studentFileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 font-bold text-xs shadow-xs transition-all"
                title="Bulk enroll students via Excel or CSV"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bulk Upload</span>
              </button>

              <button
                onClick={handleOpenAddStudent}
                className="col-span-2 sm:col-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          {/* Interactive Class Filter Bar */}
          <div 
            className="px-4 sm:px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Class:</span>
            </span>

            <button
              onClick={() => handleSelectClassFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedClassFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Classes ({students.length})
            </button>

            {schoolClasses.map(c => {
              const count = students.filter(s => (s.className || 'Class 8-A') === c).length;
              const isSelected = selectedClassFilter === c;
              return (
                <button
                  key={c}
                  onClick={() => handleSelectClassFilter(c)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : count > 0
                        ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                        : 'bg-white/60 border border-slate-200/60 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {c} <span className="opacity-75 text-[11px]">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[540px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Roll No</th>
                  <th className="py-3.5 px-3 sm:px-4">Student Name</th>
                  <th className="py-3.5 px-3 sm:px-4">Class</th>
                  <th className="py-3.5 px-3 sm:px-4 hidden md:table-cell">Parent Email</th>
                  <th className="py-3.5 px-3 sm:px-4 hidden sm:table-cell">Parent Phone</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(selectedClassFilter === 'all' 
                  ? students 
                  : students.filter(s => (s.className || 'Class 8-A') === selectedClassFilter)
                ).map(st => (
                  <tr key={`${st.className || '8A'}_${st.rollNo}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-slate-500 whitespace-nowrap">
                      #{st.rollNo}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 font-bold text-slate-800">
                      <p className="whitespace-nowrap">{st.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal md:hidden">{st.parentEmail}</p>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 font-semibold text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-bold text-[11px] whitespace-nowrap shadow-2xs">
                        {st.className || 'Class 8-A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-slate-500 hidden md:table-cell">
                      {st.parentEmail || '—'}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-slate-500 font-mono hidden sm:table-cell">
                      {st.parentPhone || '—'}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditStudent(st)}
                          className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 transition-colors"
                          title="Edit Student"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setStudentToDelete(st)}
                          className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-500 hover:text-rose-600 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(selectedClassFilter === 'all' 
              ? students 
              : students.filter(s => (s.className || 'Class 8-A') === selectedClassFilter)
            ).length === 0 && (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                <Users className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">No students enrolled in {selectedClassFilter} yet</p>
                <p className="text-[11px] text-slate-400 mt-1">Click &ldquo;Add Student&rdquo; or use &ldquo;Bulk Upload&rdquo; with the template to enroll students.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SCHOOL HOLIDAY & OFF-DAYS MANAGEMENT SECTION           */}
      {/* ========================================================= */}
      {activeAdminSubTab === 'holidays' && (
        <div className="flex flex-col gap-5">
          {/* Main Holiday Management Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800">School Calendar & Holiday Policy</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Auto-Enforced
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Holidays are automatically grayed out & blurred in teachers&apos; attendance registers and excluded from student absence calculations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenAddHoliday}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-200 transition-all self-start sm:self-auto"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Declare Holiday</span>
                </button>
              </div>
            </div>

            {/* Automated Standing Rules Strip */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/50 via-slate-50 to-indigo-50/30 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Automated Standing Weekly & National Rules
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Sunday Rule */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Palmtree className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-800">Every Sunday</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Universal weekly off. Attendance is automatically grayed out and disabled.
                    </p>
                  </div>
                </div>

                {/* 2nd & 4th Saturday Rule */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Coffee className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-800">2nd & 4th Saturday</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Standard bi-weekly school holiday (days 8-14 & 22-28 of every month).
                    </p>
                  </div>
                </div>

                {/* National Gazetted Holidays */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CalendarCheck className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-800">Gazetted Holidays</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                        Built-in
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Republic Day, Independence Day, Gandhi Jayanti, Diwali, Christmas, etc.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Declared Custom School Holidays List */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Admin-Declared School Holidays ({localHolidays.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  Custom events, weather breaks, sports days
                </span>
              </div>

              {localHolidays.length === 0 ? (
                <div className="py-10 text-center text-slate-400 flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200 rounded-2xl">
                  <Palmtree className="w-8 h-8 text-slate-300" />
                  <p className="font-bold text-slate-700 text-xs">No custom holidays declared yet</p>
                  <p className="text-[11px] text-slate-400">
                    Sundays and 2nd/4th Saturdays are already active. Click &ldquo;Declare Holiday&rdquo; to add school-specific holidays.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {localHolidays.map((h) => {
                    const dateObj = new Date(h.date + 'T00:00:00');
                    const formattedDate = !isNaN(dateObj.getTime())
                      ? dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
                      : h.date;

                    return (
                      <div 
                        key={h.id || h.date}
                        className="p-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/70 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                            <Palmtree className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{h.name}</p>
                            <p className="text-[11px] font-semibold text-amber-700 mt-0.5">{formattedDate}</p>
                            <p className="text-[10px] text-slate-400 mt-0.2">Declared by {h.declaredBy || 'Admin'}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => setHolidayToDelete(h)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors shrink-0"
                          title="Remove Holiday"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reference: Standard Gazetted Calendar */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-600">Standard National & Gazetted Days Reference:</span>
                <span className="text-[11px] font-semibold text-slate-400">Standard School Calendar</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_GAZETTED_HOLIDAYS.slice(0, 8).map((gh, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200/80 text-[11px] font-medium text-slate-700 shadow-xs"
                  >
                    <span className="text-amber-500 font-bold">&bull;</span>
                    <span>{gh.name}</span>
                    <span className="text-slate-400 text-[10px]">({gh.date || gh.dateMatch?.replace('-', '')})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. ACADEMIC EXAMS & SUBJECT CURRICULUM MANAGEMENT          */}
      {/* ========================================================= */}
      {activeAdminSubTab === 'academics' && (
        <div className="flex flex-col gap-5">
          
          {/* CARD 1: EXAMINATIONS & ACTIVE TERM */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800">Examination Calendar & Active Term</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {localConfig.exams?.length || 0} Configured
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure examinations and select which exam is currently active for marksheet entry and report cards.
                </p>
              </div>
              <button
                onClick={handleOpenAddExam}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Exam</span>
              </button>
            </div>

            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(localConfig.exams || []).map((exam) => {
                  const isActive = (localConfig.activeExam || 'Unit Test 1') === exam.name;
                  return (
                    <div 
                      key={exam.id}
                      className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isActive 
                          ? 'bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/40 border-indigo-300 shadow-sm' 
                          : 'bg-white border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Award className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 leading-snug truncate">{exam.name}</h4>
                            <p className="text-[10px] text-slate-400 font-medium">Academic Term</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditExam(exam)}
                            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Rename exam"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setExamToDelete(exam)}
                            className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete exam"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-[11px] font-bold">
                            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                            <span>Active for Marks</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetActiveExam(exam.name)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            Make Active
                          </button>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">#{exam.id.slice(-4)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CARD 2: CURRICULUM SUBJECTS & MAX MARKS & TEACHER ASSIGNMENT */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800">Curriculum Subjects & Evaluation Scale</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {localConfig.subjects?.length || 0} Subjects
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure subjects, maximum marks (e.g., 25, 50, 80, 100), and designate primary faculty teachers.
                </p>
              </div>
              <button
                onClick={handleOpenAddSubject}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subject</span>
              </button>
            </div>

            {/* Filter by Class for Academics Subjects */}
            <div className="px-4 sm:px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 shrink-0">Class Scope:</span>
              <button
                type="button"
                onClick={() => setAcademicClassFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
                  academicClassFilter === 'all'
                    ? 'bg-[#171340] text-white border-[#171340] shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Classes
              </button>
              {schoolClasses.map(cls => (
                <button
                  type="button"
                  key={cls}
                  onClick={() => setAcademicClassFilter(cls)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
                    academicClassFilter === cls
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Subject</th>
                    <th className="py-3 px-4 text-center">Max Marks</th>
                    <th className="py-3 px-4">Assigned Teacher</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {(localConfig.subjects || [])
                    .filter(sub => {
                      if (academicClassFilter === 'all') return true;
                      if (!sub.classes || sub.classes.length === 0 || sub.classes.includes('All Classes')) return true;
                      return sub.classes.includes(academicClassFilter);
                    })
                    .map((sub) => {
                      const assignedTeacher = teachers.find(t => t.name === sub.assignedTeacherName) || 
                                             teachers.find(t => (t.subject || '').toLowerCase() === sub.label.toLowerCase());
                      return (
                        <tr key={sub.key} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 sm:px-6">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs">
                                {sub.label.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 text-sm">{sub.label}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <p className="text-[10px] text-slate-400 font-mono">key: {sub.key}</p>
                                  {sub.classes && !sub.classes.includes('All Classes') ? (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      {sub.classes.join(', ')}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                                      All Classes
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 font-bold text-slate-700 border border-slate-200">
                            {sub.max || 25} Marks
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {sub.assignedTeacherName ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{sub.assignedTeacherName}</span>
                            </span>
                          ) : assignedTeacher ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-600 font-medium border border-slate-200">
                              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                              <span>{assignedTeacher.name} <span className="text-[10px] text-slate-400">(matched)</span></span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-400 text-[11px] font-medium border border-slate-200/60">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditSubject(sub)}
                              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Edit subject & max marks"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSubjectToDelete(sub)}
                              className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete subject"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARD 3: SCHOOL CLASSES & GRADE DIVISIONS */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800">School Classes & Grade Divisions</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {schoolClasses.length} Active Classes
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Add, remove, or customize classes (e.g. Class 1-A, Grade 6-B, Class 11-Science) for your school.
                </p>
              </div>

              {/* Quick Add Class Form */}
              <form onSubmit={handleAddClass} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="e.g. Class 6-A or Grade 11-A"
                  value={newClassNameInput}
                  onChange={(e) => setNewClassNameInput(e.target.value)}
                  className="w-full sm:w-48 text-xs px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newClassNameInput.trim() || isAddingClass}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Class</span>
                </button>
              </form>
            </div>

            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {schoolClasses.map(cls => {
                const studentCount = students.filter(s => (s.className || 'Class 8-A') === cls).length;
                const ct = teachers.find(t => getTeacherClassTeacherOf(t) === cls);

                return (
                  <div 
                    key={cls}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-800 text-sm block">{cls}</span>
                        <span className="text-[10px] text-slate-500">
                          {studentCount} {studentCount === 1 ? 'Student' : 'Students'} Enrolled
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenRenameClass(cls)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer"
                          title={`Rename ${cls}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {schoolClasses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setClassToDelete(cls);
                              setDeleteConfirmText('');
                              setUnderstandChecked(false);
                            }}
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                            title={`Permanently delete ${cls}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 text-[10px]">Class Teacher:</span>
                      {ct ? (
                        <span className="font-bold text-indigo-700 truncate max-w-[120px]" title={ct.name}>
                          {ct.name}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium text-[10px]">Not Appointed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT TEACHER (With Password Change Field)    */}
      {/* ========================================================= */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {editingTeacher ? `Edit Profile & Credentials: ${editingTeacher.name}` : 'Add New Teacher'}
              </h3>
              <button 
                onClick={() => setIsTeacherModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Mrs. Sunita Verma"
                  value={teacherName} 
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="teacher@myschool.com"
                  value={teacherEmail} 
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Teaching Subject</label>
                <div className="relative mt-1">
                  <select 
                    value={teacherSubject} 
                    onChange={(e) => setTeacherSubject(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800 appearance-none pr-8 cursor-pointer"
                  >
                    {(localConfig.subjects || []).map((sub) => (
                      <option key={sub.key} value={sub.label}>{sub.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Dual Role: Class Teacher Designation */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isClassTeacherChecked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsClassTeacherChecked(checked);
                      if (checked && !teacherAssignedClasses.includes(teacherClassTeacherOf)) {
                        setTeacherAssignedClasses([...teacherAssignedClasses, teacherClassTeacherOf]);
                      }
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Appointed as Class Teacher</span>
                    <span className="text-[10px] text-slate-400">(1 Class Teacher per class only)</span>
                  </div>
                </label>

                {isClassTeacherChecked && (
                  <div className="pt-2 border-t border-slate-200/60 animate-in fade-in duration-150">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Assigned Class:
                    </label>
                    <div className="relative">
                      <select
                        value={teacherClassTeacherOf}
                        onChange={(e) => {
                          const newCtClass = e.target.value;
                          setTeacherClassTeacherOf(newCtClass);
                          if (!teacherAssignedClasses.includes(newCtClass)) {
                            setTeacherAssignedClasses([...teacherAssignedClasses, newCtClass]);
                          }
                        }}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-950 appearance-none pr-8 cursor-pointer"
                      >
                        {schoolClasses.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-indigo-600 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-Class Assignment: A Teacher Can Teach Multiple Classes */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800">Assigned Teaching Classes</label>
                    <p className="text-[10px] text-slate-400">Select all classes where this teacher teaches subjects:</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setTeacherAssignedClasses([...schoolClasses])}
                      className="text-indigo-600 hover:underline font-semibold"
                    >
                      All
                    </button>
                    <span className="text-slate-300">&bull;</span>
                    <button
                      type="button"
                      onClick={() => setTeacherAssignedClasses(isClassTeacherChecked ? [teacherClassTeacherOf] : [schoolClasses[0]])}
                      className="text-slate-500 hover:underline font-semibold"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  {schoolClasses.map(cls => {
                    const isSelected = teacherAssignedClasses.includes(cls);
                    const isHomeroom = isClassTeacherChecked && teacherClassTeacherOf === cls;
                    return (
                      <button
                        type="button"
                        key={cls}
                        onClick={() => {
                          if (isHomeroom) return; // Cannot uncheck homeroom class
                          if (isSelected) {
                            if (teacherAssignedClasses.length <= 1) return; // keep at least 1 class
                            setTeacherAssignedClasses(teacherAssignedClasses.filter(c => c !== cls));
                          } else {
                            setTeacherAssignedClasses([...teacherAssignedClasses, cls]);
                          }
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                          isHomeroom
                            ? 'bg-indigo-100/80 border-indigo-300 text-indigo-900 cursor-default'
                            : isSelected
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{cls}</span>
                        {isHomeroom ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-800 shrink-0">CT</span>
                        ) : isSelected ? (
                          <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Password field directly in editing form */}
              {editingTeacher ? (
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Teacher Password</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setTeacherPassword(getFirstNamePassword(teacherName))}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                    >
                      Reset to {getFirstNamePassword(teacherName)}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={teacherPassword} 
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">
                    Admin can set custom password or reset back to default anytime.
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-indigo-50 text-[11px] text-indigo-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Default password will be set automatically to <strong>{getFirstNamePassword(teacherName)}</strong></span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100"
                >
                  Save Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT STUDENT (With Class Dropdown List)      */}
      {/* ========================================================= */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {editingStudent ? `Edit Student #${editingStudent.rollNo}` : 'Add New Student'}
              </h3>
              <button 
                onClick={() => setIsStudentModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Roll No</label>
                  <input 
                    type="text" 
                    required
                    placeholder="11"
                    value={studentRollNo} 
                    onChange={(e) => setStudentRollNo(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600">Select Class</label>
                  <div className="relative mt-1">
                    <select 
                      value={studentClass} 
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800 appearance-none pr-8 cursor-pointer"
                    >
                      {schoolClasses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Student Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Varun Sharma"
                  value={studentName} 
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Parent Email Address</label>
                <input 
                  type="email" 
                  placeholder="parent.sharma@example.com"
                  value={studentParentEmail} 
                  onChange={(e) => setStudentParentEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Parent Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="9876543211"
                  value={studentParentPhone} 
                  onChange={(e) => setStudentParentPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION MODAL: DELETE TEACHER                        */}
      {/* ========================================================= */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Confirm Teacher Removal</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>{teacherToDelete.name}</strong>? This will revoke their access to MySchool permanently.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTeacher}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION MODAL: DELETE STUDENT                        */}
      {/* ========================================================= */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Remove Student Record</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>{studentToDelete.name} (Roll #{studentToDelete.rollNo})</strong> from the class roster?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION MODAL: CLEAN SLATE (0 RECORDS)               */}
      {/* ========================================================= */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Initialize Clean Slate?</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                This will delete <strong>all demo students, marks, attendance, and faculty accounts</strong> so you can onboard a brand-new school with 0 records. Your master Administrator login is preserved.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetModalOpen(false)}
                className="py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleCleanSlate}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 flex items-center justify-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <span>Yes, Start at 0</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION MODAL: RESTORE DEMO DATA                     */}
      {/* ========================================================= */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Restore Demo Presentation Data?</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                This will reload the 10 sample students (Class 8-A), attendance logs, and demo teachers for demonstrations and client presentations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsDemoModalOpen(false)}
                className="py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleRestoreDemo}
                className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <span>Restore Demo</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DECLARE CUSTOM HOLIDAY                             */}
      {/* ========================================================= */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Palmtree className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Declare School Holiday</h3>
              </div>
              <button 
                onClick={() => setIsHolidayModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHoliday} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600">Holiday Date</label>
                <input 
                  type="date" 
                  required
                  value={holidayDate} 
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium bg-slate-50 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Holiday Name / Occasion</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Annual Sports Meet (School Closed)"
                  value={holidayName} 
                  onChange={(e) => setHolidayName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This date will automatically be grayed out and non-clickable in teacher attendance registers across all classes.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingHoliday}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-200"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingHoliday ? 'Saving...' : 'Declare Holiday'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRM DELETE HOLIDAY                             */}
      {/* ========================================================= */}
      {holidayToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Remove School Holiday?</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Remove <strong>{holidayToDelete.name}</strong> on <strong>{holidayToDelete.date}</strong>? Teachers will be able to take attendance on this day again.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHolidayToDelete(null)}
                className="py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Keep Holiday
              </button>
              <button
                type="button"
                onClick={confirmDeleteHoliday}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT EXAMINATION                              */}
      {/* ========================================================= */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {editingExam ? `Rename Examination: ${editingExam.name}` : 'Add New Examination'}
                </h3>
              </div>
              <button 
                onClick={() => setIsExamModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600">Examination Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Mid-Term Examination, Unit Test 3, Final Board Exam"
                  value={examNameInput} 
                  onChange={(e) => setExamNameInput(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setAsActiveOnSave}
                    onChange={(e) => setSetAsActiveOnSave(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Set as currently active examination</span>
                    <span className="text-[10px] text-slate-400">Teachers will record and view marks for this exam</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingExam}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingExam ? 'Saving...' : editingExam ? 'Update Exam' : 'Add Exam'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRM DELETE EXAMINATION                          */}
      {/* ========================================================= */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Delete Examination?</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to delete <strong>{examToDelete.name}</strong> from the school calendar?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExamToDelete(null)}
                className="py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteExam}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200"
              >
                Delete Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT SUBJECT                                  */}
      {/* ========================================================= */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {editingSubject ? `Edit Subject: ${editingSubject.label}` : 'Add Curriculum Subject'}
                </h3>
              </div>
              <button 
                onClick={() => setIsSubjectModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600">Subject Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Computer Science, Social Studies, Sanskrit"
                  value={subjectLabelInput} 
                  onChange={(e) => setSubjectLabelInput(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">Maximum Marks</label>
                  <span className="text-[10px] text-slate-400">Total scale for this subject</span>
                </div>
                <input 
                  type="number" 
                  required
                  min="1"
                  max="200"
                  value={subjectMaxMarksInput} 
                  onChange={(e) => setSubjectMaxMarksInput(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-800"
                />
                {/* Quick Presets for fast 1-click selection */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">Quick presets:</span>
                  {[25, 50, 80, 100].map(val => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setSubjectMaxMarksInput(val)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                        Number(subjectMaxMarksInput) === val 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Assigned Primary Teacher</label>
                <div className="relative mt-1">
                  <select
                    value={subjectTeacherInput}
                    onChange={(e) => setSubjectTeacherInput(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800 appearance-none pr-8 cursor-pointer"
                  >
                    <option value="">— Unassigned (Any authorized teacher) —</option>
                    {subjectTeacherInput && !teachers.some(t => t.name === subjectTeacherInput) && (
                      <option value={subjectTeacherInput}>
                        {subjectTeacherInput} (Currently Assigned)
                      </option>
                    )}
                    {teachers.map(t => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.role === 'class_teacher' ? `Class Teacher ${t.class_name || ''}` : `${t.subject || 'Faculty'}`})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Assigning a teacher gives them direct marks entry permission for this subject.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Applicable Classes</label>
                <div className="flex items-center gap-1.5 flex-wrap p-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <button
                    type="button"
                    onClick={() => setSubjectClassesInput(['All Classes'])}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      subjectClassesInput.includes('All Classes')
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Classes
                  </button>
                  {schoolClasses.map(cls => {
                    const isSelected = !subjectClassesInput.includes('All Classes') && subjectClassesInput.includes(cls);
                    return (
                      <button
                        type="button"
                        key={cls}
                        onClick={() => {
                          if (subjectClassesInput.includes('All Classes')) {
                            setSubjectClassesInput([cls]);
                          } else {
                            if (subjectClassesInput.includes(cls)) {
                              const next = subjectClassesInput.filter(c => c !== cls);
                              setSubjectClassesInput(next.length > 0 ? next : ['All Classes']);
                            } else {
                              setSubjectClassesInput([...subjectClassesInput, cls]);
                            }
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cls}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {subjectClassesInput.includes('All Classes') 
                    ? 'Active for all classes in school and available in all class timetables.'
                    : `Active exclusively in timetable & marksheets for: ${subjectClassesInput.join(', ')}`}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSubject}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingSubject ? 'Saving...' : editingSubject ? 'Update Subject' : 'Add Subject'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRM DELETE SUBJECT                              */}
      {/* ========================================================= */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Delete Subject?</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to remove <strong>{subjectToDelete.label}</strong> from curriculum and marksheets?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSubjectToDelete(null)}
                className="py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubject}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 cursor-pointer"
              >
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: HIGH-SECURITY 2-STEP CONFIRM DELETE CLASS           */}
      {/* ========================================================= */}
      {classToDelete && (() => {
        const enrolledCount = students.filter(s => (s.className || 'Class 8-A') === classToDelete).length;
        const isMatches = deleteConfirmText.trim().toLowerCase() === classToDelete.toLowerCase();
        const canDelete = understandChecked && isMatches && !isDeletingClass;

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-rose-100 flex flex-col gap-4">
              
              {/* Header */}
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 shrink-0 flex items-center justify-center shadow-xs">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 tracking-tight">
                    Delete {classToDelete}?
                  </h4>
                  <p className="text-xs text-rose-600 font-semibold mt-0.5">
                    Critical destructive action &bull; Permanent removal
                  </p>
                </div>
              </div>

              {/* Warning Notice Box */}
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3.5 text-xs text-rose-950 flex flex-col gap-2">
                <p className="font-bold">
                  Deleting <span className="underline font-black">{classToDelete}</span> will result in:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-900">
                  <li>
                    {enrolledCount > 0 ? (
                      <span className="font-bold text-rose-700">
                        {enrolledCount} enrolled student{enrolledCount > 1 ? 's' : ''} will have their assigned class unlinked.
                      </span>
                    ) : (
                      <span>All class rosters, student groups, and attendance records for this section will be removed.</span>
                    )}
                  </li>
                  <li>Assigned Class Teacher designation for this section will be revoked.</li>
                  <li>The class timetable schedule and period assignments will be permanently deleted.</li>
                </ul>
              </div>

              {/* Step 1: Confirmation Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 cursor-pointer select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={understandChecked}
                    onChange={(e) => setUnderstandChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 font-bold leading-snug">
                    I understand that deleting this class cannot be undone and will erase all class data.
                  </span>
                </label>
              </div>

              {/* Step 2: Verification Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  To confirm, type <span className="font-black text-rose-600 select-all font-mono px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200">{classToDelete}</span> below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={`Type "${classToDelete}" to confirm`}
                  className={`w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl border transition-all focus:outline-none ${
                    isMatches 
                      ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:ring-2 focus:ring-rose-500' 
                      : 'border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500'
                  }`}
                  autoFocus
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setClassToDelete(null);
                    setDeleteConfirmText('');
                    setUnderstandChecked(false);
                  }}
                  disabled={isDeletingClass}
                  className="py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteClass}
                  disabled={!canDelete}
                  className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    canDelete
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingClass ? 'Deleting...' : 'Permanently Delete'}</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* MODAL: RENAME CLASS                                       */}
      {/* ========================================================= */}
      {classToRename && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Rename Class</h3>
                  <p className="text-[10px] text-slate-400">Current: {classToRename}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setClassToRename(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRenameClass} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">New Class Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 8-A or Class 9-Blue"
                  value={renamedClassNameInput}
                  onChange={(e) => setRenamedClassNameInput(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-800"
                  autoFocus
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Renaming will automatically update all enrolled students, assigned teachers, curriculum subjects, and timetables.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClassToRename(null)}
                  disabled={isRenamingClass}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!renamedClassNameInput.trim() || isRenamingClass}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-100 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isRenamingClass ? 'Renaming...' : 'Save Class Name'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
