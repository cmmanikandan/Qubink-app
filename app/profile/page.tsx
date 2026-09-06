'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import PhoneInput from '@/components/PhoneInput';
import {
  User,
  FileText,
  MapPin,
  Bell,
  HelpCircle,
  Shield,
  FileCode,
  LogOut,
  ChevronRight,
  Edit3,
  CheckCircle2,
  Lock,
  X,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, role, setCurrentUser, addresses, logout } = useApp();

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(currentUser.fullName || currentUser.name || '');
  const [editPhone, setEditPhone] = useState(currentUser.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleOpenEdit = () => {
    setEditName(currentUser.fullName || currentUser.name || '');
    setEditPhone(currentUser.phone || '');
    setSaveSuccess(false);
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      setCurrentUser({
        fullName: editName.trim(),
        name: editName.trim(),
        phone: editPhone.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        setShowEditModal(false);
      }, 700);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const handleConfirmLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6 selection:bg-qubink-teal selection:text-white">
      {/* Profile Card Header */}
      <div className="qubink-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-qubink-softmint/30 border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-4 min-w-0">
          {/* Google Display Picture / Initials */}
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName || 'User Profile'}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-qubink-teal/40 shadow-sm shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-qubink-navy to-qubink-teal text-white flex items-center justify-center text-xl font-black shadow-sm shrink-0">
              {currentUser.fullName
                ? currentUser.fullName.slice(0, 2).toUpperCase()
                : currentUser.name
                ? currentUser.name.slice(0, 2).toUpperCase()
                : 'CU'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-qubink-navy font-heading truncate">
                {currentUser.fullName || currentUser.name || 'Qubink Customer'}
              </h1>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-qubink-teal/10 text-qubink-teal border border-qubink-teal/20 shrink-0">
                {role}
              </span>
            </div>
            <p className="text-xs text-qubink-muted truncate mt-0.5">
              {currentUser.email || 'Google Account'}
            </p>
            <p className="text-xs text-qubink-dark font-semibold mt-1 flex items-center gap-1.5">
              {currentUser.phone ? (
                <span>{currentUser.phone}</span>
              ) : (
                <span className="text-gray-400 font-normal italic">No mobile number added</span>
              )}
            </p>
          </div>
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={handleOpenEdit}
          className="px-4 py-2 rounded-xl bg-white hover:bg-qubink-softmint text-qubink-teal border border-qubink-teal/30 text-xs font-bold shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center hover:translate-y-[-1px]"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Saved Addresses Banner */}
      <Link
        href="/customer/addresses"
        className="qubink-card p-5 flex items-center justify-between hover:border-qubink-teal transition-all group cursor-pointer border border-gray-200/80 shadow-xs"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-qubink-softmint text-qubink-teal flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-qubink-navy font-heading group-hover:text-qubink-teal transition-colors">
                Saved Addresses
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-qubink-softmint text-qubink-teal font-bold">
                {addresses.length} Saved
              </span>
            </div>
            <p className="text-xs text-qubink-muted mt-0.5">
              Manage hostel, home, or office drop-off locations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-qubink-teal">
          <span>Manage</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </Link>

      {/* Navigation Menu */}
      <div className="qubink-card divide-y divide-gray-100 overflow-hidden text-xs font-semibold border border-gray-200/80 shadow-xs">
        <Link
          href="/orders"
          className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-qubink-navy"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-qubink-teal" />
            <span>My Print Orders</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link
          href="/notifications"
          className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-qubink-navy"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-qubink-teal" />
            <span>Notifications & Alerts</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link
          href="/help"
          className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-qubink-navy"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-4 h-4 text-qubink-teal" />
            <span>Help & Support Center</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link
          href="/terms"
          className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-qubink-navy"
        >
          <div className="flex items-center gap-3">
            <FileCode className="w-4 h-4 text-gray-500" />
            <span>Terms of Service</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link
          href="/privacy"
          className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-qubink-navy"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Privacy & Document Security Policy</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        {/* Sign Out Button (Prompts Confirmation) */}
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-red-50/70 transition-colors text-red-600 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 font-bold">
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Sign Out</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-300" />
        </button>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="qubink-modal-backdrop flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-qubink-teal" />
                <h3 className="text-base font-extrabold text-qubink-navy font-heading">
                  Edit Profile
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block font-bold text-qubink-navy">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-qubink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-qubink-navy focus:outline-none focus:border-qubink-teal bg-gray-50/50"
                  />
                </div>
              </div>

              {/* Mobile Phone Number (Default India +91) */}
              <div className="space-y-1.5">
                <label className="block font-bold text-qubink-navy">
                  Mobile Number (For Order & Pickup PIN SMS) *
                </label>
                <PhoneInput
                  value={editPhone}
                  onChange={setEditPhone}
                  placeholder="98765 43210"
                  required
                />
              </div>

              {/* Read-Only Google Email */}
              <div className="space-y-1.5">
                <label className="block font-bold text-qubink-muted">Google Account Email</label>
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-100/70 text-qubink-muted">
                  <span className="font-medium truncate">{currentUser.email || 'Signed in with Google'}</span>
                  <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-2" />
                </div>
                <p className="text-[10px] text-gray-400">Email is linked to your Google sign-in</p>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-qubink-muted font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-qubink-teal text-white font-bold shadow-md hover:bg-qubink-teal/90 cursor-pointer transition-all disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="qubink-modal-backdrop flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative space-y-4 animate-in zoom-in-95 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-qubink-navy font-heading">
                Sign Out of Qubink?
              </h3>
              <p className="text-xs text-qubink-muted leading-relaxed">
                Are you sure you want to sign out? You can sign right back in anytime using your Google account.
              </p>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-qubink-navy font-bold text-xs hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md hover:bg-red-700 cursor-pointer transition-all"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

