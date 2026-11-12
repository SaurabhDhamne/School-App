'use client';

import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Check, 
  Layers, 
  FileText 
} from 'lucide-react';

export default function ScanModal({
  isOpen,
  onClose,
  initialType = 'marksheet',
  students,
  onApplyData,
  showToast
}) {
  const [scanType, setScanType] = useState(initialType);
  const [scanSubject, setScanSubject] = useState('maths');
  const [previewImage, setPreviewImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
        showToast('✨ Gemini AI extracted paper records successfully!');
      } else {
        showToast(`⚠️ AI OCR: ${json.error || 'Failed to process'}`);
      }
    } catch (err) {
      showToast('⚠️ AI Vision service error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!extractedData) return;
    onApplyData(scanType, scanSubject, extractedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        
        {/* Hidden inputs */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => handleImageSelected(e.target.files?.[0])}
          accept="image/*" 
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
                <span>AI Vision Paper Scanner</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Gemini 2.0 Flash
                </span>
              </h3>
              <p className="text-xs text-slate-400">Digitize handwritten registers or exam answer booklets</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Type & Subject Picker */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setScanType('marksheet'); setExtractedData(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
              scanType === 'marksheet'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Exam Marksheet / Booklet
          </button>
          <button
            type="button"
            onClick={() => { setScanType('attendance'); setExtractedData(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
              scanType === 'attendance'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Attendance Register
          </button>
        </div>

        {scanType === 'marksheet' && (
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Subject:</span>
            <select
              value={scanSubject}
              onChange={(e) => setScanSubject(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
            >
              {subjects.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
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
              <p className="text-[10px] text-slate-400">Use phone/webcam camera</p>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300 transition-all text-slate-700"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold">Upload Image / File</p>
              <p className="text-[10px] text-slate-400">JPG, PNG, or photo scan</p>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-h-48 flex items-center justify-center">
              <img src={previewImage} alt="Scan Preview" className="object-contain max-h-48 w-full" />
              <button
                onClick={() => { setPreviewImage(null); setExtractedData(null); }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAnalyzing && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs font-bold text-indigo-600 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gemini Vision AI is analyzing handwritten entries...</span>
              </div>
            )}
          </div>
        )}

        {/* Extracted Data Preview & Arithmetic Error Warning */}
        {extractedData && (
          <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Extracted {extractedData.records?.length || 0} Records</span>
              </p>
              <span className="text-[10px] font-semibold text-slate-400">
                Confidence: High
              </span>
            </div>

            {/* Arithmetic check alert if present */}
            {extractedData.arithmeticChecks && extractedData.arithmeticChecks.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Arithmetic Discrepancy Auto-Corrected:</p>
                  <p className="text-[11px] text-amber-800">{extractedData.arithmeticChecks[0].note}</p>
                </div>
              </div>
            )}

            {/* Mini records table */}
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
                        {r.mark} / 25
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Confirm Apply */}
            <button
              type="button"
              onClick={handleApply}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Apply to Student Database</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

