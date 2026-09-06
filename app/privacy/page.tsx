'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Trash2, Key, Database, RefreshCw } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-7 selection:bg-qubink-teal selection:text-white">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 sm:p-2.5 rounded-xl hover:bg-gray-100 text-qubink-navy transition-colors cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-qubink-navy font-heading">
            Privacy & Document Security Policy
          </h1>
          <p className="text-xs text-qubink-muted">
            Our ironclad commitment to your personal data & document confidentiality
          </p>
        </div>
      </div>

      {/* 24-Hour Auto Shredding Guarantee Hero Banner */}
      <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-tr from-qubink-navy via-[#0B394A] to-qubink-teal text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-qubink-mint">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero Long-Term Storage Guarantee</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black font-heading leading-tight">
          Your Documents Are Automatically Shredded After 24 Hours
        </h2>
        <p className="text-xs text-gray-200 leading-relaxed max-w-2xl">
          At Qubink, we treat your college assignments, identity cards, resumes, and legal papers with bank-grade confidentiality. Uploaded files are strictly accessible only during your active print window and are automatically permanently deleted from all partner terminals and servers within 24 hours of order fulfillment.
        </p>
      </div>

      {/* Core Privacy Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Trash2 className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-xs text-qubink-navy">Auto Deletion (24h)</h3>
          <p className="text-[11px] text-qubink-muted leading-relaxed">
            Cron jobs automatically delete raw files and generated previews after 24 hours.
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-xs text-qubink-navy">TLS 1.3 Encryption</h3>
          <p className="text-[11px] text-qubink-muted leading-relaxed">
            All document streams and metadata are encrypted in transit and encrypted at rest.
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Key className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-xs text-qubink-navy">6-Digit Secret PIN</h3>
          <p className="text-[11px] text-qubink-muted leading-relaxed">
            Prints are sealed and handed over only upon verified counter PIN confirmation.
          </p>
        </div>
      </div>

      {/* Detailed Policy Text */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6 text-xs text-qubink-dark leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-black text-qubink-navy uppercase tracking-wider font-heading">
            1. What Information We Collect
          </h2>
          <p>
            To provide on-demand printing services, Qubink collects only minimal essential data:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-qubink-muted">
            <li><strong>Google Identity Information:</strong> Name, verified email address, and avatar picture provided through Google Single Sign-On.</li>
            <li><strong>Contact Number:</strong> 10-digit Indian mobile number for counter pickup PIN notifications and order SMS.</li>
            <li><strong>Location Data:</strong> Approximate neighborhood or GPS coordinates to discover printing shops within your search radius.</li>
            <li><strong>Saved Delivery Drop Points:</strong> Room, hostel, home, or office addresses you voluntarily store.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-qubink-navy uppercase tracking-wider font-heading">
            2. Strict No-Data-Selling Commitment
          </h2>
          <p>
            We do not sell, rent, monetize, or trade your personal information or document contents to third-party advertisers, data aggregators, or marketing networks.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-qubink-navy uppercase tracking-wider font-heading">
            3. Shop Partner Access Protocol
          </h2>
          <p>
            Partner Xerox operators are granted temporary read access to render your document directly onto their networked production printers. Operators are legally bound by confidentiality agreements and are strictly barred from storing local copies or duplicating your files.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-qubink-navy uppercase tracking-wider font-heading">
            4. Your Rights & Data Deletion Requests
          </h2>
          <p>
            You may request complete erasure of your account, saved addresses, and profile data at any time by contacting our Privacy Office at{' '}
            <a href="mailto:privacy@qubink.in" className="text-qubink-teal font-bold underline">
              privacy@qubink.in
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
