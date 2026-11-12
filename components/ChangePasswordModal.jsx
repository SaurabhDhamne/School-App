'use client';

import React, { useState } from 'react';
import { Lock, X, Check, KeyRound } from 'lucide-react';

export default function ChangePasswordModal({ isOpen, onClose, currentUser, showToast }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      showToast('⚠️ Password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('⚠️ Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          userId: currentUser.id,
          newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('🔑 Password changed successfully!');
        onClose();
      } else {
        showToast(`⚠️ ${data.error || 'Failed to update password'}`);
      }
    } catch (e) {
      showToast('⚠️ Service error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Change Password</h3>
              <p className="text-xs text-slate-400">{currentUser.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">New Password</label>
            <input 
              type="password"
              required
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Confirm Password</label>
            <input 
              type="password"
              required
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Updating...' : 'Save New Password'}</span>
          </button>
        </form>

      </div>
    </div>
  );
}

