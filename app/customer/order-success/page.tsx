'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/store';
import confetti from 'canvas-confetti';
import { CheckCircle2, QrCode, ArrowRight, Home, FileText } from 'lucide-react';

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const { orders } = useApp();
  const order = orders.find((o) => o.id === orderId) || orders[0];

  useEffect(() => {
    // Fire confetti on successful placement
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-qubink-navy font-heading">
          Order Placed Successfully!
        </h1>
        <p className="text-xs text-qubink-muted mt-1 max-w-sm mx-auto">
          Your document has been transmitted to <strong>{order?.shopName}</strong>. The shop is
          reviewing the job now.
        </p>
      </div>

      {/* Verification Card */}
      <div className="qubink-card p-6 bg-gradient-to-br from-white to-qubink-softmint/20 border-qubink-teal/20 space-y-4 shadow-md text-center">
        <div>
          <span className="text-[11px] font-bold text-qubink-muted uppercase tracking-wider block">
            Order Reference
          </span>
          <span className="text-lg font-extrabold text-qubink-navy font-heading">
            {order?.orderNumber}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 inline-block shadow-xs">
          <QrCode className="w-24 h-24 mx-auto text-qubink-navy" />
          <span className="block text-[11px] font-bold text-qubink-muted mt-2">
            Verification Code
          </span>
          <span className="text-xl font-extrabold tracking-widest text-qubink-teal font-mono">
            {order?.pickupCode}
          </span>
        </div>

        <p className="text-xs text-qubink-muted">
          Show this QR code or 6-digit OTP at the counter when collecting your prints.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <button
          onClick={() => router.push(`/customer/order/${order?.id}`)}
          className="w-full py-3.5 rounded-2xl bg-qubink-teal text-white font-bold text-sm shadow-lg shadow-qubink-teal/25 hover:bg-qubink-teal/90 flex items-center justify-center gap-2"
        >
          <span>Track Order Live</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => router.push('/customer/orders')}
          className="w-full py-3 rounded-2xl bg-white border border-gray-200 text-qubink-navy font-bold text-xs hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>View All Orders</span>
        </button>
      </div>
    </div>
  );
}
