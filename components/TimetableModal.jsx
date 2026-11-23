'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Printer, 
  Check, 
  Settings, 
  Edit3, 
  Save, 
  Trash2, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown,
  Loader2,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { 
  TIMETABLE_DAYS, 
  AVAILABLE_SUBJECTS, 
  SUBJECT_METADATA, 
  DEFAULT_TIMETABLE_PERIODS, 
  DEFAULT_WEEKLY_SCHEDULE,
  getClassTimetable,
  saveClassTimetableLocal
} from '@/lib/timetableData';
import { getSchoolConfig } from '@/lib/schoolConfig';

const AVAILABLE_CLASSES = [
  'Class 8-A',
  'Class 8-B',
  'Class 9-A',
  'Class 9-B',
  'Class 10-A',
  'Class 10-B',
  'Class 7-A',
  'Class 7-B'
];

export default function TimetableModal({
  isOpen,
  onClose,
  defaultClass = 'Class 8-A',
  currentUser = null,
  isParentView = false,
  showToast,
  onNavigateToAcademics
}) {
  const [selectedClass, setSelectedClass] = useState(defaultClass || 'Class 8-A');
  const [schedule, setSchedule] = useState(() => getClassTimetable(defaultClass || 'Class 8-A'));
  const [periods, setPeriods] = useState(DEFAULT_TIMETABLE_PERIODS);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Dynamic Subjects for the selected class derived strictly from schoolConfig Academics
  const classSubjects = useMemo(() => {
    try {
      const cfg = getSchoolConfig();
      if (cfg && Array.isArray(cfg.subjects) && cfg.subjects.length > 0) {
        // Filter subjects configured for this class or 'All Classes'
        const matched = cfg.subjects
          .filter(sub => {
            if (!sub.classes || sub.classes.length === 0 || sub.classes.includes('All Classes')) {
              return true;
            }
            return sub.classes.includes(selectedClass);
          })
          .map(s => s.label);

        if (matched.length > 0) {
          return matched;
        }
      }
    } catch (e) {}
    return ['Mathematics', 'Science', 'English', 'Marathi', 'Hindi', 'Games', 'Social Studies'];
  }, [selectedClass]);

  // Full options for period slot dropdown: includes class subjects + ALWAYS includes 'Free Period'
  const dropdownSubjects = useMemo(() => {
    const list = [...classSubjects];
    if (!list.includes('Free Period')) {
      list.push('Free Period');
    }
    return list;
  }, [classSubjects]);

  // Dynamic color resolver so custom subjects in Academics look beautiful
  const getSubjectMeta = (subName) => {
    if (SUBJECT_METADATA[subName]) return SUBJECT_METADATA[subName];
    if (subName === 'Free Period') {
      return {
        color: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100',
        headerColor: 'bg-slate-500 text-white',
        badge: 'bg-slate-100 text-slate-600'
      };
    }
    const hash = (subName || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const palette = [
      { color: 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100', headerColor: 'bg-indigo-600 text-white', badge: 'bg-indigo-100 text-indigo-900' },
      { color: 'bg-violet-50 text-violet-900 border-violet-200 hover:bg-violet-100', headerColor: 'bg-violet-600 text-white', badge: 'bg-violet-100 text-violet-900' },
      { color: 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100', headerColor: 'bg-teal-600 text-white', badge: 'bg-teal-100 text-teal-900' },
      { color: 'bg-cyan-50 text-cyan-900 border-cyan-200 hover:bg-cyan-100', headerColor: 'bg-cyan-600 text-white', badge: 'bg-cyan-100 text-cyan-900' },
      { color: 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100', headerColor: 'bg-rose-600 text-white', badge: 'bg-rose-100 text-rose-900' },
      { color: 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100', headerColor: 'bg-orange-600 text-white', badge: 'bg-orange-100 text-orange-900' }
    ];
    return palette[hash % palette.length];
  };

  const handleManageSubjectsClick = () => {
    onClose();
    if (onNavigateToAcademics) {
      onNavigateToAcademics(selectedClass);
    }
  };

  // Editing state
  const [isEditingSubjects, setIsEditingSubjects] = useState(false);
  const [editedSchedule, setEditedSchedule] = useState({});
  const [isTimingModalOpen, setIsTimingModalOpen] = useState(false);
  const [editedPeriods, setEditedPeriods] = useState([]);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [breakToDelete, setBreakToDelete] = useState(null);

  // Available classes list from config or defaults
  const availableClasses = useMemo(() => {
    try {
      const cfg = getSchoolConfig();
      if (cfg && Array.isArray(cfg.classes) && cfg.classes.length > 0) {
        return cfg.classes;
      }
    } catch (e) {}
    return AVAILABLE_CLASSES;
  }, []);

  // Resolve effective user from prop or localStorage
  const effectiveUser = useMemo(() => {
    if (currentUser && (currentUser.name || currentUser.role)) return currentUser;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('currentUser') || localStorage.getItem('myschool_user');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return currentUser || null;
  }, [currentUser]);

  // Permissions:
  // Admin can edit any class timetable and period timings.
  // Class teacher can edit the schedule of their own assigned class.
  // Teachers assigned to this class can also edit schedule.
  const isAdmin = effectiveUser?.role === 'admin' || effectiveUser?.isAdmin === true;
  
  const isClassTeacherOfThisClass = Boolean(!isParentView && (
    isAdmin || 
    effectiveUser?.isClassTeacherOfActiveClass === true ||
    (effectiveUser?.classTeacherOf && effectiveUser.classTeacherOf.toLowerCase() === (selectedClass || '').toLowerCase()) ||
    (effectiveUser?.assignedClass && effectiveUser.assignedClass.toLowerCase() === (selectedClass || '').toLowerCase()) ||
    (effectiveUser?.class_name && effectiveUser.class_name.toLowerCase().includes((selectedClass || '').toLowerCase())) ||
    (Array.isArray(effectiveUser?.classes) && effectiveUser.classes.some(c => c.toLowerCase() === (selectedClass || '').toLowerCase())) ||
    (!effectiveUser || effectiveUser?.role === 'teacher' || effectiveUser?.role === 'class_teacher' || effectiveUser?.role === 'subject_teacher')
  ));

  const canEditSubjects = !isParentView && isClassTeacherOfThisClass;
  const canEditTimings = !isParentView && isAdmin;

  // Sync selectedClass if prop changes
  useEffect(() => {
    if (isOpen && defaultClass && defaultClass !== selectedClass) {
      setSelectedClass(defaultClass);
    }
  }, [isOpen, defaultClass]);

  // Fetch timetable from DB / API with instant local display
  const fetchTimetable = async (cls) => {
    setIsLoading(true);
    // 1. Immediately set local cached schedule for instant UI response without waiting
    const localCached = getClassTimetable(cls);
    if (localCached) {
      setSchedule(localCached);
    }
    try {
      const res = await fetch(`/api/timetable?class=${encodeURIComponent(cls)}`);
      const json = await res.json();
      if (json.success) {
        if (json.schedule) {
          setSchedule(json.schedule);
          saveClassTimetableLocal(cls, json.schedule);
        }
        if (json.periods && Array.isArray(json.periods) && json.periods.length > 0) {
          setPeriods(json.periods);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch remote timetable, using local fallback:', e);
      setSchedule(getClassTimetable(cls));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTimetable(selectedClass);
      setIsEditingSubjects(false);
      setIsTimingModalOpen(false);
      setIsConfirmSaveOpen(false);
    }
  }, [isOpen, selectedClass]);

  // Escape key support to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isTimingModalOpen) {
          setIsTimingModalOpen(false);
        } else if (isConfirmSaveOpen) {
          setIsConfirmSaveOpen(false);
        } else if (isEditingSubjects) {
          setIsEditingSubjects(false);
        } else {
          onClose?.();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isTimingModalOpen, isConfirmSaveOpen, isEditingSubjects, onClose]);

  // Start editing subjects
  const handleStartEditSubjects = () => {
    setEditedSchedule(JSON.parse(JSON.stringify(schedule)));
    setIsEditingSubjects(true);
    setStatusMessage(null);
  };

  // Cancel editing subjects
  const handleCancelEditSubjects = () => {
    setIsEditingSubjects(false);
    setEditedSchedule({});
  };

  // Change a single slot in edit mode
  const handleSlotSubjectChange = (day, periodId, newSubject) => {
    setEditedSchedule(prev => {
      const updated = { ...prev };
      if (!updated[day]) updated[day] = {};
      updated[day] = {
        ...updated[day],
        [periodId]: { ...(updated[day][periodId] || {}), subject: newSubject }
      };
      return updated;
    });
  };

  // Confirm and save edited subjects directly and live
  const handleSaveSubjects = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass,
          schedule: editedSchedule
        })
      });
      const json = await res.json();
      if (json.success) {
        setSchedule(editedSchedule);
        saveClassTimetableLocal(selectedClass, editedSchedule);
        setIsEditingSubjects(false);
        setIsConfirmSaveOpen(false);
        setStatusMessage({ type: 'success', text: `Weekly timetable for ${selectedClass} saved live!` });
        setTimeout(() => setStatusMessage(null), 4000);
        if (showToast) {
          showToast(`Weekly timetable for ${selectedClass} saved live!`);
        }
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to save timetable: ' + (json.error || 'Server error') });
      }
    } catch (e) {
      // Local fallback
      setSchedule(editedSchedule);
      saveClassTimetableLocal(selectedClass, editedSchedule);
      setIsEditingSubjects(false);
      setIsConfirmSaveOpen(false);
      setStatusMessage({ type: 'success', text: `Saved timetable locally for ${selectedClass}` });
      setTimeout(() => setStatusMessage(null), 4000);
      if (showToast) {
        showToast(`Saved timetable locally for ${selectedClass}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Open Timings & Breaks config modal (Admin only)
  const handleOpenTimingConfig = () => {
    setEditedPeriods(JSON.parse(JSON.stringify(periods)));
    setIsTimingModalOpen(true);
  };

  // Save Timing & Breaks config
  const handleSaveTimingConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass,
          periods: editedPeriods
        })
      });
      const json = await res.json();
      if (json.success) {
        setPeriods(editedPeriods);
        setIsTimingModalOpen(false);
        setStatusMessage({ type: 'success', text: 'Period timings & breaks updated live in database!' });
        setTimeout(() => setStatusMessage(null), 4000);
        if (showToast) {
          showToast('Updated period timings & breaks in database!');
        }
      } else {
        alert('Failed to update timings: ' + (json.error || 'Server error'));
      }
    } catch (e) {
      setPeriods(editedPeriods);
      setIsTimingModalOpen(false);
      setStatusMessage({ type: 'success', text: 'Updated timings locally' });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Print strictly the timetable on 1 single landscape page
  const handlePrint = () => {
    try {
      const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      
      // Header periods
      const periodsHeaders = periods.map(p => {
        if (p.isBreak) {
          return `<th style="background:#fef3c7; color:#78350f; padding:4px 2px; width:46px; border:1px solid #cbd5e1; text-align:center;">
            <div style="font-size:8.5px; font-weight:900; text-transform:uppercase;">${p.label}</div>
            <div style="font-size:8px; font-family:monospace; color:#92400e;">${p.time || ''}</div>
          </th>`;
        }
        return `<th style="background:#f1f5f9; color:#1e293b; padding:4px 3px; border:1px solid #cbd5e1; text-align:center;">
          <div style="font-size:9.5px; font-weight:900; text-transform:uppercase; color:#3730a3;">${p.label}</div>
          <div style="font-size:8px; font-family:monospace; color:#64748b; margin-top:1px;">${p.time || ''}</div>
        </th>`;
      }).join('');

      // Color mapper for subjects
      const colorMap = {
        'Mathematics': 'background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe;',
        'English': 'background:#fffbeb; color:#92400e; border:1px solid #fde68a;',
        'Science': 'background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0;',
        'Marathi': 'background:#faf5ff; color:#6b21a8; border:1px solid #e9d5ff;',
        'Hindi': 'background:#fff1f2; color:#9f1239; border:1px solid #fecdd3;',
        'Games': 'background:#f0fdfa; color:#115e59; border:1px solid #99f6e4;',
        'Social Studies': 'background:#fff7ed; color:#9a3412; border:1px solid #fed7aa;',
        'Free Period': 'background:#f8fafc; color:#64748b; border:1px solid #e2e8f0;'
      };

      // Table body rows
      const rows = TIMETABLE_DAYS.map(day => {
        const dayData = currentSchedule[day] || {};
        const cells = periods.map(p => {
          if (p.isBreak) {
            const isLunch = (p.label || '').toLowerCase().includes('lunch');
            return `<td style="background:${isLunch ? '#f0fdf4' : '#fffbeb'}; border:1px solid #cbd5e1; text-align:center; padding:3px 2px; font-size:12px;">
              ${isLunch ? '🍱' : '☕'}
            </td>`;
          }
          const sub = dayData[p.id]?.subject || 'Free Period';
          const style = colorMap[sub] || 'background:#f8fafc; color:#475569; border:1px solid #e2e8f0;';
          return `<td style="border:1px solid #cbd5e1; text-align:center; padding:2px 2px;">
            <div style="padding:4px 2px; border-radius:5px; font-size:9.5px; font-weight:800; ${style}">
              ${sub}
            </div>
          </td>`;
        }).join('');

        return `<tr>
          <td style="background:#f8fafc; border:1px solid #cbd5e1; font-weight:900; font-size:10px; text-align:center; padding:4px 3px; width:72px;">
            ${day}
          </td>
          ${cells}
        </tr>`;
      }).join('');

      // Create hidden iframe for completely isolated, guaranteed 1-page printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow || iframe.contentDocument;
      const iframeDoc = doc.document || doc;

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${selectedClass} Timetable - MySchool</title>
            <style>
              @page {
                size: landscape;
                margin: 6mm 8mm;
              }
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              html, body {
                width: 100%;
                height: 100%;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                color: #0f172a;
                background: #ffffff;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 5px;
                margin-bottom: 6px;
                border-bottom: 2px solid #0f172a;
              }
              h1 {
                font-size: 15px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: -0.3px;
                color: #0f172a;
              }
              p.sub {
                font-size: 9.5px;
                color: #475569;
                font-weight: 600;
                margin-top: 1px;
              }
              .date-box {
                text-align: right;
                font-size: 10px;
                font-weight: 800;
                color: #0f172a;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 9px;
                color: #64748b;
                font-weight: 600;
                border-top: 1px solid #cbd5e1;
                margin-top: 5px;
                padding-top: 3px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1>MySchool • ${selectedClass} Weekly Timetable</h1>
                <p class="sub">Academic Year 2026-2027 • Monday to Saturday • Official Timetable</p>
              </div>
              <div class="date-box">
                <div>Date: ${printDate}</div>
                <div style="font-size: 8.5px; color: #64748b; font-weight: 500;">Academic Administration</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="background:#e2e8f0; color:#1e293b; padding:4px; width:72px; border:1px solid #cbd5e1; font-size:9.5px; font-weight:900;">
                    DAY
                  </th>
                  ${periodsHeaders}
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div class="footer">
              <span>MySchool Classroom & Academic Portal</span>
              <span>Printed on: ${printDate} • Valid for Academic Year 2026-2027</span>
            </div>
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (err) {
          console.error('Print iframe error:', err);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        }
      }, 250);
    } catch (e) {
      console.warn('Fallback to standard window.print:', e);
      window.print();
    }
  };

  if (!isOpen) return null;

  const currentSchedule = isEditingSubjects ? editedSchedule : schedule;

  return (
    <>
      {/* Print Specific CSS: Hides everything except the timetable table on a single landscape page */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 6mm 8mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 100% !important;
            overflow: hidden !important;
            background: white !important;
            color: black !important;
          }
          /* Hide all app chrome, modals, headers, sidebars */
          body * {
            visibility: hidden;
          }
          /* Make ONLY the printable timetable container and its children visible */
          #printable-timetable-container,
          #printable-timetable-container * {
            visibility: visible !important;
          }
          #printable-timetable-container {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 8px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-after: avoid !important;
            break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only-header {
            display: block !important;
          }
          table {
            width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 3px 4px !important;
            font-size: 10px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Main Modal Dialog */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
        <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[94vh] overflow-hidden my-auto">
          
          {/* Header */}
          <div className="p-2.5 sm:px-4 sm:py-2.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/70 no-print">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    {selectedClass} Timetable
                  </h3>
                  {isEditingSubjects && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                      Editing Mode Active
                    </span>
                  )}
                  {statusMessage && (
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 animate-in fade-in ${
                      statusMessage.type === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {statusMessage.type === 'error' ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      <span>{statusMessage.text}</span>
                    </span>
                  )}
                  {!isParentView && !canEditSubjects && (
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      View Only (Class Teacher / Admin Only)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Weekly period schedule &bull; Monday to Saturday &bull; Dedicated per class
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              {/* Class Selector for Teachers / Admin */}
              {!isParentView && !isEditingSubjects && (
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="pl-3 pr-8 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none shadow-2xs cursor-pointer"
                  >
                    {availableClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Edit Schedule Button (Prominently visible in header for teachers) */}
              {canEditSubjects && !isEditingSubjects && (
                <button
                  onClick={handleStartEditSubjects}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title="Click to edit subject slots for this class"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Schedule</span>
                </button>
              )}

              {/* Editing Mode Header Actions */}
              {isEditingSubjects && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCancelEditSubjects}
                    disabled={isSaving}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSubjects}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}

              {/* Timing & Breaks Config Button */}
              {canEditTimings && !isEditingSubjects && (
                <button
                  onClick={handleOpenTimingConfig}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  title="Configure lecture timings, periods, and breaks"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Timing & Breaks</span>
                </button>
              )}

              {/* Manage Subjects in Admin Academics Button */}
              {canEditSubjects && !isEditingSubjects && (
                <button
                  onClick={handleManageSubjectsClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  title={`Configure curriculum subjects for ${selectedClass} in Admin Academics`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Manage Subjects</span>
                </button>
              )}

              {/* Print Button (Strictly prints timetable) */}
              {!isEditingSubjects && (
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  title="Print timetable to PDF or printer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print</span>
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Table Container Body */}
          <div className="p-2 sm:p-3 overflow-y-auto flex-1 flex flex-col gap-2">
            
            {/* The Print-Target Container */}
            <div id="printable-timetable-container" className="flex flex-col gap-1.5">
              
              {/* Formal School Header visible ONLY when printing */}
              <div className="hidden print-only-header pb-2 border-b-2 border-slate-800 mb-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h1 className="text-lg font-black uppercase tracking-tight text-black">
                      MySchool &bull; {selectedClass} Weekly Timetable
                    </h1>
                    <p className="text-[11px] text-gray-700 font-semibold mt-0.5">
                      Academic Year 2026-2027 &bull; Monday to Saturday &bull; 45 Minute Lectures
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-gray-900">
                      Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-gray-600 font-medium">
                      Official Schedule
                    </div>
                  </div>
                </div>
              </div>

              {/* WEEKLY TIMETABLE GRID TABLE */}
              <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs bg-white">
                <table className="w-full border-collapse text-left text-xs min-w-[700px]">
                  <thead>
                    {/* Ultra-compact slim header row */}
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-sans">
                      <th className="py-1 px-1.5 border-r border-slate-200 font-bold uppercase tracking-wider text-center w-20 bg-slate-200/60 text-[10px]">
                        DAY
                      </th>

                      {periods.map((item) => {
                        if (item.isBreak) {
                          return (
                            <th 
                              key={item.id}
                              className="py-1 px-1 border-r border-slate-200 text-center bg-amber-50/70 text-amber-900 w-16 sm:w-20 font-sans leading-none"
                            >
                              <div className="text-[10px] font-black uppercase tracking-tight text-amber-900">
                                {item.label}
                              </div>
                              <div className="text-[9px] font-mono text-amber-700 font-medium mt-0.5">
                                {item.time}
                              </div>
                            </th>
                          );
                        }

                        return (
                          <th 
                            key={item.id}
                            className="py-1 px-1.5 border-r border-slate-200 text-center leading-none"
                          >
                            <div className="text-[10px] text-indigo-800 font-sans font-bold uppercase tracking-tight">
                              {item.label}
                            </div>
                            <div className="font-mono text-[9px] text-slate-500 font-medium mt-0.5">
                              {item.time}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans">
                    {TIMETABLE_DAYS.map((day, idx) => {
                      const daySchedule = currentSchedule[day] || {};
                      const isEven = idx % 2 === 0;

                      return (
                        <tr key={day} className={`hover:bg-slate-50/60 transition-colors ${isEven ? 'bg-white' : 'bg-slate-50/30'}`}>
                          {/* Day Column */}
                          <td className="py-1 px-2 border-r border-slate-200 font-bold text-slate-800 text-center bg-slate-100/40">
                            <span className="block text-xs font-black">{day}</span>
                          </td>

                          {periods.map((item) => {
                            // Break Column in Day Row: Clean, quiet, uncluttered with subtle emoji and no repeated text
                            if (item.isBreak) {
                              const isLunch = (item.label || '').toLowerCase().includes('lunch');
                              return (
                                <td 
                                  key={item.id}
                                  className={`py-1 px-1 border-r border-slate-200 text-center align-middle ${
                                    isLunch ? 'bg-emerald-50/40 text-emerald-700' : 'bg-amber-50/40 text-amber-700'
                                  }`}
                                  title={`${item.label} (${item.time})`}
                                >
                                  <span className="text-sm select-none opacity-85">
                                    {isLunch ? '🍱' : '☕'}
                                  </span>
                                </td>
                              );
                            }

                            // Period Slot Cell
                            const slotData = daySchedule[item.id] || {};
                            const currentSub = slotData.subject || 'Free Period';
                            const meta = getSubjectMeta(currentSub);

                            return (
                              <td 
                                key={item.id}
                                className="p-1 border-r border-slate-200 text-center align-middle"
                              >
                                {isEditingSubjects ? (
                                  /* Inline Subject Selector in Edit Mode: dynamically filtered to this class + Free Period */
                                  <div className="relative">
                                    <select
                                      value={currentSub}
                                      onChange={(e) => handleSlotSubjectChange(day, item.id, e.target.value)}
                                      className={`w-full py-1 px-1.5 text-xs font-black rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer ${meta.color}`}
                                    >
                                      {dropdownSubjects.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  </div>
                                ) : (
                                  /* Normal View: Thin, Clean Subject Chip without Teacher Name and without Emojis */
                                  <div className={`py-1 px-1.5 rounded-lg border text-center transition-all shadow-2xs ${meta.color}`}>
                                    <span className="font-bold text-xs leading-none tracking-tight block truncate">
                                      {currentSub}
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Print Footer with Printed Date (Strictly Date, No Time) */}
              <div className="hidden print-only-header pt-1 text-[10px] text-gray-500 font-medium">
                <div className="flex items-center justify-between">
                  <span>MySchool Academic Administration</span>
                  <span>Printed on: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

            </div>

            {/* Bottom Controls / Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 no-print">
              
              {/* Dynamic Class Subjects Legend */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="font-bold text-slate-500 mr-1">Subjects:</span>
                {classSubjects.map(sub => {
                  const meta = getSubjectMeta(sub);
                  return (
                    <span 
                      key={sub}
                      className={`px-2 py-0.5 rounded-md font-bold border ${meta.color}`}
                    >
                      {sub}
                    </span>
                  );
                })}
                {canEditSubjects && (
                  <button
                    onClick={handleManageSubjectsClick}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold transition-all cursor-pointer ml-1"
                    title={`Open Admin Academics to configure subjects for ${selectedClass}`}
                  >
                    <BookOpen className="w-2.5 h-2.5 text-indigo-600" />
                    <span>Manage Subjects</span>
                  </button>
                )}
              </div>

              {/* Action Buttons for Class Teacher and Admin */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {canEditSubjects && !isEditingSubjects && (
                  <button
                    onClick={handleStartEditSubjects}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-100 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Schedule Subjects</span>
                  </button>
                )}

                {isEditingSubjects && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancelEditSubjects}
                      disabled={isSaving}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSubjects}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-100 transition-all cursor-pointer"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* CONFIRMATION MODAL BEFORE SAVING SUBJECTS (WITH PROPER z-[80] ON TOP) */}
      {isConfirmSaveOpen && (
        <div 
          className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100 no-print"
          style={{ zIndex: 80 }}
        >
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Confirm Schedule Update</h4>
                <p className="text-xs text-slate-500">Save updated timetable for {selectedClass}?</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will update the weekly schedule for {selectedClass} in the database, visible across all teacher and parent accounts.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsConfirmSaveOpen(false)}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleSaveSubjects}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isSaving ? 'Updating...' : 'Yes, Save to Database'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN MODAL: CONFIGURE TIMINGS & BREAKS (WITH PROPER z-[70] ON TOP) */}
      {isTimingModalOpen && (
        <div 
          className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-100 overflow-y-auto no-print"
          style={{ zIndex: 70 }}
        >
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto my-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Configure Lecture Timings & Breaks</h4>
                  <p className="text-[11px] text-slate-500">Add, remove, or adjust period times and break slots</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTimingModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Periods & Breaks */}
            <div className="flex flex-col gap-2.5">
              {editedPeriods.map((item, index) => {
                const isBreak = item.isBreak;

                return (
                  <div 
                    key={item.id} 
                    className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isBreak ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isBreak ? 'bg-amber-200 text-amber-900' : 'bg-indigo-100 text-indigo-900'
                      }`}>
                        {isBreak ? 'Break' : `Period ${item.number || index + 1}`}
                      </span>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditedPeriods(prev => prev.map((p, i) => i === index ? { ...p, label: val } : p));
                        }}
                        className="text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg w-32 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Label"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs">
                        <input
                          type="text"
                          value={item.time}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditedPeriods(prev => prev.map((p, i) => i === index ? { ...p, time: val } : p));
                          }}
                          className="text-xs font-mono font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg w-28 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="e.g. 08:00 - 08:45"
                        />
                      </div>

                      {/* Remove Break Button */}
                      {isBreak && (
                        <button
                          type="button"
                          onClick={() => setBreakToDelete({ index, label: item.label || 'Break' })}
                          className="w-7 h-7 rounded-lg hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove this break"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions to Add Break or Period */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
              <button
                onClick={() => {
                  const newBreak = {
                    id: `b_${Date.now()}`,
                    type: 'break',
                    label: 'Recess Break',
                    time: '10:00 - 10:15',
                    duration: '15m',
                    isBreak: true
                  };
                  setEditedPeriods(prev => [...prev, newBreak]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Break Slot</span>
              </button>

              <button
                onClick={() => {
                  const periodCount = editedPeriods.filter(p => !p.isBreak).length + 1;
                  const newPeriod = {
                    id: `p${periodCount}`,
                    type: 'period',
                    number: periodCount,
                    label: `Lecture ${periodCount}`,
                    time: '01:15 - 02:00',
                    duration: '45m'
                  };
                  setEditedPeriods(prev => [...prev, newPeriod]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Lecture Slot</span>
              </button>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsTimingModalOpen(false)}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTimingConfig}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaving ? 'Updating...' : 'Save Timings to Database'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE BREAK SLOT MODAL */}
      {breakToDelete !== null && (
        <div 
          className="fixed inset-0 z-[85] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100 no-print"
          style={{ zIndex: 85 }}
        >
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Remove Break Slot?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>{breakToDelete.label}</strong> from the period timing schedule?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBreakToDelete(null)}
                className="py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditedPeriods(prev => prev.filter((_, i) => i !== breakToDelete.index));
                  setBreakToDelete(null);
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 cursor-pointer"
              >
                Remove Break
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
