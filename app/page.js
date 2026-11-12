'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import ChangePasswordModal from '@/components/ChangePasswordModal';

export default function App() {
  // Navigation: 'home' | 'attendance' | 'marksheet' | 'admin'
  const [activeTab, setActiveTab] = useState('home');

  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Student Roster & Marksheet
  const [students, setStudents] = useState([]);
  const [currentSubjectFilter, setCurrentSubjectFilter] = useState('all');

  // Modals
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanInitialType, setScanInitialType] = useState('marksheet');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [emailModalData, setEmailModalData] = useState(null);

  // Notifications
  const [toastMessage, setToastMessage] = useState(null);
  const fileInputRef = useRef(null);

  const subjects = [
    { key: 'all', label: 'All Subjects' },
    { key: 'maths', label: 'Maths', max: 25 },
    { key: 'science', label: 'Science', max: 25 },
    { key: 'english', label: 'English', max: 25 },
    { key: 'social', label: 'Social', max: 25 },
    { key: 'hindi', label: 'Hindi', max: 25 },
  ];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load
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
    } else {
      const defaultTeacher = {
        id: 't1',
        name: 'Mrs. Priya Sharma',
        email: 'priya.sharma@stmarys.edu',
        role: 'class_teacher',
        classTeacherOf: 'Class 8-A',
        subject: 'Mathematics',
        school: "MySchool"
      };
      setCurrentUser(defaultTeacher);
      localStorage.setItem('edusnap_user', JSON.stringify(defaultTeacher));
    }

    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      const json = await res.json();
      if (json.success && json.data) {
        setStudents(json.data);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('edusnap_user', JSON.stringify(user));
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
    showToast('Logged out');
  };

  // Calculations
  const calculateStudentTotal = (marksObj = {}) => {
    return Object.values(marksObj).reduce((sum, m) => sum + (Number(m) || 0), 0);
  };

  const calculateStudentPercentage = (marksObj = {}) => {
    const total = calculateStudentTotal(marksObj);
    const max = 5 * 25;
    return ((total / max) * 100).toFixed(1);
  };

  const getStudentGrade = (pct) => {
    if (pct >= 90) return { grade: 'A+', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct >= 75) return { grade: 'A', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (pct >= 60) return { grade: 'B', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    if (pct >= 40) return { grade: 'C', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { grade: 'Help', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  // Attendance Toggle
  const toggleAttendance = async (rollNo) => {
    const student = students.find(s => s.rollNo === rollNo);
    if (!student) return;
    const newStatus = student.attendance === 'P' ? 'A' : 'P';

    setStudents(prev => prev.map(s => s.rollNo === rollNo ? { ...s, attendance: newStatus } : s));

    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_single',
          updates: { rollNo, attendance: newStatus }
        })
      });
    } catch (e) {
      console.error('Failed to save attendance:', e);
    }
  };

  // Update Marks
  const updateSubjectMark = async (rollNo, subjectKey, val) => {
    if (currentUser?.role === 'subject_teacher' && currentUser.subject.toLowerCase() !== subjectKey.toLowerCase()) {
      showToast(`🔒 Access restricted: Only ${currentUser.subject} teacher can edit.`);
      return;
    }

    const num = val === '' ? '' : Math.min(25, Math.max(0, Number(val)));

    setStudents(prev => prev.map(s => {
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

  // Apply OCR Data
  const handleApplyAiData = async (type, subject, data) => {
    if (!data || !data.records) return;

    if (type === 'marksheet') {
      const updates = data.records.map(r => ({
        rollNo: r.rollNo,
        subject,
        mark: r.mark
      }));

      setStudents(prev => prev.map(s => {
        const match = updates.find(u => u.rollNo === s.rollNo);
        if (match) {
          return { ...s, marks: { ...s.marks, [subject]: match.mark } };
        }
        return s;
      }));

      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply_ocr_marks', updates })
      });

      showToast(`✅ Successfully applied AI marks to ${updates.length} students!`);
    } else {
      const updates = data.records.map(r => ({
        rollNo: r.rollNo,
        status: r.status
      }));

      setStudents(prev => prev.map(s => {
        const match = updates.find(u => u.rollNo === s.rollNo);
        if (match) {
          return { ...s, attendance: match.status };
        }
        return s;
      }));

      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply_ocr_attendance', updates })
      });

      showToast(`✅ Successfully applied AI attendance to ${updates.length} students!`);
    }
  };

  // Open Scanner
  const handleOpenScan = (type) => {
    setScanInitialType(type);
    setIsScanModalOpen(true);
  };

  // Export Full Marksheet CSV
  const handleExportMarksheetCSV = () => {
    const headers = "Roll No,Name,Parent Email,Maths (25),Science (25),English (25),Social (25),Hindi (25),Total (125),Percentage %,Grade\n";
    const rows = students.map(s => {
      const tot = calculateStudentTotal(s.marks);
      const pct = calculateStudentPercentage(s.marks);
      const gr = getStudentGrade(pct).grade;
      return `"${s.rollNo}","${s.name}","${s.parentEmail}",${s.marks.maths ?? 0},${s.marks.science ?? 0},${s.marks.english ?? 0},${s.marks.social ?? 0},${s.marks.hindi ?? 0},${tot},${pct}%,${gr}`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Class_8A_Marksheet_Unit_Test_1_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("📊 Full marksheet exported to CSV!");
  };

  // Excel / CSV File Import
  const handleExcelImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      const lines = content.split('\n').filter(l => l.trim().length > 0);
      if (lines.length <= 1) {
        showToast("⚠️ File is empty or has invalid formatting.");
        return;
      }

      const imported = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 2) {
          imported.push({
            rollNo: parts[0] || `0${i}`,
            name: parts[1] || `Student ${i}`,
            className: 'Class 8-A',
            parentEmail: parts[2] || `parent${i}@example.com`,
            parentPhone: parts[3] || `987654320${i}`,
            attendance: 'P',
            emailed: false,
            marks: {
              maths: Number(parts[4]) || 20,
              science: Number(parts[5]) || 20,
              english: Number(parts[6]) || 20,
              social: Number(parts[7]) || 20,
              hindi: Number(parts[8]) || 20,
            }
          });
        }
      }

      if (imported.length > 0) {
        setStudents(imported);
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'bulk_replace', students: imported })
        });
        showToast(`✅ Successfully imported ${imported.length} student records!`);
      }
    };
    reader.readAsText(file);
  };

  // Single Email Composer
  const handleOpenEmailSingle = (student, type) => {
    let subject = '';
    let message = '';

    if (type === 'attendance') {
      subject = `Absence Notice - ${student.name} (${currentUser?.classTeacherOf || 'Class 8-A'})`;
      message = `Dear Parent,\n\nThis is to notify you that ${student.name} (Roll No: ${student.rollNo}) was marked ABSENT today (${new Date().toLocaleDateString()}) in ${currentUser?.classTeacherOf || 'Class 8-A'}.\n\nPlease ensure school regularity.\n\nWarm regards,\n${currentUser?.name || 'Class Teacher'}\n${currentUser?.school || "MySchool"}`;
    } else {
      const tot = calculateStudentTotal(student.marks);
      const pct = calculateStudentPercentage(student.marks);
      const gr = getStudentGrade(pct).grade;

      subject = `Unit Test 1 Report Card - ${student.name} (${currentUser?.classTeacherOf || 'Class 8-A'})`;
      message = `Dear Parent,\n\nPlease find the Unit Test 1 marks summary for ${student.name} (Roll No: ${student.rollNo}):\n` +
        `-----------------------------------------\n` +
        `• Mathematics: ${student.marks?.maths ?? 0} / 25\n` +
        `• Science: ${student.marks?.science ?? 0} / 25\n` +
        `• English: ${student.marks?.english ?? 0} / 25\n` +
        `• Social Studies: ${student.marks?.social ?? 0} / 25\n` +
        `• Hindi: ${student.marks?.hindi ?? 0} / 25\n` +
        `-----------------------------------------\n` +
        `Total Score: ${tot} / 125 (${pct}%)\n` +
        `Overall Grade: ${gr}\n` +
        `Class: ${currentUser?.classTeacherOf || 'Class 8-A'}\n\n` +
        `Warm regards,\n${currentUser?.name || 'Class Teacher'}\n${currentUser?.school || "MySchool"}`;
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

  // Bulk Email Dispatch
  const handleOpenEmailAll = (type) => {
    if (currentUser?.role === 'subject_teacher') {
      showToast('🔒 Only Class Teacher can send bulk final report cards.');
      return;
    }

    if (type === 'marksheet') {
      setStudents(prev => prev.map(s => ({ ...s, emailed: true })));
      showToast('📧 Multi-subject report cards dispatched to all parents!');
    } else {
      const absentees = students.filter(s => s.attendance === 'A');
      showToast(`📧 Absence alert emails sent to ${absentees.length} parents!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col text-slate-800">
      
      {/* Hidden File Input for Excel Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleExcelImport} 
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
        className="hidden" 
      />

      {/* Global Toast */}
      <Toast message={toastMessage} />

      {/* Top Navbar & Header */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenChangePasswordModal={() => setIsChangePasswordModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'home' && (
          <DashboardTab 
            currentUser={currentUser}
            students={students}
            onNavigate={setActiveTab}
            onOpenScanModal={handleOpenScan}
            onOpenEmailAll={handleOpenEmailAll}
            calculateTotal={calculateStudentTotal}
            calculatePercentage={calculateStudentPercentage}
            getGrade={getStudentGrade}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab 
            students={students}
            onToggleAttendance={toggleAttendance}
            onOpenScanModal={handleOpenScan}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onOpenEmailSingle={handleOpenEmailSingle}
            onOpenEmailAll={handleOpenEmailAll}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'marksheet' && (
          <MarksheetTab 
            students={students}
            subjects={subjects}
            currentSubjectFilter={currentSubjectFilter}
            setCurrentSubjectFilter={setCurrentSubjectFilter}
            currentUser={currentUser}
            onUpdateMark={updateSubjectMark}
            onOpenScanModal={handleOpenScan}
            onTriggerExcelImport={() => fileInputRef.current?.click()}
            onExportMarksheetCSV={handleExportMarksheetCSV}
            onOpenEmailSingle={handleOpenEmailSingle}
            onOpenEmailAll={handleOpenEmailAll}
            onSelectStudent={setSelectedStudentDetail}
            calculateTotal={calculateStudentTotal}
            calculatePercentage={calculateStudentPercentage}
            getGrade={getStudentGrade}
          />
        )}

        {/* Admin Panel Tab */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminTab 
            students={students}
            onRefreshStudents={fetchStudents}
            showToast={showToast}
          />
        )}
      </main>

      {/* Modals */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        showToast={showToast}
      />

      <ChangePasswordModal 
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentUser={currentUser}
        showToast={showToast}
      />

      <ScanModal 
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        initialType={scanInitialType}
        students={students}
        onApplyData={handleApplyAiData}
        showToast={showToast}
      />

      {/* Attendance 3-Option Export Modal */}
      <ExportAttendanceModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        students={students}
        onExportToast={showToast}
      />

      <StudentDetailModal 
        isOpen={!!selectedStudentDetail}
        onClose={() => setSelectedStudentDetail(null)}
        student={selectedStudentDetail}
        subjects={subjects}
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

    </div>
  );
}
