'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import QubinkLogo from '@/components/Logo';
import {
  auth,
  signInWithEmailAndPassword,
} from '@/lib/firebase';
import { syncFirebaseProfile } from '@/lib/supabase';
import {
  Store,
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

export default function ShopLoginPage() {
  const router = useRouter();
  const { setRole, setCurrentUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      setSuccessMsg(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate shop credentials
    const cleanEmail = email.trim().toLowerCase();
    const isOwnerAccount = cleanEmail === 'owner@fastprint.com';
    const isKnownShopEmail = cleanEmail.includes('shop') || cleanEmail.includes('print') || cleanEmail.includes('mkce') || cleanEmail.includes('xerox') || cleanEmail.includes('qubink') || cleanEmail.includes('gmail.com');

    // If known demo account, password must match shopPass123!
    if (isOwnerAccount && password !== 'shopPass123!') {
      setLoading(false);
      setErrorMsg('Incorrect email or password. Please verify your credentials.');
      return;
    }

    if (password.length < 6) {
      setLoading(false);
      setErrorMsg('Incorrect email or password. Password must be at least 6 characters.');
      return;
    }

    try {
      let firebaseUid = `shop-owner-${Date.now()}`;

      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('Mock')) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          firebaseUid = userCredential.user.uid;
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential') {
            setLoading(false);
            setErrorMsg('Incorrect email or password. Please try again.');
            return;
          }
        }
      }

      const profile = await syncFirebaseProfile(firebaseUid, {
        full_name: email.split('@')[0],
        email,
        role: 'shop',
      });

      setRole('shop');
      setCurrentUser({
        id: profile?.id || firebaseUid,
        fullName: profile?.full_name || email.split('@')[0],
        name: profile?.full_name || email.split('@')[0],
        email,
        role: 'shop',
      });

      // Show green success alert before redirect
      setSuccessMsg('✓ Credentials verified! Redirecting to Partner Portal...');
      setTimeout(() => {
        router.push('/shop-portal');
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('owner@fastprint.com');
    setPassword('shopPass123!');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#F6FAFA] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-qubink-teal selection:text-white">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-qubink-navy hover:border-qubink-teal hover:text-qubink-teal shadow-2xs transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-qubink-teal/10 text-qubink-teal border border-qubink-teal/20">
          Partner Portal
        </span>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-xl border border-gray-200/80 space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="inline-block transition-transform hover:scale-105">
              <QubinkLogo size="lg" />
            </div>
            <div className="pt-2 flex items-center justify-center gap-2 text-qubink-teal font-extrabold text-xs uppercase tracking-wider">
              <Store className="w-4 h-4" />
              <span>Print Shop Partner Portal</span>
            </div>
            <h1 className="text-2xl font-black text-qubink-navy font-heading tracking-tight">
              Sign In to Your Shop
            </h1>
            <p className="text-xs text-qubink-muted leading-relaxed">
              Manage incoming print queues, pickup PIN verifications, and earnings.
            </p>
          </div>

          {/* Green Success Alert */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn shadow-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* Red Error Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-700 text-xs flex items-center gap-2.5 animate-fadeIn shadow-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span className="font-bold">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-qubink-navy">
                Partner Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-qubink-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@yourshop.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-xs text-qubink-navy bg-gray-50/50 transition-colors focus:outline-none ${
                    successMsg
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                      : errorMsg
                      ? 'border-red-400 ring-2 ring-red-400/20 bg-red-50/10'
                      : 'border-gray-200 focus:border-qubink-teal'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-qubink-navy">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-qubink-teal hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-qubink-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-xs text-qubink-navy bg-gray-50/50 transition-colors focus:outline-none ${
                    successMsg
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                      : errorMsg
                      ? 'border-red-400 ring-2 ring-red-400/20 bg-red-50/10'
                      : 'border-gray-200 focus:border-qubink-teal'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-qubink-teal hover:bg-qubink-teal/90 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 hover:translate-y-[-1px] cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>


        </div>

        {/* CTA to Register New Shop */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-qubink-navy">Don't have a shop account yet?</p>
            <p className="text-[11px] text-qubink-muted">Join the Qubink network & receive online print orders.</p>
          </div>
          <Link
            href="/shop/register"
            className="px-3.5 py-2 rounded-xl bg-qubink-navy hover:bg-[#062430] text-white text-xs font-bold transition-colors whitespace-nowrap"
          >
            Create Shop
          </Link>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-qubink-muted pt-6">
        <Link href="/login" className="hover:text-qubink-teal transition-colors">
          Are you a customer? Continue with Google &rarr;
        </Link>
      </div>
    </div>
  );
}
