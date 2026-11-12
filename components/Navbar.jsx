'use client';

import React from 'react';
import { 
  Sparkles, 
  Home as HomeIcon, 
  Calendar, 
  FileSpreadsheet, 
  LogIn, 
  ShieldCheck 
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onOpenAuthModal, 
  onOpenProfileModal 
}) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#171340] to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Sparkles className="w-5 h-5 text-[#FF8A00]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-slate-900">MySchool</h1>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Class 8-A Teacher Portal</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'attendance'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab('marksheet')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'marksheet'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Marksheet</span>
            </button>

            {/* Admin Panel Tab (Only when logged in as Admin) */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100/70 border border-amber-200/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right: Teacher / Admin Profile Pill */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <div 
              onClick={onOpenProfileModal}
              className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border cursor-pointer transition-all hover:shadow-sm ${
                isAdmin 
                  ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/60' 
                  : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
              }`}
              title="Click to view your profile and account settings"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ${
                isAdmin ? 'bg-amber-600 text-white' : 'bg-indigo-600 text-white'
              }`}>
                {isAdmin ? <ShieldCheck className="w-4 h-4" /> : currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
                <p className={`text-[10px] font-semibold ${isAdmin ? 'text-amber-700 font-bold' : 'text-indigo-600'}`}>
                  {isAdmin ? 'School Administrator' : (
                    currentUser.role === 'class_teacher' 
                      ? `${currentUser.classTeacherOf || 'Class 8-A'} Teacher` 
                      : `${currentUser.subject || 'Subject'} Teacher`
                  )}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login Portal</span>
            </button>
          )}
        </div>

      </div>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden items-center justify-around gap-1 mt-2.5 pt-2 border-t border-slate-100">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold text-center transition-all ${
            activeTab === 'home' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold text-center transition-all ${
            activeTab === 'attendance' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500'
          }`}
        >
          Attendance
        </button>
        <button
          onClick={() => setActiveTab('marksheet')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold text-center transition-all ${
            activeTab === 'marksheet' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500'
          }`}
        >
          Marksheet
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold text-center transition-all ${
              activeTab === 'admin' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-amber-700'
            }`}
          >
            Admin
          </button>
        )}
      </div>
    </header>
  );
}
