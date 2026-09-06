'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Shield, AlertCircle } from 'lucide-react';

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-xs text-qubink-muted">
            Last Updated: September 2026 • Qubink Technologies Private Limited
          </p>
        </div>
      </div>

      {/* Main Terms Document Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6 text-xs text-qubink-dark leading-relaxed">
        <div className="p-3.5 rounded-2xl bg-qubink-softmint/60 border border-qubink-teal/20 text-qubink-teal flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="font-semibold text-xs leading-relaxed">
            Please read these terms carefully before placing printing orders on Qubink. By utilizing the platform, you agree to comply with all guidelines outlined below.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-qubink-navy uppercase tracking-wider font-heading">
            1. The Qubink Marketplace Platform
          </h2>
          <p>
            Qubink connects customers (students, professionals, individuals) with independent local photocopy centers and digital printing shops (&ldquo;Shop Partners&rdquo;). Qubink facilitates seamless digital file uploads, print configuration, order queueing, status notifications, and contactless counter pickup via secret 6-digit PIN verification.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-qubink-navy uppercase tracking-wider font-heading">
            2. Document Ownership & Content Policy
          </h2>
          <p>
            By uploading files (PDF, DOCX, PPTX, JPG, PNG) to Qubink, you certify that you have the lawful right, license, or copyright permission to reproduce the contents. You strictly agree not to submit:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-qubink-muted">
            <li>Counterfeit legal documents, sovereign currency replicas, or fraudulent government IDs.</li>
            <li>Defamatory, obscene, violent, or unlawful materials prohibited under Indian law.</li>
            <li>Proprietary examination papers, university keys, or restricted academic material without authorization.</li>
          </ul>
          <p>
            Shop Partners reserve the right to decline print jobs that violate local laws or legal copyright guidelines.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-qubink-navy uppercase tracking-wider font-heading">
            3. Order Placement & Print Customizations
          </h2>
          <p>
            You are solely responsible for verifying document specifications prior to payment, including:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-qubink-muted">
            <li>Page orientation (Portrait vs. Landscape).</li>
            <li>Color profile (Black & White grayscale vs. Full Color).</li>
            <li>Duplex settings (Single-sided vs. Back-to-Back).</li>
            <li>Additional finishing services (Spiral Binding, Soft Binding, Thermal Lamination).</li>
          </ul>
          <p>
            Pricing is established individually by each Shop Partner and transparently broken down at checkout prior to confirmation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-qubink-navy uppercase tracking-wider font-heading">
            4. Counter Pickup & 6-Digit PIN Protocol
          </h2>
          <p>
            When an order status updates to &ldquo;Ready for Pickup&rdquo;, a dynamic 6-digit Secret Pickup PIN is generated exclusively for your order. To prevent unauthorized document theft, Shop Partners will only release prints upon counter presentation of this matching 6-digit PIN. Orders remain reserved at the counter for up to 24 hours.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-qubink-navy uppercase tracking-wider font-heading">
            5. Cancellations & Refund Policy
          </h2>
          <p>
            Orders can be cancelled with a 100% instant refund at any time before the shop begins physical printing. Once printing has commenced, cancellation is no longer possible. In the event of printer smudging, missing pages, or incorrect binding, report the issue via our <Link href="/help" className="text-qubink-teal font-bold underline">Help Center</Link> within 2 hours of counter collection for a free reprint or full credit.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-qubink-navy uppercase tracking-wider font-heading">
            6. Governing Jurisdiction
          </h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or related to the service shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.
          </p>
        </section>
      </div>
    </div>
  );
}
