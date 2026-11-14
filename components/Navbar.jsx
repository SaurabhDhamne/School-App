'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Home as HomeIcon, 
  Calendar, 
  FileSpreadsheet, 
  BookOpen,
  LogIn, 
  ShieldCheck,
  GraduationCap,
  ChevronDown,
  Smartphone,
  Check
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  selectedClass = 'Class 8-A',
  onChangeClass,
  availableClasses = [],
  schoolConfig,
  onOpenAuthModal, 
  onOpenProfileModal 
}) {
  const isAdmin = currentUser?.role === 'admin';
  const isClassTeacher = isAdmin || (currentUser?.classTeacherOf && currentUser.classTeacherOf === selectedClass);
  const displaySchoolName = schoolConfig?.schoolName || 'MySchool';

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // If already installed or launched from mobile home screen (standalone), never show button
    const isStandalone = 
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof window !== 'undefined' && window.navigator?.standalone === true);

    if (isStandalone) {
      setIsInstallable(false);
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Custom Interactive Class Switcher Dropdown State
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
  const classDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target)) {
        setIsClassMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsClassMenuOpen(false);
    };

    if (isClassMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isClassMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Left: Brand Identity & Active Class Switcher */}
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => setActiveTab('home')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#171340] to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Sparkles className="w-5 h-5 text-[#FF8A00]" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
                {displaySchoolName}
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold hidden sm:block">
                {schoolConfig?.schoolTagline || 'Teacher & Academic Portal'}
              </p>
            </div>
          </div>

          {/* Global Interactive Custom Class Switcher Dropdown */}
          {currentUser && availableClasses.length > 0 && (
            <div className="relative" ref={classDropdownRef}>
              <button
                type="button"
                onClick={() => setIsClassMenuOpen(prev => !prev)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-black transition-all shadow-xs ${
                  isClassMenuOpen
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                    : 'bg-indigo-50/90 border-indigo-200/90 text-indigo-950 hover:bg-indigo-100/90'
                }`}
                title="Switch Active Class"
              >
                <GraduationCap className={`w-4 h-4 ${isClassMenuOpen ? 'text-amber-300' : 'text-indigo-600'} shrink-0`} />
                <span>{selectedClass}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isClassMenuOpen ? 'rotate-180 text-white' : 'text-indigo-600'}`} />
              </button>

              {/* Custom Floating Dropdown Menu */}
              {isClassMenuOpen && (
                <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-indigo-950/20 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 pb-2 mb-1 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Class</span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {availableClasses.length} Classes
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto px-1 space-y-0.5">
                    {availableClasses.map(c => {
                      const isSelected = c === selectedClass;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            onChangeClass?.(c);
                            setIsClassMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-all ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-700 font-black'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full transition-all ${isSelected ? 'bg-indigo-600 scale-125' : 'bg-slate-300'}`} />
                            <span>{c}</span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-indigo-600 stroke-[3]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

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

            <button
              onClick={() => setActiveTab('homework')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'homework'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Homework</span>
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

        {/* Right: Teacher / Admin Profile Pill & Install App */}
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm shadow-emerald-200 transition-all animate-pulse"
              title="Install app to your home screen"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

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
                <p className={`text-[10px] font-semibold ${isAdmin ? 'text-amber-700 font-bold' : isClassTeacher ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                  {isAdmin ? 'School Administrator' : (
                    isClassTeacher 
                      ? `Class Teacher • ${selectedClass}` 
                      : `${currentUser.subject || 'Subject'} Teacher • ${selectedClass}`
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
          Marks
        </button>
        <button
          onClick={() => setActiveTab('homework')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold text-center transition-all ${
            activeTab === 'homework' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500'
          }`}
        >
          Homework
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
