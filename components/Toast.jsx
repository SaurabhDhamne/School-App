'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#171340] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-medium border border-indigo-400/30 animate-bounce">
      <Sparkles className="w-5 h-5 text-[#FF8A00]" />
      <span>{message}</span>
    </div>
  );
}

