'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  UserCheck, 
  XCircle, 
  CheckCircle2, 
  Download, 
  Camera, 
  Mail, 
  Search, 
  Sparkles,
  ChevronDown,
  Clock,
  FileSpreadsheet
} from 'lucide-react';

export default function AttendanceTab({
  students,
  onToggleAttendance,
  onOpenScanModal,
  onOpenExportModal,
  onOpenEmailSingle,
  onOpenEmailAll,
  currentUser
}) {
  const [selectedDay, setSelectedDay] = useState('we');
  const [searchQuery, setSearchQuery] = useState('');

  const daysOfWeek = [
    { key: 'su', label: 'Su', date: '08' },
    { key: 'mo', label: 'Mo', date: '09' },
    { key: 'tu', label: 'Tu', date: '10' },
    { key: 'we', label: 'We', date: '11' },
    { key: 'th', label: 'Th', date: '12' },
    { key: 'fr', label: 'Fr', date: '13' },
    { key: 'sa', label: 'Sa', date: '14' },
  ];

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNo.includes(searchQuery)
  );

  const total = students.length;
  const presentCount = students.filter(s => s.attendance === 'P').length;
  const absentCount = students.filter(s => s.attendance === 'A').length;
  const rate = total > 0 ? ((presentCount / total) * 100).toFixed(0) : 0;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Daily Attendance Register</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentUser?.classTeacherOf || 'Class 8-A'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Track daily presence, scan paper rolls, and export official records</p>
        </div>

        {/* Action Buttons: Scan, Export (3 Options), Notify */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* AI Scan Paper Attendance */}
          <button
            onClick={() => onOpenScanModal('attendance')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs border border-indigo-200/70 transition-all"
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>AI Scan Register</span>
          </button>

          {/* THE REQUESTED 3-OPTION ATTENDANCE DOWNLOAD BUTTON */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Download Weekly, Monthly, or Custom Date Attendance List"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Download Attendance List</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-extrabold">3 Options</span>
          </button>

          {/* Alert Absent Parents */}
          <button
            onClick={() => onOpenEmailAll('attendance')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200/70 transition-all"
          >
            <Mail className="w-4 h-4 text-rose-600" />
            <span>Alert Absentees ({absentCount})</span>
          </button>
        </div>
      </div>

      {/* Week Calendar Row & Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Day Picker */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Week</span>
            <span className="text-xs font-semibold text-indigo-600">November 2026</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((d) => {
              const isSelected = selectedDay === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => setSelectedDay(d.key)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-bold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <span className="text-[11px] opacity-80">{d.label}</span>
                  <span className="text-base font-black mt-0.5">{d.date}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Attendance Counter */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Presence</span>
          
          <div className="grid grid-cols-2 gap-3">
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
            <span>Class Attendance Rate:</span>
            <span className="font-bold text-indigo-600">{rate}%</span>
          </div>
        </div>

      </div>

      {/* Roster & Quick Toggle Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Search & Title */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800">Student Roll Call</h3>
            <span className="text-xs font-semibold text-slate-400">({filteredStudents.length} Students)</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search by name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Student Rows */}
        <div className="divide-y divide-slate-100">
          {filteredStudents.map((st) => {
            const isPresent = st.attendance === 'P';
            return (
              <div 
                key={st.rollNo}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs font-mono">
                    #{st.rollNo}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{st.name}</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {st.parentEmail || st.parentPhone || 'Parent details available'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {!isPresent && (
                    <button
                      onClick={() => onOpenEmailSingle(st, 'attendance')}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-600 transition-colors"
                      title="Send Absence Email to Parent"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Notify Parent</span>
                    </button>
                  )}

                  {/* Toggle Attendance Button */}
                  <button
                    onClick={() => onToggleAttendance(st.rollNo)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm ${
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

