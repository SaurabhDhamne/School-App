'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import DashboardTab from '@/components/DashboardTab';
import AttendanceTab from '@/components/AttendanceTab';
import MarksheetTab from '@/components/MarksheetTab';
import AdminTab from '@/components/AdminTab';
import ScanModal from '@/components/ScanModal';
import ExportAttendanceModal from '@/components/ExportAttendanceModal';
import StudentDetailModal from '@/components/StudentDetailModal';
import EmailModal from '@/components/EmailModal';
import AuthModal from '@/components/AuthModal';
import ProfileModal from '@/components/ProfileModal';
import HomeworkSection from '@/components/HomeworkSection';
import ParentPortalView from '@/components/ParentPortalView';
import { Mail, Send, AlertTriangle, FileSpreadsheet, CheckCircle2, X, AlertCircle, Upload } from 'lucide-react';
import { getSchoolConfig, saveSchoolConfig, DEFAULT_SCHOOL_CONFIG } from '@/lib/schoolConfig';
import { getLocalCustomHolidays, saveLocalCustomHolidays, isSchoolHoliday } from '@/lib/holidays';

export default function App() {
  // Navigation: 'home' | 'attendance' | 'marksheet' | 'admin'
  const [activeTab, setActiveTab] = useState('home');

  // School Configuration & Multi-Class Architecture
  const [schoolConfig, setSchoolConfig] = useState(() => getSchoolConfig());
  const [customHolidays, setCustomHolidays] = useState(() => getLocalCustomHolidays());
  const [selectedClass, setSelectedClass] = useState(() => {
    try {
      const savedUser = localStorage.getItem('edusnap_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.classTeacherOf && u.classTeacherOf !== 'All Classes') return u.classTeacherOf;
      }
    } catch (e) {}
    return 'Class 8-A';
  });

  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Student Roster & Marksheet
  const [students, setStudents] = useState([]);
  const [currentSubjectFilter, setCurrentSubjectFilter] = useState('all');

  // Filtered Students strictly for the active class
  const classStudents = useMemo(() => {
    return students.filter(s => (s.className || 'Class 8-A') === selectedClass);
  }, [students, selectedClass]);

  // Dynamic Teacher Context for Selected Class
  const isClassTeacherOfActiveClass = currentUser?.role === 'admin' || (currentUser?.classTeacherOf && currentUser.classTeacherOf === selectedClass);

  const effectiveUser = useMemo(() => {
    if (!currentUser) return null;
    return {
      ...currentUser,
      isClassTeacherOfActiveClass,
      effectiveRole: isClassTeacherOfActiveClass ? 'class_teacher' : 'subject_teacher',
      displayRole: currentUser.role === 'admin' 
        ? 'School Administrator'
        : isClassTeacherOfActiveClass 
          ? `Class Teacher (${selectedClass})` 
          : `${currentUser.subject || 'Subject'} Teacher (${selectedClass})`
    };
  }, [currentUser, selectedClass, isClassTeacherOfActiveClass]);

  // Date-based Attendance State
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [attendanceHistory, setAttendanceHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('myschool_attendance_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // Modals
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanInitialType, setScanInitialType] = useState('marksheet');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [emailModalData, setEmailModalData] = useState(null);
  const [broadcastConfirmData, setBroadcastConfirmData] = useState(null);
  const [pendingExcelImport, setPendingExcelImport] = useState(null);

  // Notifications
  const [toastMessage, setToastMessage] = useState(null);
  const fileInputRef = useRef(null);
  const [adminInitialSubTab, setAdminInitialSubTab] = useState('teachers');

  const handleNavigateToAcademics = (targetClass) => {
    if (targetClass) {
      setSelectedClass(targetClass);
    }
    setAdminInitialSubTab('academics');
    setActiveTab('admin');
  };

  // Dynamic Configured Subjects from schoolConfig
  const configuredSubjects = useMemo(() => {
    return schoolConfig?.subjects && schoolConfig.subjects.length > 0
      ? schoolConfig.subjects
      : DEFAULT_SCHOOL_CONFIG.subjects;
  }, [schoolConfig]);

  const subjects = useMemo(() => {
    return [
      { key: 'all', label: 'All Subjects' },
      ...configuredSubjects
    ];
  }, [configuredSubjects]);

  const totalConfiguredMaxMarks = useMemo(() => {
    return configuredSubjects.reduce((sum, s) => sum + (Number(s.max) || 25), 0) || 100;
  }, [configuredSubjects]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to match a record to an existing student by either roll number OR name
  const findMatchingStudent = (list, item) => {
    if (!item || !list) return null;

    // 1. Match by roll number (handling '1' vs '01')
    if (item.rollNo !== undefined && item.rollNo !== null) {
      const targetRoll = String(item.rollNo).trim();
      const targetNum = parseInt(targetRoll, 10);
      const byRoll = list.find(s => {
        const sNum = parseInt(s.rollNo, 10);
        return s.rollNo === targetRoll || (!isNaN(targetNum) && !isNaN(sNum) && sNum === targetNum);
      });
      if (byRoll) return byRoll;
    }

    // 2. Match by student name (case-insensitive substring)
    if (item.name && item.name.trim().length > 1) {
      const targetName = item.name.toLowerCase().trim();
      const byName = list.find(s => {
        const sName = s.name.toLowerCase().trim();
        return sName === targetName || sName.includes(targetName) || targetName.includes(sName);
      });
      if (byName) return byName;
    }

    return null;
  };

  // Centralized Configuration Fetch & Multi-Device Sync
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const json = await res.json();
      if (json.success && json.config) {
        setSchoolConfig(json.config);
        saveSchoolConfig(json.config);
      }
    } catch (err) {
      console.warn('Failed to fetch school config:', err);
    }
  };

  const handleUpdateConfig = async (action, payload) => {
    // Instant optimistic update if config is provided
    if (action === 'save_all' && payload?.config) {
      setSchoolConfig(payload.config);
      saveSchoolConfig(payload.config);
    }
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
      const json = await res.json();
      if (json.success && json.config) {
        setSchoolConfig(json.config);
        saveSchoolConfig(json.config);
        return { success: true, config: json.config };
      }
      return { success: false, error: json.error, message: json.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Initial load & live cross-device sync
  useEffect(() => {
    const savedUser = localStorage.getItem('edusnap_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        if (u.role === 'admin') setActiveTab('admin');
      } catch (e) {
        console.error(e);
      }
    }

    fetchStudents();
    fetchHolidays();
    fetchConfig();

    // Standard pattern: Auto-sync on window focus / tab return (throttled to 15s)
    let lastFetch = Date.now();
    const handleFocus = () => {
      if (Date.now() - lastFetch > 15000) {
        lastFetch = Date.now();
        fetchStudents();
        fetchHolidays();
        fetchConfig();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleFocus();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // Passive safety sync every 5 minutes (300,0000ms) instead of constant 10s loop
    const interval = setInterval(() => {
      lastFetch = Date.now();
      fetchStudents();
      fetchHolidays();
      fetchConfig();
    }, 3000000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  const fetchHolidays = async () => {
    try {
      const res = await fetch('/api/holidays');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCustomHolidays(json.data);
        saveLocalCustomHolidays(json.data);
      }
    } catch (err) {
      console.warn('Failed to fetch holidays:', err);
    }
  };

  // Universal Mobile Back Button: Intercept Android/browser back button to dismiss open modal instead of closing app
  useEffect(() => {
    const isModalOpen = isAuthModalOpen || isProfileModalOpen || isExportModalOpen || !!selectedStudentDetail || !!emailModalData || !!broadcastConfirmData || !!pendingExcelImport;
    if (isModalOpen) {
      window.history.pushState({ appModalOpen: true }, '');
      const handleBack = () => {
        setIsAuthModalOpen(false);
        setIsProfileModalOpen(false);
        setIsExportModalOpen(false);
        setSelectedStudentDetail(null);
        setEmailModalData(null);
        setBroadcastConfirmData(null);
        setPendingExcelImport(null);
      };
      window.addEventListener('popstate', handleBack);
      return () => {
        window.removeEventListener('popstate', handleBack);
      };
    }
  }, [isAuthModalOpen, isProfileModalOpen, isExportModalOpen, selectedStudentDetail, emailModalData, broadcastConfirmData, pendingExcelImport]);

  // Dual Persistence: State + LocalStorage Cache
  const updateAndPersistStudents = (newStudentsOrFn) => {
    setStudents(prev => {
      const updated = typeof newStudentsOrFn === 'function' ? newStudentsOrFn(prev) : newStudentsOrFn;
      try {
        localStorage.setItem('myschool_students_cache', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage students cache write error:', e);
      }
      return updated;
    });
  };

  const fetchStudents = async () => {
    // 1. Immediately load cached students from localStorage so UI never flashes empty
    try {
      const cached = localStorage.getItem('myschool_students_cache');
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setStudents(parsed);
        }
      }
    } catch (e) {}

    // 2. Fetch fresh data from backend
    try {
      const res = await fetch('/api/students');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setStudents(json.data);
        localStorage.setItem('myschool_students_cache', JSON.stringify(json.data));
      }
      if (json.attendanceHistory && Object.keys(json.attendanceHistory).length > 0) {
        setAttendanceHistory(prev => {
          const merged = { ...prev };
          for (const [dateKey, dayRolls] of Object.entries(json.attendanceHistory)) {
            merged[dateKey] = { ...(merged[dateKey] || {}), ...dayRolls };
          }
          try {
            localStorage.setItem('myschool_attendance_history', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('edusnap_user', JSON.stringify(user));
    if (user.role === 'parent') {
      if (user.student?.className) {
        setSelectedClass(user.student.className);
      }
      return;
    }
    if (user.classTeacherOf && user.classTeacherOf !== 'All Classes') {
      setSelectedClass(user.classTeacherOf);
    }
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('home');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('edusnap_user');
    setActiveTab('home');
    showToast('Signed out successfully');
  };

  // Calculations
  const calculateStudentTotal = (marksObj = {}) => {
    return Object.values(marksObj).reduce((sum, m) => sum + (Number(m) || 0), 0);
  };

  const calculateStudentPercentage = (marksObj = {}) => {
    const total = calculateStudentTotal(marksObj);
    const max = totalConfiguredMaxMarks || 100;
    return ((total / max) * 100).toFixed(1);
  };

  const getStudentGrade = (pct) => {
    if (pct >= 90) return { grade: 'A+', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct >= 75) return { grade: 'A', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (pct >= 60) return { grade: 'B', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    if (pct >= 40) return { grade: 'C', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { grade: 'Help', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  // Attendance Toggle (strictly isolated per date, persists to storage & DB)
  const toggleAttendance = async (rollNo, dateStr) => {
    const targetDate = dateStr || selectedAttendanceDate || new Date().toISOString().split('T')[0];

    // Cannot take attendance on school holidays / off days
    if (isSchoolHoliday(targetDate, customHolidays)) {
      showToast('🌴 That day is a school holiday. Attendance is disabled.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Determine current status strictly for targetDate without cross-date leakage
    const currentStatus = attendanceHistory[targetDate]?.[rollNo] !== undefined
      ? attendanceHistory[targetDate][rollNo]
      : (targetDate === todayStr ? (students.find(s => s.rollNo === rollNo)?.attendance || 'P') : 'P');
    
    const newStatus = currentStatus === 'P' ? 'A' : 'P';

    // 1. Update attendanceHistory state strictly for targetDate
    setAttendanceHistory(prev => {
      const existingDay = prev[targetDate] ? { ...prev[targetDate] } : {};
      existingDay[rollNo] = newStatus;
      const updated = {
        ...prev,
        [targetDate]: existingDay
      };
      try {
        localStorage.setItem('myschool_attendance_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Only if the modified date IS today, update student.attendance for today's live cards
    if (targetDate === todayStr) {
      updateAndPersistStudents(prev => prev.map(s => s.rollNo === rollNo ? { ...s, attendance: newStatus } : s));
    }

    // 3. Persist to server/database with exact date
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_attendance',
          date: targetDate,
          updates: { rollNo, attendance: newStatus, date: targetDate }
        })
      });
    } catch (e) {
      console.error('Failed to save attendance:', e);
    }
  };

  // Update Marks with Dynamic Class & Subject Permission Enforcement
  const updateSubjectMark = async (rollNo, subjectKey, val) => {
    const targetSub = configuredSubjects.find(s => s.key === subjectKey);
    const subLabel = (targetSub?.label || subjectKey).toLowerCase().trim();
    const subMax = targetSub?.max || 25;

    if (!effectiveUser?.isClassTeacherOfActiveClass && effectiveUser?.role !== 'admin') {
      const userSub = (currentUser?.subject || '').toLowerCase().trim();
      let match = userSub === subjectKey.toLowerCase() || userSub === subLabel || userSub.includes(subLabel) || subLabel.includes(userSub);
      if (userSub.includes('science') && subjectKey === 'science') match = true;
      if (userSub.includes('math') && subjectKey === 'maths') match = true;
      if (userSub.includes('english') && subjectKey === 'english') match = true;
      if (userSub.includes('social') && subjectKey === 'social') match = true;
      if (userSub.includes('hindi') && subjectKey === 'hindi') match = true;
      if (targetSub?.assignedTeacherName && currentUser?.name && targetSub.assignedTeacherName === currentUser.name) match = true;

      if (!match) {
        showToast(`🔒 Access restricted: In ${selectedClass}, only the ${currentUser?.subject || 'assigned subject'} teacher can edit.`);
        return;
      }
    }

    const num = val === '' ? '' : Math.min(subMax, Math.max(0, Number(val)));

    updateAndPersistStudents(prev => prev.map(s => {
      if (s.rollNo === rollNo) {
        return { ...s, marks: { ...s.marks, [subjectKey]: num } };
      }
      return s;
    }));

    if (selectedStudentDetail && selectedStudentDetail.rollNo === rollNo) {
      setSelectedStudentDetail(prev => ({
        ...prev,
        marks: { ...prev.marks, [subjectKey]: num }
      }));
    }

    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_single',
          updates: { rollNo, marks: { [subjectKey]: num } }
        })
      });
    } catch (e) {
      console.error('Failed to save mark:', e);
    }
  };

  // Apply OCR Data with Smart Roll No or Name Matching
  const handleApplyAiData = async (type, subject, data, dateOverride) => {
    if (!data || !data.records) return;

    if (type === 'marksheet') {
      const records = data.records;
      const updates = [];

      updateAndPersistStudents(prev => {
        return prev.map(s => {
          // Find matching record by roll number OR name
          const matchedRecord = records.find(r => findMatchingStudent([s], r) !== null);

          if (matchedRecord && matchedRecord.mark !== undefined) {
            updates.push({
              rollNo: s.rollNo,
              subject,
              mark: matchedRecord.mark
            });
            return {
              ...s,
              marks: {
                ...s.marks,
                [subject]: Number(matchedRecord.mark)
              }
            };
          }
          return s;
        });
      });

      if (updates.length > 0) {
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'apply_ocr_marks', updates })
        });
        if (updates.length === 1) {
          const matched = students.find(s => s.rollNo === updates[0].rollNo);
          showToast(`✅ Updated ${matched?.name || 'Student'} (#${updates[0].rollNo}): ${updates[0].mark} marks!`);
        } else {
          showToast(`✅ Matched & updated marks for ${updates.length} students!`);
        }
      } else {
        const sampleName = records[0]?.name ? `"${records[0].name}"` : 'Student';
        const sampleRoll = records[0]?.rollNo ? `(Roll #${records[0].rollNo})` : '';
        showToast(`⚠️ Scanned ${sampleName} ${sampleRoll} not found in this class roster.`);
      }
    } else {
      // type === 'attendance'
      const records = data.records;
      const targetDate = dateOverride || selectedAttendanceDate || new Date().toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];

      // Automatically switch the active view to this target date
      setSelectedAttendanceDate(targetDate);

      const updates = [];
      const newDayMap = { ...(attendanceHistory[targetDate] || {}) };

      records.forEach(r => {
        const matched = findMatchingStudent(students, r);
        if (matched && r.status) {
          const cleanStatus = r.status.toUpperCase() === 'A' ? 'A' : 'P';
          newDayMap[matched.rollNo] = cleanStatus;
          updates.push({
            rollNo: matched.rollNo,
            status: cleanStatus,
            date: targetDate
          });
        }
      });

      // Update attendance history for the active date
      setAttendanceHistory(prev => {
        const updated = {
          ...prev,
          [targetDate]: newDayMap
        };
        try {
          localStorage.setItem('myschool_attendance_history', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      // If active date is today, also sync students' immediate attendance
      if (targetDate === todayStr) {
        updateAndPersistStudents(prev => {
          return prev.map(s => {
            if (newDayMap[s.rollNo]) {
              return { ...s, attendance: newDayMap[s.rollNo] };
            }
            return s;
          });
        });
      }

      if (updates.length > 0) {
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'apply_ocr_attendance', updates, date: targetDate })
        });
        const dateFormatted = new Date(targetDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        showToast(`✅ Matched & applied attendance for ${updates.length} students on ${dateFormatted}!`);
      } else {
        showToast(`⚠️ No matching students found from the scanned register.`);
      }
    }
  };

  const handleOpenScan = (type) => {
    setScanInitialType(type);
    setIsScanModalOpen(true);
  };

  // Export Full Marksheet CSV for Active Class
  const handleExportMarksheetCSV = () => {
    const subHeaders = configuredSubjects.map(s => `${s.label} (${s.max || 25})`).join(',');
    const headers = `Roll No,Name,Class,Parent Email,${subHeaders},Total (${totalConfiguredMaxMarks}),Percentage %,Grade\n`;
    const rows = classStudents.map(s => {
      const tot = calculateStudentTotal(s.marks);
      const pct = calculateStudentPercentage(s.marks);
      const gr = getStudentGrade(pct).grade;
      const subVals = configuredSubjects.map(sub => s.marks?.[sub.key] ?? 0).join(',');
      return `"${s.rollNo}","${s.name}","${selectedClass}","${s.parentEmail || ''}",${subVals},${tot},${pct}%,${gr}`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedClass.replace(/\s+/g, '_')}_Marksheet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`📊 ${selectedClass} marksheet exported to CSV!`);
  };

  // Download Sample Excel Template
  const handleDownloadExcelTemplate = () => {
    const sampleRecord1 = {
      "Roll No": "01",
      "Student Name": "Aakash Verma",
      "Parent Email": "parent.verma@example.com",
      "Parent Phone": "9876543201"
    };
    const sampleRecord2 = {
      "Roll No": "02",
      "Student Name": "Ananya Gupta",
      "Parent Email": "parent.gupta@example.com",
      "Parent Phone": "9876543202"
    };
    configuredSubjects.forEach(s => {
      sampleRecord1[s.label] = Math.round((s.max || 25) * 0.85);
      sampleRecord2[s.label] = (s.max || 25);
    });

    const worksheet = XLSX.utils.json_to_sheet([sampleRecord1, sampleRecord2]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Marksheet_Template");
    XLSX.writeFile(workbook, `MySchool_${(schoolConfig?.activeExam || 'Exam').replace(/\s+/g, '_')}_Template.xlsx`);
    showToast("📥 Downloaded Sample Excel Template!");
  };

  // Universal Excel & CSV Import (supports .xlsx, .xls, .csv with Roll No or Name Matching)
  const handleExcelImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          showToast("⚠️ The uploaded spreadsheet is empty.");
          return;
        }

        const imported = jsonRows.map((row, idx) => {
          const rawRoll = String(row['Roll No'] || row['Roll'] || row['rollNo'] || row['roll'] || (idx + 1)).padStart(2, '0');
          const rawName = String(row['Student Name'] || row['Name'] || row['name'] || `Student ${rawRoll}`).trim();

          // Match existing student by roll or name
          const existing = findMatchingStudent(students, { rollNo: rawRoll, name: rawName });
          const importedMarks = { ...(existing?.marks || {}) };

          configuredSubjects.forEach(sub => {
            const val = row[sub.label] ?? row[sub.label.toLowerCase()] ?? row[sub.key] ?? row[`${sub.label} (${sub.max || 25})`];
            if (val !== undefined && val !== '') {
              importedMarks[sub.key] = Number(val);
            } else if (importedMarks[sub.key] === undefined) {
              importedMarks[sub.key] = 0;
            }
          });

          return {
            rollNo: existing ? existing.rollNo : rawRoll,
            name: existing ? existing.name : rawName,
            className: existing?.className || selectedClass || 'Class 8-A',
            parentEmail: row['Parent Email'] || row['Email'] || existing?.parentEmail || '',
            parentPhone: String(row['Parent Phone'] || row['Phone'] || existing?.parentPhone || ''),
            attendance: existing?.attendance || 'P',
            emailed: false,
            marks: importedMarks
          };
        });

        // Instead of directly overwriting, require user confirmation
        setPendingExcelImport({
          imported,
          fileName: file.name,
          count: imported.length,
          targetClass: selectedClass || 'Class 8-A'
        });
      } catch (err) {
        console.error('Excel parse error:', err);
        showToast("⚠️ Failed to parse Excel file. Please use the template.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleConfirmExcelImport = async () => {
    if (!pendingExcelImport) return;
    try {
      const { imported, count, targetClass } = pendingExcelImport;
      updateAndPersistStudents(imported);
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_replace', students: imported })
      });
      showToast(`✅ Successfully matched and imported marks for ${count} students in ${targetClass}!`);
    } catch (err) {
      console.error('Failed to persist imported students:', err);
      showToast('⚠️ Error saving imported marks to server.');
    } finally {
      setPendingExcelImport(null);
    }
  };

  const handleCancelExcelImport = () => {
    setPendingExcelImport(null);
  };

  // Single Email Composer
  const handleOpenEmailSingle = (student, type) => {
    let subject = '';
    let message = '';

    if (type === 'attendance') {
      subject = `Absence Notice - ${student.name} (${currentUser?.classTeacherOf || 'Class 8-A'})`;
      message = `Dear Parent,\n\nThis is to notify you that ${student.name} (Roll No: ${student.rollNo}) was marked ABSENT today (${new Date().toLocaleDateString()}) in ${currentUser?.classTeacherOf || 'Class 8-A'}.\n\nPlease ensure school regularity.\n\nWarm regards,\n${currentUser?.name || 'Class Teacher'}\n${currentUser?.school || 'MySchool'}`;
    } else {
      const tot = calculateStudentTotal(student.marks);
      const pct = calculateStudentPercentage(student.marks);
      const gr = getStudentGrade(pct).grade;
      const examName = schoolConfig?.activeExam || 'Unit Test 1';

      subject = `${examName} Report Card - ${student.name} (${currentUser?.classTeacherOf || selectedClass || 'Class 8-A'})`;
      const marksBreakdown = configuredSubjects
        .map(sub => `• ${sub.label}: ${student.marks?.[sub.key] ?? 0} / ${sub.max || 25}`)
        .join('\n');

      message = `Dear Parent,\n\nPlease find the ${examName} marks summary for ${student.name} (Roll No: ${student.rollNo}):\n` +
        `-----------------------------------------\n` +
        `${marksBreakdown}\n` +
        `-----------------------------------------\n` +
        `Total Score: ${tot} / ${totalConfiguredMaxMarks} (${pct}%)\n` +
        `Overall Grade: ${gr}\n` +
        `Class: ${currentUser?.classTeacherOf || selectedClass || 'Class 8-A'}\n\n` +
        `Warm regards,\n${currentUser?.name || 'Class Teacher'}\n${currentUser?.school || 'MySchool'}`;
    }

    setEmailModalData({ student, type, subject, message });
  };

  const handleConfirmSendEmail = ({ student, type }) => {
    if (type === 'marksheet') {
      setStudents(prev => prev.map(s => s.rollNo === student.rollNo ? { ...s, emailed: true } : s));
    }
    showToast(`📧 Report dispatched to ${student.parentEmail}!`);
    setEmailModalData(null);
  };

  // Bulk Email Dispatch with Mandatory Confirmation Modal
  const handleOpenEmailAll = (type, targetDate) => {
    if (currentUser?.role === 'subject_teacher') {
      showToast('🔒 Only Class Teacher or Admin can send bulk reports.');
      return;
    }

    if (type === 'marksheet') {
      const targetPool = classStudents.length > 0 ? classStudents : students;
      if (targetPool.length === 0) {
        showToast(`⚠️ No students enrolled in ${selectedClass} to email.`);
        return;
      }
      setBroadcastConfirmData({
        type: 'marksheet',
        title: 'Broadcast Parent Report Cards',
        targetClass: selectedClass,
        recipientCount: targetPool.length,
        examName: schoolConfig?.activeExam || 'Unit Test 1',
        description: `You are about to dispatch official ${schoolConfig?.activeExam || 'Unit Test 1'} report cards to parents of all ${targetPool.length} students in ${selectedClass}.`,
        impactNote: 'Each parent will receive an email containing their child\'s subject-wise marks, total score, percentage, and overall grade ranking.',
        actionLabel: `Confirm & Broadcast (${targetPool.length} Reports)`
      });
    } else {
      const activeD = targetDate || selectedAttendanceDate || new Date().toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      const targetPool = classStudents.length > 0 ? classStudents : students;
      const absentees = targetPool.filter(s => {
        const status = attendanceHistory[activeD]?.[s.rollNo] !== undefined 
          ? attendanceHistory[activeD][s.rollNo]
          : (activeD === todayStr ? (s.attendance || 'P') : 'P');
        return status === 'A';
      });

      if (absentees.length === 0) {
        showToast(`ℹ️ No absent students marked in ${selectedClass} for ${activeD}.`);
        return;
      }

      setBroadcastConfirmData({
        type: 'attendance',
        title: 'Broadcast Daily Absence Alerts',
        targetClass: selectedClass,
        targetDate: activeD,
        recipientCount: absentees.length,
        description: `You are about to dispatch instant absence alert emails to parents of ${absentees.length} absent students in ${selectedClass} for ${activeD}.`,
        impactNote: 'Alert emails will be dispatched immediately to notify parents of unexcused absence.',
        actionLabel: `Confirm & Send ${absentees.length} Alerts`
      });
    }
  };

  const handleExecuteBroadcast = () => {
    if (!broadcastConfirmData) return;
    const { type, recipientCount, targetClass, targetDate } = broadcastConfirmData;
    
    if (type === 'marksheet') {
      setStudents(prev => prev.map(s => {
        if (!s.className || s.className === targetClass || (targetClass === 'Class 8-A' && !s.className)) {
          return { ...s, emailed: true };
        }
        return s;
      }));
      showToast(`📧 Successfully broadcasted report cards to ${recipientCount} parents in ${targetClass}!`);
    } else {
      showToast(`📧 Absence alert emails sent to ${recipientCount} parents for ${targetDate}!`);
    }
    setBroadcastConfirmData(null);
  };

  // ==============================================================
  // LOGIN PAGE GATE: ACCESS IS LOCKED UNTIL USER LOGS IN!
  // ==============================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F6F7FB]">
        <Toast message={toastMessage} />
        <AuthModal 
          isOpen={true}
          isGatePage={true}
          onLoginSuccess={handleLoginSuccess}
          showToast={showToast}
          students={students}
        />
      </div>
    );
  }

  // ==============================================================
  // DEDICATED PARENT PORTAL: CHILD ATTENDANCE & CLASS HOMEWORK ONLY
  // ==============================================================
  if (currentUser.role === 'parent') {
    return (
      <>
        <Toast message={toastMessage} />
        <ParentPortalView 
          currentUser={currentUser}
          student={currentUser.student}
          attendanceHistory={attendanceHistory}
          students={students}
          onRefreshStudents={fetchStudents}
          onLogout={handleLogout}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          showToast={showToast}
          schoolConfig={schoolConfig}
          customHolidays={customHolidays}
        />
        <ProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onLogout={handleLogout}
          showToast={showToast}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col text-slate-800">
      
      {/* Hidden File Input for Excel Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleExcelImport} 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
      />

      {/* Global Toast */}
      <Toast message={toastMessage} />

      {/* Top Navbar & Header with Class Switcher */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={effectiveUser}
        selectedClass={selectedClass}
        onChangeClass={setSelectedClass}
        availableClasses={schoolConfig.classes}
        schoolConfig={schoolConfig}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'home' && (
          <DashboardTab 
            currentUser={effectiveUser}
            students={classStudents}
            selectedClass={selectedClass}
            onNavigate={setActiveTab}
            onOpenScanModal={handleOpenScan}
            onOpenEmailAll={handleOpenEmailAll}
            calculateTotal={calculateStudentTotal}
            calculatePercentage={calculateStudentPercentage}
            getGrade={getStudentGrade}
            showToast={showToast}
            onNavigateToAcademics={handleNavigateToAcademics}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab 
            students={classStudents}
            selectedClass={selectedClass}
            selectedDate={selectedAttendanceDate}
            onChangeDate={setSelectedAttendanceDate}
            attendanceHistory={attendanceHistory}
            onToggleAttendance={toggleAttendance}
            onOpenScanModal={handleOpenScan}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onOpenEmailSingle={handleOpenEmailSingle}
            onOpenEmailAll={handleOpenEmailAll}
            currentUser={effectiveUser}
            customHolidays={customHolidays}
          />
        )}

        {activeTab === 'marksheet' && (
          <MarksheetTab 
            students={classStudents}
            selectedClass={selectedClass}
            subjects={subjects}
            activeExam={schoolConfig?.activeExam || 'Unit Test 1'}
            currentSubjectFilter={currentSubjectFilter}
            setCurrentSubjectFilter={setCurrentSubjectFilter}
            currentUser={effectiveUser}
            onUpdateMark={updateSubjectMark}
            onOpenScanModal={handleOpenScan}
            onTriggerExcelImport={() => fileInputRef.current?.click()}
            onDownloadExcelTemplate={handleDownloadExcelTemplate}
            onExportMarksheetCSV={handleExportMarksheetCSV}
            onOpenEmailSingle={handleOpenEmailSingle}
            onOpenEmailAll={handleOpenEmailAll}
            onSelectStudent={setSelectedStudentDetail}
            calculateTotal={calculateStudentTotal}
            calculatePercentage={calculateStudentPercentage}
            getGrade={getStudentGrade}
          />
        )}

        {activeTab === 'homework' && (
          <HomeworkSection 
            currentUser={effectiveUser} 
            selectedClass={selectedClass}
            students={classStudents}
            showToast={showToast} 
            isFullPage={true} 
            onNavigateToAcademics={handleNavigateToAcademics}
          />
        )}

        {/* Admin Panel Tab */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminTab 
            students={students}
            onRefreshStudents={fetchStudents}
            showToast={showToast}
            customHolidays={customHolidays}
            onRefreshHolidays={(hols) => setCustomHolidays(hols)}
            schoolConfig={schoolConfig}
            onUpdateConfig={handleUpdateConfig}
            selectedClass={selectedClass}
            onChangeClass={setSelectedClass}
            initialSubTab={adminInitialSubTab}
          />
        )}
      </main>

      {/* Profile & Account Settings Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        showToast={showToast}
      />

      {/* Auth / Login Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        showToast={showToast}
        students={students}
      />

      <ScanModal 
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        initialType={scanInitialType}
        students={classStudents}
        selectedDate={selectedAttendanceDate}
        onApplyData={handleApplyAiData}
        currentUser={effectiveUser}
        showToast={showToast}
        subjects={subjects}
      />

      {/* Attendance 3-Option Export Modal */}
      <ExportAttendanceModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        students={classStudents}
        selectedClass={selectedClass}
        selectedDate={selectedAttendanceDate}
        attendanceHistory={attendanceHistory}
        customHolidays={customHolidays}
        onExportToast={showToast}
      />

      <StudentDetailModal 
        isOpen={!!selectedStudentDetail}
        onClose={() => setSelectedStudentDetail(null)}
        student={selectedStudentDetail}
        subjects={subjects}
        activeExam={schoolConfig?.activeExam || 'Unit Test 1'}
        onOpenEmailModal={handleOpenEmailSingle}
        getGrade={getStudentGrade}
        calculateTotal={calculateStudentTotal}
        calculatePercentage={calculateStudentPercentage}
      />

      <EmailModal 
        isOpen={!!emailModalData}
        onClose={() => setEmailModalData(null)}
        data={emailModalData}
        onConfirmSend={handleConfirmSendEmail}
      />

      {/* BULK BROADCAST CONFIRMATION MODAL */}
      {broadcastConfirmData && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          style={{ zIndex: 60 }}
        >
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  broadcastConfirmData.type === 'marksheet' 
                    ? 'bg-amber-100 text-amber-700 shadow-sm' 
                    : 'bg-rose-100 text-rose-700 shadow-sm'
                }`}>
                  {broadcastConfirmData.type === 'marksheet' ? <Mail className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{broadcastConfirmData.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">Please confirm before sending bulk parent communications</p>
                </div>
              </div>
              <button 
                onClick={() => setBroadcastConfirmData(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Target Class:</span>
                  <span className="font-bold text-slate-900 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {broadcastConfirmData.targetClass}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Recipients Count:</span>
                  <span className="font-bold text-slate-900">
                    {broadcastConfirmData.recipientCount} Parents
                  </span>
                </div>
                {broadcastConfirmData.examName && (
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Academic Exam:</span>
                    <span className="font-bold text-slate-900">{broadcastConfirmData.examName}</span>
                  </div>
                )}
                {broadcastConfirmData.targetDate && (
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Attendance Date:</span>
                    <span className="font-bold text-slate-900">{broadcastConfirmData.targetDate}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {broadcastConfirmData.description}
              </p>

              {broadcastConfirmData.impactNote && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{broadcastConfirmData.impactNote}</span>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBroadcastConfirmData(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBroadcast}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all cursor-pointer ${
                  broadcastConfirmData.type === 'marksheet'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-amber-200'
                    : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-200'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{broadcastConfirmData.actionLabel || 'Confirm & Send Broadcast'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT CONFIRMATION MODAL */}
      {pendingExcelImport && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          style={{ zIndex: 60 }}
        >
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Confirm Marksheet Excel Import</h3>
                  <p className="text-xs text-slate-500 font-medium">Verify file before updating database marks</p>
                </div>
              </div>
              <button 
                onClick={handleCancelExcelImport}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">File Name:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[220px]" title={pendingExcelImport.fileName}>
                    {pendingExcelImport.fileName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Target Class:</span>
                  <span className="font-bold text-slate-900 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {pendingExcelImport.targetClass}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Records Matched:</span>
                  <span className="font-bold text-emerald-700">
                    {pendingExcelImport.count} Students
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Confirming this import will update and overwrite existing marks for the matched students in {pendingExcelImport.targetClass}.
                </span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelExcelImport}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmExcelImport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Apply Marks</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
