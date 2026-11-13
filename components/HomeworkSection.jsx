'use client';

import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';

const STORAGE_KEY = 'myschool_homework_posts';

const INITIAL_DEFAULT_POSTS = [
  {
    id: 'hw_1',
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
  showToast, 
  isFullPage = false,
  onNavigateToHomework 
}) {
  const [homeworkList, setHomeworkList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // For Image Lightbox
  const [selectedPdf, setSelectedPdf] = useState(null); // For PDF Viewer Modal { url, name }
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
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
  const [attachedFile, setAttachedFile] = useState(null); // { type: 'image' | 'pdf', name: '', size: '', url: '' }
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });

  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'General Notice'];

  // Load from persistent localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHomeworkList(parsed);
          return;
        }
      }
      setHomeworkList(INITIAL_DEFAULT_POSTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_POSTS));
    } catch (e) {
      console.warn('LocalStorage read error:', e);
      setHomeworkList(INITIAL_DEFAULT_POSTS);
    }
  }, []);

  // Save to localStorage
  const savePosts = (newList) => {
    setHomeworkList(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (limit to 6MB for smooth browser storage)
    if (file.size > 6 * 1024 * 1024) {
      showToast?.('⚠️ Please choose a file smaller than 6MB');
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const reader = new FileReader();

    reader.onload = (evt) => {
      setAttachedFile({
        type: isPdf ? 'pdf' : 'image',
        name: file.name,
        size: formatFileSize(file.size),
        url: evt.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCreateHomework = (e) => {
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
      subject: currentUser?.role === 'subject_teacher' ? currentUser.subject : subject,
      teacherName: currentUser?.name || 'Class Teacher',
      teacherRole: currentUser?.role || 'class_teacher',
      message: message.trim(),
      link: link.trim(),
      attachment: attachedFile,
      imageUrl: attachedFile?.type === 'image' ? attachedFile.url : null,
      postedAt: formattedTime,
      hasDeadline,
      deadlineDate: hasDeadline ? deadlineDate : null
    };

    const updated = [newPost, ...homeworkList];
    savePosts(updated);
    showToast?.('📢 Homework & notice posted successfully!');
    
    // Reset form
    setMessage('');
    setLink('');
    setAttachedFile(null);
    setHasDeadline(false);
    setIsModalOpen(false);
  };

  const handleDelete = (id, postTeacherName) => {
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
    }
  };

  // Filtered List
  const filteredList = homeworkList.filter(hw => {
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-600">Total Posted</p>
                <p className="text-xl font-black text-indigo-950 mt-0.5">{totalPosts}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-700">With Deadlines</p>
                <p className="text-xl font-black text-amber-950 mt-0.5">{activeDeadlines}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white text-amber-600 flex items-center justify-center shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-rose-700">PDFs & Photos</p>
                <p className="text-xl font-black text-rose-950 mt-0.5">{withAttachments}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white text-rose-600 flex items-center justify-center shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
            </div>
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
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
              >
                <option value="All">All Subjects</option>
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={deadlineFilter}
                onChange={(e) => setDeadlineFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
              >
                <option value="all">All Dates</option>
                <option value="active">Has Deadline</option>
                <option value="none">No Deadline</option>
              </select>
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
            // Determine attachment (support both new attachment object and legacy imageUrl)
            const attachment = hw.attachment || (hw.imageUrl ? {
              type: hw.imageUrl.startsWith('data:application/pdf') ? 'pdf' : 'image',
              name: 'Worksheet File',
              size: '',
              url: hw.imageUrl
            } : null);

            const isPdf = attachment?.type === 'pdf' || attachment?.name?.toLowerCase().endsWith('.pdf') || attachment?.url?.startsWith('data:application/pdf');

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

                  {/* Attached PDF Document Card */}
                  {attachment && isPdf && (
                    <div className="mt-1 p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {attachment.name || 'Worksheet_Assignment.pdf'}
                          </p>
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded">
                            {attachment.size || 'PDF Document'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {attachment.url && (
                          <button
                            type="button"
                            onClick={() => setSelectedPdf({ url: attachment.url, name: attachment.name || 'Worksheet.pdf' })}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-100/60 border border-rose-200 text-rose-800 font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        )}

                        {attachment.url && (
                          <a
                            href={attachment.url}
                            download={attachment.name || 'Worksheet.pdf'}
                            className="p-1.5 rounded-xl bg-white hover:bg-rose-100/60 border border-rose-200 text-rose-800 shadow-xs transition-all"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Attached Worksheet Photo (Interactive Lightbox Viewer) */}
                  {attachment && !isPdf && attachment.url && (
                    <div 
                      onClick={() => {
                        setSelectedImage(attachment.url);
                        setImageZoom(1);
                      }}
                      className="relative mt-1 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 max-h-40 flex items-center justify-center cursor-pointer group/img"
                      title="Click to view full image"
                    >
                      <img 
                        src={attachment.url} 
                        alt="Worksheet Attachment" 
                        className="object-cover w-full max-h-40 group-hover/img:scale-105 transition-transform duration-200" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                        <Maximize2 className="w-4 h-4" />
                        <span>Click to Enlarge</span>
                      </div>
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
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {subjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
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

              {/* Optional Photo or PDF Worksheet Upload */}
              <div>
                <label className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Attach Worksheet (Photo or PDF Document)</span>
                </label>
                
                {attachedFile ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 p-3 bg-slate-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        attachedFile.type === 'pdf' ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'
                      }`}>
                        {attachedFile.type === 'pdf' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{attachedFile.name}</p>
                        <p className="text-[10px] text-slate-400">{attachedFile.size} • {attachedFile.type.toUpperCase()}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/60 cursor-pointer text-slate-600 transition-colors">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold">Click to upload Worksheet Photo or PDF</span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
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

          {/* Full Image Display Container */}
          <div 
            className="relative max-w-4xl max-h-[82vh] overflow-auto flex items-center justify-center p-2 rounded-2xl bg-black/40 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Full Worksheet"
              style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center center' }}
              className="max-h-[78vh] max-w-full object-contain rounded-lg transition-transform duration-150"
            />
          </div>

          <p className="text-[11px] text-slate-400 mt-2">
            Click anywhere outside the picture or press &times; to exit viewer.
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
                  <span className="hidden sm:inline">Open in New Tab</span>
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

            {/* Embedded Native PDF Viewer with Fallback */}
            <div className="flex-1 w-full bg-slate-100 p-2 sm:p-4 min-h-[60vh] max-h-[78vh] flex flex-col items-center justify-center">
              {pdfBlobUrl ? (
                <object
                  data={pdfBlobUrl}
                  type="application/pdf"
                  className="w-full h-full min-h-[60vh] rounded-xl border border-slate-200 bg-white"
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
      )}

    </div>
  );
}
