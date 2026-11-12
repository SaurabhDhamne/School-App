'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, ShieldCheck, ArrowRight, UserCheck, ChevronDown, Sparkles } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, showToast }) {
  // Mode: 'teacher' | 'admin'
  const [loginMode, setLoginMode] = useState('teacher');
  
  // Teachers list for dropdown
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  
  // Passwords
  const [password, setPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('admin@myschool.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
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

  if (!isOpen) return null;

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  // Calculate default password preview
  const getDefaultPassHint = (name = '') => {
    const clean = name.replace(/^(mrs\.|mr\.|dr\.|ms\.|prof\.)\s+/i, '').trim();
    const first = clean.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${first || 'teacher'}@123`;
  };

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
        onClose();
      } else {
        showToast(`⚠️ ${data.error || 'Invalid password'}`);
      }
    } catch (err) {
      showToast('⚠️ Login service error');
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
        onClose();
      } else {
        showToast(`⚠️ ${data.error || 'Invalid admin credentials'}`);
      }
    } catch (err) {
      showToast('⚠️ Login service error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${loginMode === 'admin' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
              {loginMode === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {loginMode === 'admin' ? 'School Administrator Login' : 'Teacher Portal Login'}
              </h3>
              <p className="text-xs text-slate-400">
                {loginMode === 'admin' ? 'Full school & roster control' : 'Select your name from staff list'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setLoginMode('teacher')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              loginMode === 'teacher'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Teacher Portal
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
            Admin Portal
          </button>
        </div>

        {/* TEACHER LOGIN FORM (Dropdown selection) */}
        {loginMode === 'teacher' ? (
          <form onSubmit={handleTeacherLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Select Your Name</label>
              <div className="relative mt-1">
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 appearance-none pr-8"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role === 'class_teacher' ? `${t.class_name || 'Class 8-A'} Teacher` : `${t.subject} Teacher`})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            {selectedTeacher && (
              <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-indigo-950">{selectedTeacher.name}</p>
                  <p className="text-[11px] text-indigo-600 font-medium">
                    {selectedTeacher.role === 'class_teacher' ? `Class Teacher (${selectedTeacher.class_name || 'Class 8-A'})` : `Subject Teacher (${selectedTeacher.subject})`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Default Password:</span>
                  <span className="font-mono text-xs font-bold text-indigo-700">
                    {getDefaultPassHint(selectedTeacher.name)}
                  </span>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <span className="text-[10px] text-slate-400">Default is firstname@123</span>
              </div>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="password"
                  required
                  placeholder={`Enter password (e.g. ${selectedTeacher ? getDefaultPassHint(selectedTeacher.name) : 'priya@123'})`}
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
        ) : (
          /* ADMIN LOGIN FORM */
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Admin Password</label>
                <span className="text-[10px] text-slate-400 font-mono">admin@123</span>
              </div>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="password"
                  required
                  placeholder="Enter admin password (admin@123)"
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
