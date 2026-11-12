'use client';

import React, { useState } from 'react';
import { Mail, Send, X } from 'lucide-react';

export default function EmailModal({
  isOpen,
  onClose,
  data,
  onConfirmSend,
}) {
  if (!isOpen || !data) return null;

  const { student, type, subject: initialSubject, message: initialMessage } = data;
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState(initialMessage);

  const handleSend = () => {
    onConfirmSend({ student, type, subject, message });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {type === 'attendance' ? 'Absence Alert to Parent' : 'Report Card Email Preview'}
              </h3>
              <p className="text-xs text-slate-400">Recipient: {student.parentEmail}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">Email Subject</label>
            <input 
              type="text" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Message Content</label>
            <textarea 
              rows={8}
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              className="w-full font-mono text-xs px-3 py-2.5 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 leading-relaxed"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Send Email to Parent</span>
          </button>
        </div>

      </div>
    </div>
  );
}

