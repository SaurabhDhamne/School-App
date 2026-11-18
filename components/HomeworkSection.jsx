'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getPdfBlobUrl } from '@/lib/pdfUtils';
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  Clock, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  FileText,
  File,
  Eye,
  X, 
  Trash2, 
  Send, 
  ExternalLink, 
  Maximize2,
  ZoomIn,
  ZoomOut,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Upload
} from 'lucide-react';

const STORAGE_KEY = 'myschool_homework_posts';

const INITIAL_DEFAULT_POSTS = [
  {
    id: 'hw_1',
    className: 'Class 8-A',
    subject: 'Mathematics',
    teacherName: 'Mrs. Priya Sharma',
    teacherRole: 'class_teacher',
    message: 'Complete Exercise 4.2 (Questions 1 to 8) on Linear Equations. Refer to the attached PDF worksheet for extra practice.',
    link: 'https://myschool.edu/resources/maths-ch4',
    attachment: {
      type: 'pdf',
      name: 'Class8_Maths_LinearEquations_Practice.pdf',
      size: '245 KB',
      url: null
    },
    imageUrl: null,
    postedAt: '12 Nov 2026, 09:30 AM',
    hasDeadline: true,
    deadlineDate: '2026-11-14'
  },
  {
    id: 'hw_2',
    className: 'Class 8-A',
    subject: 'Science',
    teacherName: 'Mr. Rajesh Patel',
    teacherRole: 'subject_teacher',
    message: 'Read Chapter 6 on Cellular Structure and draw the labeled plant cell diagram in your homework sheet.',
    link: '',
    attachment: null,
    imageUrl: null,
    postedAt: '11 Nov 2026, 02:15 PM',
    hasDeadline: true,
    deadlineDate: '2026-11-15'
  }
];

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function HomeworkSection({ 
  currentUser, 
  selectedClass = 'Class 8-A',
  showToast, 
  isFullPage = false,
  onNavigateToHomework 
}) {
  const [homeworkList, setHomeworkList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // For Image Lightbox
  const [selectedPdf, setSelectedPdf] = useState(null); // For PDF Viewer Modal { url, name }
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfZoom, setPdfZoom] = useState(1);
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
      setZoom(Math.min(3, Math.max(0.6, Number((startZoomRef.current * scale).toFixed(2)))));
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
          try { URL.revokeObjectURL(bUrl); } catch (e) {}
        }
      };
    } else {
      setPdfBlobUrl(null);
    }
  }, [selectedPdf]);

  // Back button / Escape key dismissal for PDF & Image modals
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  const [deadlineFilter, setDeadlineFilter] = useState('all'); // 'all', 'active', 'none'

  // Form State
  const [subject, setSubject] = useState(() => {
    if (currentUser?.role === 'subject_teacher') return currentUser.subject || 'Science';
    return 'Mathematics';
  });
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]); // Array of up to 5 files: { type: 'image' | 'pdf', name: '', size: '', url: '' }
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });

  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'General Notice'];

  // Load from persistent backend API (Supabase as authoritative truth, localStorage as instant cache)
  const fetchHomework = async () => {
    // 1. Instant cache load from localStorage on cold start
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHomeworkList(parsed);
        }
      }
    } catch (e) {}

    // 2. Fresh live sync from server API (authoritative source of truth)
    try {
      const cls = selectedClass || 'Class 8-A';
      const res = await fetch(`/api/homework?className=${encodeURIComponent(cls)}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setHomeworkList(json.data);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Homework API fetch error:', err);
    }
  };

  useEffect(() => {
    fetchHomework();

    // Standard pattern: Auto-sync on tab return / window focus (throttled to 15s)
    let lastFetch = Date.now();
    const handleFocus = () => {
      if (Date.now() - lastFetch > 15000) {
        lastFetch = Date.now();
        fetchHomework();
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
      fetchHomework();
    }, 300000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [selectedClass]);

  // Save to both state and backend API
  const savePosts = async (newList) => {
    setHomeworkList(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  // Upload handler supporting multiple files (capped to 5 total, max 30MB each)
  const handleFileUpload = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (!rawFiles.length) return;

    if (attachedFiles.length + rawFiles.length > 5) {
      showToast?.(`⚠️ Maximum 5 files/photos allowed per post (you currently have ${attachedFiles.length}).`);
      e.target.value = '';
      return;
    }

    const maxBytes = 30 * 1024 * 1024; // 30 MB per file limit
    const oversized = rawFiles.find(f => f.size > maxBytes);
    if (oversized) {
      showToast?.(`⚠️ "${oversized.name}" exceeds the 30MB size limit. Max 30MB per file.`);
      e.target.value = '';
      return;
    }

    setIsUploadingFile(true);
    const newAttachments = [];

    for (const file of rawFiles) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/homework/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.success && data.url) {
          newAttachments.push({
            type: data.type || (isPdf ? 'pdf' : 'image'),
            name: data.name || file.name,
            size: data.size || formatFileSize(file.size),
            url: data.url
          });
        } else {
          throw new Error('Upload failed');
        }
      } catch (err) {
        // Fallback to local Data URI if server bucket is unreachable
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            newAttachments.push({
              type: isPdf ? 'pdf' : 'image',
              name: file.name,
              size: formatFileSize(file.size),
              url: evt.target.result
            });
            resolve();
          };
          reader.onerror = resolve;
          reader.readAsDataURL(file);
        });
      }
    }

    setAttachedFiles(prev => [...prev, ...newAttachments].slice(0, 5));
    showToast?.(`📎 Attached ${newAttachments.length} file${newAttachments.length > 1 ? 's' : ''}!`);
    setIsUploadingFile(false);
    e.target.value = '';
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setAttachedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCreateHomework = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast?.('⚠️ Please write a homework message or instructions');
      return;
    }

    const now = new Date();
    const formattedTime = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + 
      ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newPost = {
      id: `hw_${Date.now()}`,
      className: selectedClass || 'Class 8-A',
      subject: currentUser?.role === 'subject_teacher' ? currentUser.subject : subject,
      teacherName: currentUser?.name || 'Class Teacher',
      teacherRole: currentUser?.role || 'class_teacher',
      message: message.trim(),
      link: link.trim(),
      attachments: attachedFiles,
      attachment: attachedFiles[0] || null,
      imageUrl: attachedFiles.find(f => f.type === 'image')?.url || null,
      postedAt: formattedTime,
      hasDeadline,
      deadlineDate: hasDeadline ? deadlineDate : null
    };

    // Optimistic update
    const updated = [newPost, ...homeworkList.filter(h => h.id !== newPost.id)];
    savePosts(updated);
    showToast?.('📢 Homework & notice posted successfully!');
    
    // Reset form & close modal immediately
    setMessage('');
    setLink('');
    setAttachedFiles([]);
    setHasDeadline(false);
    setIsModalOpen(false);

    // Sync to backend database so phone and all parents receive it
    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', post: newPost })
      });
      const json = await res.json();
      if (json.success && json.post) {
        // Reconcile state and cache with confirmed server post
        setHomeworkList(prev => [json.post, ...prev.filter(h => h.id !== json.post.id && h.id !== newPost.id)]);
      }
    } catch (err) {
      console.warn('Backend homework sync error:', err);
    }
  };

  const handleDelete = async (id, postTeacherName) => {
    const isAdmin = currentUser?.role === 'admin';
    const isOwner = currentUser?.name === postTeacherName;
    const isClassTeacher = currentUser?.role === 'class_teacher';

    if (!isAdmin && !isOwner && !isClassTeacher) {
      showToast?.('🔒 You can only delete your own homework posts.');
      return;
    }

    if (confirm('Are you sure you want to delete this homework post?')) {
      const filtered = homeworkList.filter(hw => hw.id !== id);
      savePosts(filtered);
      showToast?.('🗑️ Homework post removed');

      try {
        await fetch('/api/homework', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id })
        });
      } catch (err) {
        console.warn('Backend homework delete error:', err);
      }
    }
  };

  // Filtered List for active class
  const filteredList = homeworkList.filter(hw => {
    // Class isolation: match this class or general all-classes announcements
    if (hw.className && hw.className !== 'All Classes' && hw.className !== selectedClass) {
      return false;
    }
    if (selectedSubjectFilter !== 'All' && hw.subject !== selectedSubjectFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = hw.message?.toLowerCase().includes(q);
      const matchSub = hw.subject?.toLowerCase().includes(q);
      const matchTeach = hw.teacherName?.toLowerCase().includes(q);
      if (!matchMsg && !matchSub && !matchTeach) return false;
    }
    if (deadlineFilter === 'active') return hw.hasDeadline;
    if (deadlineFilter === 'none') return !hw.hasDeadline;

    return true;
  });

  const totalPosts = homeworkList.length;
  const activeDeadlines = homeworkList.filter(h => h.hasDeadline).length;
  const withAttachments = homeworkList.filter(h => !!h.attachment || !!h.imageUrl).length;

  return (
    <div className={`flex flex-col gap-5 ${isFullPage ? 'max-w-7xl mx-auto px-4 sm:px-6 py-6' : 'bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm'}`}>
      
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-800">
                {isFullPage ? 'Class Homework & Parent Notice Hub' : 'Class Homework & Notice Board'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Photos & PDF Worksheets
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Post daily homework, worksheets (photos or PDF documents), and links. Visible across all teacher & parent views.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isFullPage && onNavigateToHomework && (
            <button
              onClick={onNavigateToHomework}
              className="px-3.5 py-2 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all"
            >
              Full Hub
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post Homework / Notice</span>
          </button>
        </div>
      </div>

      {/* Full Page Stats & Search Controls */}
      {isFullPage && (
        <>
          {/* Compact Homework Summary Bar (Clean & Space-Saving) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-100/90 text-indigo-900 text-xs font-bold">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>{totalPosts} Total Posted</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-100/90 text-amber-900 text-xs font-bold">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>{activeDeadlines} With Deadlines</span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 border border-rose-100/90 text-rose-900 text-xs font-bold">
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>{withAttachments} PDFs & Photos</span>
              </span>
            </div>

            <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
              Cloud Storage Synced &bull; {selectedClass}
            </span>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search homework by keyword, subject, or teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Subject:</span>
              <div className="relative flex items-center">
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="All">All Subjects</option>
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              </div>

              <div className="relative flex items-center">
                <select
                  value={deadlineFilter}
                  onChange={(e) => setDeadlineFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="all">All Dates</option>
                  <option value="active">Has Deadline</option>
                  <option value="none">No Deadline</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Homework Cards Grid */}
      {filteredList.length === 0 ? (
        <div className="text-center py-12 bg-slate-50/60 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
          <BookOpen className="w-8 h-8 text-slate-300" />
          <p className="text-xs font-bold text-slate-500">No homework or notices found</p>
          <p className="text-[11px] text-slate-400">Click &ldquo;Post Homework / Notice&rdquo; to share an update with the class.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((hw) => {
            // Support both new multi-attachment array and legacy single attachment/imageUrl
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

            return (
              <div 
                key={hw.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between gap-3 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col gap-2.5">
                  {/* Card Top: Subject & Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        hw.subject === 'Mathematics' ? 'bg-blue-100 text-blue-800' :
                        hw.subject === 'Science' ? 'bg-emerald-100 text-emerald-800' :
                        hw.subject === 'English' ? 'bg-purple-100 text-purple-800' :
                        hw.subject === 'Social Studies' ? 'bg-amber-100 text-amber-800' :
                        hw.subject === 'Hindi' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {hw.subject}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        By {hw.teacherName}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(hw.id, hw.teacherName)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-80 group-hover:opacity-100"
                      title="Delete homework post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Message Content */}
                  <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                    {hw.message}
                  </p>

                  {/* Attached PDF Worksheets (Support multiple) */}
                  {pdfFiles.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-0.5">
                      {pdfFiles.map((pdf, pIdx) => (
                        <div key={pIdx} className="p-2.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {pdf.name || `Worksheet_${pIdx + 1}.pdf`}
                              </p>
                              <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/70 px-1.5 py-0.2 rounded">
                                {pdf.size || 'PDF Document'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {pdf.url && (
                              <button
                                type="button"
                                onClick={() => setSelectedPdf({ url: pdf.url, name: pdf.name || 'Worksheet.pdf' })}
                                className="px-2 py-1 rounded-xl bg-white hover:bg-rose-100/60 border border-rose-200 text-rose-800 font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            )}

                            {pdf.url && (
                              <a
                                href={pdf.url}
                                download={pdf.name || 'Worksheet.pdf'}
                                className="p-1 rounded-xl bg-white hover:bg-rose-100/60 border border-rose-200 text-rose-800 shadow-xs transition-all"
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

                  {/* Attached Worksheet Photos (Single or Gallery Grid) */}
                  {imgFiles.length > 0 && (
                    <div className={`mt-1 ${imgFiles.length > 1 ? 'grid grid-cols-2 gap-1.5' : ''}`}>
                      {imgFiles.map((img, iIdx) => (
                        <div 
                          key={iIdx}
                          onClick={() => {
                            setSelectedImage(img.url);
                            setImageZoom(1);
                          }}
                          className={`relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center cursor-pointer group/img ${
                            imgFiles.length > 1 ? 'h-24' : 'max-h-40'
                          }`}
                          title="Click to view full photo"
                        >
                          <img 
                            src={img.url} 
                            alt={img.name || `Photo ${iIdx + 1}`} 
                            className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-200" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-[10px] font-bold">
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Enlarge</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Resource Link */}
                  {hw.link && (
                    <a 
                      href={hw.link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 mt-1 truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{hw.link}</span>
                    </a>
                  )}
                </div>

                {/* Bottom Timestamps & Deadline */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Posted {hw.postedAt}</span>
                  </span>

                  {hw.hasDeadline && hw.deadlineDate && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-600" />
                      <span>Due: {hw.deadlineDate}</span>
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: POST HOMEWORK & NOTICE                            */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Post Homework or Notice</h3>
                  <p className="text-xs text-slate-400">Attach photos or PDF worksheets for students</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHomework} className="flex flex-col gap-3.5 text-xs">
              
              {/* Subject Selection */}
              <div>
                <label className="font-semibold text-slate-700">Subject</label>
                {currentUser?.role === 'subject_teacher' ? (
                  <div className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-indigo-900 flex items-center justify-between">
                    <span>{currentUser.subject}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Assigned Subject</span>
                  </div>
                ) : (
                  <div className="relative mt-1">
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none pr-8 cursor-pointer"
                    >
                      {subjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Message / Task Description */}
              <div>
                <label className="font-semibold text-slate-700">Homework Instructions / Notice</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Read Chapter 4 and complete questions 1-8. Refer to the attached PDF worksheet."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full mt-1 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-medium"
                />
              </div>

              {/* Optional Resource Link */}
              <div>
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Resource Link (Optional)</span>
                </label>
                <input 
                  type="url"
                  placeholder="https://drive.google.com/... or educational video"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Optional Photo or PDF Worksheet Upload (Max 5 files, up to 30MB each) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Attach Worksheets & Photos</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    {attachedFiles.length}/5 files (Max 30MB each)
                  </span>
                </div>
                
                {/* List of Attached Files */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} className="rounded-2xl border border-slate-200 p-2.5 bg-slate-50 flex items-center justify-between gap-2.5 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            file.type === 'pdf' ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'
                          }`}>
                            {file.type === 'pdf' ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{file.size} • {file.type.toUpperCase()}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="p-1.5 rounded-lg hover:bg-rose-100/70 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove this file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Trigger (if under 5 limit) */}
                {attachedFiles.length < 5 ? (
                  isUploadingFile ? (
                    <div className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/70 text-indigo-700">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      <span className="text-xs font-bold">Uploading attachment to cloud storage...</span>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/60 cursor-pointer text-slate-600 transition-colors">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-semibold">
                        {attachedFiles.length === 0 
                          ? 'Click to upload Photos or PDF Worksheets (Max 5, up to 30MB each)' 
                          : `+ Add more files (${5 - attachedFiles.length} slots left)`}
                      </span>
                      <input 
                        type="file" 
                        multiple
                        accept="image/*,application/pdf" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>
                  )
                ) : (
                  <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-center">
                    ✓ Maximum 5 attachments added for this homework post.
                  </p>
                )}
              </div>

              {/* Optional Submission Deadline Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={hasDeadline}
                    onChange={(e) => setHasDeadline(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="font-bold text-slate-800">Set Submission Deadline (Optional)</span>
                </label>

                {hasDeadline && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium">Due Date:</span>
                    <input 
                      type="date"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish to Class</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* IMAGE LIGHTBOX MODAL: FULL RESOLUTION VIEW & ZOOM         */}
      {/* ======================================================== */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          {/* Lightbox Controls Header */}
          <div 
            className="w-full max-w-4xl flex items-center justify-between text-white pb-3 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold">Worksheet Image Viewer</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setImageZoom(z => Math.max(0.5, z - 0.25))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-[11px] font-mono text-slate-300 w-12 text-center">
                {Math.round(imageZoom * 100)}%
              </span>

              <button
                onClick={() => setImageZoom(z => Math.min(3, z + 0.25))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <a
                href={selectedImage}
                download="homework-worksheet.png"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-xs"
                title="Download Image"
              >
                <Download className="w-4 h-4" />
              </a>

              <button
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-rose-600 text-white ml-2 transition-colors"
                title="Close Viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Full Image Display Container with Touch Pinch & Zoom */}
          <div 
            className="relative max-w-4xl max-h-[82vh] overflow-auto flex items-center justify-center p-2 rounded-2xl bg-black/40 border border-white/10 touch-pan-x touch-pan-y"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => handleTouchStart(e, imageZoom)}
            onTouchMove={(e) => handleTouchMove(e, setImageZoom)}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={() => handleDoubleTap(setImageZoom, imageZoom)}
          >
            <img
              src={selectedImage}
              alt="Full Worksheet"
              style={{ 
                transform: `scale(${imageZoom})`, 
                transformOrigin: 'center center',
                transition: touchStartDistRef.current ? 'none' : 'transform 0.15s ease-out' 
              }}
              className="max-h-[78vh] max-w-full object-contain rounded-lg select-none"
            />
          </div>

          <p className="text-[11px] text-slate-400 mt-2">
            Pinch with 2 fingers to zoom • Click anywhere outside or press &times; to exit.
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* PDF VIEWER MODAL: IN-APP EMBEDDED PDF LIGHTBOX             */}
      {/* ======================================================== */}
      {selectedPdf && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedPdf(null)}
        >
          <div 
            className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{selectedPdf.name}</h4>
                  <p className="text-[10px] text-slate-400">Class 8-A PDF Worksheet Document</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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

                <button
                  type="button"
                  onClick={() => {
                    const target = pdfBlobUrl || selectedPdf.url;
                    if (target) window.open(target, '_blank');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                  title="Open in Full Browser PDF Viewer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in Tab</span>
                </button>

                <a
                  href={pdfBlobUrl || selectedPdf.url}
                  download={selectedPdf.name}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  title="Download PDF to Computer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                <button
                  onClick={() => setSelectedPdf(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors ml-1"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded Native PDF Viewer with Touch Pinch & Zoom */}
            <div 
              className="flex-1 w-full bg-slate-100 p-2 sm:p-4 min-h-[60vh] max-h-[78vh] overflow-auto flex flex-col items-center justify-center touch-pan-x touch-pan-y"
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
                className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center"
              >
                {pdfBlobUrl ? (
                  <object
                    data={pdfBlobUrl}
                    type="application/pdf"
                    className="w-full h-full min-h-[60vh] rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <iframe
                      src={pdfBlobUrl}
                      className="w-full h-full min-h-[60vh] rounded-xl border border-slate-200 bg-white"
                      title="PDF Worksheet Preview"
                    />
                  {/* Graceful Fallback if browser/device cannot display embedded PDF */}
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl h-full w-full">
                    <FileText className="w-14 h-14 text-rose-500 mb-3" />
                    <h4 className="text-sm font-bold text-slate-800 mb-1">{selectedPdf.name}</h4>
                    <p className="text-xs text-slate-500 mb-4 max-w-sm">
                      Inline PDF display is not supported on this browser or mobile device. Click below to view or download.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(pdfBlobUrl, '_blank')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in PDF Viewer</span>
                      </button>
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
                <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                  <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs font-medium">Preparing PDF preview...</p>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
