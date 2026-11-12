'use client';

import React from 'react';
import { 
  Users, 
  UserCheck, 
  Award, 
  TrendingUp, 
  Camera, 
  Calendar, 
  FileSpreadsheet, 
  Mail, 
  ChevronRight, 
  Sparkles,
  BarChart2
} from 'lucide-react';
import HomeworkSection from '@/components/HomeworkSection';

export default function DashboardTab({
  currentUser,
  students,
  onNavigate,
  onOpenScanModal,
  onOpenEmailAll,
  calculateTotal,
  calculatePercentage,
  getGrade,
  showToast
}) {
  const totalStudents = students.length;
  const presentCount = students.filter(s => s.attendance === 'P').length;
  const absentCount = students.filter(s => s.attendance === 'A').length;
  const attendanceRate = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(0) : 0;

  // Calculate overall class average
  const classAvg = totalStudents > 0 
    ? (students.reduce((acc, s) => acc + Number(calculatePercentage(s.marks)), 0) / totalStudents).toFixed(1)
    : 0;

  // Top performers
  const sortedStudents = [...students].sort((a, b) => {
    return Number(calculatePercentage(b.marks)) - Number(calculatePercentage(a.marks));
  });
  const topStudents = sortedStudents.slice(0, 3);
  const needHelpStudents = sortedStudents.filter(s => Number(calculatePercentage(s.marks)) < 60);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#171340] via-indigo-900 to-indigo-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-amber-300 w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Good morning, {currentUser?.name || 'Teacher'}!</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {currentUser?.classTeacherOf || 'Class 8-A'} Academic Overview
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/80 max-w-xl">
              Track attendance, review multi-subject unit test grades, and scan paper registers with AI vision.
            </p>
          </div>

          {/* Quick AI Scan Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenScanModal('marksheet')}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF8A00] to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera className="w-4 h-4" />
              <span>AI Scan Paper</span>
            </button>
          </div>
        </div>

        {/* Background glow circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">TOTAL STUDENTS</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-800">{totalStudents}</p>
          <span className="text-[11px] font-semibold text-slate-400">Enrolled in Class 8-A</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">PRESENT TODAY</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">{presentCount}</p>
            <span className="text-xs font-bold text-slate-400">({attendanceRate}%)</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">{absentCount} absentees today</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">CLASS AVERAGE</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-black text-indigo-600">{classAvg}%</p>
            <span className="text-xs font-bold text-emerald-600">Unit Test 1</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">5 core subjects combined</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">TOP PERFORMERS</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">
            {students.filter(s => Number(calculatePercentage(s.marks)) >= 90).length}
          </p>
          <span className="text-[11px] font-semibold text-slate-400">Scored A+ (&gt;90%)</span>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Attendance Action */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="group bg-white p-6 rounded-3xl border border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Daily Attendance Register</h3>
            <p className="text-xs text-slate-500 mt-1">1-tap roll call, absentee parent notifications, and download weekly/monthly attendance lists.</p>
          </div>
        </div>

        {/* Marksheet Action */}
        <div 
          onClick={() => onNavigate('marksheet')}
          className="group bg-white p-6 rounded-3xl border border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Gradebook & Marksheet</h3>
            <p className="text-xs text-slate-500 mt-1">Multi-subject marks entry, automatic grade rankings, and consolidated report cards.</p>
          </div>
        </div>

        {/* Parent Communication Action */}
        <div 
          onClick={() => onOpenEmailAll('marksheet')}
          className="group bg-white p-6 rounded-3xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Broadcast Parent Reports</h3>
            <p className="text-xs text-slate-500 mt-1">Instantly dispatch customized email report cards to all registered parents in one click.</p>
          </div>
        </div>

      </div>

      {/* NEW: CLASS HOMEWORK & NOTICE BOARD */}
      <HomeworkSection currentUser={currentUser} showToast={showToast} />

      {/* Bottom Insights: Top Students & Attention Needed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Performers */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Top Academic Performers</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">Class 8-A</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {topStudents.map((st, idx) => {
              const pct = calculatePercentage(st.marks);
              const gr = getGrade(pct);
              return (
                <div key={st.rollNo} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{st.name}</p>
                      <p className="text-[10px] text-slate-400">Roll No: {st.rollNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">{pct}%</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${gr.color}`}>
                      {gr.grade}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Students Needing Support */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Academic Follow-up Needed</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">&lt;60% Score</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {needHelpStudents.length > 0 ? (
              needHelpStudents.map((st) => {
                const pct = calculatePercentage(st.marks);
                const gr = getGrade(pct);
                return (
                  <div key={st.rollNo} className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-400">#{st.rollNo}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{st.name}</p>
                        <p className="text-[10px] text-slate-500">{st.parentEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-600">{pct}%</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${gr.color}`}>
                        {gr.grade}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 italic py-4 text-center">All students are scoring above 60%!</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
