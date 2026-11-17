'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    Smartphone,
    Languages,
    Lightbulb,
    ListChecks,
    ChevronDown,
    ChevronUp,
    RefreshCw
  } from 'lucide-react';

const HW_STORAGE_KEY = 'myschool_homework_posts';

const AI_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी', sublabel: 'Hindi', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', sublabel: 'Marathi', flag: '🇮🇳' },
  { code: 'gu', label: 'ગુજરાતી', sublabel: 'Gujarati', flag: '🇮🇳' }
];

export default function ParentPortalView({
  currentUser,
  student,
  attendanceHistory = {},
  students = [],
  onRefreshStudents,
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

  // AI Study Helper & Multi-Language Translation State
  const [expandedAiHwId, setExpandedAiHwId] = useState(null);
  const [aiExplainData, setAiExplainData] = useState({}); // { [hwId]: { [lang]: data } }
  const [aiLoadingHwId, setAiLoadingHwId] = useState(null);
  const [aiActiveLangMap, setAiActiveLangMap] = useState({}); // { [hwId]: 'en' | 'hi' | ... }

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
  const [pdfZoom, setPdfZoom] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null); // url
  const [imageZoom, setImageZoom] = useState(1);
  const touchStartDistRef = useRef(null);
  const startZoomRef = useRef(1);
  const lastTapRef = useRef(0);

  const handleTouchStart = (e, currentZoom) => {
    if (e.touches && e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      startZoomRef.current = currentZoom;
    }
  };

  const handleTouchMove = (e, setZoom) => {
    if (e.touches && e.touches.length === 2 && touchStartDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / touchStartDistRef.current;
      const nextZoom = Math.min(3, Math.max(0.6, Number((startZoomRef.current * scale).toFixed(2))));
      setZoom(nextZoom);
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  const handleDoubleTap = (setZoom, currentZoom) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setZoom(currentZoom > 1 ? 1 : 1.8);
    }
    lastTapRef.current = now;
  };

  // Convert PDF data URIs into Chromium-compatible Blob URLs with automatic fallback
  useEffect(() => {
    if (selectedPdf) {
      const bUrl = getPdfBlobUrl(selectedPdf.url || '');
      setPdfBlobUrl(bUrl);
      setPdfZoom(1);
      return () => {
        if (bUrl && bUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(bUrl); } catch (e) { }
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

  // Load Homework Posts from live server API + cached localStorage fallback (Intelligent merge)
  const fetchLiveHomework = async () => {
    // 1. Instant local storage cache
    try {
      const saved = localStorage.getItem(HW_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHomeworkList(prev => {
            const idMap = new Map();
            parsed.forEach(p => idMap.set(p.id, p));
            prev.forEach(p => idMap.set(p.id, p));
            return Array.from(idMap.values());
          });
        }
      }
  } catch (e) { }

  // 2. Fetch live from server so phone immediately receives PC posts
  try {
    const res = await fetch(`/api/homework?className=${encodeURIComponent(studentClass)}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      setHomeworkList(prev => {
        const idMap = new Map();
        json.data.forEach(p => idMap.set(p.id, p));
        // Preserve recently posted items (< 2 mins) so they never vanish
        prev.forEach(p => {
          const postTime = Number(p.id?.replace(/\D/g, '')) || 0;
          if (!idMap.has(p.id) && Date.now() - postTime < 120000) {
            idMap.set(p.id, p);
          }
        });
        const merged = Array.from(idMap.values());
        try {
          localStorage.setItem(HW_STORAGE_KEY, JSON.stringify(merged));
      } catch (e) { }
      return merged;
    });
  }
    } catch (err) {
  console.warn('Parent portal homework fetch error:', err);
}
  };

useEffect(() => {
  fetchLiveHomework();

  // Standard pattern: Auto-sync on tab return / window focus (throttled to 15s)
  let lastFetch = Date.now();
  const handleFocus = () => {
    if (Date.now() - lastFetch > 15000) {
      lastFetch = Date.now();
      fetchLiveHomework();
    }
  };

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') handleFocus();
  };

  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibility);

  // Passive safety sync every 5 minutes (300,000ms) instead of constant 10s loop
  const interval = setInterval(() => {
    lastFetch = Date.now();
    fetchLiveHomework();
  }, 300000);

  return () => {
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibility);
    clearInterval(interval);
  };
}, [studentClass]);

// Load Parent's local completion checklist for their child
useEffect(() => {
  try {
    const doneKey = `myschool_parent_done_${currentStudent.rollNo}_${studentClass.replace(/\s+/g, '')}`;
    const savedDone = localStorage.getItem(doneKey);
    if (savedDone) {
      setCompletedHwMap(JSON.parse(savedDone));
    }
} catch (e) { }
  }, [currentStudent.rollNo, studentClass]);

const toggleHomeworkCompleted = (hwId) => {
  setCompletedHwMap(prev => {
    const updated = { ...prev, [hwId]: !prev[hwId] };
    try {
      const doneKey = `myschool_parent_done_${currentStudent.rollNo}_${studentClass.replace(/\s+/g, '')}`;
      localStorage.setItem(doneKey, JSON.stringify(updated));
  } catch (e) { }
  if (updated[hwId]) {
    showToast?.('🎉 Marked as completed at home!');
  }
  return updated;
});
  };

// AI Homework Explainer & Multi-Language Translator Handler
const handleToggleAiExplanation = async (hw, targetLang = null) => {
  const hwId = hw.id;
  const currentLang = targetLang || aiActiveLangMap[hwId] || 'en';

  if (expandedAiHwId === hwId && !targetLang) {
    // Toggle closed
    setExpandedAiHwId(null);
    return;
  }

  setExpandedAiHwId(hwId);
  if (targetLang) {
    setAiActiveLangMap(prev => ({ ...prev, [hwId]: targetLang }));
  }

  // If already cached for this hw and language, return instantly
  if (aiExplainData[hwId]?.[currentLang]) {
    return;
  }

  setAiLoadingHwId(hwId);
  try {
    const res = await fetch('/api/homework/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homework: {
          id: hw.id,
          subject: hw.subject,
          message: hw.message,
          deadlineDate: hw.deadlineDate,
          teacherName: hw.teacherName,
          attachment: hw.attachment,
          imageUrl: hw.imageUrl
        },
        targetLanguage: currentLang
      })
    });

    const json = await res.json();
    if (json.success && json.data) {
      setAiExplainData(prev => ({
        ...prev,
        [hwId]: {
          ...(prev[hwId] || {}),
          [currentLang]: json.data
        }
      }));
    }
  } catch (err) {
    console.warn('Could not fetch AI homework explanation:', err);
  } finally {
    setAiLoadingHwId(null);
  }
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
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'homework'
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
          onClick={() => {
            setActiveTab('attendance');
            onRefreshStudents?.();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'attendance'
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
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${subjectFilter === sub
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            
          </div>

          {/* Homework Posts Feed */}
          <div className="flex flex-col gap-3.5">
            {classHomework.map(hw => {
              const isDone = !!completedHwMap[hw.id];
              const allAttachments = Array.isArray(hw.attachments) && hw.attachments.length > 0
                ? hw.attachments
                : (hw.attachment ? [hw.attachment] : hw.imageUrl ? [{
              type: hw.imageUrl.startsWith('data:application/pdf') ? 'pdf' : 'image',
                name: 'Worksheet File',
            size: '',
            url: hw.imageUrl
                  }] : []);

                const pdfFiles = allAttachments.filter(a => a?.type === 'pdf' || a?.name?.toLowerCase().endsWith('.pdf') || a?.url?.startsWith('data:application/pdf'));
                const imgFiles = allAttachments.filter(a => a?.type === 'image' || (!a?.type && !a?.name?.toLowerCase().endsWith('.pdf')));
            const isOverdue = hw.hasDeadline && hw.deadlineDate && hw.deadlineDate < todayStr;
            const isDueToday = hw.hasDeadline && hw.deadlineDate === todayStr;
            const isAiExpanded = expandedAiHwId === hw.id;
            const activeLang = aiActiveLangMap[hw.id] || 'en';
            const currentAiData = aiExplainData[hw.id]?.[activeLang];
            const isLoadingThisAi = aiLoadingHwId === hw.id;

            return (
              <div
                key={hw.id}
                className={`bg-white rounded-3xl border transition-all p-4 sm:p-5 shadow-xs flex flex-col gap-3.5 ${
                  isDone 
                    ? 'border-emerald-200 bg-emerald-50/15' 
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* 1. Top Row: Subject Badge + Teacher Name (Left) & Mark Done Button (Right) */}
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Subject Badge with Distinct Theme Colors */}
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                      hw.subject === 'Mathematics' ? 'bg-blue-50 text-blue-800 border-blue-200/80' :
                      hw.subject === 'Science' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' :
                      hw.subject === 'English' ? 'bg-purple-50 text-purple-800 border-purple-200/80' :
                      hw.subject === 'Social Studies' ? 'bg-amber-50 text-amber-800 border-amber-200/80' :
                      hw.subject === 'Hindi' ? 'bg-rose-50 text-rose-800 border-rose-200/80' :
                      'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {hw.subject || 'General'}
                    </span>

                    <span className="text-xs text-slate-600 font-medium">
                      By <strong className="text-slate-800 font-bold">{hw.teacherName || 'Teacher'}</strong>
                    </span>
                  </div>

                  {/* Right Side: Parent Done Checkbox Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleHomeworkCompleted(hw.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
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

                {/* 2. Homework Message */}
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                  {hw.message}
                </p>

                {/* 3. Attached PDF Worksheets (Matching Teacher View Exactly: Large Red Squircle + Full Filename + Size + View & Download) */}
                {pdfFiles.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {pdfFiles.map((pdf, pIdx) => (
                      <div 
                        key={pIdx}
                        className="p-3 sm:p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/80 hover:bg-rose-100/50 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div 
                          onClick={() => setSelectedPdf({
                            url: pdf.url,
                            name: pdf.name || `${hw.subject}_Worksheet_${pIdx + 1}.pdf`
                          })}
                          className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1 cursor-pointer"
                          title="Click to view worksheet"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">
                              {pdf.name || `${hw.subject}_Worksheet.pdf`}
                            </p>
                            <p className="text-xs font-semibold text-rose-500 mt-0.5">
                              {pdf.size || 'PDF Document'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedPdf({
                              url: pdf.url,
                              name: pdf.name || `${hw.subject}_Worksheet_${pIdx + 1}.pdf`
                            })}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {pdf.url && (
                            <a
                              href={pdf.url}
                              download={pdf.name || 'Worksheet.pdf'}
                              className="p-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Attached Photo Preview (if any) */}
                {imgFiles.length > 0 && (
                  <div className={`${imgFiles.length > 1 ? 'grid grid-cols-2 gap-2' : ''}`}>
                    {imgFiles.map((img, iIdx) => (
                      <div 
                        key={iIdx}
                        onClick={() => {
                          setSelectedImage(img.url);
                          setImageZoom(1);
                        }}
                        className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center cursor-pointer group/img max-h-48"
                        title="Click to view full photo"
                      >
                        <img 
                          src={img.url} 
                          alt={img.name || `Photo ${iIdx + 1}`} 
                          className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-200" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                          <Eye className="w-4 h-4" />
                          <span>Click to Enlarge</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Reference Link (Matching Teacher View with Icon & URL) */}
                {hw.link && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                    <ExternalLink className="w-4 h-4 text-indigo-600 shrink-0" />
                    <a
                      href={hw.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline truncate"
                    >
                      {hw.link}
                    </a>
                  </div>
                )}

                {/* 6. AI Study Helper & Easy Worksheet Plan Bar */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleToggleAiExplanation(hw)}
                    className={`w-full flex items-center justify-between p-2.5 sm:px-3.5 sm:py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                      isAiExpanded
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-gradient-to-r from-purple-50 via-indigo-50/60 to-amber-50/50 hover:bg-indigo-100/60 text-indigo-900 border-indigo-200/80 shadow-2xs'
                    }`}
                    title="Get simple explanation and worksheet study plan in Hindi, Marathi, Gujarati or English"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className={`w-4 h-4 ${isAiExpanded ? 'text-amber-300' : 'text-amber-500'}`} />
                      <span>{isAiExpanded ? 'Hide AI Helper' : 'AI Summary & Explanation / समझें'}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                        isAiExpanded ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        AI
                      </span>
                    </div>
                    {isAiExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expandable AI Study Helper Card */}
                {isAiExpanded && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/30 to-white border border-indigo-200 shadow-sm flex flex-col gap-3.5 animate-in fade-in duration-150">
                    {/* Language Switcher Bar: 4 Languages ONLY */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-indigo-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Sparkles className="w-4 h-4 text-amber-300" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>AI Homework Summary & Explanation</span>
                            <span className="text-[10px] font-normal text-slate-500">(गृहपाठ सारांश व स्पष्टीकरण)</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Plain explanation of the message, notice & attached worksheet in your language
                          </p>
                        </div>
                      </div>

                      {/* 4 Languages Only: English, Hindi, Marathi, Gujarati */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-[10px] font-bold text-indigo-800 flex items-center gap-1 mr-1 shrink-0">
                          <Languages className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Translate:</span>
                        </span>
                        {AI_LANGUAGES.map(l => {
                          const isSelected = activeLang === l.code;
                          return (
                            <button
                              key={l.code}
                              type="button"
                              onClick={() => handleToggleAiExplanation(hw, l.code)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-white hover:bg-indigo-50 text-slate-700 border border-slate-200'
                              }`}
                              title={`Translate to ${l.sublabel || l.label}`}
                            >
                              <span>{l.flag} {l.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Content Body */}
                    {isLoadingThisAi ? (
                      <div className="py-6 flex flex-col items-center justify-center gap-2 text-indigo-600">
                        <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                        <p className="text-xs font-semibold text-slate-600">
                          Translating explanation to {AI_LANGUAGES.find(l => l.code === activeLang)?.label || 'selected language'}...
                        </p>
                      </div>
                    ) : currentAiData ? (
                      <div className="flex flex-col gap-3 text-xs leading-relaxed">
                        {/* Main Clear Explanation & Summary */}
                        <div className="bg-white/95 p-3.5 rounded-2xl border border-indigo-100 shadow-2xs">
                          <p className="text-[11px] font-extrabold text-indigo-900 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>What this homework & worksheet covers:</span>
                          </p>
                          <p className="text-slate-800 font-medium text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                            {currentAiData.explanation || currentAiData.summary}
                          </p>
                        </div>

                        {/* Key Details at a Glance */}
                        {(currentAiData.keyPoints || currentAiData.topic || currentAiData.task) && (
                          <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 flex flex-col gap-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Summary Details:
                            </p>
                            {Array.isArray(currentAiData.keyPoints) && currentAiData.keyPoints.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {currentAiData.keyPoints.map((pt, pIdx) => (
                                  <div key={pIdx} className="text-xs font-semibold text-slate-700">
                                    {pt}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {currentAiData.topic && (
                                  <div><strong className="text-slate-900">Topic:</strong> {currentAiData.topic}</div>
                                )}
                                {currentAiData.task && (
                                  <div><strong className="text-slate-900">Task:</strong> {currentAiData.task}</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* 7. Bottom Row: Posted Date (Left) & Due Date Pill (Right) - Exactly Matching Teacher View */}
                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                  {/* Left: Posted Date with Clock */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Posted {hw.postedAt}</span>
                  </div>

                  {/* Right: Due Date with Calendar Icon in Amber/Rose Pill Badge */}
                  {hw.hasDeadline && hw.deadlineDate && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                      isOverdue
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : isDueToday
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                          : 'bg-amber-50/80 text-amber-900 border border-amber-200/90'
                    }`}>
                      <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {isOverdue
                          ? `Due: ${hw.deadlineDate}`
                          : isDueToday
                            ? 'Due Today'
                            : `Due: ${hw.deadlineDate}`}
                      </span>
                    </div>
                  )}
                </div>

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
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${selectedDateStatus === 'P' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                        {selectedDateStatus === 'P' ? 'Present' : 'Absent'}
                      </span>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => setHistoryFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${historyFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      All ({attendanceStats.totalDays})
                    </button>
                    <button
                      onClick={() => setHistoryFilter('present')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${historyFilter === 'present' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Present ({attendanceStats.presentDays})
                    </button>
                    <button
                      onClick={() => setHistoryFilter('absent')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${historyFilter === 'absent' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
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
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${selectedDate === row.dateStr
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100/60'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${row.status === 'P' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
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

                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${row.status === 'P' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
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
          MOBILE & DESKTOP PDF VIEWER MODAL WITH PINCH-TO-ZOOM
      ========================================================================= */}
          {selectedPdf && (
            <div 
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
              onClick={() => setSelectedPdf(null)}
            >
              <div 
                className="bg-white w-full max-w-4xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with Title + Zoom Controls + Actions */}
                <div className="p-3 sm:p-4 px-4 sm:px-6 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                        {selectedPdf.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 hidden sm:block">Worksheet Document</p>
                    </div>
                  </div>

                  {/* Zoom Controls + Actions */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Zoom In/Out controls */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setPdfZoom(z => Math.max(0.6, Number((z - 0.2).toFixed(1))))}
                        className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfZoom(1)}
                        className="px-1.5 text-[11px] font-bold text-slate-700 hover:text-indigo-600 cursor-pointer"
                        title="Reset Zoom to 100%"
                      >
                        {Math.round(pdfZoom * 100)}%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfZoom(z => Math.min(2.5, Number((z + 0.2).toFixed(1))))}
                        className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {pdfBlobUrl && (
                      <a
                        href={pdfBlobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 bg-white text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        title="Open in native mobile PDF viewer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Open in Tab</span>
                      </a>
                    )}

                    <a
                      href={pdfBlobUrl || selectedPdf.url}
                      download={selectedPdf.name || 'Worksheet.pdf'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </a>

                    <button
                      onClick={() => setSelectedPdf(null)}
                      className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors ml-0.5 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Touch Pinch-to-Zoom & Pan Viewport */}
                <div 
                  className="flex-1 w-full bg-slate-100 p-2 sm:p-4 overflow-auto relative flex items-center justify-center touch-pan-x touch-pan-y"
                  onTouchStart={(e) => handleTouchStart(e, pdfZoom)}
                  onTouchMove={(e) => handleTouchMove(e, setPdfZoom)}
                  onTouchEnd={handleTouchEnd}
                  onDoubleClick={() => handleDoubleTap(setPdfZoom, pdfZoom)}
                >
                  <div 
                    style={{ 
                      transform: `scale(${pdfZoom})`, 
                      transformOrigin: 'top center',
                      transition: touchStartDistRef.current ? 'none' : 'transform 0.15s ease-out' 
                    }}
                    className="w-full h-full min-h-[55vh] flex flex-col items-center justify-center"
                  >
                    {pdfBlobUrl ? (
                      <object
                        data={pdfBlobUrl}
                        type="application/pdf"
                        className="w-full h-full min-h-[55vh] rounded-2xl bg-white border border-slate-200 shadow-sm"
                      >
                        <iframe
                          src={pdfBlobUrl}
                          title={selectedPdf.name}
                          className="w-full h-full min-h-[55vh] rounded-2xl bg-white"
                        />
                        {/* Mobile Fallback View if embedded browser PDF plugin is blocked */}
                        <div className="flex flex-col items-center justify-center p-6 text-center bg-white rounded-2xl h-full w-full">
                          <FileText className="w-12 h-12 text-rose-500 mb-2" />
                          <h4 className="text-sm font-bold text-slate-800 mb-1">{selectedPdf.name}</h4>
                          <p className="text-xs text-slate-500 mb-4 max-w-xs">
                            Pinch or tap below to open in your phone's full-screen native PDF viewer.
                          </p>
                          <div className="flex items-center gap-2">
                            <a
                              href={pdfBlobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open PDF in Fullscreen</span>
                            </a>
                            <a
                              href={pdfBlobUrl}
                              download={selectedPdf.name}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          </div>
                        </div>
                      </object>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-500">
                        Loading worksheet document...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
          FULL-SCREEN IMAGE LIGHTBOX MODAL WITH MOBILE PINCH-TO-ZOOM
      ========================================================================= */}
          {selectedImage && (
            <div 
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-150"
              onClick={() => setSelectedImage(null)}
            >
              <div 
                className="relative max-w-4xl max-h-[92vh] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Floating Mobile & Desktop Zoom Bar */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1.5 px-2.5 rounded-2xl border border-white/15 text-white shadow-xl">
                  <button
                    type="button"
                    onClick={() => setImageZoom(z => Math.max(0.6, Number((z - 0.2).toFixed(1))))}
                    className="w-7 h-7 rounded-xl hover:bg-white/20 flex items-center justify-center cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageZoom(1)}
                    className="px-2 text-xs font-bold hover:bg-white/20 rounded-xl h-7 flex items-center cursor-pointer"
                    title="Double-tap image or click to reset to 100%"
                  >
                    {Math.round(imageZoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageZoom(z => Math.min(3, Number((z + 0.2).toFixed(1))))}
                    className="w-7 h-7 rounded-xl hover:bg-white/20 flex items-center justify-center cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <a
                    href={selectedImage}
                    download="Worksheet_Photo.jpg"
                    className="w-7 h-7 rounded-xl hover:bg-white/20 flex items-center justify-center cursor-pointer text-white"
                    title="Download Photo"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="w-7 h-7 rounded-xl hover:bg-rose-600 flex items-center justify-center cursor-pointer ml-1 text-white"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Touch Pinch-to-zoom container */}
                <div 
                  className="overflow-auto max-h-[85vh] max-w-[92vw] p-2 flex items-center justify-center touch-pan-x touch-pan-y"
                  onTouchStart={(e) => handleTouchStart(e, imageZoom)}
                  onTouchMove={(e) => handleTouchMove(e, setImageZoom)}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => handleDoubleTap(setImageZoom, imageZoom)}
                >
                  <img
                    src={selectedImage}
                    alt="Homework Attachment"
                    style={{ 
                      transform: `scale(${imageZoom})`, 
                      transformOrigin: 'center center',
                      transition: touchStartDistRef.current ? 'none' : 'transform 0.15s ease-out' 
                    }}
                    className="rounded-2xl max-w-full max-h-[80vh] object-contain shadow-2xl select-none"
                  />
                </div>

                {/* Mobile touch hint pill */}
                <p className="text-[11px] text-white/60 mt-2 font-medium bg-black/40 px-3 py-1 rounded-full sm:hidden">
                  💡 Pinch with 2 fingers or double-tap to zoom
                </p>
              </div>
            </div>
          )}
          </div>
      );
}
