'use client';

import React, { useState, useRef, useEffect } from 'react';
import { getPdfBlobUrl } from '@/lib/pdfUtils';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Check, 
  RotateCcw,
  FileText,
  Lock,
  Eye,
  UserCheck,
  ExternalLink,
  Calendar
} from 'lucide-react';

export default function ScanModal({
  isOpen,
  onClose,
  initialType = 'marksheet',
  students = [],
  selectedDate,
  onApplyData,
  currentUser,
  showToast
}) {
  const isSubjectTeacher = currentUser?.role === 'subject_teacher';

  const getTeacherSubjectKey = () => {
    const s = (currentUser?.subject || '').toLowerCase();
    if (s.includes('science')) return 'science';
    if (s.includes('math')) return 'maths';
    if (s.includes('english')) return 'english';
    if (s.includes('social')) return 'social';
    if (s.includes('hindi')) return 'hindi';
    return 'maths';
  };

  const defaultSub = isSubjectTeacher ? getTeacherSubjectKey() : 'maths';

  const todayStr = new Date().toISOString().split('T')[0];
  const [targetDate, setTargetDate] = useState(selectedDate || todayStr);
  const [scanType, setScanType] = useState(initialType);
  const [scanSubject, setScanSubject] = useState(defaultSub);
  const [previewImage, setPreviewImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [selectedAssignRoll, setSelectedAssignRoll] = useState('');
  const [isViewingPdf, setIsViewingPdf] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  useEffect(() => {
    if (isViewingPdf && previewImage?.startsWith('data:application/pdf')) {
      const bUrl = getPdfBlobUrl(previewImage);
      setPdfBlobUrl(bUrl);
      return () => {
        if (bUrl && bUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(bUrl); } catch (e) {}
        }
      };
    } else {
      setPdfBlobUrl(null);
    }
  }, [isViewingPdf, previewImage]);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Mobile Back Button Support: Intercept Android/browser back button to close modal instead of exiting app
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ scanModalOpen: true }, '');

      const handlePopState = () => {
        onClose();
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setScanType(initialType);
      if (isSubjectTeacher) {
        setScanSubject(getTeacherSubjectKey());
      }
      setScanError(null);
      setExtractedData(null);
      setPreviewImage(null);
      setSelectedAssignRoll('');
      setIsViewingPdf(false);
      setTargetDate(selectedDate || todayStr);
    }
  }, [isOpen, initialType, currentUser, selectedDate]);

  if (!isOpen) return null;

  const subjects = [
    { key: 'maths', label: 'Mathematics' },
    { key: 'science', label: 'Science' },
    { key: 'english', label: 'English' },
    { key: 'social', label: 'Social Studies' },
    { key: 'hindi', label: 'Hindi' },
  ];

  const handleImageSelected = (file) => {
    if (!file) return;
    setScanError(null);
    setExtractedData(null);
    setSelectedAssignRoll('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setPreviewImage(base64);
      runAiOcr(base64);
    };
    reader.readAsDataURL(file);
  };

  const runAiOcr = async (base64) => {
    setIsAnalyzing(true);
    setScanError(null);
    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: scanType,
          subject: scanSubject,
          imageBase64: base64
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setExtractedData(json.data);
        showToast('✨ Real paper records extracted successfully!');
      } else {
        const errMsg = json.error || 'Failed to extract handwriting. Please ensure photo is clear and well-lit.';
        setScanError(errMsg);
        showToast(`⚠️ ${errMsg}`);
      }
    } catch (err) {
      const errMsg = 'AI Vision service is temporarily unavailable. Please retry.';
      setScanError(errMsg);
      showToast(`⚠️ ${errMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetake = () => {
    setPreviewImage(null);
    setExtractedData(null);
    setScanError(null);
    setSelectedAssignRoll('');
    setIsViewingPdf(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleApply = () => {
    if (!extractedData || !extractedData.records) return;

    // If teacher mapped a single paper to a specific student from dropdown
    let dataToApply = { ...extractedData };
    if (extractedData.records.length === 1 && selectedAssignRoll) {
      const mappedStudent = students.find(s => s.rollNo === selectedAssignRoll);
      dataToApply.records = [{
        ...extractedData.records[0],
        rollNo: selectedAssignRoll,
        name: mappedStudent ? mappedStudent.name : extractedData.records[0].name
      }];
    }

    onApplyData(scanType, scanSubject, dataToApply, targetDate);
    onClose();
  };

  // Find if single scanned student matches current roster
  const singleRecord = extractedData?.records?.length === 1 ? extractedData.records[0] : null;
  const matchedStudentInRoster = singleRecord ? students.find(s => {
    if (singleRecord.rollNo && (String(s.rollNo).trim() === String(singleRecord.rollNo).trim() || parseInt(s.rollNo, 10) === parseInt(singleRecord.rollNo, 10))) {
      return true;
    }
    if (singleRecord.name && s.name.toLowerCase().trim() === singleRecord.name.toLowerCase().trim()) {
      return true;
    }
    return false;
  }) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        
        {/* Hidden inputs */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => handleImageSelected(e.target.files?.[0])}
          accept="image/*,application/pdf" 
          className="hidden" 
        />
        <input 
          type="file" 
          ref={cameraInputRef} 
          onChange={(e) => handleImageSelected(e.target.files?.[0])}
          accept="image/*" 
          capture="environment"
          className="hidden" 
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Real AI Vision Paper Scanner</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live OCR
                </span>
              </h3>
              <p className="text-xs text-slate-400">Scans real physical answer papers or attendance registers</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Type Picker */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setScanType('marksheet'); handleRetake(); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
              scanType === 'marksheet'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Exam Answer Paper (Single Student)
          </button>
          <button
            type="button"
            onClick={() => { setScanType('attendance'); handleRetake(); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
              scanType === 'attendance'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Attendance Register (Whole Class)
          </button>
        </div>

        {/* Subject Picker with STRICT TEACHER RESTRICTION */}
        {scanType === 'marksheet' && (
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Subject:</span>
            {isSubjectTeacher ? (
              <div className="flex items-center justify-between w-full px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900">
                <span className="capitalize">{currentUser.subject}</span>
                <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Locked to your subject</span>
                </span>
              </div>
            ) : (
              <select
                value={scanSubject}
                onChange={(e) => setScanSubject(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
              >
                {subjects.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Visible Error Message */}
        {scanError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Scan Result</p>
              <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">{scanError}</p>
            </div>
            <button
              onClick={() => setScanError(null)}
              className="text-rose-400 hover:text-rose-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Capture Buttons or Image Preview */}
        {!previewImage ? (
          <div className="grid grid-cols-2 gap-3 py-4">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-400 transition-all text-indigo-700"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-600">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold">Snap Live Photo</p>
              <p className="text-[10px] text-slate-400">Use phone or webcam camera</p>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300 transition-all text-slate-700"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold">Upload Photo / PDF</p>
              <p className="text-[10px] text-slate-400">JPG, PNG, or PDF marksheet</p>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-h-48 flex items-center justify-center p-2">
              {previewImage.startsWith('data:application/pdf') ? (
                <div className="flex flex-col items-center justify-center py-6 text-white gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold">PDF Marksheet Document Loaded</span>
                  <button
                    type="button"
                    onClick={() => setIsViewingPdf(true)}
                    className="mt-1 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Full PDF</span>
                  </button>
                </div>
              ) : (
                <img src={previewImage} alt="Scan Preview" className="object-contain max-h-48 w-full" />
              )}

              <button
                onClick={handleRetake}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAnalyzing && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs font-bold text-indigo-600 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Vision is reading real handwriting & marks...</span>
              </div>
            )}
          </div>
        )}

        {/* Extracted Data Preview */}
        {extractedData && (
          <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Extracted {extractedData.records?.length || 0} Student Record(s)</span>
              </p>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Live Scan Complete
              </span>
            </div>

            {/* Arithmetic check alert if present */}
            {extractedData.arithmeticChecks && extractedData.arithmeticChecks.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Score Verification:</p>
                  <p className="text-[11px] text-amber-800">{extractedData.arithmeticChecks[0].note}</p>
                </div>
              </div>
            )}

            {/* Single Student Card View */}
            {singleRecord ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border border-indigo-200/80 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Single Answer Paper Scanned
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {currentUser?.school || 'MySchool'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div>
                    <p className="text-base font-black text-slate-900">{singleRecord.name || 'Unknown Student'}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      Scanned Roll No: #{singleRecord.rollNo || 'N/A'} {extractedData.detectedClass ? `• ${extractedData.detectedClass}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-indigo-600">
                      {singleRecord.mark} <span className="text-xs text-slate-400 font-semibold">/ {singleRecord.maxMark || 20}</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {extractedData.detectedSubject || scanSubject}
                    </span>
                  </div>
                </div>

                {/* Match Status in Current Class Roster */}
                <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                  {matchedStudentInRoster ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200">
                      <UserCheck className="w-4 h-4 shrink-0" />
                      <span>
                        Matches Roster: <strong>{matchedStudentInRoster.name}</strong> (Roll #{matchedStudentInRoster.rollNo})
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
                      <span className="text-xs font-bold text-amber-900">
                        ⚠️ Student &ldquo;{singleRecord.name}&rdquo; not automatically found in Class 8-A.
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap">Assign score to:</span>
                        <select
                          value={selectedAssignRoll}
                          onChange={(e) => setSelectedAssignRoll(e.target.value)}
                          className="w-full text-xs font-semibold bg-white border border-amber-300 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Select Class 8-A Student --</option>
                          {students.map(s => (
                            <option key={s.rollNo} value={s.rollNo}>
                              #{s.rollNo} - {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* Multi-Student Register Table */
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                {extractedData.records?.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-white hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-500">#{r.rollNo}</span>
                      <span className="font-semibold text-slate-800">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status && (
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${r.status === 'P' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {r.status === 'P' ? 'Present' : 'Absent'}
                        </span>
                      )}
                      {r.mark !== undefined && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs">
                          {r.mark} / {r.maxMark || 25}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Target Attendance Date Selector & Indicator */}
            {scanType === 'attendance' && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 shadow-xs mt-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block">Apply Attendance To Date:</span>
                    <span className="text-[11px] font-semibold text-indigo-700 truncate block">
                      {new Date(targetDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                      {targetDate === todayStr && ' • Today'}
                    </span>
                  </div>
                </div>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => {
                    if (e.target.value) setTargetDate(e.target.value);
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-indigo-200 bg-white text-indigo-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs shrink-0"
                  title="Select date to record this attendance scan"
                />
              </div>
            )}

            {/* Action Buttons: RETAKE and CONFIRM */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake / Scan Another</span>
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>
                  {singleRecord 
                    ? `Confirm & Apply ${singleRecord.mark} Marks`
                    : `Confirm & Apply to ${new Date(targetDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                  }
                </span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Embedded Full PDF Viewer Modal */}
      {isViewingPdf && previewImage?.startsWith('data:application/pdf') && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsViewingPdf(false)}
        >
          <div 
            className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-600" />
                <span className="text-xs sm:text-sm font-bold text-slate-800">Scanned PDF Marksheet</span>
              </div>
              <div className="flex items-center gap-2">
                {pdfBlobUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(pdfBlobUrl, '_blank')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Open in New Tab</span>
                  </button>
                )}
                <button
                  onClick={() => setIsViewingPdf(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full bg-slate-100 p-2 sm:p-4 min-h-[65vh] flex flex-col items-center justify-center">
              {pdfBlobUrl ? (
                <object
                  data={pdfBlobUrl}
                  type="application/pdf"
                  className="w-full h-full min-h-[65vh] rounded-xl border border-slate-200 bg-white"
                >
                  <iframe
                    src={pdfBlobUrl}
                    className="w-full h-full min-h-[65vh] rounded-xl border border-slate-200 bg-white"
                    title="PDF Marksheet Document"
                  />
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl h-full w-full">
                    <FileText className="w-12 h-12 text-rose-500 mb-2" />
                    <p className="text-xs text-slate-600 mb-3">Inline PDF display not supported on this browser.</p>
                    <button
                      onClick={() => window.open(pdfBlobUrl, '_blank')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Browser Viewer</span>
                    </button>
                  </div>
                </object>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                  <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs font-medium">Loading PDF document...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
