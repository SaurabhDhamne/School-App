'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-[#171340] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold border border-indigo-400/40 animate-bounce max-w-[90vw] text-center pointer-events-none">
      <Sparkles className="w-5 h-5 text-[#FF8A00] shrink-0" />
      <span>{message}</span>
    </div>
  );
}
