'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  Clock, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  X, 
  Trash2, 
  Send, 
  ExternalLink, 
  Sparkles,
  Lock,
  CheckCircle2
} from 'lucide-react';

export default function HomeworkSection({ currentUser, showToast }) {
  // Sample initial homework/notice records
  const [homeworkList, setHomeworkList] = useState([
    {
      id: 'hw_1',
      subject: 'Mathematics',
      teacherName: 'Mrs. Priya Sharma',
      message: 'Complete Exercise 4.2 (Questions 1 to 8) on Linear Equations in your class notebook.',
      link: 'https://myschool.edu/resources/maths-ch4',
      imageUrl: null,
      postedAt: '12 Nov 2026, 09:30 AM',
      hasDeadline: true,
      deadlineDate: '2026-11-14'
    },
    {
      id: 'hw_2',
      subject: 'Science',
      teacherName: 'Mr. Rajesh Patel',
      message: 'Read Chapter 6 on Cellular Structure and draw the labeled plant cell diagram.',
      link: '',
      imageUrl: null,
      postedAt: '11 Nov 2026, 02:15 PM',
      hasDeadline: true,
      deadlineDate: '2026-11-15'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState(() => {
    if (currentUser?.role === 'subject_teacher') return currentUser.subject || 'Science';
    return 'Mathematics';
  });
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });

  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'General Notice'];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setImagePreview(evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateHomework = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast('⚠️ Please write a homework message or instructions');
      return;
    }

    const now = new Date();
    const formattedTime = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + 
      ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newPost = {
      id: `hw_${Date.now()}`,
      subject: currentUser?.role === 'subject_teacher' ? currentUser.subject : subject,
      teacherName: currentUser?.name || 'Class Teacher',
      message: message.trim(),
      link: link.trim(),
      imageUrl: imagePreview,
      postedAt: formattedTime,
      hasDeadline,
      deadlineDate: hasDeadline ? deadlineDate : null
    };

    setHomeworkList([newPost, ...homeworkList]);
    showToast('📢 Homework & notice posted to Class 8-A!');
    
    // Reset form
    setMessage('');
    setLink('');
    setImagePreview(null);
    setHasDeadline(false);
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    setHomeworkList(prev => prev.filter(hw => hw.id !== id));
    showToast('Post removed');
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Class Homework & Notice Board</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Parent Center
              </span>
            </div>
            <p className="text-xs text-slate-400">Post daily homework, worksheets, photos, and links for parents & students</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post Homework / Notice</span>
        </button>
      </div>

      {/* Homework Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {homeworkList.map((hw) => (
          <div 
            key={hw.id}
            className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between gap-3 hover:border-indigo-200 transition-all"
          >
            <div className="flex flex-col gap-2">
              {/* Card Meta Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    {hw.subject}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    By {hw.teacherName}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(hw.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete post"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Message */}
              <p className="text-xs text-slate-800 font-medium leading-relaxed mt-1">
                {hw.message}
              </p>

              {/* Attached Image Preview if available */}
              {hw.imageUrl && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-36 flex items-center justify-center">
                  <img src={hw.imageUrl} alt="Homework Attachment" className="object-cover w-full max-h-36" />
                </div>
              )}

              {/* Resource Link if available */}
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
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400">
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
        ))}
      </div>

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
                  <p className="text-xs text-slate-400">For Class 8-A parents and students</p>
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
                  placeholder="e.g. Read Chapter 4 and solve exercises 1 to 5. Bring completed work on Monday."
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

              {/* Optional Worksheet / Image Upload */}
              <div>
                <label className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Attach Photo / Worksheet (Optional)</span>
                </label>
                
                {imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-36 bg-slate-900 flex items-center justify-center">
                    <img src={imagePreview} alt="Worksheet" className="object-contain max-h-36 w-full" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/60 cursor-pointer text-slate-600 transition-colors">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold">Click to upload worksheet image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
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

    </div>
  );
}
