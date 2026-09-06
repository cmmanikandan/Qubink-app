'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageCircle,
  Mail,
  Phone,
  HelpCircle,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

const FAQS = [
  {
    q: 'How do I collect my order at the Xerox shop?',
    a: 'Once your documents are printed, you will receive a 6-digit Secret Pickup PIN in your Qubink app and via SMS. Simply walk up to the shop counter, mention your Order ID, and share the 6-digit PIN. The shop will hand over your printed documents instantly without waiting in line.',
  },
  {
    q: 'What happens to my uploaded documents after printing?',
    a: 'Qubink has a strict Zero Data Retention policy. Your uploaded PDF and Word documents are encrypted in transit and automatically shredded/deleted permanently from the shop terminal and our secure cloud storage within 24 hours of collection.',
  },
  {
    q: 'Can I cancel an order or get a refund?',
    a: 'You can cancel an order anytime before the shop partner starts printing ("Printing" status). If printing has not commenced, 100% of your payment is refunded immediately to your original payment method. If there is a print quality defect or missing pages, contact support within 2 hours for an instant free reprint or refund.',
  },
  {
    q: 'How do I choose between Black & White and Color printing?',
    a: 'During document upload, you can customize print settings per file: Black & White vs. Color, Single-Sided vs. Back-to-Back (Duplex), page ranges, number of copies, and optional spiral binding or lamination.',
  },
  {
    q: 'What are the shop pickup timings?',
    a: 'Each shop partner displays their verified opening and closing hours. Most university and campus print partners are open from 8:30 AM to 9:30 PM. Your order remains safely stored at the counter for up to 24 hours.',
  },
];

export default function HelpSupportPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Form State
  const [subject, setSubject] = useState('');
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setSubject('');
      setOrderId('');
      setMessage('');
    }, 4000);
  };

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
            Help & Customer Support
          </h1>
          <p className="text-xs text-qubink-muted">
            Fast resolution for print orders, counter pickups, and payments
          </p>
        </div>
      </div>

      {/* Direct Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <a
          href="https://wa.me/919876543210?text=Hello%20Qubink%20Support,%20I%20need%20help%20with%20my%20print%20order"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 rounded-2xl bg-white border border-gray-200/80 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <MessageCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-xs text-qubink-navy group-hover:text-emerald-600 transition-colors">
            WhatsApp Support
          </h3>
          <p className="text-[11px] text-qubink-muted mt-0.5">Average reply in ~3 mins</p>
          <span className="inline-block mt-2 text-[11px] font-bold text-emerald-600">
            Chat on WhatsApp &rarr;
          </span>
        </a>

        <a
          href="mailto:support@qubink.in"
          className="p-4 rounded-2xl bg-white border border-gray-200/80 hover:border-qubink-teal shadow-xs hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-qubink-softmint text-qubink-teal flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-xs text-qubink-navy group-hover:text-qubink-teal transition-colors">
            Email Helpdesk
          </h3>
          <p className="text-[11px] text-qubink-muted mt-0.5">support@qubink.in</p>
          <span className="inline-block mt-2 text-[11px] font-bold text-qubink-teal">
            Send Email &rarr;
          </span>
        </a>

        <a
          href="tel:+918045678900"
          className="p-4 rounded-2xl bg-white border border-gray-200/80 hover:border-blue-500 shadow-xs hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Phone className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-xs text-qubink-navy group-hover:text-blue-600 transition-colors">
            Helpline (Toll-Free)
          </h3>
          <p className="text-[11px] text-qubink-muted mt-0.5">Mon - Sun: 8 AM - 10 PM</p>
          <span className="inline-block mt-2 text-[11px] font-bold text-blue-600">
            Call Support &rarr;
          </span>
        </a>
      </div>

      {/* Contact Inquiry Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-qubink-navy font-heading">
            Send Us a Message
          </h2>
          <p className="text-xs text-qubink-muted">
            Have a question about an order or a shop partner? Fill in the form below and our team will follow up promptly.
          </p>
        </div>

        {isSubmitted && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Thank you! Your ticket has been registered. Our support team will get back to you shortly.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-qubink-navy">Subject / Issue Type *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Order pickup PIN not received"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-qubink-navy">Order ID (Optional)</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. ORD-98214"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-qubink-navy">Message Details *</label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or feedback in detail..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-qubink-teal text-xs text-qubink-navy bg-gray-50/50 font-medium"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-qubink-teal text-white font-bold text-xs shadow-md hover:bg-qubink-teal/90 flex items-center gap-1.5 cursor-pointer transition-all hover:translate-y-[-1px]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Ticket</span>
            </button>
          </div>
        </form>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-qubink-teal" />
          <h2 className="text-base font-extrabold text-qubink-navy font-heading">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-2">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left font-bold text-xs text-qubink-navy hover:text-qubink-teal transition-colors cursor-pointer"
                >
                  <span className="pr-4">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-qubink-teal shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-qubink-muted leading-relaxed border-t border-gray-100 bg-gray-50/30 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
