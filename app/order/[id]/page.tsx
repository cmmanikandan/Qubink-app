'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import {
  CheckCircle2,
  Clock,
  Printer,
  ShoppingBag,
  Truck,
  MapPin,
  Phone,
  QrCode,
  FileText,
  Star,
  ArrowLeft,
  XCircle,
  AlertCircle,
  Sparkles,
  Eye,
  Download,
  MessageCircle,
  Copy,
  Check,
  X,
  CreditCard,
  ShieldCheck,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { OrderStatus } from '@/types';

const getFileBadgeInfo = (filename?: string, mimeType?: string) => {
  const ext = filename?.split('.').pop()?.toUpperCase() || 'FILE';
  if (ext === 'PDF' || mimeType?.includes('pdf')) return { ext: 'PDF', label: 'PDF Document', badgeClass: 'bg-red-50 text-red-700 border border-red-200' };
  if (['DOC', 'DOCX'].includes(ext) || mimeType?.includes('word')) return { ext: 'DOCX', label: 'Word Document', badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200' };
  if (['XLS', 'XLSX', 'CSV'].includes(ext) || mimeType?.includes('sheet') || mimeType?.includes('csv')) return { ext: 'XLSX', label: 'Spreadsheet', badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
  if (['PPT', 'PPTX'].includes(ext) || mimeType?.includes('presentation')) return { ext: 'PPT', label: 'Presentation', badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200' };
  if (['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(ext) || mimeType?.includes('image')) return { ext: 'IMAGE', label: 'Image File', badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200' };
  return { ext, label: `${ext} File`, badgeClass: 'bg-teal-50 text-teal-700 border border-teal-200' };
};

export default function OrderTrackingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { orders, shops, updateOrderStatus, updateOrderPayment, addReview, role } = useApp();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [previewItem, setPreviewItem] = useState<{ name: string; url: string; mime?: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);

  // Payment Change & Online Pay states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTab, setPaymentTab] = useState<'UPI' | 'ONLINE' | 'CASH'>('UPI');
  const [upiInputRef, setUpiInputRef] = useState('');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');
  const [copiedShopUpi, setCopiedShopUpi] = useState(false);

  const order =
    orders.find(
      (o) =>
        o.id === id ||
        o.orderNumber === id ||
        (id && typeof id === 'string' && o.orderNumber?.toLowerCase() === id.toLowerCase()) ||
        (id && typeof id === 'string' && `qb-${o.orderNumber}`.toLowerCase() === id.toLowerCase())
    ) || orders[0];

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
          <FileText className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-qubink-navy font-heading">Order Not Found</h2>
        <p className="text-xs text-qubink-muted">The requested print order could not be located.</p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-qubink-teal text-white font-bold text-xs shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to My Orders
        </Link>
      </div>
    );
  }

  // Enrich with live shop record so partner card always shows fresh data
  const liveShop = shops.find((s) => s.id === order.shopId);
  const partnerName = liveShop?.name || order.shopName;
  const partnerPhone = liveShop?.phone || order.shopPhone;
  const partnerAddress = liveShop?.address || order.shopAddress;
  const partnerRating = liveShop?.rating ? liveShop.rating.toFixed(1) : '5.0';
  const partnerReviews = liveShop?.reviewCount || 0;

  // Clean 4-digit code
  const cleanPickupCode = (order.pickupCode.replace(/\D/g, '') || order.pickupCode).slice(0, 4);

  // Timeline step definitions
  const pickupSteps = [
    { key: 'PLACED', label: 'Order Placed', desc: 'Received by shopkeeper' },
    { key: 'ACCEPTED', label: 'Shop Accepted', desc: 'Added to print queue' },
    { key: 'PRINTING', label: 'Printing & Processing', desc: 'Printing & binding in progress' },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', desc: 'Ready at shop counter' },
    { key: 'COMPLETED', label: 'Order Collected', desc: 'Handed over to customer' },
  ];

  const deliverySteps = [
    { key: 'PLACED', label: 'Order Placed', desc: 'Received by shopkeeper' },
    { key: 'ACCEPTED', label: 'Shop Accepted', desc: 'In queue for printing' },
    { key: 'PRINTING', label: 'Printing', desc: 'Printing & packaging' },
    { key: 'READY', label: 'Packed & Sealed', desc: 'Ready for courier partner' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'On the way to destination' },
    { key: 'COMPLETED', label: 'Delivered', desc: 'Handed over successfully' },
  ];

  const steps = order.fulfillmentType === 'DELIVERY' ? deliverySteps : pickupSteps;

  const getStepIndex = (status: OrderStatus) => {
    if (order.fulfillmentType === 'DELIVERY') {
      const map: Record<string, number> = {
        PLACED: 0,
        ACCEPTED: 1,
        PRINTING: 2,
        READY: 3,
        READY_FOR_PICKUP: 3,
        OUT_FOR_DELIVERY: 4,
        COMPLETED: 5,
      };
      return map[status] ?? 0;
    } else {
      const map: Record<string, number> = {
        PLACED: 0,
        ACCEPTED: 1,
        PRINTING: 2,
        READY: 3,
        READY_FOR_PICKUP: 3,
        COMPLETED: 4,
      };
      return map[status] ?? 0;
    }
  };

  const currentIndex = getStepIndex(order.status);
  const isTerminated = order.status === 'CANCELLED' || order.status === 'REJECTED';

  const handleCancelOrder = () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      updateOrderStatus(order.id, 'CANCELLED');
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    addReview(order.id, order.shopId, ratingVal, reviewComment);
    setHasReviewed(true);
    setShowReviewModal(false);
  };

  // Sync upiInputRef when order loads
  React.useEffect(() => {
    if (order?.upiRefId) {
      setUpiInputRef(order.upiRefId);
    }
  }, [order?.upiRefId]);

  // Payment Action Handlers
  const handleConfirmUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiInputRef.trim()) {
      alert('Please enter your 12-digit UPI / UTR Reference Number');
      return;
    }
    setIsUpdatingPayment(true);
    try {
      await updateOrderPayment(order.id, 'UPI', 'PENDING_VERIFICATION', upiInputRef.trim());
      setPaymentSuccessMsg('UPI Reference submitted! Status updated to Pending Verification.');
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccessMsg('');
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handlePayOnlineNow = async () => {
    setIsUpdatingPayment(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const txRef = `RZP_${Math.floor(100000 + Math.random() * 900000)}`;
      await updateOrderPayment(order.id, 'RAZORPAY', 'PAID', txRef);
      setPaymentSuccessMsg('Payment Successful! Order marked as PAID.');
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccessMsg('');
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleSwitchToCash = async () => {
    setIsUpdatingPayment(true);
    try {
      const method = order.fulfillmentType === 'DELIVERY' ? 'CASH_ON_DELIVERY' : 'CASH';
      await updateOrderPayment(order.id, method, 'PENDING');
      setPaymentSuccessMsg('Payment method set to Cash.');
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccessMsg('');
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const copyToClipboard = (text: string, type: 'code' | 'order') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedOrderNumber(true);
        setTimeout(() => setCopiedOrderNumber(false), 2000);
      }
    }
  };

  const handlePrintReceipt = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => router.push('/orders')}
          className="inline-flex items-center gap-2 text-xs font-bold text-qubink-navy hover:text-qubink-teal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintReceipt}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-qubink-teal bg-white text-xs font-bold text-qubink-navy transition-colors shadow-2xs"
            title="Print Receipt"
          >
            <Printer className="w-3.5 h-3.5 text-qubink-teal" />
            <span>Print Receipt</span>
          </button>

          <span
            className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
              order.status === 'COMPLETED'
                ? 'bg-emerald-100 text-emerald-800'
                : order.status === 'REJECTED' || order.status === 'CANCELLED'
                ? 'bg-red-100 text-red-800'
                : 'bg-qubink-softmint text-qubink-teal border border-qubink-teal/30 animate-pulse'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            <span>{order.status.replace(/_/g, ' ')}</span>
          </span>
        </div>
      </div>

      {/* Hero Order Overview Card with 4-Digit Pickup Code */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6">
          {/* Left: Order Info, Metadata & Payment Pill */}
          <div className="space-y-3.5 flex-1 min-w-0 text-left">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-qubink-navy font-heading tracking-tight">
                Order #{order.orderNumber}
              </h1>
              <button
                type="button"
                onClick={() => copyToClipboard(order.orderNumber, 'order')}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-qubink-softmint text-gray-500 hover:text-qubink-teal transition-colors cursor-pointer"
                title="Copy Order Number"
              >
                {copiedOrderNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-qubink-muted">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-qubink-teal" />
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>•</span>
              <span className="font-semibold text-qubink-navy">
                {order.fulfillmentType === 'PICKUP' ? 'Store Pickup' : 'Home Delivery'}
              </span>
              <span>•</span>
              <span className="font-semibold text-qubink-teal">{partnerName}</span>
            </div>

            {/* Payment Status Pill & Total */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-[11px] font-bold text-qubink-navy flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-qubink-muted" />
                <span>Method: {order.paymentMethod || (order.fulfillmentType === 'DELIVERY' ? 'Cash on Delivery' : 'Pay at Shop')}</span>
              </span>
              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
                  order.paymentStatus === 'PAID'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : order.paymentStatus === 'PENDING_VERIFICATION'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Status: {order.paymentStatus || 'PENDING'}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-qubink-softmint text-qubink-teal font-black text-[11px]">
                Total: ₹{order.totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Pay Online / Change Method Button */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {order.paymentStatus === 'PAID' ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Paid ({order.paymentMethod === 'UPI' ? 'UPI' : order.paymentMethod === 'RAZORPAY' ? 'Online' : 'Cash'})</span>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    className="ml-1 text-[11px] text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                  >
                    View / Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-qubink-teal hover:bg-teal-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Change Payment / Pay Now</span>
                </button>
              )}

              {order.upiRefId && (
                <span className="text-[11px] text-qubink-muted font-mono bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                  UTR: <strong className="text-qubink-navy">{order.upiRefId}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Right: 4-Digit Pickup Verification Code & QR Card */}
          <div className="bg-gradient-to-br from-qubink-softmint/80 via-white to-teal-50/70 p-4 sm:p-5 rounded-3xl border border-qubink-teal/30 shadow-xs flex items-center gap-4 flex-shrink-0 self-start md:self-center">
            {/* QR Code */}
            <div className="p-2 bg-white rounded-2xl border border-gray-100 shadow-2xs shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=88x88&data=${encodeURIComponent(cleanPickupCode)}`}
                alt="Pickup QR Code"
                width={88}
                height={88}
                className="rounded-xl mx-auto"
              />
            </div>

            {/* Digits & Action */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-start gap-1 text-[10px] font-black uppercase tracking-widest text-qubink-teal">
                <QrCode className="w-3.5 h-3.5" />
                <span>4-Digit Pickup Code</span>
              </div>

              {/* 4 Individual Digit Boxes */}
              <div className="flex items-center justify-start gap-1.5">
                {cleanPickupCode.split('').map((digit, i) => (
                  <div
                    key={i}
                    className="w-10 h-11 rounded-xl bg-white border-2 border-qubink-teal shadow-xs flex items-center justify-center text-lg font-black text-qubink-navy font-heading"
                  >
                    {digit}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-start gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(cleanPickupCode, 'code')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-qubink-teal hover:underline cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Code Copied!' : 'Copy 4-Digit Code'}</span>
                </button>
              </div>

              <p className="text-[10px] text-qubink-muted leading-tight max-w-[190px]">
                Show this code or QR at counter to release prints.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline Progression Stepper */}
        {isTerminated ? (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
            <XCircle className="w-6 h-6 flex-shrink-0 text-red-600" />
            <div>
              <p className="font-extrabold text-sm">
                Order was {order.status === 'CANCELLED' ? 'Cancelled' : 'Rejected'}
              </p>
              {order.rejectionReason && (
                <p className="mt-0.5 text-red-600">{order.rejectionReason}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-qubink-muted">
                Live Order Progression
              </h3>
              <span className="text-xs text-qubink-teal font-bold">
                Step {currentIndex + 1} of {steps.length}
              </span>
            </div>

            {/* Stepper with connecting line */}
            <div className="relative pt-1">
              {/* Connecting Line precisely between center of Step 1 and Step 5 */}
              <div className="hidden sm:block absolute top-[22px] left-[10%] right-[10%] h-1 bg-gray-100 rounded-full z-0">
                <div
                  className="h-full bg-qubink-teal rounded-full transition-all duration-500"
                  style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                />
              </div>

              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-5 gap-2 relative z-10">
                {steps.map((st, idx) => {
                  const isPassed = idx < currentIndex;
                  const isCurrent = idx === currentIndex;

                  return (
                    <div
                      key={st.key}
                      className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2.5"
                    >
                      {/* Circle Step */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all flex-shrink-0 ${
                          isPassed
                            ? 'bg-qubink-teal text-white shadow-xs'
                            : isCurrent
                            ? 'bg-qubink-navy text-white ring-4 ring-qubink-teal/25 shadow-md scale-110'
                            : 'bg-white border-2 border-gray-200 text-gray-400'
                        }`}
                      >
                        {isPassed ? <CheckCircle2 className="w-5 h-5 text-white" /> : idx + 1}
                      </div>

                      {/* Step Text aligned horizontally */}
                      <div className="text-left sm:text-center min-w-0 flex flex-col justify-start">
                        <p
                          className={`text-xs font-bold leading-snug min-h-[30px] flex items-center justify-start sm:justify-center ${
                            isCurrent
                              ? 'text-qubink-teal font-extrabold'
                              : isPassed
                              ? 'text-qubink-navy'
                              : 'text-gray-400'
                          }`}
                        >
                          {st.label}
                        </p>
                        <p className="text-[11px] text-qubink-muted hidden sm:block mt-0.5 leading-tight">
                          {st.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Rate & Review Callout (when completed) */}
        {order.status === 'COMPLETED' && !hasReviewed && !order.rating && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-amber-900">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span>How was the print quality and service at <strong>{order.shopName}</strong>?</span>
            </div>
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all flex-shrink-0 cursor-pointer"
            >
              ★ Rate &amp; Review Shop
            </button>
          </div>
        )}

        {/* If review already submitted */}
        {(hasReviewed || order.rating) && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>
                Thank you! You rated {order.shopName} <strong>{order.rating || ratingVal} ★</strong>
                {order.reviewComment && ` — "${order.reviewComment}"`}
              </span>
            </div>
          </div>
        )}

        {/* Cancel Button - Centered and Aligned with helper info */}
        {order.status === 'PLACED' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-qubink-muted">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Order placed. You can cancel anytime before the print shop accepts and starts printing.</span>
            </div>
            <button
              onClick={handleCancelOrder}
              className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs font-bold transition-all shadow-2xs cursor-pointer self-end sm:self-auto shrink-0"
            >
              Cancel Order
            </button>
          </div>
        )}
      </div>

      {/* Cards Grid: Partner Info & Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Print Partner Information Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-qubink-muted flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-qubink-teal" />
              <span>Print Partner Information</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-1">
              ★ {partnerRating} <span className="text-gray-400 text-[10px]">({partnerReviews})</span>
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-extrabold text-qubink-navy font-heading">{partnerName}</h4>
            {liveShop?.estimatedPrepTime && (
              <p className="text-xs text-qubink-teal font-semibold">
                ⚡ Avg. Prep Time: {liveShop.estimatedPrepTime}
              </p>
            )}
            {partnerAddress && (
              <p className="text-xs text-qubink-muted leading-relaxed flex items-start gap-1.5 pt-1">
                <MapPin className="w-3.5 h-3.5 text-qubink-teal shrink-0 mt-0.5" />
                <span>{partnerAddress}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
            {partnerPhone ? (
              <a
                href={`tel:${partnerPhone}`}
                className="px-4 py-2 rounded-xl bg-qubink-softmint hover:bg-qubink-teal text-qubink-teal hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Shop</span>
              </a>
            ) : (
              <span className="px-3 py-2 rounded-xl bg-gray-50 text-gray-400 text-xs font-semibold">
                No phone available
              </span>
            )}

            {partnerPhone && (
              <a
                href={`https://wa.me/91${partnerPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                  `Hi! I placed print order *${order.orderNumber}* on Qubink. Could you please confirm the status?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            {liveShop?.mapUrl && (
              <a
                href={liveShop.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Directions</span>
              </a>
            )}
          </div>
        </div>

        {/* Fulfillment & Destination Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-qubink-muted flex items-center gap-2">
              {order.fulfillmentType === 'DELIVERY' ? (
                <Truck className="w-4 h-4 text-qubink-teal" />
              ) : (
                <MapPin className="w-4 h-4 text-qubink-teal" />
              )}
              <span>{order.fulfillmentType === 'DELIVERY' ? 'Delivery Destination' : 'Counter Collection'}</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-qubink-softmint text-qubink-teal text-xs font-bold">
              {order.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Store Pickup'}
            </span>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-qubink-navy">
              {order.fulfillmentType === 'DELIVERY'
                ? order.deliveryAddressText || 'Customer Delivery Address'
                : `Collect at Counter: ${order.shopName}`}
            </h4>
            <p className="text-xs text-qubink-muted">
              Customer: <strong>{order.customerName}</strong>
              {order.customerPhone && ` • +91 ${order.customerPhone.replace(/\D/g, '').slice(-10)}`}
            </p>
            {order.notes && (
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-qubink-dark">
                <span className="font-bold text-qubink-navy block text-[11px]">Special Instructions:</span>
                <span>{order.notes}</span>
              </div>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-qubink-muted">
            <span className="font-bold text-qubink-navy block">Notice:</span>
            {order.fulfillmentType === 'DELIVERY'
              ? 'Our delivery executive will arrive once your prints are dry and packed.'
              : 'Bring your 4-digit pickup code or QR code to verify and collect your document prints.'}
          </div>
        </div>
      </div>

      {/* Ordered Items & Document Print Specifications */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-extrabold text-qubink-navy font-heading">
            Order Items &amp; Print Specifications
          </h3>
          <span className="text-xs text-qubink-muted font-bold">
            {order.items.length} {order.items.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {order.items.map((item) => {
            const badge = getFileBadgeInfo(item.documentName, item.documentUrl);
            return (
            <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-heading font-black text-[10px] ${badge.badgeClass}`}>
                  {badge.ext}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-qubink-navy text-sm truncate">{item.documentName}</p>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${badge.badgeClass}`}>
                      {badge.ext}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.documentUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const isPdf = item.documentName?.toLowerCase().endsWith('.pdf') || item.documentUrl?.includes('application/pdf');
                              const isImg = item.documentName?.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/i) || item.documentUrl?.includes('image');
                              setPreviewItem({
                                name: item.documentName,
                                url: item.documentUrl!,
                                mime: isPdf ? 'application/pdf' : isImg ? 'image/jpeg' : 'other',
                              });
                            }}
                            className="p-1.5 rounded-lg text-qubink-muted hover:text-qubink-teal hover:bg-qubink-softmint transition-colors"
                            title="Preview Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={item.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-qubink-muted hover:text-qubink-teal hover:bg-qubink-softmint transition-colors"
                            title="Open in New Tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={item.documentUrl}
                            download={item.documentName}
                            className="p-1.5 rounded-lg text-qubink-muted hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px] text-qubink-muted">
                    <span className="px-2 py-0.5 rounded-lg bg-gray-100 font-bold text-qubink-navy">
                      {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}
                    </span>
                    {item.settings?.pageRangeType === 'CUSTOM' && item.settings?.customRange && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                        Pages: {item.settings.customRange}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-lg bg-gray-100">
                      {item.settings.printType === 'COLOR' ? 'Colour' : 'B&W'}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-gray-100">{item.settings.paperSize}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-gray-100">
                      {item.settings.sides === 'DOUBLE' ? 'Back-to-Back' : 'Single Side'}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-gray-100 font-bold">
                      {item.settings.copies} {item.settings.copies > 1 ? 'copies' : 'copy'}
                    </span>
                    {item.settings.hasBinding && (
                      <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-qubink-teal font-semibold">
                        + Spiral Binding
                      </span>
                    )}
                    {item.settings.hasLamination && (
                      <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-qubink-teal font-semibold">
                        + Lamination
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0 self-end sm:self-center">
                <div className="font-black text-qubink-navy text-sm">
                  ₹{item.itemPrice.toFixed(2)}
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Pricing Summary Breakdown */}
        <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-right max-w-sm ml-auto">
          <div className="flex justify-between text-qubink-muted">
            <span>Documents Subtotal:</span>
            <span className="font-semibold text-qubink-navy">₹{order.subtotal.toFixed(2)}</span>
          </div>

          {order.bindingTotal > 0 && (
            <div className="flex justify-between text-qubink-muted">
              <span>Binding Charges:</span>
              <span className="font-semibold text-qubink-navy">₹{order.bindingTotal.toFixed(2)}</span>
            </div>
          )}

          {order.laminationTotal > 0 && (
            <div className="flex justify-between text-qubink-muted">
              <span>Lamination Charges:</span>
              <span className="font-semibold text-qubink-navy">₹{order.laminationTotal.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-qubink-muted">
            <span>Fulfillment ({order.fulfillmentType === 'DELIVERY' ? 'Doorstep Delivery' : 'Store Pickup'}):</span>
            <span className="font-semibold text-qubink-navy">
              {order.deliveryFee > 0 ? `₹${order.deliveryFee.toFixed(2)}` : 'FREE'}
            </span>
          </div>

          {((order.couponDiscount && order.couponDiscount > 0) || order.couponCode) ? (
            <div className="flex justify-between text-emerald-600 font-bold items-center">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Coupon ({order.couponCode || 'SAVE50'} applied):</span>
              </span>
              <span>-₹{(order.couponDiscount || 50).toFixed(2)}</span>
            </div>
          ) : null}

          <div className="pt-2.5 border-t border-gray-200 flex justify-between items-center text-sm font-black text-qubink-navy">
            <span>Total Payable:</span>
            <span className="text-qubink-teal font-black text-lg">
              ₹{order.totalAmount.toFixed(2)}
            </span>
          </div>

          {order.paymentStatus !== 'PAID' ? (
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-qubink-teal hover:bg-teal-600 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay ₹{order.totalAmount.toFixed(2)} Online / Change Method</span>
            </button>
          ) : (
            <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Payment Verified ({order.paymentMethod})</span>
              </span>
              {order.upiRefId && <span className="font-mono text-[11px]">UTR: {order.upiRefId}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewItem && (
        <div className="qubink-modal-backdrop flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <FileText className="w-5 h-5 text-qubink-teal" />
              <span className="font-bold text-qubink-navy text-sm flex-1 truncate">{previewItem.name}</span>
              <a
                href={previewItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-gray-100 hover:bg-qubink-softmint text-gray-600 hover:text-qubink-teal transition-colors"
                title="Open in New Tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href={previewItem.url}
                download={previewItem.name}
                className="p-2 rounded-xl bg-gray-100 hover:bg-emerald-100 text-gray-600 hover:text-emerald-600 transition-colors"
                title="Download Document"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center">
              {previewItem.mime?.includes('image') ? (
                <img
                  src={previewItem.url}
                  alt={previewItem.name}
                  className="max-w-full max-h-[70vh] rounded-2xl mx-auto border border-gray-100 shadow-sm object-contain"
                />
              ) : previewItem.mime?.includes('pdf') ? (
                <iframe
                  src={previewItem.url}
                  title={previewItem.name}
                  className="w-full rounded-2xl border border-gray-200 bg-white"
                  style={{ height: '65vh' }}
                />
              ) : (
                <div className="text-center py-12 space-y-3">
                  <FileText className="w-14 h-14 text-qubink-teal/40 mx-auto" />
                  <p className="text-sm font-bold text-qubink-navy">{previewItem.name}</p>
                  <a
                    href={previewItem.url}
                    download={previewItem.name}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-qubink-teal text-white font-bold text-xs shadow-xs hover:bg-qubink-teal/90 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download to View
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="qubink-modal-backdrop flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative space-y-4">
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-qubink-navy font-heading">
              Rate Your Print Experience with {order.shopName}
            </h3>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingVal(star)}
                    className="p-1 text-2xl transition-transform hover:scale-125 cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingVal ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-qubink-navy mb-1">
                  Optional Feedback
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Fast print quality, clean spiral binding, polite shopkeeper..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-qubink-teal"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-qubink-muted hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-qubink-teal text-white text-xs font-bold shadow-xs hover:bg-qubink-teal/90 transition-colors cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Payment Options Modal (Change Method & Pay Online / UPI / Cash) */}
      {showPaymentModal && (
        <div className="qubink-modal-backdrop flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative space-y-5">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-qubink-softmint text-qubink-teal text-[10px] font-black uppercase tracking-wider">
                Payment Options
              </span>
              <h3 className="text-lg font-black text-qubink-navy font-heading mt-1">
                Order #{order.orderNumber}
              </h3>
              <p className="text-xs text-qubink-muted">
                Choose how you would like to pay for your print order at <strong>{partnerName}</strong>.
              </p>
            </div>

            {/* Total Amount Pill */}
            <div className="p-3 rounded-2xl bg-teal-50/60 border border-qubink-teal/20 flex items-center justify-between">
              <span className="text-xs font-bold text-qubink-navy">Total Payable Amount:</span>
              <span className="text-lg font-black text-qubink-teal font-heading">
                ₹{order.totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Success Message Banner */}
            {paymentSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{paymentSuccessMsg}</span>
              </div>
            )}

            {/* Payment Mode Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setPaymentTab('UPI')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentTab === 'UPI'
                    ? 'bg-white text-qubink-navy shadow-xs'
                    : 'text-gray-500 hover:text-qubink-navy'
                }`}
              >
                UPI / QR Code
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab('ONLINE')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentTab === 'ONLINE'
                    ? 'bg-white text-qubink-navy shadow-xs'
                    : 'text-gray-500 hover:text-qubink-navy'
                }`}
              >
                Pay Online
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab('CASH')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentTab === 'CASH'
                    ? 'bg-white text-qubink-navy shadow-xs'
                    : 'text-gray-500 hover:text-qubink-navy'
                }`}
              >
                Cash
              </button>
            </div>

            {/* Tab 1: UPI / QR Code */}
            {paymentTab === 'UPI' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-2xs shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                        `upi://pay?pa=${encodeURIComponent(
                          liveShop?.upiId || 'qubink.payments@okaxis'
                        )}&pn=${encodeURIComponent(partnerName)}&am=${order.totalAmount.toFixed(
                          2
                        )}&cu=INR&tn=Order%20${order.orderNumber}`
                      )}`}
                      alt="UPI Payment QR Code"
                      width={140}
                      height={140}
                      className="rounded-lg mx-auto"
                    />
                  </div>
                  <div className="space-y-2 text-left flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-qubink-muted">Scan with GPay, PhonePe, Paytm:</p>
                    <p className="text-xs font-extrabold text-qubink-navy truncate">
                      UPI ID: {liveShop?.upiId || 'qubink.payments@okaxis'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        copyToClipboard(liveShop?.upiId || 'qubink.payments@okaxis', 'code');
                        setCopiedShopUpi(true);
                        setTimeout(() => setCopiedShopUpi(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-gray-200 hover:border-qubink-teal text-qubink-navy text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {copiedShopUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-gray-500" />}
                      <span>{copiedShopUpi ? 'UPI ID Copied' : 'Copy UPI ID'}</span>
                    </button>
                    <p className="text-[10px] text-qubink-muted leading-tight">
                      Transfer exact ₹{order.totalAmount.toFixed(2)}, then enter the 12-digit UTR / UPI reference ID below.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleConfirmUpi} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-qubink-navy mb-1">
                      Enter 12-Digit UPI Transaction / UTR Number:
                    </label>
                    <input
                      type="text"
                      required
                      value={upiInputRef}
                      onChange={(e) => setUpiInputRef(e.target.value)}
                      placeholder="e.g. 423891048291"
                      maxLength={30}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-qubink-teal"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUpdatingPayment}
                    className="w-full py-3 rounded-xl bg-qubink-teal hover:bg-teal-600 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isUpdatingPayment ? 'Submitting...' : 'Submit UTR & Confirm Payment'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Tab 2: Pay Online Instantly */}
            {paymentTab === 'ONLINE' && (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-left">
                  <div className="flex items-center gap-2 text-xs font-bold text-qubink-navy">
                    <CreditCard className="w-4 h-4 text-qubink-teal" />
                    <span>Instant Online Payment Gateway</span>
                  </div>
                  <p className="text-[11px] text-qubink-muted leading-relaxed">
                    Pay securely using Debit/Credit Card, NetBanking, or UPI. Your order will be immediately verified as <strong>PAID</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePayOnlineNow}
                  disabled={isUpdatingPayment}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-qubink-navy via-slate-800 to-qubink-teal text-white text-xs font-black tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {isUpdatingPayment
                      ? 'Processing Secure Payment...'
                      : `Pay ₹${order.totalAmount.toFixed(2)} Online Now`}
                  </span>
                </button>
              </div>
            )}

            {/* Tab 3: Pay Cash */}
            {paymentTab === 'CASH' && (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-left">
                  <div className="flex items-center gap-2 text-xs font-bold text-qubink-navy">
                    <ShoppingBag className="w-4 h-4 text-amber-500" />
                    <span>
                      {order.fulfillmentType === 'DELIVERY'
                        ? 'Cash on Delivery'
                        : 'Pay Cash at Shop Counter'}
                    </span>
                  </div>
                  <p className="text-[11px] text-qubink-muted leading-relaxed">
                    {order.fulfillmentType === 'DELIVERY'
                      ? `Hand over ₹${order.totalAmount.toFixed(2)} cash directly to the delivery courier.`
                      : `Pay ₹${order.totalAmount.toFixed(2)} in cash directly at ${partnerName}'s billing counter when picking up.`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSwitchToCash}
                  disabled={isUpdatingPayment}
                  className="w-full py-3 rounded-xl border-2 border-qubink-navy text-qubink-navy hover:bg-qubink-navy hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <span>{isUpdatingPayment ? 'Updating...' : 'Switch to Cash Payment'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
