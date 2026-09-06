'use client';

import React from 'react';
import Link from 'next/link';
import QubinkLogo from '@/components/Logo';
import {
  Printer,
  Truck,
  Store,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Sparkles,
  ShieldCheck,
  Zap,
  Check,
  QrCode,
  Layers,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F6FAFA] text-[#102A33] selection:bg-qubink-teal selection:text-white flex flex-col justify-between">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="transition-transform hover:opacity-95">
              <QubinkLogo size="md" />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-qubink-navy">
            <a href="#how-it-works" className="hover:text-qubink-teal transition-colors">
              How It Works
            </a>
            <a href="#services" className="hover:text-qubink-teal transition-colors">
              Services
            </a>
            <a href="#benefits" className="hover:text-qubink-teal transition-colors">
              Benefits
            </a>
            <Link href="/customer/home" className="hover:text-qubink-teal transition-colors">
              Nearby Shops
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/shop/register"
              className="hidden sm:flex px-3.5 py-2 rounded-xl border border-qubink-teal/30 text-xs font-bold text-qubink-teal hover:bg-qubink-softmint/50 transition-colors items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Create Shop Account</span>
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-qubink-teal text-white text-xs font-bold hover:bg-qubink-teal/90 shadow-xs transition-all flex items-center gap-1.5 hover:translate-y-[-1px]"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. HERO SECTION */}
        <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-qubink-teal/10 via-qubink-mint/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-qubink-softmint border border-qubink-teal/20 text-xs font-extrabold text-qubink-teal">
                <Sparkles className="w-4 h-4" />
                <span>Zero-Queue Xerox & Document Printing</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-[#082F3F] font-heading tracking-tight leading-[1.1]">
                Print. Collect.<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00A99D] to-[#42D6BD]">
                  Delivered.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-qubink-muted max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Never wait in Xerox shop queues again. Discover verified local photocopy centers, upload
                your files from your phone, choose B&W or color, and select{' '}
                <strong className="text-qubink-navy font-bold">5-minute shop pickup</strong> or{' '}
                <strong className="text-qubink-navy font-bold">doorstep delivery</strong>.
              </p>

              {/* Action CTAs */}
              <div className="flex items-center justify-center lg:justify-start flex-wrap gap-3 pt-2">
                <Link
                  href="/customer/upload"
                  className="px-6 py-3.5 rounded-2xl bg-[#00A99D] hover:bg-[#008f85] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:translate-y-[-1px]"
                >
                  <Printer className="w-4 h-4" />
                  <span>Upload & Print Document</span>
                </Link>

                <Link
                  href="/customer/home"
                  className="px-5 py-3.5 rounded-2xl bg-white border border-gray-300 hover:border-qubink-teal text-qubink-navy font-bold text-sm shadow-2xs hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-qubink-teal" />
                  <span>Find Nearby Shops</span>
                </Link>

                <Link
                  href="/shop/register"
                  className="px-5 py-3.5 rounded-2xl bg-qubink-navy hover:bg-[#062430] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:translate-y-[-1px]"
                >
                  <Store className="w-4 h-4 text-qubink-mint" />
                  <span>Create Account for Shop</span>
                </Link>
              </div>

              {/* Key Highlights */}
              <div className="flex items-center justify-center lg:justify-start flex-wrap gap-6 pt-4 text-xs text-qubink-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Zero Waiting in Line</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Secure 6-Digit Pickup Code</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Live Print Status</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual: Real-time Order Experience Showcase */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-gray-100 relative space-y-5">
                {/* Header Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-qubink-softmint text-qubink-teal flex items-center justify-center">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-qubink-navy font-heading">
                        Order #QB-84920
                      </h3>
                      <p className="text-[11px] text-qubink-muted">Sri Balaji Xerox & Prints (0.4 km)</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ready for Pickup
                  </span>
                </div>

                {/* File Specs Details */}
                <div className="p-4 rounded-2xl bg-gray-50/90 border border-gray-200/70 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-xs">
                        PDF
                      </div>
                      <div>
                        <p className="font-bold text-xs text-qubink-navy">Project_Final_Report.pdf</p>
                        <p className="text-[11px] text-qubink-muted">24 Pages • 2 Copies • A4</p>
                      </div>
                    </div>
                    <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">Ready</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-qubink-navy">
                      B&W Duplex
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-qubink-navy">
                      Spiral Binding
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-qubink-navy">
                      Shop Pickup
                    </span>
                  </div>
                </div>

                {/* Pickup Verification Code Preview */}
                <div className="p-4 rounded-2xl bg-qubink-softmint/50 border border-qubink-teal/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-qubink-muted block">
                      Shop Pickup Code
                    </span>
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-qubink-teal" />
                      <span className="font-mono font-black text-lg text-qubink-navy tracking-widest">
                        582 910
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-qubink-teal bg-white px-2.5 py-1 rounded-lg border border-qubink-teal/20 shadow-2xs">
                    Show at Counter
                  </span>
                </div>

                {/* Direct Action Link */}
                <Link
                  href="/customer/upload"
                  className="w-full py-3 rounded-xl bg-[#082F3F] hover:bg-[#082F3F]/90 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Start Your Print Order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS */}
        <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-y border-gray-200/60">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-qubink-teal bg-qubink-softmint px-3 py-1 rounded-full">
                Simple & Seamless
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-qubink-navy font-heading">
                How Qubink Works
              </h2>
              <p className="text-xs sm:text-sm text-qubink-muted">
                Get your urgent printouts, photocopy jobs, and bound documents in 3 quick steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="p-7 rounded-3xl bg-gray-50/80 border border-gray-200/80 space-y-4 text-center hover:shadow-sm transition-all hover:bg-white">
                <div className="w-14 h-14 rounded-2xl bg-qubink-softmint text-qubink-teal font-black text-xl flex items-center justify-center mx-auto shadow-2xs">
                  1
                </div>
                <h3 className="font-extrabold text-base text-qubink-navy font-heading">
                  Discover Nearby Shop
                </h3>
                <p className="text-xs text-qubink-muted leading-relaxed">
                  Use GPS to find verified Xerox and print shops within 5 KM with ratings, open hours, and custom services.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-gray-50/80 border border-gray-200/80 space-y-4 text-center hover:shadow-sm transition-all hover:bg-white">
                <div className="w-14 h-14 rounded-2xl bg-qubink-softmint text-qubink-teal font-black text-xl flex items-center justify-center mx-auto shadow-2xs">
                  2
                </div>
                <h3 className="font-extrabold text-base text-qubink-navy font-heading">
                  Upload & Customize
                </h3>
                <p className="text-xs text-qubink-muted leading-relaxed">
                  Upload PDFs, scan via mobile camera, or pick images. Choose B&W or Color, paper size, and spiral binding.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-gray-50/80 border border-gray-200/80 space-y-4 text-center hover:shadow-sm transition-all hover:bg-white">
                <div className="w-14 h-14 rounded-2xl bg-qubink-softmint text-qubink-teal font-black text-xl flex items-center justify-center mx-auto shadow-2xs">
                  3
                </div>
                <h3 className="font-extrabold text-base text-qubink-navy font-heading">
                  Collect or Delivered
                </h3>
                <p className="text-xs text-qubink-muted leading-relaxed">
                  Track live status on your phone. Show your 6-digit pickup PIN at the counter, or receive fast doorstep delivery.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. PRINTING SERVICES */}
        <section id="services" className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-qubink-teal bg-qubink-softmint px-3 py-1 rounded-full">
                Full-Service Catalog
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-qubink-navy font-heading">
                Comprehensive Printing Solutions
              </h2>
              <p className="text-xs sm:text-sm text-qubink-muted">
                Transparent catalog rates set directly by verified local printing partners.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-3 hover:border-qubink-teal transition-all">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 text-qubink-navy flex items-center justify-center font-bold text-sm">
                  B&W
                </div>
                <h3 className="font-bold text-sm text-qubink-navy">Xerox & Black/White</h3>
                <p className="text-xs text-qubink-muted leading-relaxed">
                  Fast single or double-sided photocopying on standard 75 GSM bright white paper.
                </p>
                <p className="text-xs font-semibold text-qubink-teal">Single & Double-Sided Options</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-3 hover:border-qubink-teal transition-all">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                  CLR
                </div>
                <h3 className="font-bold text-sm text-qubink-navy">High-Res Color Printing</h3>
                <p className="text-xs text-qubink-muted leading-relaxed">
                  Vibrant laser & inkjet color prints for project reports, presentations, and charts.
                </p>
                <p className="text-xs font-semibold text-qubink-teal">Laser & Inkjet Color Quality</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-3 hover:border-qubink-teal transition-all">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-qubink-navy">Binding & Finishing</h3>
                <p className="text-xs text-qubink-muted leading-relaxed">
                  Spiral coil, comb binding, transparent covers, and soft thermal book binding.
                </p>
                <p className="text-xs font-semibold text-qubink-teal">Spiral, Comb & Soft Cover</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-3 hover:border-qubink-teal transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-qubink-navy">Doorstep Delivery</h3>
                <p className="text-xs text-qubink-muted leading-relaxed">
                  Direct dispatch by verified shop partners to your college hostel, office, or home.
                </p>
                <p className="text-xs font-semibold text-qubink-teal">Fast Campus & Home Delivery</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. BENEFITS */}
        <section id="benefits" className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200/60">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-qubink-navy font-heading">
                Why Thousands Choose Qubink
              </h2>
              <p className="text-xs sm:text-sm text-qubink-muted">
                Built specifically to solve long waits at college campus & neighborhood Xerox centers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-gray-200/70 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-qubink-softmint text-qubink-teal flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-qubink-navy">Save 20-30 Minutes per Order</h3>
                <p className="text-xs text-qubink-muted leading-relaxed">
                  No more standing outside shops while documents load from pendrives or WhatsApp web.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-gray-200/70 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-qubink-softmint text-qubink-teal flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-qubink-navy">100% Privacy Protection</h3>
                <p className="text-xs text-qubink-muted leading-relaxed">
                  Your files are shared only with the selected shop for printing, without exposing your phone to public computers.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-gray-200/70 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-qubink-softmint text-qubink-teal flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-qubink-navy">Exact Transparent Pricing</h3>
                <p className="text-xs text-qubink-muted leading-relaxed">
                  Know the exact cost before sending the job. No surprise charges or confusing per-page calculations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. CALL TO ACTION BANNER */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto rounded-3xl bg-[#082F3F] p-8 sm:p-12 text-center text-white relative overflow-hidden space-y-6 shadow-xl">
            <div className="space-y-2 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-black font-heading">
                Ready to Print Without the Queue?
              </h2>
              <p className="text-xs sm:text-sm text-gray-300">
                Upload your document now and collect it hot from the printer in 5 minutes.
              </p>
            </div>

            <div className="flex items-center justify-center flex-wrap gap-3 pt-2">
              <Link
                href="/customer/upload"
                className="px-6 py-3.5 rounded-xl bg-qubink-teal hover:bg-qubink-teal/90 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <span>Upload Document</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
              >
                <span>Create Free Account</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 7. FOOTER */}
      <footer className="bg-[#082F3F] text-white pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          {/* Main 4-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-white/10">
            {/* Column 1: Brand & Overview (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-4">
              <Link href="/" className="inline-block">
                <QubinkLogo size="md" lightText />
              </Link>
              <p className="text-xs text-gray-300 leading-relaxed max-w-sm">
                India’s leading on-demand Xerox, printing, and binding network. Discover verified local print shops, configure custom print specs, and get instant pickup or fast doorstep delivery.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-qubink-mint font-semibold">
                  Zero Waiting Queue
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-qubink-mint font-semibold">
                  GPS Shop Discovery
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-qubink-mint font-semibold">
                  Verified Partners
                </span>
              </div>
            </div>

            {/* Column 2: Printing Services (lg:col-span-3) */}
            <div className="lg:col-span-3 space-y-3 text-xs">
              <h4 className="font-extrabold text-qubink-mint uppercase tracking-wider text-[11px]">
                Printing Services
              </h4>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-qubink-teal" />
                  <span>B&W & Color Xerox Copies</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-qubink-teal" />
                  <span>A4 & A3 Document Printing</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-qubink-teal" />
                  <span>Spiral & Thermal Book Binding</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-qubink-teal" />
                  <span>Lamination & Certificate Finishing</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-qubink-teal" />
                  <span>Express Doorstep Delivery</span>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer App (lg:col-span-2) */}
            <div className="lg:col-span-2 space-y-3 text-xs">
              <h4 className="font-extrabold text-qubink-mint uppercase tracking-wider text-[11px]">
                Customer App
              </h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link href="/customer/home" className="hover:text-qubink-mint transition-colors">
                    Nearby Print Shops
                  </Link>
                </li>
                <li>
                  <Link href="/customer/upload" className="hover:text-qubink-mint transition-colors">
                    Upload & Configure
                  </Link>
                </li>
                <li>
                  <Link href="/customer/orders" className="hover:text-qubink-mint transition-colors">
                    Track Orders
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-qubink-mint transition-colors">
                    Help & Support
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-qubink-mint transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-qubink-mint transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Portals & Access (lg:col-span-3) */}
            <div className="lg:col-span-3 space-y-3 text-xs">
              <h4 className="font-extrabold text-qubink-mint uppercase tracking-wider text-[11px]">
                Portals & Partners
              </h4>
              <ul className="space-y-2.5 text-gray-300">
                <li>
                  <Link href="/shop/register" className="hover:text-qubink-mint transition-colors flex items-center justify-between group">
                    <span className="font-semibold text-white group-hover:text-qubink-mint">Create Account for Shop</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">New</span>
                  </Link>
                </li>
                <li>
                  <Link href="/shop/login" className="hover:text-qubink-mint transition-colors flex items-center justify-between">
                    <span>Shop Partner Login</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-qubink-teal/20 text-qubink-mint font-bold">Partner</span>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/login" className="hover:text-qubink-mint transition-colors flex items-center justify-between">
                    <span>Marketplace Admin Portal</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">Admin</span>
                  </Link>
                </li>
                <li className="pt-1 border-t border-white/10">
                  <Link href="/login" className="hover:text-qubink-mint transition-colors flex items-center justify-between">
                    <span>Customer Sign In</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-semibold">Google</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-300 font-medium">All Systems Operational</span>
              <span className="text-gray-500">•</span>
              <span>© {new Date().getFullYear()} QUBINK Technologies Pvt. Ltd. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-gray-400">
              <span className="hover:text-gray-300">Next.js PWA</span>
              <span>•</span>
              <span className="hover:text-gray-300">Location-Based Xerox Marketplace</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
