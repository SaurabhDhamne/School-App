'use client';

import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  BookOpen, 
  GraduationCap, 
  Building2, 
  KeyRound, 
  LogOut, 
  Check, 
  ShieldCheck 
} from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, currentUser, onLogout, showToast }) {
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);

  if (!isOpen || !currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      showToast('⚠️ Password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('⚠️ Passwords do not match');
      return;
    }

    setLoadingPass(true);
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
        showToast('🔑 Password updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
        setIsChangingPass(false);
      } else {
        showToast(`⚠️ ${data.error || 'Failed to update password'}`);
      }
    } catch (err) {
      showToast('⚠️ Service error');
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md ${
              isAdmin ? 'bg-amber-600 shadow-amber-200' : 'bg-indigo-600 shadow-indigo-200'
            }`}>
              {isAdmin ? <ShieldCheck className="w-6 h-6" /> : currentUser.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{currentUser.name}</h3>
              <p className="text-xs text-slate-400">{currentUser.email}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Designation
            </span>
            <p className="font-bold text-slate-800">
              {isAdmin ? 'School Administrator' : (
                currentUser.role === 'class_teacher' ? 'Class Teacher' : 'Subject Teacher'
              )}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Assigned Class
            </span>
            <p className="font-bold text-slate-800">
              {currentUser.classTeacherOf || 'Class 8-A'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Assigned Subject
            </span>
            <p className="font-bold text-slate-800">
              {currentUser.subject || 'All Subjects'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              School
            </span>
            <p className="font-bold text-slate-800">
              {currentUser.school || 'MySchool'}
            </p>
          </div>
        </div>

        {/* Change Password Collapsible Section */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
          <div 
            onClick={() => setIsChangingPass(!isChangingPass)}
            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Change Password</span>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600">
              {isChangingPass ? 'Close' : 'Update'}
            </span>
          </div>

          {isChangingPass && (
            <form onSubmit={handleChangePassword} className="p-4 pt-1 flex flex-col gap-3 bg-white border-t border-slate-200">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">New Password</label>
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
                <label className="text-[11px] font-semibold text-slate-600">Confirm Password</label>
                <input 
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loadingPass}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{loadingPass ? 'Saving...' : 'Save New Password'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out from {currentUser.name}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

