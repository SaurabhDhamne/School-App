'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, UserCheck, ChevronDown, Sparkles, X, School, Users, HeartHandshake, Phone, Check, GraduationCap } from 'lucide-react';
import { getSchoolConfig } from '@/lib/schoolConfig';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, showToast, isGatePage = false, students = [] }) {
  // Mode: 'teacher' | 'parent' | 'admin'
  const [loginMode, setLoginMode] = useState('teacher');
  
  // Teachers list for dropdown
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const teacherDropdownRef = useRef(null);
  
  // Students list for Parent Portal (dynamically loaded from props or API)
  const schoolConfig = getSchoolConfig();
  const [parentStudents, setParentStudents] = useState(() => students || []);
  const [parentClass, setParentClass] = useState(() => schoolConfig.classes?.[0] || 'Class 8-A');
  const [isParentClassDropdownOpen, setIsParentClassDropdownOpen] = useState(false);
  const parentClassDropdownRef = useRef(null);

  const [parentStudentRoll, setParentStudentRoll] = useState('01');
  const [parentPhoneOrEmail, setParentPhoneOrEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');

  // Passwords
  const [password, setPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('admin@myschool.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(e.target)) {
        setIsTeacherDropdownOpen(false);
      }
      if (parentClassDropdownRef.current && !parentClassDropdownRef.current.contains(e.target)) {
        setIsParentClassDropdownOpen(false);
      }
    };
    if (isTeacherDropdownOpen || isParentClassDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTeacherDropdownOpen, isParentClassDropdownOpen]);

  // Sync with live students from props
  useEffect(() => {
    if (students && students.length > 0) {
      setParentStudents(students);
    }
  }, [students]);

  // Compute available classes dynamically from school config or live student records
  const availableClasses = useMemo(() => {
    const list = parentStudents && parentStudents.length > 0 ? parentStudents : (students || []);
    const set = new Set();
    list.forEach(s => {
      if (s.className) set.add(s.className);
    });
    if (schoolConfig?.classes && schoolConfig.classes.length > 0) {
      schoolConfig.classes.forEach(c => set.add(c));
    }
    if (set.size === 0) set.add('Class 8-A');
    return Array.from(set);
  }, [parentStudents, students, schoolConfig]);

  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
      fetchLiveStudents();
    }
  }, [isOpen]);

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.success && data.teachers) {
        setTeachers(data.teachers);
        if (data.teachers.length > 0 && !selectedTeacherId) {
          setSelectedTeacherId(data.teachers[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLiveStudents = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setParentStudents(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  const handleTeacherLogin = async (e) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      showToast('⚠️ Please select your name from the dropdown');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          teacherId: selectedTeacherId,
          password
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
        showToast(`🎉 Welcome back, ${data.user.name}!`);
        if (onClose) onClose();
      } else {
        showToast(`⚠️ ${data.error || 'Invalid password'}`);
      }
    } catch (err) {
      showToast('⚠️ Login service error');
    } finally {
      setLoading(false);
    }
  };

  const handleParentLogin = async (e) => {
    if (e) e.preventDefault();
    if (!parentPhoneOrEmail.trim()) {
      showToast('⚠️ Please enter your registered email');
      return;
    }
    setLoading(true);
    try {
      const input = parentPhoneOrEmail.trim();
      const isEmail = input.includes('@');
      const isDigitsOnly = /^\d+$/.test(input);

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parent_login',
          className: parentClass,
          parentEmail: isEmail ? input : (isDigitsOnly && input.length > 5 ? null : input),
          parentPhone: isDigitsOnly && input.length >= 7 ? input : null,
          studentRollNo: isDigitsOnly && input.length <= 3 ? input : null,
          password: parentPassword
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
        showToast(`👨‍👩‍👧 Welcome to Parent Portal, ${data.user.student?.name || 'Student'}'s Parent!`);
        if (onClose) onClose();
      } else {
        showToast(`⚠️ ${data.error || 'Failed to authenticate parent'}`);
      }
    } catch (err) {
      showToast('⚠️ Parent login service error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: adminEmail,
          password: adminPassword
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
        showToast(`🛡️ Logged in as School Administrator`);
        if (onClose) onClose();
      } else {
        showToast(`⚠️ ${data.error || 'Invalid admin credentials'}`);
      }
    } catch (err) {
      showToast('⚠️ Login service error');
    } finally {
      setLoading(false);
    }
  };

  const filteredParentStudents = parentStudents.filter(
    s => (s.className || 'Class 8-A').toLowerCase() === parentClass.toLowerCase()
  );

  const selectedParentStudent = filteredParentStudents.find(
    s => s.rollNo === parentStudentRoll
  ) || filteredParentStudents[0];

  const containerClasses = isGatePage
    ? "min-h-screen bg-[#F6F7FB] flex items-center justify-center p-4"
    : "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150";

  return (
    <div className={containerClasses}>
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#171340] to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
              <Sparkles className="w-5 h-5 text-[#FF8A00]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-black tracking-tight text-slate-900">MySchool</h2>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  loginMode === 'parent' 
                    ? 'bg-emerald-100 text-emerald-800'
                    : loginMode === 'admin'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {loginMode === 'parent' ? 'PARENT PORTAL' : loginMode === 'admin' ? 'ADMIN' : 'TEACHER'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {loginMode === 'admin' 
                  ? 'School Administrator Login' 
                  : loginMode === 'parent'
                    ? 'Parent Access Portal'
                    : 'Teacher Access Gate'}
              </p>
            </div>
          </div>

          {!isGatePage && onClose && (
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Mode Switcher 3 Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setLoginMode('teacher')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              loginMode === 'teacher'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('parent')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              loginMode === 'parent'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Parent
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('admin')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              loginMode === 'admin'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Admin
          </button>
        </div>

        {/* 1. TEACHER LOGIN FORM */}
        {loginMode === 'teacher' && (
          <form onSubmit={handleTeacherLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Select Your Name</label>
              <div className="relative mt-1" ref={teacherDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsTeacherDropdownOpen(prev => !prev)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl border text-xs font-bold transition-all text-left ${
                    isTeacherDropdownOpen
                      ? 'border-indigo-500 bg-white ring-2 ring-indigo-500/20 text-slate-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                      {selectedTeacher ? selectedTeacher.name.charAt(0) : <UserCheck className="w-4 h-4" />}
                    </div>
                    <span className="truncate">{selectedTeacher ? selectedTeacher.name : 'Select a teacher...'}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isTeacherDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                </button>

                {isTeacherDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-indigo-950/15 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Faculty Roster</span>
                      <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{teachers.length} teachers</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
                      {teachers.length === 0 ? (
                        <div className="px-3 py-3 text-center text-xs text-slate-400">
                          No teachers registered yet.<br/>
                          <span className="text-[11px] text-indigo-600 font-semibold">Please log in as Admin to add teachers.</span>
                        </div>
                      ) : (
                        teachers.map(t => {
                          const isSelected = t.id === selectedTeacherId;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setSelectedTeacherId(t.id);
                                setIsTeacherDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-left transition-all ${
                                isSelected
                                  ? 'bg-indigo-50 text-indigo-900 font-bold'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                  isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {t.name.charAt(0)}
                                </div>
                                <div className="truncate">
                                  <p className="truncate font-bold text-slate-800">{t.name}</p>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {t.subject || 'Faculty'} {t.class_name ? `• ${t.class_name}` : ''}
                                  </p>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedTeacher && (
              <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-indigo-950">{selectedTeacher.name}</p>
                  <p className="text-[11px] text-indigo-600 font-medium">
                    {selectedTeacher.subject ? `${selectedTeacher.subject} Teacher` : 'Teacher'}
                    {selectedTeacher.class_name ? ` • Class Teacher (${selectedTeacher.class_name})` : ''}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Logging in...' : 'Sign In to Teacher Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 2. PARENT LOGIN FORM */}
        {loginMode === 'parent' && (
          <form onSubmit={handleParentLogin} className="flex flex-col gap-4">
            {/* Class Selection */}
            <div>
              <label className="text-[11px] font-bold text-slate-700">Child's Class</label>
              <div className="relative mt-1" ref={parentClassDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsParentClassDropdownOpen(prev => !prev)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                    isParentClassDropdownOpen
                      ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20 text-slate-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{parentClass}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isParentClassDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                </button>

                {isParentClassDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/15 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                      {availableClasses.map(c => {
                        const isSelected = c === parentClass;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setParentClass(c);
                              setIsParentClassDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                            }`}
                          >
                            <span>{c}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Registered Parent Email */}
            <div>
              <label className="text-[11px] font-bold text-slate-700">Registered Parent Email</label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="text"
                  required
                  placeholder="Enter your registered email address"
                  value={parentPhoneOrEmail}
                  onChange={(e) => setParentPhoneOrEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Parent Password */}
            <div>
              <label className="text-[11px] font-bold text-slate-700">Password</label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="password"
                  required
                  placeholder="Enter password"
                  value={parentPassword}
                  onChange={(e) => setParentPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In as Parent'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 3. ADMIN LOGIN FORM */}
        {loginMode === 'admin' && (
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Admin Email</label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Admin Password</label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Access Admin Dashboard'}</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
