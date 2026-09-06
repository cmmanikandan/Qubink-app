'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import {
  ArrowLeft,
  Bell,
  Smartphone,
  Shield,
  Download,
  Trash2,
  LogOut,
  CheckCircle2,
  MapPin,
  ChevronRight,
} from 'lucide-react';

export default function CustomerSettingsPage() {
  const router = useRouter();
  const { currentUser, setRole } = useApp();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [gpsPrecision, setGpsPrecision] = useState(true);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 text-qubink-navy"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-qubink-navy font-heading">
            App Settings
          </h1>
          <p className="text-xs text-qubink-muted">PWA controls, notifications & preferences</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* PWA & Mobile Installation */}
        <div className="qubink-card p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-qubink-softmint text-qubink-teal flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-qubink-navy">Install Qubink Android App</h3>
              <p className="text-xs text-qubink-muted mt-0.5">
                Install as a native Progressive Web App (PWA) with offline support and instant launch.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if ('serviceWorker' in navigator) {
                alert('Qubink is already installable! Look for the "Install" icon in your browser address bar.');
              }
            }}
            className="w-full py-2.5 rounded-xl bg-qubink-teal text-white font-bold text-xs shadow-md hover:bg-qubink-teal/90 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Install on Home Screen</span>
          </button>
        </div>

        {/* Saved Addresses Navigation */}
        <Link
          href="/customer/addresses"
          className="qubink-card p-5 flex items-center justify-between hover:border-qubink-teal transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-qubink-softmint text-qubink-teal flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-qubink-navy group-hover:text-qubink-teal transition-colors">
                Saved Delivery Addresses
              </h3>
              <p className="text-xs text-qubink-muted mt-0.5">
                Edit addresses, change landmarks, and set default drop location
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-qubink-teal transition-colors" />
        </Link>

        {/* Preferences */}
        <div className="qubink-card p-5 space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-qubink-muted">
            Preferences & Permissions
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-qubink-teal" />
              <div>
                <p className="text-xs font-bold text-qubink-navy">Order Status Push Alerts</p>
                <p className="text-[11px] text-qubink-muted">
                  Get notified when shop starts printing or marks ready
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="w-4 h-4 text-qubink-teal rounded"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-qubink-teal" />
              <div>
                <p className="text-xs font-bold text-qubink-navy">High-Accuracy GPS</p>
                <p className="text-[11px] text-qubink-muted">
                  Calculate real-time road distance to nearby Xerox shops
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={gpsPrecision}
              onChange={(e) => setGpsPrecision(e.target.checked)}
              className="w-4 h-4 text-qubink-teal rounded"
            />
          </div>
        </div>

        {/* Security & Authentication Info */}
        <div className="qubink-card p-5 space-y-2 text-xs">
          <h3 className="font-bold text-xs uppercase tracking-wider text-qubink-muted">
            Authentication & Security
          </h3>
          <p className="text-qubink-dark">
            <strong>Authenticated Profile:</strong> {currentUser.fullName || currentUser.name || 'Customer'} ({currentUser.email})
          </p>
          <p className="text-qubink-muted font-mono text-[11px]">
            Role: <strong>customer</strong> • Synced via Supabase Profiles
          </p>
        </div>

        {/* Log out */}
        <button
          onClick={() => {
            router.push('/login');
          }}
          className="w-full py-3 rounded-2xl bg-red-50 text-red-600 font-bold text-xs border border-red-200 hover:bg-red-100 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Qubink</span>
        </button>
      </div>
    </div>
  );
}
