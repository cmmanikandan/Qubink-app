'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="qubink-card p-6 sm:p-8 max-w-md w-full shadow-2xl border-gray-100 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo size="lg" showText={false} />
          </div>
          <h1 className="text-2xl font-extrabold text-qubink-navy font-heading">
            Reset Your Password
          </h1>
          <p className="text-xs text-qubink-muted">
            Enter your email and we will send you instructions to reset your password.
          </p>
        </div>

        {submitted ? (
          <div className="p-5 rounded-2xl bg-qubink-softmint border border-qubink-teal/30 text-center space-y-2 text-xs">
            <CheckCircle2 className="w-10 h-10 text-qubink-teal mx-auto" />
            <p className="font-bold text-qubink-navy">Recovery Link Dispatched</p>
            <p className="text-qubink-muted">
              If an account exists for {email}, a secure reset link has been dispatched to your inbox.
            </p>
            <div className="pt-2">
              <Link href="/login" className="text-qubink-teal font-bold hover:underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-qubink-dark mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-qubink-teal"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-qubink-teal text-white font-bold text-sm shadow-md shadow-qubink-teal/20 hover:bg-qubink-teal/90 transition-all"
            >
              Send Reset Instructions
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-qubink-muted hover:text-qubink-navy"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
