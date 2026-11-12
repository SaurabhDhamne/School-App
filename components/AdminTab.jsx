'use client';

import React, { useState, useEffect } from 'react';
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
  Lock
} from 'lucide-react';

export default function AdminTab({ students, onRefreshStudents, showToast }) {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState('teachers'); // 'teachers' | 'students'

  // Available classes in MySchool
  const schoolClasses = [
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

  // Teacher Modals
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherRole, setTeacherRole] = useState('subject_teacher');
  const [teacherClass, setTeacherClass] = useState('Class 8-A');
  const [teacherSubject, setTeacherSubject] = useState('Science');

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

  // ---------------- Teacher Actions ----------------
  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherName('');
    setTeacherEmail('');
    setTeacherPassword('');
    setTeacherRole('subject_teacher');
    setTeacherClass('Class 8-A');
    setTeacherSubject('Science');
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (t) => {
    setEditingTeacher(t);
    setTeacherName(t.name);
    setTeacherEmail(t.email);
    setTeacherPassword(t.password || getFirstNamePassword(t.name));
    setTeacherRole(t.role);
    setTeacherClass(t.class_name || 'Class 8-A');
    setTeacherSubject(t.subject || 'Mathematics');
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
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
            role: teacherRole,
            className: teacherClass,
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
            role: teacherRole,
            className: teacherClass,
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
    setStudentRollNo(String(students.length + 1).padStart(2, '0'));
    setStudentName('');
    setStudentClass('Class 8-A');
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
                {teachers.map(t => (
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
                ))}
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
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">Student Enrollment Roster</h3>
              <p className="text-xs text-slate-400">Select class from dropdown to assign students cleanly.</p>
            </div>
            <button
              onClick={handleOpenAddStudent}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Student</span>
            </button>
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
                {students.map(st => (
                  <tr key={st.rollNo} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-slate-500">
                      #{st.rollNo}
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 font-bold text-slate-800">
                      <p>{st.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal md:hidden">{st.parentEmail}</p>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4 font-semibold text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Teacher Role</label>
                  <select 
                    value={teacherRole} 
                    onChange={(e) => setTeacherRole(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    <option value="class_teacher">Class Teacher</option>
                    <option value="subject_teacher">Subject Teacher</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Subject</label>
                  <select 
                    value={teacherSubject} 
                    onChange={(e) => setTeacherSubject(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Assigned Class</label>
                <select
                  value={teacherClass}
                  onChange={(e) => setTeacherClass(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {schoolClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
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
                  <select 
                    value={studentClass} 
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    {schoolClasses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
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

    </div>
  );
}
