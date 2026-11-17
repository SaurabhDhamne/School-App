'use client';

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Camera, 
  Upload, 
  Download, 
  Mail, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ArrowRight,
  Lock,
  FileDown
} from 'lucide-react';

export default function MarksheetTab({
  students,
  selectedClass = 'Class 8-A',
  subjects = [],
  activeExam = 'Unit Test 1',
  currentSubjectFilter,
  setCurrentSubjectFilter,
  currentUser,
  onUpdateMark,
  onOpenScanModal,
  onTriggerExcelImport,
  onExportMarksheetCSV,
  onOpenEmailSingle,
  onOpenEmailAll,
  onSelectStudent,
  calculateTotal,
  calculatePercentage,
  getGrade,
  onDownloadExcelTemplate
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const activeSubjects = (subjects || []).filter(s => s.key !== 'all');
  const totalMaxMarks = activeSubjects.reduce((sum, s) => sum + (Number(s.max) || 25), 0) || 100;

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNo.includes(searchQuery)
  );

  // Strict Permission Check:
  // - Admin & Class Teacher of active class can edit all subjects
  // - In another class where teacher is not Class Teacher, they can ONLY edit their own subject
  const canEditSubject = (subjectKey) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.isClassTeacherOfActiveClass) return true;
    if (currentUser.role === 'class_teacher' && (!currentUser.classTeacherOf || currentUser.classTeacherOf === selectedClass)) return true;
    
    const userSub = (currentUser.subject || '').toLowerCase().trim();
    const targetSub = activeSubjects.find(s => s.key === subjectKey);
    const subLabel = (targetSub?.label || subjectKey).toLowerCase().trim();

    if (userSub && (userSub === subLabel || userSub.includes(subLabel) || subLabel.includes(userSub))) return true;
    if (targetSub?.assignedTeacherName && currentUser?.name && targetSub.assignedTeacherName === currentUser.name) return true;
    return false;
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Academic Marksheet & Gradebook</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {activeExam} (Max: {totalMaxMarks})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {currentUser?.role === 'admin' || currentUser?.isClassTeacherOfActiveClass
              ? `👑 Class Teacher (${selectedClass}): Full editing rights across all subjects`
              : `🔒 ${currentUser?.subject || 'Subject'} Teacher (${selectedClass}): You can edit ${currentUser?.subject} marks only`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenScanModal('marksheet')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs border border-indigo-200/70 transition-all"
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>AI Scan Paper</span>
          </button>

          {/* Import Excel / CSV */}
          <button
            onClick={onTriggerExcelImport}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-xs border border-slate-200 transition-all"
            title="Upload .xlsx, .xls, or .csv marksheet file"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Import Excel / CSV</span>
          </button>

          {/* Download Sample Excel Template */}
          <button
            onClick={onDownloadExcelTemplate}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium text-xs border border-slate-200 transition-all"
            title="Download sample blank Excel template with correct columns"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Template</span>
          </button>

          {/* Export Full CSV */}
          <button
            onClick={onExportMarksheetCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-xs border border-slate-200 transition-all"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => onOpenEmailAll('marksheet')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-200 transition-all"
          >
            <Mail className="w-4 h-4" />
            <span>Email Report Cards</span>
          </button>
        </div>
      </div>

      {/* Subject Filter Pills & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Subject Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {subjects.map(sub => {
            const isSelected = currentSubjectFilter === sub.key;
            return (
              <button
                key={sub.key}
                onClick={() => setCurrentSubjectFilter(sub.key)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-[#171340] text-white border-[#171340] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            placeholder="Search student or roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Marksheet Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4 sm:px-6">Roll & Name</th>
                {activeSubjects
                  .filter(sub => currentSubjectFilter === 'all' || currentSubjectFilter === sub.key)
                  .map(sub => (
                    <th key={sub.key} className="py-4 px-3 text-center whitespace-nowrap">
                      {sub.label} {canEditSubject(sub.key) ? `(${sub.max || 25})` : '🔒'}
                    </th>
                  ))
                }
                <th className="py-4 px-3 text-center whitespace-nowrap">Total ({totalMaxMarks})</th>
                <th className="py-4 px-3 text-center">%</th>
                <th className="py-4 px-3 text-center">Grade</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredStudents.map((st) => {
                const total = calculateTotal(st.marks);
                const pct = calculatePercentage(st.marks);
                const gradeInfo = getGrade(pct);

                return (
                  <tr key={st.rollNo} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Student Info */}
                    <td className="py-3 px-4 sm:px-6">
                      <div 
                        onClick={() => onSelectStudent(st)}
                        className="cursor-pointer group flex items-center gap-3"
                      >
                        <span className="font-mono font-bold text-slate-400 group-hover:text-indigo-600">
                          #{st.rollNo}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {st.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-normal">
                            {st.parentEmail}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Dynamic Curriculum Subjects */}
                    {activeSubjects
                      .filter(sub => currentSubjectFilter === 'all' || currentSubjectFilter === sub.key)
                      .map(sub => {
                        const isEditable = canEditSubject(sub.key);
                        const scoreVal = st.marks?.[sub.key] ?? '';
                        return (
                          <td key={sub.key} className="py-3 px-3 text-center">
                            {isEditable ? (
                              <input
                                type="number"
                                min="0"
                                max={sub.max || 25}
                                value={scoreVal}
                                onChange={(e) => onUpdateMark(st.rollNo, sub.key, e.target.value)}
                                className="w-14 text-center font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg py-1 focus:bg-white focus:border-indigo-500 focus:outline-none"
                                placeholder="—"
                              />
                            ) : (
                              <span 
                                className="inline-block w-14 text-center font-mono text-slate-400 bg-slate-100/70 py-1 rounded-lg border border-slate-200/50 cursor-not-allowed"
                                title={`Locked: Only ${sub.label} or Class Teacher can edit`}
                              >
                                {scoreVal !== '' ? scoreVal : 0}
                              </span>
                            )}
                          </td>
                        );
                      })
                    }

                    {/* Total */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {total}
                    </td>

                    {/* % */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-indigo-600">
                      {pct}%
                    </td>

                    {/* Grade */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${gradeInfo.color}`}>
                        {gradeInfo.grade}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {st.emailed ? (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Emailed</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => onOpenEmailSingle(st, 'marksheet')}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-colors"
                            title="Email Report Card"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onSelectStudent(st)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                          title="View Details"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <FileSpreadsheet className="w-8 h-8 text-slate-300" />
              <p className="font-bold text-slate-700 text-xs">No students enrolled in {selectedClass} yet</p>
              <p className="text-[11px] text-slate-400">Add students or bulk-upload via Excel in the Admin tab to enter marks.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
