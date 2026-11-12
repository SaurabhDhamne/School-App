'use client';

import React from 'react';
import { X, Mail, Phone, Share2, Award, BookOpen, GraduationCap } from 'lucide-react';

export default function StudentDetailModal({
  isOpen,
  onClose,
  student,
  subjects,
  onOpenEmailModal,
  getGrade,
  calculateTotal,
  calculatePercentage
}) {
  if (!isOpen || !student) return null;

  const total = calculateTotal(student.marks);
  const percentage = calculatePercentage(student.marks);
  const gradeInfo = getGrade(percentage);

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello! Sharing academic report for ${student.name} (Roll No: ${student.rollNo}). Total Marks: ${total}/125 (${percentage}%, Grade: ${gradeInfo.grade}).`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-indigo-100">
              {student.rollNo}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
              <p className="text-xs text-slate-400">Roll No: {student.rollNo} • Class 8-A</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <p className="text-[11px] font-semibold text-slate-400">Total Score</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{total} <span className="text-xs font-medium text-slate-400">/ 125</span></p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <p className="text-[11px] font-semibold text-slate-400">Percentage</p>
            <p className="text-lg font-black text-indigo-600 mt-0.5">{percentage}%</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <p className="text-[11px] font-semibold text-slate-400">Performance</p>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mt-1 ${gradeInfo.color}`}>
              {gradeInfo.grade}
            </span>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject Performance (Unit Test 1)</h4>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
            {subjects.filter(s => s.key !== 'all').map(sub => {
              const score = student.marks?.[sub.key] ?? 0;
              const subPct = ((score / 25) * 100).toFixed(0);
              return (
                <div key={sub.key} className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <span className="text-xs font-semibold text-slate-700 capitalize">{sub.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                      <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${subPct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono w-14 text-right">
                      {score} / 25
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Parent Communication Details */}
        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex flex-col gap-2">
          <p className="text-xs font-bold text-indigo-950">Parent Contact Details</p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              {student.parentEmail || 'Not provided'}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              {student.parentPhone || 'Not provided'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => { onClose(); onOpenEmailModal(student, 'marksheet'); }}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all"
          >
            <Mail className="w-4 h-4" />
            <span>Email Report Card</span>
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-100 flex items-center justify-center gap-2 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
}

