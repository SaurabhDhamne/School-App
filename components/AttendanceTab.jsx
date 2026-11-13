'use client';

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  UserCheck, 
  XCircle, 
  CheckCircle2, 
  Download, 
  Camera, 
  Mail, 
  Search, 
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';

export default function AttendanceTab({
  students,
  selectedDate,
  onChangeDate,
  attendanceHistory = {},
  onToggleAttendance,
  onOpenScanModal,
  onOpenExportModal,
  onOpenEmailSingle,
  onOpenEmailAll,
  currentUser
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const activeDate = selectedDate || todayStr;

  // Generate 7-day week strip centered around the selected date
  const getDaysOfWeek = (baseDateStr) => {
    const base = new Date(baseDateStr);
    const dayOfWeek = base.getDay(); // 0 is Sunday
    const sunday = new Date(base);
    sunday.setDate(base.getDate() - dayOfWeek);

    const days = [];
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      days.push({
        key: iso,
        label: dayNames[i],
        dayNum: d.getDate().toString().padStart(2, '0'),
        dateStr: iso,
        isToday: iso === todayStr
      });
    }
    return days;
  };

  const weekDays = getDaysOfWeek(activeDate);

  // Helper to step date forward or backward by N days
  const stepDate = (days) => {
    const d = new Date(activeDate);
    d.setDate(d.getDate() + days);
    onChangeDate?.(d.toISOString().split('T')[0]);
  };

  // Format active date for display header
  const formattedDateHeader = new Date(activeDate + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Filter students based on search query
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNo.includes(searchQuery)
  );

  // Helper to get status for any student strictly on the active date
  const getStudentStatus = (rollNo) => {
    if (attendanceHistory[activeDate] && attendanceHistory[activeDate][rollNo] !== undefined) {
      return attendanceHistory[activeDate][rollNo];
    }
    // Only fall back to student's initial attendance if activeDate IS today!
    if (activeDate === todayStr) {
      const st = students.find(s => s.rollNo === rollNo);
      return st?.attendance || 'P';
    }
    // For ANY other date with no saved record yet: Default is strictly 'P' (Present)!
    return 'P';
  };

  // Calculate statistics strictly for the ACTIVE SELECTED DATE
  const total = students.length;
  const presentCount = students.filter(s => getStudentStatus(s.rollNo) === 'P').length;
  const absentCount = total - presentCount;
  const rate = total > 0 ? ((presentCount / total) * 100).toFixed(0) : 0;

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Daily Attendance Register</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentUser?.classTeacherOf || 'Class 8-A'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Viewing records for <strong className="text-slate-700">{formattedDateHeader}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Scan Paper Attendance */}
          <button
            onClick={() => onOpenScanModal('attendance')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs border border-indigo-200/70 transition-all"
            title="Scan handwritten attendance register"
          >
            <Camera className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Scan Register</span>
          </button>

          {/* 3-Option Attendance Download Button */}
          <button
            onClick={onOpenExportModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all"
            title="Download Weekly, Monthly, or Custom Date Attendance List"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export Register</span>
          </button>

          {/* Alert Absent Parents for Selected Date */}
          <button
            onClick={() => onOpenEmailAll('attendance', activeDate)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200/70 transition-all"
          >
            <Mail className="w-3.5 h-3.5 text-rose-600" />
            <span>Alert Absentees ({absentCount})</span>
          </button>
        </div>
      </div>

      {/* Week Calendar Row & Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Interactive Calendar Strip */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
          
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">
                {new Date(activeDate + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </span>
              {activeDate === todayStr && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Today
                </span>
              )}
            </div>

            {/* Date Navigation & Calendar Picker */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => stepDate(-1)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {activeDate !== todayStr && (
                <button
                  onClick={() => onChangeDate?.(todayStr)}
                  className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold"
                >
                  Today
                </button>
              )}

              {/* Native HTML5 Calendar Picker Input */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={activeDate}
                  onChange={(e) => {
                    if (e.target.value) onChangeDate?.(e.target.value);
                  }}
                  className="px-2 py-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  title="Pick any date from calendar"
                />
              </div>

              <button
                onClick={() => stepDate(1)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 7-Day Week Buttons */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekDays.map((d) => {
              const isSelected = activeDate === d.dateStr;
              return (
                <button
                  key={d.key}
                  onClick={() => onChangeDate?.(d.dateStr)}
                  className={`flex flex-col items-center justify-center py-2 px-1 sm:p-2.5 rounded-2xl transition-all relative ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-bold'
                      : d.isToday
                        ? 'bg-indigo-50/70 border border-indigo-200 text-indigo-800 font-semibold hover:bg-indigo-100/70'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <span className="text-[10px] sm:text-[11px] opacity-80">{d.label}</span>
                  <span className="text-sm sm:text-base font-black mt-0.5">{d.dayNum}</span>
                  {d.isToday && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Dynamic Presence Counter for Selected Date */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Presence Summary</span>
            <span className="text-[11px] font-semibold text-indigo-600">{formattedDateHeader}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
              <p className="text-2xl font-black text-emerald-700">{presentCount}</p>
              <p className="text-[11px] font-bold text-emerald-600">Present</p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-center">
              <p className="text-2xl font-black text-rose-700">{absentCount}</p>
              <p className="text-[11px] font-bold text-rose-600">Absent</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold text-slate-500">
            <span>Daily Attendance Rate:</span>
            <span className="font-bold text-indigo-600">{rate}%</span>
          </div>
        </div>

      </div>

      {/* Roster & Quick Toggle Table (For Selected Date) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Search & Title */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800">Student Roll Call</h3>
            <span className="text-xs font-semibold text-slate-400">({filteredStudents.length} Students)</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Student Rows for Active Date */}
        <div className="divide-y divide-slate-100">
          {filteredStudents.map((st) => {
            const currentStatus = getStudentStatus(st.rollNo);
            const isPresent = currentStatus === 'P';

            return (
              <div 
                key={st.rollNo}
                className="p-3.5 sm:px-6 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                    #{st.rollNo}
                  </div>
                  <div className="truncate max-w-[150px] sm:max-w-none">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{st.name}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                      {st.parentEmail || st.parentPhone || 'Parent details available'}
                    </p>
                  </div>
                </div>

                {/* Right Actions: Notify Parent & Toggle for this date */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                  
                  {/* Notify Absent Parent Button */}
                  {!isPresent && (
                    <button
                      onClick={() => onOpenEmailSingle(st, 'attendance')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-[11px] font-bold text-amber-800 transition-colors"
                      title="Send Absence Email to Parent"
                    >
                      <Mail className="w-3.5 h-3.5 text-amber-600" />
                      <span className="hidden xs:inline">Notify</span>
                    </button>
                  )}

                  {/* Toggle Attendance for Active Date */}
                  <button
                    onClick={() => onToggleAttendance(st.rollNo, activeDate)}
                    className={`flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs transition-all shadow-sm ${
                      isPresent
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                        : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200'
                    }`}
                  >
                    {isPresent ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PRESENT</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ABSENT</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
