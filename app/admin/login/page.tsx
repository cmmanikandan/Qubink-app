'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import QubinkLogo from '@/components/Logo';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setRole, setCurrentUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter your admin credentials.');
      setSuccessMsg(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const isAdminEmail =
      cleanEmail === 'admin@qubink.com' ||
      cleanEmail === 'manikandanprabhu37@gmail.com' ||
      cleanEmail.includes('admin');
    const isValidAdminPass =
      password === 'admin123' ||
      password === 'admin' ||
      password === 'qubinkAdmin2026' ||
      (isAdminEmail && password.length >= 5);

    if (!isAdminEmail || !isValidAdminPass) {
      setLoading(false);
      setErrorMsg('Incorrect email or password. Please verify your admin credentials.');
      return;
    }

    setSuccessMsg('✓ Credentials verified! Redirecting to Admin Control Center...');
    setTimeout(() => {
      setRole('admin');
      setCurrentUser({
        id: 'admin-master-1',
        fullName: 'Marketplace Super Admin',
        name: 'Marketplace Super Admin',
        email,
        role: 'admin',
      });
      router.push('/admin');
    }, 700);
  };



  return (
    <div className="min-h-screen bg-[#082F3F] text-white flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-purple-500 selection:text-white">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
          Internal Console
        </span>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        <div className="bg-[#0b3c50] rounded-3xl p-7 sm:p-9 shadow-2xl border border-white/15 space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="inline-block transition-transform hover:scale-105">
              <QubinkLogo size="lg" lightText />
            </div>
            <div className="pt-2 flex items-center justify-center gap-1.5 text-purple-300 font-extrabold text-xs uppercase tracking-wider">
              <KeyRound className="w-4 h-4" />
              <span>Marketplace Administration</span>
            </div>
            <h1 className="text-2xl font-black text-white font-heading tracking-tight">
              Admin Control Center
            </h1>
            <p className="text-xs text-gray-300 leading-relaxed">
              Authenticate with administrative credentials to manage shops, verify registrations, and view platform metrics.
            </p>
          </div>

          {/* Green Success Alert */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn shadow-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* Red Error Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5 animate-fadeIn shadow-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span className="font-bold">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-200">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@qubink.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-xs text-white bg-black/20 transition-colors focus:outline-none ${
                    successMsg
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : errorMsg
                      ? 'border-red-400 ring-2 ring-red-400/30'
                      : 'border-white/20 focus:border-purple-400'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-200">
                Admin Master Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-xs text-white bg-black/20 transition-colors focus:outline-none ${
                    successMsg
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : errorMsg
                      ? 'border-red-400 ring-2 ring-red-400/30'
                      : 'border-white/20 focus:border-purple-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:translate-y-[-1px] disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>


        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-gray-400 pt-6">
        <p>© {new Date().getFullYear()} Qubink Technologies Inc. Restricted internal system.</p>
      </div>
    </div>
  );
}
