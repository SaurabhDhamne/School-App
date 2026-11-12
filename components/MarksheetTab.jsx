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
  ArrowRight
} from 'lucide-react';

export default function MarksheetTab({
  students,
  subjects,
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
  getGrade
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNo.includes(searchQuery)
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Academic Marksheet & Gradebook</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Unit Test 1 (Max 25/sub)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Edit marks, scan paper answer sheets with AI, or dispatch report cards</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onOpenScanModal('marksheet')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs border border-indigo-200/70 transition-all"
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>AI Scan Marksheet</span>
          </button>

          <button
            onClick={onTriggerExcelImport}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-xs border border-slate-200 transition-all"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Import Excel</span>
          </button>

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
            <span>Email All Report Cards</span>
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
                {(currentSubjectFilter === 'all' || currentSubjectFilter === 'maths') && (
                  <th className="py-4 px-3 text-center">Maths (25)</th>
                )}
                {(currentSubjectFilter === 'all' || currentSubjectFilter === 'science') && (
                  <th className="py-4 px-3 text-center">Science (25)</th>
                )}
                {(currentSubjectFilter === 'all' || currentSubjectFilter === 'english') && (
                  <th className="py-4 px-3 text-center">English (25)</th>
                )}
                {(currentSubjectFilter === 'all' || currentSubjectFilter === 'social') && (
                  <th className="py-4 px-3 text-center">Social (25)</th>
                )}
                {(currentSubjectFilter === 'all' || currentSubjectFilter === 'hindi') && (
                  <th className="py-4 px-3 text-center">Hindi (25)</th>
                )}
                <th className="py-4 px-3 text-center">Total (125)</th>
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

                    {/* Subjects Editable Inputs */}
                    {(currentSubjectFilter === 'all' || currentSubjectFilter === 'maths') && (
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={st.marks?.maths ?? ''}
                          onChange={(e) => onUpdateMark(st.rollNo, 'maths', e.target.value)}
                          className="w-14 text-center font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg py-1 focus:bg-white focus:border-indigo-500 focus:outline-none"
                        />
                      </td>
                    )}

                    {(currentSubjectFilter === 'all' || currentSubjectFilter === 'science') && (
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={st.marks?.science ?? ''}
                          onChange={(e) => onUpdateMark(st.rollNo, 'science', e.target.value)}
                          className="w-14 text-center font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg py-1 focus:bg-white focus:border-indigo-500 focus:outline-none"
                        />
                      </td>
                    )}

                    {(currentSubjectFilter === 'all' || currentSubjectFilter === 'english') && (
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={st.marks?.english ?? ''}
                          onChange={(e) => onUpdateMark(st.rollNo, 'english', e.target.value)}
                          className="w-14 text-center font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg py-1 focus:bg-white focus:border-indigo-500 focus:outline-none"
                        />
                      </td>
                    )}

                    {(currentSubjectFilter === 'all' || currentSubjectFilter === 'social') && (
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={st.marks?.social ?? ''}
                          onChange={(e) => onUpdateMark(st.rollNo, 'social', e.target.value)}
                          className="w-14 text-center font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg py-1 focus:bg-white focus:border-indigo-500 focus:outline-none"
                        />
                      </td>
                    )}

                    {(currentSubjectFilter === 'all' || currentSubjectFilter === 'hindi') && (
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={st.marks?.hindi ?? ''}
                          onChange={(e) => onUpdateMark(st.rollNo, 'hindi', e.target.value)}
                          className="w-14 text-center font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg py-1 focus:bg-white focus:border-indigo-500 focus:outline-none"
                        />
                      </td>
                    )}

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
        </div>
      </div>

    </div>
  );
}

