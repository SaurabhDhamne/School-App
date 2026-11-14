'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getPdfBlobUrl } from '@/lib/pdfUtils';
import { 
  Calendar as CalendarIcon, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Download, 
  Eye, 
  X, 
  ExternalLink, 
  Search, 
  Sparkles, 
  FileText, 
  LogOut, 
  Check, 
  ZoomIn, 
  ZoomOut,
  AlertCircle,
  KeyRound,
  Smartphone
} from 'lucide-react';

const HW_STORAGE_KEY = 'myschool_homework_posts';

export default function ParentPortalView({
  currentUser,
  student,
  attendanceHistory = {},
  students = [],
  onLogout,
  onOpenProfileModal,
  showToast,
  schoolConfig
}) {
  // Navigation: Homework FIRST, Attendance SECOND
  const [activeTab, setActiveTab] = useState('homework');

  // Active student object (merge currentUser.student with latest state from live students)
  const currentStudent = useMemo(() => {
    const fromList = students.find(
      s => s.rollNo === (student?.rollNo || currentUser?.student?.rollNo) &&
           (s.className || 'Class 8-A').toLowerCase() === (student?.className || currentUser?.student?.className || 'Class 8-A').toLowerCase()
    );
    return fromList || student || currentUser?.student || {
      rollNo: '01',
      name: 'Student',
      className: 'Class 8-A',
      parentEmail: '',
      parentPhone: '',
      attendance: 'P'
    };
  }, [students, student, currentUser]);

  const studentClass = currentStudent.className || 'Class 8-A';
  const todayStr = new Date().toISOString().split('T')[0];

  // Attendance Inspector Date & Filter
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'present' | 'absent'

  // Homework Feed State
  const [homeworkList, setHomeworkList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [completedHwMap, setCompletedHwMap] = useState({});

  // PWA Home Screen Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
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
    if (outcome === 'accepted') setIsInstallable(false);
    setDeferredPrompt(null);
  };

  // PDF & Image Modals
  const [selectedPdf, setSelectedPdf] = useState(null); // { url, name }
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null); // url
  const [imageZoom, setImageZoom] = useState(1);

  // Convert PDF data URIs into Chromium-compatible Blob URLs
  useEffect(() => {
    if (selectedPdf?.url) {
      const bUrl = getPdfBlobUrl(selectedPdf.url);
      setPdfBlobUrl(bUrl);
      return () => {
        if (bUrl && bUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(bUrl); } catch (e) {}
        }
      };
    } else {
      setPdfBlobUrl(null);
    }
  }, [selectedPdf]);

  // Back button / Escape dismiss handler for modals
  useEffect(() => {
    if (selectedPdf || selectedImage) {
      window.history.pushState({ modalOpen: true }, '');
      const handleBack = () => {
        setSelectedPdf(null);
        setSelectedImage(null);
      };
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setSelectedPdf(null);
          setSelectedImage(null);
        }
      };
      window.addEventListener('popstate', handleBack);
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('popstate', handleBack);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedPdf, selectedImage]);

  // Load Homework Posts from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HW_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHomeworkList(parsed);
          return;
        }
      }
    } catch (e) {}
  }, []);

  // Load Parent's local completion checklist for their child
  useEffect(() => {
    try {
      const doneKey = `myschool_parent_done_${currentStudent.rollNo}_${studentClass.replace(/\s+/g, '')}`;
      const savedDone = localStorage.getItem(doneKey);
      if (savedDone) {
        setCompletedHwMap(JSON.parse(savedDone));
      }
    } catch (e) {}
  }, [currentStudent.rollNo, studentClass]);

  const toggleHomeworkCompleted = (hwId) => {
    setCompletedHwMap(prev => {
      const updated = { ...prev, [hwId]: !prev[hwId] };
      try {
        const doneKey = `myschool_parent_done_${currentStudent.rollNo}_${studentClass.replace(/\s+/g, '')}`;
        localStorage.setItem(doneKey, JSON.stringify(updated));
      } catch (e) {}
      if (updated[hwId]) {
        showToast?.('🎉 Marked as completed at home!');
      }
      return updated;
    });
  };

  // Helper to get child's attendance strictly on any given date
  const getChildStatusForDate = (dateStr) => {
    if (attendanceHistory[dateStr] && attendanceHistory[dateStr][currentStudent.rollNo] !== undefined) {
      return attendanceHistory[dateStr][currentStudent.rollNo];
    }
    if (dateStr === todayStr) {
      return currentStudent.attendance || 'P';
    }
    return 'P'; // Default standard presence
  };

  const selectedDateStatus = getChildStatusForDate(selectedDate);

  // Compute overall percentage & chronological history
  const attendanceStats = useMemo(() => {
    const dates = new Set(Object.keys(attendanceHistory));
    dates.add(todayStr);

    let totalDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    const historyRows = [];

    dates.forEach(d => {
      totalDays++;
      const st = getChildStatusForDate(d);
      if (st === 'P') presentDays++;
      else absentDays++;

      historyRows.push({
        dateStr: d,
        status: st,
        dateObj: new Date(d + 'T00:00:00')
      });
    });

    historyRows.sort((a, b) => b.dateObj - a.dateObj);
    const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    return {
      totalDays,
      presentDays,
      absentDays,
      rate,
      historyRows
    };
  }, [attendanceHistory, todayStr, currentStudent]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'present') {
      return attendanceStats.historyRows.filter(r => r.status === 'P');
    }
    if (historyFilter === 'absent') {
      return attendanceStats.historyRows.filter(r => r.status === 'A');
    }
    return attendanceStats.historyRows;
  }, [attendanceStats, historyFilter]);

  // Scoped Homework strictly for child's class
  const classHomework = useMemo(() => {
    return homeworkList.filter(hw => {
      const matchClass = !hw.className || hw.className === 'All Classes' || hw.className === studentClass;
      if (!matchClass) return false;

      if (subjectFilter !== 'All' && hw.subject !== subjectFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inSubj = hw.subject?.toLowerCase().includes(q);
        const inMsg = hw.message?.toLowerCase().includes(q);
        const inTeacher = hw.teacherName?.toLowerCase().includes(q);
        return inSubj || inMsg || inTeacher;
      }

      return true;
    });
  }, [homeworkList, studentClass, subjectFilter, searchQuery]);

  const totalHwCount = classHomework.length;
  const completedHwCount = classHomework.filter(hw => completedHwMap[hw.id]).length;
  const schoolName = schoolConfig?.schoolName || 'MySchool';

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col text-slate-800">
      
      {/* Top Header with UNIFORM MySchool Brand Logo & Clean Student Profile */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          
          {/* Uniform MySchool Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#171340] to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
              <Sparkles className="w-5 h-5 text-[#FF8A00]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
                  {schoolName}
                </h1>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  PARENT PORTAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold hidden sm:block">
                Academic & Homework Updates
              </p>
            </div>
          </div>

          {/* Compact Student Identity & Profile / Change Password Trigger & Install App */}
          <div className="flex items-center gap-2">
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm shadow-emerald-200 transition-all animate-pulse cursor-pointer"
                title="Install app to your mobile home screen"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}

            <div 
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 cursor-pointer transition-all hover:shadow-xs"
              title="Click to view child profile and change password"
            >
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {currentStudent.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{currentStudent.name}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{studentClass} • Roll #{currentStudent.rollNo}</p>
              </div>
              <KeyRound className="w-3.5 h-3.5 text-slate-400 ml-0.5 hover:text-indigo-600" />
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer"
              title="Sign out of Parent Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">

        {/* 2 Tabs: Homework FIRST, Attendance SECOND */}
        <div className="flex items-center gap-2 bg-slate-200/80 p-1.5 rounded-2xl max-w-md mx-auto w-full">
          <button
            onClick={() => setActiveTab('homework')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'homework'
                ? 'bg-white text-indigo-900 shadow-md shadow-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Class Homework</span>
            {classHomework.length > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
                {classHomework.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-white text-indigo-900 shadow-md shadow-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <span>Child's Attendance</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: CLASS HOMEWORK (FIRST TAB)
        ========================================================================= */}
        {activeTab === 'homework' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-150">
            
            {/* Search & Subject Filters */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Homework & Assignments for {studentClass}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official homework and study tasks posted by teachers
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search homework..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Subject Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['All', 'Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'General Notice'].map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSubjectFilter(sub)}
                    className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                      subjectFilter === sub
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* Home Study Tracker Progress */}
              {totalHwCount > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Completed {completedHwCount} of {totalHwCount} tasks
                    </span>
                  </div>
                  <div className="w-full sm:w-44 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${totalHwCount > 0 ? (completedHwCount / totalHwCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Homework Posts Feed */}
            <div className="flex flex-col gap-3.5">
              {classHomework.map(hw => {
                const isDone = !!completedHwMap[hw.id];
                const hasPdf = hw.attachment?.type === 'pdf' || (hw.attachment?.name && hw.attachment.name.toLowerCase().endsWith('.pdf'));
                const hasImg = hw.imageUrl || (hw.attachment?.type === 'image');
                const isOverdue = hw.hasDeadline && hw.deadlineDate && hw.deadlineDate < todayStr;
                const isDueToday = hw.hasDeadline && hw.deadlineDate === todayStr;

                return (
                  <div
                    key={hw.id}
                    className={`bg-white rounded-3xl border transition-all p-5 shadow-xs flex flex-col gap-3.5 ${
                      isDone 
                        ? 'border-emerald-200 bg-emerald-50/15' 
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Subject + Teacher + Mark Done Toggle */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {hw.subject || 'General'}
                        </span>
                        
                        <span className="text-xs text-slate-500 font-medium">
                          By <strong className="text-slate-800">{hw.teacherName || 'Teacher'}</strong>
                        </span>

                        <span className="text-[10px] text-slate-400 font-medium">
                          • {hw.postedAt}
                        </span>
                      </div>

                      {/* Parent Checkbox */}
                      <button
                        onClick={() => toggleHomeworkCompleted(hw.id)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isDone 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
                        }`}
                        title="Click to check off when child finishes this homework"
                      >
                        <Check className={`w-3.5 h-3.5 ${isDone ? 'text-white' : 'text-slate-400'}`} />
                        <span>{isDone ? 'Done ✓' : 'Mark as Done'}</span>
                      </button>
                    </div>

                    {/* Deadline Banner if exists */}
                    {hw.hasDeadline && hw.deadlineDate && (
                      <div className={`p-2 rounded-xl flex items-center gap-2 text-xs font-bold ${
                        isOverdue 
                          ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                          : isDueToday 
                            ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isOverdue 
                            ? `Overdue (${hw.deadlineDate})` 
                            : isDueToday 
                              ? `Due Today (${hw.deadlineDate})` 
                              : `Due: ${hw.deadlineDate}`}
                        </span>
                      </div>
                    )}

                    {/* Homework Message */}
                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                      {hw.message}
                    </div>

                    {/* Reference Link */}
                    {hw.link && (
                      <div>
                        <a
                          href={hw.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 px-2.5 py-1.5 rounded-xl border border-indigo-200/80 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Reference Link</span>
                        </a>
                      </div>
                    )}

                    {/* Attached Resources */}
                    {(hasPdf || hasImg) && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                        {hasPdf && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedPdf({
                                url: hw.attachment?.url,
                                name: hw.attachment?.name || `${hw.subject}_Worksheet.pdf`
                              })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-rose-600" />
                              <span>View PDF Worksheet</span>
                              <Eye className="w-3 h-3" />
                            </button>

                            {hw.attachment?.url && (
                              <a
                                href={hw.attachment.url}
                                download={hw.attachment?.name || 'Worksheet.pdf'}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>
                            )}
                          </div>
                        )}

                        {hasImg && (
                          <button
                            onClick={() => setSelectedImage(hw.imageUrl || hw.attachment?.url)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>View Attached Image</span>
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}

              {classHomework.length === 0 && (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 flex flex-col items-center justify-center gap-2">
                  <BookOpen className="w-8 h-8 text-slate-400" />
                  <h4 className="text-sm font-bold text-slate-700">No Homework Found</h4>
                  <p className="text-xs text-slate-400">
                    No active homework or notices posted for {studentClass}.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 2: CHILD'S ATTENDANCE (SECOND TAB - CLEAN, SIMPLE, NOT OVERDONE)
        ========================================================================= */}
        {activeTab === 'attendance' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            
            {/* Simple Overall Percentage Summary Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Overall Attendance
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black text-emerald-600">{attendanceStats.rate}%</span>
                  <span className="text-xs font-bold text-slate-500">
                    ({attendanceStats.presentDays} of {attendanceStats.totalDays} Days Present)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full sm:w-64 flex flex-col gap-1.5">
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/60">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${attendanceStats.rate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>0%</span>
                  <span>Target: 75%+</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Attendance Log with Custom Date Inspector */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                {/* Date Jump */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700">Check Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    max={todayStr}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                    selectedDateStatus === 'P' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedDateStatus === 'P' ? 'Present' : 'Absent'}
                  </span>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      historyFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    All ({attendanceStats.totalDays})
                  </button>
                  <button
                    onClick={() => setHistoryFilter('present')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      historyFilter === 'present' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Present ({attendanceStats.presentDays})
                  </button>
                  <button
                    onClick={() => setHistoryFilter('absent')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      historyFilter === 'absent' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Absent ({attendanceStats.absentDays})
                  </button>
                </div>
              </div>

              {/* Log List */}
              <div className="flex flex-col gap-2">
                {filteredHistory.map((row) => (
                  <div
                    key={row.dateStr}
                    onClick={() => setSelectedDate(row.dateStr)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      selectedDate === row.dateStr 
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs' 
                        : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        row.status === 'P' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {row.status === 'P' ? 'P' : 'A'}
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {row.dateObj.toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                        {row.dateStr === todayStr && (
                          <span className="ml-2 text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                            Today
                          </span>
                        )}
                      </p>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                      row.status === 'P' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {row.status === 'P' ? 'PRESENT' : 'ABSENT'}
                    </span>
                  </div>
                ))}

                {filteredHistory.length === 0 && (
                  <div className="py-6 text-center text-slate-400 text-xs font-medium">
                    No attendance records found for this filter.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* =========================================================================
          FULL-SCREEN PDF VIEWER MODAL
      ========================================================================= */}
      {selectedPdf && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                  {selectedPdf.name}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {pdfBlobUrl && (
                  <a
                    href={pdfBlobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Open Tab</span>
                  </a>
                )}
                {selectedPdf.url && (
                  <a
                    href={pdfBlobUrl || selectedPdf.url}
                    download={selectedPdf.name || 'Worksheet.pdf'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
                <button
                  onClick={() => setSelectedPdf(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-2 relative flex items-center justify-center overflow-hidden">
              {pdfBlobUrl ? (
                <object
                  data={pdfBlobUrl}
                  type="application/pdf"
                  className="w-full h-full rounded-2xl bg-white border border-slate-200"
                >
                  <iframe
                    src={pdfBlobUrl}
                    title={selectedPdf.name}
                    className="w-full h-full rounded-2xl bg-white"
                  />
                </object>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  Document ready for download.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FULL-SCREEN IMAGE LIGHTBOX MODAL
      ========================================================================= */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 text-white">
              <button
                onClick={() => setImageZoom(z => Math.max(0.6, z - 0.2))}
                className="w-8 h-8 rounded-xl hover:bg-white/20 flex items-center justify-center"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setImageZoom(1)}
                className="px-2 text-xs font-bold hover:bg-white/20 rounded-xl h-8 flex items-center"
              >
                {Math.round(imageZoom * 100)}%
              </button>
              <button
                onClick={() => setImageZoom(z => Math.min(2.5, z + 0.2))}
                className="w-8 h-8 rounded-xl hover:bg-white/20 flex items-center justify-center"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="w-8 h-8 rounded-xl hover:bg-rose-600 flex items-center justify-center ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-auto max-h-[85vh] p-2 flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Attachment"
                style={{ transform: `scale(${imageZoom})`, transition: 'transform 0.2s ease-out' }}
                className="rounded-2xl max-w-full max-h-full object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
