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
  Sparkles
} from 'lucide-react';

export default function AdminTab({ students, onRefreshStudents, showToast }) {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState('teachers'); // 'teachers' | 'students'

  // Teachers State
  const [teachers, setTeachers] = useState([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  // Teacher Modals
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherRole, setTeacherRole] = useState('subject_teacher');
  const [teacherClass, setTeacherClass] = useState('Class 8-A');
  const [teacherSubject, setTeacherSubject] = useState('Science');

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

  // ---------------- Teacher Actions ----------------
  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherName('');
    setTeacherEmail('');
    setTeacherRole('subject_teacher');
    setTeacherClass('Class 8-A');
    setTeacherSubject('Science');
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (t) => {
    setEditingTeacher(t);
    setTeacherName(t.name);
    setTeacherEmail(t.email);
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
            subject: teacherSubject
          })
        });
        showToast(`✅ Updated profile for ${teacherName}`);
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

  const handleDeleteTeacher = async (t) => {
    if (!confirm(`Are you sure you want to remove ${t.name}?`)) return;
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_delete_teacher', id: t.id })
      });
      showToast(`Removed ${t.name}`);
      fetchTeachers();
    } catch (e) {
      showToast('⚠️ Failed to delete teacher');
    }
  };

  const handleResetTeacherPassword = async (t) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_reset_password', id: t.id })
      });
      const data = await res.json();
      showToast(`🔑 Reset password for ${t.name} to "${data.defaultPassword}"`);
    } catch (e) {
      showToast('⚠️ Failed to reset password');
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
        showToast(`🎉 Added student ${studentName}`);
      }
      setIsStudentModalOpen(false);
      onRefreshStudents();
    } catch (e) {
      showToast('⚠️ Failed to save student');
    }
  };

  const handleDeleteStudent = async (st) => {
    if (!confirm(`Are you sure you want to remove ${st.name} (Roll #${st.rollNo})?`)) return;
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_delete_student', rollNo: st.rollNo })
      });
      showToast(`Removed student ${st.name}`);
      onRefreshStudents();
    } catch (e) {
      showToast('⚠️ Failed to remove student');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Top Admin Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-600 via-amber-700 to-indigo-950 p-6 rounded-3xl text-white shadow-xl shadow-amber-900/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">School Administrator Control Panel</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                MASTER ADMIN
              </span>
            </div>
            <p className="text-xs text-amber-100/80 mt-0.5">
              Control staff roster, teacher roles (Class vs Subject), and manage student profiles.
            </p>
          </div>
        </div>

        {/* Sub-tab Pill Toggles */}
        <div className="flex items-center gap-2 bg-black/20 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveAdminSubTab('teachers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">Registered Faculty & Staff</h3>
              <p className="text-xs text-slate-400">Teachers log in by choosing their name. Default password: firstname@123</p>
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
                  <th className="py-3.5 px-6">Teacher Name</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Assigned Class</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-800 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {t.name.charAt(0)}
                      </div>
                      <span>{t.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                        t.role === 'class_teacher' 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {t.role === 'class_teacher' ? 'Class Teacher' : 'Subject Teacher'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {t.class_name || 'Class 8-A'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {t.subject || 'General'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {t.email}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleResetTeacherPassword(t)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          title="Reset password to firstname@123"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditTeacher(t)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 transition-colors"
                          title="Edit Teacher"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(t)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-500 hover:text-rose-600 transition-colors"
                          title="Delete Teacher"
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
      {/* 2. STUDENT ROSTER MANAGEMENT SECTION                      */}
      {/* ========================================================= */}
      {activeAdminSubTab === 'students' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">Student Roll & Profiles</h3>
              <p className="text-xs text-slate-400">Add, edit student details, and assign roll numbers</p>
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
                  <th className="py-3.5 px-6">Roll No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Parent Email</th>
                  <th className="py-3.5 px-4">Parent Phone</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(st => (
                  <tr key={st.rollNo} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-500">
                      #{st.rollNo}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {st.name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {st.className || 'Class 8-A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {st.parentEmail || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {st.parentPhone || '—'}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditStudent(st)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 transition-colors"
                          title="Edit Student"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-500 hover:text-rose-600 transition-colors"
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
      {/* MODAL: ADD / EDIT TEACHER                                 */}
      {/* ========================================================= */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {editingTeacher ? `Edit ${editingTeacher.name}` : 'Add New Teacher'}
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
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="teacher@school.edu"
                  value={teacherEmail} 
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Teacher Role</label>
                  <select 
                    value={teacherRole} 
                    onChange={(e) => setTeacherRole(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                    className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-200 mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                <input 
                  type="text" 
                  value={teacherClass} 
                  onChange={(e) => setTeacherClass(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50 text-[11px] text-indigo-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Default password will be automatically assigned as <strong>firstname@123</strong></span>
              </div>

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
      {/* MODAL: ADD / EDIT STUDENT                                 */}
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
                    placeholder="09"
                    value={studentRollNo} 
                    onChange={(e) => setStudentRollNo(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600">Class</label>
                  <input 
                    type="text" 
                    value={studentClass} 
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Student Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Rohan Joshi"
                  value={studentName} 
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Parent Email Address</label>
                <input 
                  type="email" 
                  placeholder="parent.joshi@example.com"
                  value={studentParentEmail} 
                  onChange={(e) => setStudentParentEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Parent Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="9876543209"
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

    </div>
  );
}

