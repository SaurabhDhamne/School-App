'use client';

import React, { useState, useEffect, useRef } from 'react';
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

export default function App() {
  // Navigation: 'home' | 'attendance' | 'marksheet' | 'admin'
  const [activeTab, setActiveTab] = useState('home');

  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
      // Default to Class Teacher Mrs. Priya Sharma
      const defaultTeacher = {
        id: 't1',
        name: 'Mrs. Priya Sharma',
        email: 'priya@myschool.com',
        role: 'class_teacher',
        classTeacherOf: 'Class 8-A',
        subject: 'Mathematics',
        school: 'MySchool'
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
    setIsAuthModalOpen(true);
    showToast('Signed out successfully');
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

  // Update Marks with Role Permission Enforcement
  const updateSubjectMark = async (rollNo, subjectKey, val) => {
    // Permission check
    if (currentUser?.role === 'subject_teacher') {
      const userSub = (currentUser.subject || '').toLowerCase();
      let match = userSub === subjectKey.toLowerCase();
      if (userSub.includes('science') && subjectKey === 'science') match = true;
      if (userSub.includes('math') && subjectKey === 'maths') match = true;
      if (userSub.includes('english') && subjectKey === 'english') match = true;
      if (userSub.includes('social') && subjectKey === 'social') match = true;
      if (userSub.includes('hindi') && subjectKey === 'hindi') match = true;

      if (!match) {
        showToast(`🔒 Access restricted: Only ${currentUser.subject} teacher can edit.`);
        return;
      }
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
    link.setAttribute("download", `Class_8A_Marksheet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("📊 Full marksheet exported to CSV!");
  };

  // Download Sample Excel Template
  const handleDownloadExcelTemplate = () => {
    const templateData = [
      {
        "Roll No": "01",
        "Student Name": "Aakash Verma",
        "Maths": 21,
        "Science": 23,
        "English": 20,
        "Social": 19,
        "Hindi": 22,
        "Parent Email": "parent.verma@example.com",
        "Parent Phone": "9876543201"
      },
      {
        "Roll No": "02",
        "Student Name": "Ananya Gupta",
        "Maths": 25,
        "Science": 25,
        "English": 24,
        "Social": 23,
        "Hindi": 24,
        "Parent Email": "parent.gupta@example.com",
        "Parent Phone": "9876543202"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Marksheet_Template");
    XLSX.writeFile(workbook, "MySchool_Marksheet_Import_Template.xlsx");
    showToast("📥 Downloaded Sample Excel Template!");
  };

  // Universal Excel & CSV Import (supports .xlsx, .xls, .csv)
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
          // Normalize column names
          const roll = String(row['Roll No'] || row['Roll'] || row['rollNo'] || row['roll'] || (idx + 1)).padStart(2, '0');
          const name = row['Student Name'] || row['Name'] || row['name'] || `Student ${roll}`;
          const parentEmail = row['Parent Email'] || row['Email'] || row['email'] || '';
          const parentPhone = row['Parent Phone'] || row['Phone'] || row['phone'] || '';

          return {
            rollNo: roll,
            name,
            className: 'Class 8-A',
            parentEmail,
            parentPhone: String(parentPhone),
            attendance: 'P',
            emailed: false,
            marks: {
              maths: Number(row['Maths'] || row['Mathematics'] || row['maths']) || 0,
              science: Number(row['Science'] || row['science']) || 0,
              english: Number(row['English'] || row['english']) || 0,
              social: Number(row['Social'] || row['Social Studies'] || row['social']) || 0,
              hindi: Number(row['Hindi'] || row['hindi']) || 0,
            }
          };
        });

        setStudents(imported);
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'bulk_replace', students: imported })
        });

        showToast(`✅ Successfully imported ${imported.length} student marks from Excel!`);
      } catch (err) {
        console.error('Excel parse error:', err);
        showToast("⚠️ Failed to parse Excel file. Please use the template.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input
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
        accept=".xlsx, .xls, .csv" 
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
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
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

        {/* Admin Panel Tab */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminTab 
            students={students}
            onRefreshStudents={fetchStudents}
            showToast={showToast}
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

      {/* Auth / Login Modal (Shown when not logged in or switching after sign out) */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        showToast={showToast}
      />

      <ScanModal 
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        initialType={scanInitialType}
        students={students}
        onApplyData={handleApplyAiData}
        currentUser={currentUser}
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
