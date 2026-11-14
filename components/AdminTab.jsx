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
  ChevronDown
} from 'lucide-react';
import { getSchoolConfig } from '@/lib/schoolConfig';

export default function AdminTab({ students, onRefreshStudents, showToast }) {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState('teachers'); // 'teachers' | 'students'
  const [selectedClassFilter, setSelectedClassFilter] = useState('all'); // 'all' | 'Class 8-A' | etc.
  const studentFileInputRef = useRef(null);

  // Available classes in School from centralized config
  const schoolConfig = getSchoolConfig();
  const schoolClasses = schoolConfig.classes && schoolConfig.classes.length > 0
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
      ];

  // Teachers State
  const [teachers, setTeachers] = useState([]);
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
  const [teacherClass, setTeacherClass] = useState(() => schoolClasses[0] || 'Class 8-A');
  const [teacherSubject, setTeacherSubject] = useState('Mathematics');

  // Confirmation Delete Modal
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

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
      if (data.success && data.teachers) {
        setTeachers(data.teachers);
      }
    } catch (e) {
      console.error(e);
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
    setTeacherClass('Class 8-A');
    setTeacherSubject('Mathematics');
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (t) => {
    setEditingTeacher(t);
    setTeacherName(t.name);
    setTeacherEmail(t.email);
    setTeacherPassword(t.password || getFirstNamePassword(t.name));
    setIsClassTeacherChecked(t.role === 'class_teacher' || (t.class_name && t.class_name !== 'All Classes'));
    setTeacherClass(t.class_name && t.class_name !== 'All Classes' ? t.class_name : 'Class 8-A');
    setTeacherSubject(t.subject || 'Mathematics');
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    const role = isClassTeacherChecked ? 'class_teacher' : 'subject_teacher';
    const className = isClassTeacherChecked ? teacherClass : null;

    try {
      if (editingTeacher) {
        await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'admin_update_teacher',
            id: editingTeacher.id,
            name: teacherName,
            email: teacherEmail,
            role,
            className,
            subject: teacherSubject,
            password: teacherPassword
          })
        });
        showToast(`✅ Updated profile & credentials for ${teacherName}`);
      } else {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'admin_add_teacher',
            name: teacherName,
            email: teacherEmail,
            role,
            className,
            subject: teacherSubject
          })
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

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Top Admin Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-600 via-amber-700 to-indigo-950 p-5 sm:p-6 rounded-3xl text-white shadow-xl shadow-amber-900/10">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black">MySchool Administrator Control</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                MASTER ADMIN
              </span>
            </div>
            <p className="text-xs text-amber-100/80 mt-0.5">
              Manage faculty roster, edit teacher credentials, and control student enrollment.
            </p>
          </div>
        </div>

        {/* Sub-tab Pill Toggles */}
        <div className="flex items-center gap-2 bg-black/20 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveAdminSubTab('teachers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all ${
              activeAdminSubTab === 'teachers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-amber-100 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Teachers ({teachers.length})</span>
          </button>
          <button
            onClick={() => setActiveAdminSubTab('students')}
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all ${
              activeAdminSubTab === 'students'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-amber-100 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Students ({students.length})</span>
          </button>
        </div>
      </div>

      {/* Quick School Onboarding & Data Management Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-bold text-slate-700">School Onboarding & Database State:</span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
            {students.length} Students &bull; {teachers.length} Teachers
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
            title="Clear all demo students and teachers to onboard a brand new school"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Clean Slate (0 Records)</span>
          </button>
          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
            title="Restore sample demo data for presentation and testing"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
            <span>Load Demo Data</span>
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
              <h3 className="text-base font-bold text-slate-800">Registered Faculty & Staff</h3>
              <p className="text-xs text-slate-400">Click edit on any teacher to change their role, subject, or password.</p>
            </div>
            <button
              onClick={handleOpenAddTeacher}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Teacher</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
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
                  teachers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-800 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {t.name.charAt(0)}
                      </div>
                      <div className="truncate max-w-[140px] sm:max-w-none">
                        <p className="truncate">{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal md:hidden">{t.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        t.role === 'class_teacher' 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {t.role === 'class_teacher' ? 'Class Teacher' : 'Subject Teacher'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 font-semibold text-slate-600">
                      {t.class_name || 'Class 8-A'}
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
                )))}
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
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">Student Enrollment Roster</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {students.length} Total Enrolled
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Filter by class or bulk-enroll students with Excel / CSV upload.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadStudentTemplate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-xs transition-all"
                title="Download Sample Student Enrollment Excel Template"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template</span>
              </button>

              <button
                onClick={() => studentFileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 font-bold text-xs shadow-xs transition-all"
                title="Bulk enroll students via Excel or CSV"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bulk Upload</span>
              </button>

              <button
                onClick={handleOpenAddStudent}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          {/* Interactive Class Filter Bar */}
          <div className="px-4 sm:px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Class:</span>
            </span>

            <button
              onClick={() => setSelectedClassFilter('all')}
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
                  onClick={() => setSelectedClassFilter(c)}
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
            <table className="w-full text-left border-collapse text-xs">
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
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-slate-500">
                      #{st.rollNo}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 font-bold text-slate-800">
                      <p>{st.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal md:hidden">{st.parentEmail}</p>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 font-semibold text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10px]">
                        {st.className || 'Class 8-A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-slate-500 hidden md:table-cell">
                      {st.parentEmail || '—'}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 text-slate-500 font-mono hidden sm:table-cell">
                      {st.parentPhone || '—'}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
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
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Dual Role: Class Teacher Toggle Checkbox */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isClassTeacherChecked}
                    onChange={(e) => setIsClassTeacherChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Appointed as Class Teacher</span>
                    <span className="text-[10px] text-slate-400">Can take attendance & issue report cards for this class</span>
                  </div>
                </label>

                {isClassTeacherChecked && (
                  <div className="pt-2 border-t border-slate-200/60 animate-in fade-in duration-150">
                    <label className="text-[11px] font-semibold text-indigo-900 block mb-1">
                      Assigned Class:
                    </label>
                    <div className="relative">
                      <select
                        value={teacherClass}
                        onChange={(e) => setTeacherClass(e.target.value)}
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

    </div>
  );
}
