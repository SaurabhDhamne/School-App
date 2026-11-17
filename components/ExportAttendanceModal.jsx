'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Download, 
  Calendar, 
  X, 
  FileSpreadsheet, 
  Check, 
  Clock, 
  Table2, 
  CheckCircle2,
  FileDown
} from 'lucide-react';
import { getHolidayInfo } from '@/lib/holidays';

export default function ExportAttendanceModal({ 
  isOpen, 
  onClose, 
  students = [], 
  selectedClass = 'Class 8-A',
  selectedDate, 
  attendanceHistory = {}, 
  customHolidays = [],
  onExportToast 
}) {
  const formatLocalDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const activeDate = selectedDate || todayStr;

  // Export Period Mode: 'weekly' | 'monthly' | 'custom'
  const [exportType, setExportType] = useState('weekly');

  // Weekly Mode Settings
  const [weekRefDate, setWeekRefDate] = useState(() => activeDate);
  const [weeklyDaysCount, setWeeklyDaysCount] = useState(6); // 5 for Mon-Fri, 6 for Mon-Sat

  // Monthly Mode Settings
  const [selectedMonth, setSelectedMonth] = useState(() => activeDate.slice(0, 7)); // 'YYYY-MM'
  const [monthlyWorkingDaysOnly, setMonthlyWorkingDaysOnly] = useState(true);

  // Custom Date Range Settings
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(activeDate + 'T00:00:00');
    d.setDate(d.getDate() - 14);
    return formatLocalDate(d);
  });
  const [endDate, setEndDate] = useState(() => activeDate);
  const [customWorkingDaysOnly, setCustomWorkingDaysOnly] = useState(true);

  if (!isOpen) return null;

  // Retrieve attendance status for a given student & date
  const getStatus = (rollNo, dateStr) => {
    // 1. Check persistent history for this exact date
    if (attendanceHistory[dateStr] && attendanceHistory[dateStr][rollNo] !== undefined) {
      return attendanceHistory[dateStr][rollNo];
    }
    // 2. If it's today's date, fallback to student live attendance card state
    if (dateStr === todayStr) {
      const live = students.find(s => s.rollNo === rollNo)?.attendance;
      if (live) return live;
    }
    // 3. Standard fallback: Present 'P'
    return 'P';
  };

  // Formats date into readable Excel header: e.g. "17-Nov (Tue)"
  const formatDateHeader = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
    const dayNum = String(d.getDate()).padStart(2, '0');
    const monthName = d.toLocaleDateString('en-GB', { month: 'short' });
    return `${dayNum}-${monthName} (${dayName})`;
  };

  // Compute targeted column dates based on period selection
  const targetDates = useMemo(() => {
    // 1. Weekly Mode (5 or 6 Days)
    if (exportType === 'weekly') {
      const d = new Date((weekRefDate || todayStr) + 'T00:00:00');
      const day = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
      const diffToMon = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diffToMon);

      const count = weeklyDaysCount === 5 ? 5 : 6;
      const list = [];
      for (let i = 0; i < count; i++) {
        const curr = new Date(monday);
        curr.setDate(monday.getDate() + i);
        list.push(formatLocalDate(curr));
      }
      return list;
    }

    // 2. Monthly Mode (Whole Month)
    if (exportType === 'monthly') {
      const [yStr, mStr] = (selectedMonth || todayStr.slice(0, 7)).split('-');
      const year = parseInt(yStr, 10);
      const month = parseInt(mStr, 10);
      const lastDay = new Date(year, month, 0).getDate();

      const list = [];
      for (let day = 1; day <= lastDay; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (monthlyWorkingDaysOnly) {
          const hol = getHolidayInfo(dateStr, customHolidays);
          if (hol.isHoliday) continue;
        }
        list.push(dateStr);
      }
      return list;
    }

    // 3. Custom Date Range
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const list = [];
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
      let curr = new Date(start);
      while (curr <= end) {
        const dateStr = formatLocalDate(curr);
        if (customWorkingDaysOnly) {
          const hol = getHolidayInfo(dateStr, customHolidays);
          if (hol.isHoliday) {
            curr.setDate(curr.getDate() + 1);
            continue;
          }
        }
        list.push(dateStr);
        curr.setDate(curr.getDate() + 1);
      }
    }
    return list;
  }, [
    exportType, 
    weekRefDate, 
    weeklyDaysCount, 
    selectedMonth, 
    monthlyWorkingDaysOnly, 
    startDate, 
    endDate, 
    customWorkingDaysOnly, 
    customHolidays, 
    todayStr
  ]);

  // Generate rows: Student info in rows, Dates in columns, and Percentage at the end
  const generateExportData = () => {
    return (students || []).map(s => {
      const row = {
        "Roll No": s.rollNo,
        "Student Name": s.name,
        "Class": s.className || selectedClass || 'Class 8-A',
      };

      let presentCount = 0;
      let workingDaysCount = 0;

      targetDates.forEach(dateStr => {
        const colHeader = formatDateHeader(dateStr);
        const status = getStatus(s.rollNo, dateStr);
        row[colHeader] = status; // Strictly 'P' or 'A'

        if (status === 'P') {
          presentCount++;
          workingDaysCount++;
        } else if (status === 'A') {
          workingDaysCount++;
        }
      });

      const pct = workingDaysCount > 0 
        ? ((presentCount / workingDaysCount) * 100).toFixed(1)
        : '0.0';

      row["Present Days"] = presentCount;
      row["Total Days"] = workingDaysCount;
      row["Attendance %"] = `${pct}%`;

      return row;
    });
  };

  // Generate descriptive file name
  const getExportFilename = (ext = 'xlsx') => {
    const classPrefix = (selectedClass || 'Class_8-A').replace(/\s+/g, '_');
    if (exportType === 'weekly') {
      const firstDate = targetDates[0] || 'Start';
      const lastDate = targetDates[targetDates.length - 1] || 'End';
      return `${classPrefix}_Weekly_Attendance_${weeklyDaysCount}Days_${firstDate}_to_${lastDate}.${ext}`;
    }
    if (exportType === 'monthly') {
      const monthLabel = selectedMonth || todayStr.slice(0, 7);
      return `${classPrefix}_Monthly_Attendance_${monthLabel}.${ext}`;
    }
    return `${classPrefix}_Attendance_${startDate}_to_${endDate}.${ext}`;
  };

  // 1. Native Microsoft Excel Export (.xlsx)
  const handleDownloadExcel = () => {
    if (!targetDates || targetDates.length === 0) {
      onExportToast?.('⚠️ No dates found in selected range.');
      return;
    }

    const data = generateExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-fit column widths
    const colWidths = [
      { wch: 10 }, // Roll No
      { wch: 22 }, // Student Name
      { wch: 12 }, // Class
      ...targetDates.map(() => ({ wch: 15 })), // Date columns e.g. "17-Nov (Tue)"
      { wch: 14 }, // Present Days
      { wch: 12 }, // Total Days
      { wch: 14 }  // Attendance %
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance_Register');
    const filename = getExportFilename('xlsx');
    XLSX.writeFile(workbook, filename);

    onExportToast?.(`📊 Exported Excel register: ${filename}`);
    onClose();
  };

  // 2. CSV Export (.csv fallback)
  const handleDownloadCSV = () => {
    if (!targetDates || targetDates.length === 0) {
      onExportToast?.('⚠️ No dates found in selected range.');
      return;
    }

    const data = generateExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filename = getExportFilename('csv');
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onExportToast?.(`📊 Exported CSV register: ${filename}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">Export Attendance Register</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Excel (.xlsx)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Students in rows &bull; Dates in columns (P / A) &bull; Final attendance %
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Selection Modes */}
        <div className="flex flex-col gap-3">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Choose Register Period:
          </label>

          {/* Option 1: Weekly (5 or 6 Days) */}
          <div 
            onClick={() => setExportType('weekly')}
            className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2.5 ${
              exportType === 'weekly' 
                ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/20' 
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  exportType === 'weekly' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Weekly Attendance</p>
                  <p className="text-xs text-slate-500">Day-by-day columns for 5 or 6 days</p>
                </div>
              </div>
              {exportType === 'weekly' && <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />}
            </div>

            {/* Sub-controls when Weekly is active */}
            {exportType === 'weekly' && (
              <div className="pt-2.5 border-t border-emerald-200/50 flex flex-col gap-2.5 animate-in fade-in duration-150" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">Days in Week:</span>
                  <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setWeeklyDaysCount(6)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        weeklyDaysCount === 6
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      6 Days (Mon – Sat)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeeklyDaysCount(5)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        weeklyDaysCount === 5
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      5 Days (Mon – Fri)
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700">Reference Week:</label>
                  <input 
                    type="date"
                    value={weekRefDate}
                    onChange={(e) => setWeekRefDate(e.target.value)}
                    className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Option 2: Monthly (Whole Month) */}
          <div 
            onClick={() => setExportType('monthly')}
            className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2.5 ${
              exportType === 'monthly' 
                ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/20' 
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  exportType === 'monthly' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}>
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Monthly Attendance</p>
                  <p className="text-xs text-slate-500">Columns for all working days of the selected month</p>
                </div>
              </div>
              {exportType === 'monthly' && <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />}
            </div>

            {/* Sub-controls when Monthly is active */}
            {exportType === 'monthly' && (
              <div className="pt-2.5 border-t border-emerald-200/50 flex flex-col gap-2.5 animate-in fade-in duration-150" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700">Select Month:</label>
                  <input 
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={monthlyWorkingDaysOnly}
                    onChange={(e) => setMonthlyWorkingDaysOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Working days only (exclude Sundays & declared holidays)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Option 3: Custom Date Range */}
          <div 
            onClick={() => setExportType('custom')}
            className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2.5 ${
              exportType === 'custom' 
                ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/20' 
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  exportType === 'custom' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Custom Date Range</p>
                  <p className="text-xs text-slate-500">Pick any custom start and end dates</p>
                </div>
              </div>
              {exportType === 'custom' && <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />}
            </div>

            {/* Sub-controls when Custom is active */}
            {exportType === 'custom' && (
              <div className="pt-2.5 border-t border-emerald-200/50 flex flex-col gap-2.5 animate-in fade-in duration-150" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">From:</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs font-medium px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">To:</label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs font-medium px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={customWorkingDaysOnly}
                    onChange={(e) => setCustomWorkingDaysOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Working days only (exclude Sundays & holidays)
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Live Structure Preview */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-slate-700">Output Structure:</span>
          </div>
          <span className="font-semibold text-slate-600 text-[11px]">
            {students.length} Student Rows &bull; {targetDates.length} Date Cols (P / A) &bull; %
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <button 
            type="button" 
            onClick={handleDownloadCSV}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
            title="Download formatted CSV format"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Download CSV</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleDownloadExcel}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
