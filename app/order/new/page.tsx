'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useApp } from '@/lib/store';
import { uploadCustomerDocumentToStorageAndDb } from '@/lib/supabase';
import { detectPdfPageCount, parsePageRangeCount } from '@/lib/pdfHelper';
import { DocumentItem, PrintSettings, FulfillmentType } from '@/types';
import {
  UploadCloud,
  FileText,
  Trash2,
  Eye,
  Plus,
  Minus,
  CheckCircle,
  Truck,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  MapPin,
  X,
  Store,
  Download,
  Copy,
  Smartphone,
  CreditCard,
  Banknote,
  Check,
  Tag,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Admin Created Coupon Codes ---
export interface AdminCoupon {
  code: string;
  discount: number;
  description: string;
}

const DEFAULT_COUPONS: AdminCoupon[] = [
  { code: 'SAVE50', discount: 50, description: 'Flat ₹50 OFF on print & xerox orders' },
  { code: 'FIRSTPRINT', discount: 20, description: '₹20 OFF for first-time customer orders' },
  { code: 'QUBINK10', discount: 10, description: 'Flat ₹10 instant discount on any Xerox job' },
  { code: 'STUDENT25', discount: 25, description: '₹25 OFF on project documentation & spiral binding' },
];

const COUPONS: Record<string, number> = {
  FIRSTPRINT: 20,
  QUBINK10: 10,
  SAVE50: 50,
  STUDENT25: 25,
};

// --- Main Component ---
export default function NewOrderPage() {
  const router = useRouter();
  const {
    shops,
    pricing,
    cart,
    addresses,
    addDocumentToCart,
    updateDocumentInCart,
    removeDocumentFromCart,
    updateDocumentSettings,
    setSelectedShop,
    setFulfillmentType,
    setAddressId,
    setCartNotes,
    calculatePricing,
    placeOrder,
    addAddress,
    currentUser,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);

  // Synchronize browser history so hardware/browser back button returns from Step 2 to Step 1
  useEffect(() => {
    const handlePopState = () => {
      setStep(1);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newLabel, setNewLabel] = useState<'Home' | 'College' | 'Office' | 'Other'>('Home');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'RAZORPAY'>('CASH');
  const [upiRefId, setUpiRefId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{ id: string; orderNumber: string; pickupCode: string } | null>(null);

  const selectedShop = shops.find((s) => s.id === (cart.shopId || shops[0]?.id)) || shops[0];
  const shopRates = pricing[selectedShop?.id] || {
    bwA4: 2.0, colorA4: 10.0, bwA3: 5.0, colorA3: 20.0,
    bindingPrice: 35.0, laminationPrice: 25.0, deliveryFee: 30.0,
  };

  const priceBreakdown = calculatePricing(
    selectedShop?.id || '',
    cart.documents,
    cart.settingsMap,
    cart.fulfillmentType
  );

  const finalTotal = Math.max(0, priceBreakdown.total - couponDiscount);

  // --- File Upload ---
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 20 * 1024 * 1024) {
        setUploadError(`"${file.name}" exceeds the 20 MB size limit.`);
        continue;
      }

      let detectedPages = 1;
      const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        try {
          detectedPages = await detectPdfPageCount(file);
        } catch (err) {
          console.warn('PDF page count detection notice:', err);
          detectedPages = 1;
        }
      } else if (file.type.includes('image')) {
        detectedPages = 1;
      } else {
        detectedPages = 1;
      }

      // Create immediate local object URL for instant, zero-delay preview & download
      const localBlobUrl = URL.createObjectURL(file);
      const docItem: DocumentItem = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        fileName: file.name,
        fileSize: file.size,
        pageCount: detectedPages,
        mimeType: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
        fileUrl: localBlobUrl,
      };

      addDocumentToCart(docItem);

      // Concurrently upload to Supabase Storage bucket and record in public.documents
      uploadCustomerDocumentToStorageAndDb(file, file.name, currentUser?.id || 'guest', detectedPages)
        .then((uploadRes) => {
          if (uploadRes?.storageUrl) {
            updateDocumentInCart(docItem.id, { fileUrl: uploadRes.storageUrl });
          }
        })
        .catch((uploadErr) => {
          console.warn('Supabase document upload notice:', uploadErr);
        });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [addDocumentToCart, updateDocumentInCart, currentUser?.id]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    const fakeEvent = { target: { files: dt.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileChange(fakeEvent);
  }, [handleFileChange]);

  const [availableCoupons, setAvailableCoupons] = useState<AdminCoupon[]>(DEFAULT_COUPONS);

  // Load dynamically created admin coupons from localStorage if available
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('qubink_admin_coupons');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAvailableCoupons(parsed);
          }
        }
      }
    } catch {}
  }, []);

  // --- Coupon ---
  const handleApplyCoupon = (codeToApply?: string) => {
    const raw = (codeToApply || couponInput || '').toUpperCase().trim();
    const found =
      availableCoupons.find((c) => c.code === raw) ||
      (COUPONS[raw] ? { code: raw, discount: COUPONS[raw], description: '' } : null);

    if (found) {
      setCouponCode(found.code);
      setCouponInput(found.code);
      setCouponDiscount(found.discount);
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code. Try SAVE50, FIRSTPRINT, or QUBINK10.');
      setCouponApplied(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponInput('');
    setCouponDiscount(0);
    setCouponApplied(false);
    setCouponError('');
  };

  // --- Address ---
  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    await addAddress({
      label: newLabel,
      addressLine: newAddressLine,
      landmark: newLandmark,
      city: newCity,
      pincode: newPincode,
      isDefault: addresses.length === 0,
    });
    setShowAddressModal(false);
    setNewAddressLine('');
    setNewLandmark('');
    setNewCity('');
    setNewPincode('');
  };

  // --- Place Order ---
  const handlePlaceOrder = async () => {
    if (cart.documents.length === 0) {
      alert('Please upload at least one document to print.');
      return;
    }
    if (paymentMethod === 'UPI' && !upiRefId.trim()) {
      alert('Please enter the UTR / Transaction Reference ID after completing UPI payment.');
      return;
    }

    try {
      setIsSubmitting(true);
      const createdOrder = await placeOrder({
        paymentMethod,
        upiRefId: paymentMethod === 'UPI' ? upiRefId.trim() : undefined,
        couponCode: couponApplied ? couponCode : undefined,
        couponDiscount,
      });
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.55 }, colors: ['#00A99D', '#42D6BD', '#082F3F', '#FFD700'] });
      setPlacedOrder({ id: createdOrder.id, orderNumber: createdOrder.orderNumber, pickupCode: createdOrder.pickupCode });
    } catch (err) {
      console.error('Failed to place order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileBadgeInfo = (name?: string, mime?: string) => {
    const n = (name || '').toLowerCase();
    const m = (mime || '').toLowerCase();
    if (n.endsWith('.pdf') || m.includes('pdf')) {
      return {
        ext: 'PDF',
        label: 'PDF Document',
        badgeClass: 'bg-red-50 text-red-700 border border-red-200',
      };
    }
    if (n.endsWith('.docx') || n.endsWith('.doc') || m.includes('word') || m.includes('officedocument')) {
      return {
        ext: 'DOCX',
        label: 'Word Document (.docx)',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
      };
    }
    if (n.endsWith('.xlsx') || n.endsWith('.xls') || m.includes('excel') || m.includes('spreadsheet')) {
      return {
        ext: 'XLSX',
        label: 'Excel Spreadsheet (.xlsx)',
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      };
    }
    if (n.endsWith('.pptx') || n.endsWith('.ppt') || m.includes('presentation') || m.includes('powerpoint')) {
      return {
        ext: 'PPT',
        label: 'PowerPoint (.pptx)',
        badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      };
    }
    if (n.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) || m.includes('image')) {
      const ext = n.split('.').pop()?.toUpperCase() || 'IMAGE';
      return {
        ext,
        label: `Image File (.${ext.toLowerCase()})`,
        badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200',
      };
    }
    return {
      ext: 'DOC',
      label: 'Document File',
      badgeClass: 'bg-teal-50 text-teal-700 border border-teal-200',
    };
  };

  // --- ORDER PLACED SUCCESS ---
  if (placedOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-qubink-navy/20 backdrop-blur-sm px-4">
        <div className="max-w-md w-full space-y-6 animate-in zoom-in-95 fade-in duration-500">
          <div className="qubink-card p-8 text-center space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-qubink-teal to-emerald-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-qubink-teal/25">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-qubink-navy font-heading">Order Placed! 🎉</h1>
              <p className="text-sm text-qubink-muted mt-1">Your print order has been sent to {selectedShop?.name}.</p>
            </div>

            <div className="p-4 rounded-2xl bg-qubink-softmint/70 border border-qubink-teal/20 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-qubink-muted font-medium">Order ID</span>
                <span className="font-extrabold text-qubink-navy font-mono">{placedOrder.orderNumber}</span>
              </div>
              <div className="pt-3 border-t border-qubink-teal/10">
                <p className="text-[11px] text-qubink-muted font-semibold uppercase tracking-wider mb-2">4-Digit Pickup Code</p>
                <div className="flex items-center justify-center gap-2">
                  {placedOrder.pickupCode.split('').map((ch, i) => (
                    <div key={i} className="w-12 h-14 rounded-xl bg-white border-2 border-qubink-teal/30 shadow flex items-center justify-center text-2xl font-black text-qubink-navy">
                      {ch}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-qubink-muted mt-2">Show this code at the counter to collect your prints.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/order/${placedOrder.id}`)}
                className="flex-1 py-3 rounded-2xl bg-qubink-teal text-white font-bold text-sm shadow-lg shadow-qubink-teal/25 hover:bg-qubink-teal/90 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Track Order
              </button>
              <button
                onClick={() => router.push('/orders')}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-qubink-navy font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                My Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------- MAIN CHECKOUT ----------------------
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/70 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (step === 2) {
                if (typeof window !== 'undefined' && window.history.state?.step === 2) {
                  window.history.back();
                } else {
                  setStep(1);
                }
              } else if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/home');
              }
            }}
            className="w-10 h-10 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-qubink-navy transition-colors shadow-2xs shrink-0 cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-qubink-navy font-heading">
              {step === 1 ? 'Configure Print Order' : 'Fulfillment & Payment'}
            </h1>
            <p className="text-xs sm:text-sm text-qubink-muted">
              {step === 1 ? 'Upload files and customize your print specifications.' : 'Choose how you want to receive and pay for your prints.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs self-start sm:self-auto">
          <Store className="w-4 h-4 text-qubink-teal" />
          <span className="text-qubink-muted">Printing at:</span>
          <select
            value={selectedShop?.id || ''}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="font-bold text-qubink-navy bg-transparent focus:outline-none cursor-pointer"
          >
            {shops.filter((s) => s.status === 'APPROVED').map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-3 max-w-sm">
        {[1, 2].map((s) => (
          <React.Fragment key={s}>
            <button
              onClick={() => s < step && setStep(s as 1 | 2)}
              className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                step === s ? 'bg-qubink-teal text-white' : s < step ? 'bg-qubink-softmint text-qubink-teal cursor-pointer hover:opacity-80' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${step === s ? 'bg-white/20' : ''}`}>
                {s < step ? <Check className="w-3 h-3" /> : s}
              </span>
              {s === 1 ? 'Upload & Specs' : 'Payment'}
            </button>
            {s < 2 && <div className={`flex-1 h-0.5 rounded-full ${step > s ? 'bg-qubink-teal' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* --- STEP 1: Upload & Specs --- */}
        {step === 1 && (
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Zone */}
            <div className="qubink-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-qubink-navy font-heading">1. Upload Documents</h2>
                  <p className="text-xs text-qubink-muted">PDF, DOC, DOCX, JPG, PNG — up to 20 MB per file.</p>
                </div>
                {cart.documents.length > 0 && (
                  <span className="text-xs font-bold text-qubink-teal bg-qubink-softmint px-2.5 py-1 rounded-full">
                    {cart.documents.length} File{cart.documents.length > 1 ? 's' : ''} Added
                  </span>
                )}
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-qubink-teal/30 hover:border-qubink-teal rounded-2xl p-6 sm:p-8 text-center bg-qubink-ice/60 hover:bg-qubink-softmint/30 transition-all cursor-pointer group"
              >
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto text-qubink-teal group-hover:scale-110 transition-transform mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-qubink-navy font-heading">Click or drag & drop files here</h3>
                <p className="text-xs text-qubink-muted mt-1">Multi-file upload supported for combined project reports.</p>
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Document List with distinct Badges */}
              {cart.documents.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-qubink-muted">Uploaded Files ({cart.documents.length})</h3>
                  <div className="divide-y divide-gray-100">
                    {cart.documents.map((doc) => {
                      const badge = getFileBadgeInfo(doc.fileName, doc.mimeType);
                      return (
                        <div key={doc.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 truncate">
                            <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-heading font-black text-[10px] shadow-2xs ${badge.badgeClass}`}>
                              <FileText className="w-4 h-4 mb-0.5" />
                              <span>{badge.ext}</span>
                            </div>
                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-qubink-navy text-xs truncate">{doc.fileName}</p>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${badge.badgeClass}`}>
                                  {badge.ext}
                                </span>
                              </div>
                              <p className="text-[11px] text-qubink-muted mt-0.5">
                                {doc.pageCount} pages • {((doc.fileSize || 0) / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg text-qubink-muted hover:text-qubink-teal hover:bg-qubink-softmint transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              download={doc.fileName}
                              className="p-1.5 rounded-lg text-qubink-muted hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => removeDocumentFromCart(doc.id)}
                            className="p-1.5 rounded-lg text-qubink-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 rounded-xl border border-dashed border-gray-300 text-xs font-semibold text-qubink-muted hover:border-qubink-teal hover:text-qubink-teal transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add More Files
                  </button>
                </div>
              )}
            </div>

            {/* Print Specs */}
            {cart.documents.length > 0 && (
              <div className="qubink-card p-6 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-qubink-navy font-heading">2. Customize Print Specifications</h2>
                  <p className="text-xs text-qubink-muted">Configure color mode, paper sizing, duplexing, and binding.</p>
                </div>
                {cart.documents.map((doc, idx) => {
                  const s = cart.settingsMap[doc.id] || { printType: 'BW', sides: 'SINGLE', paperSize: 'A4', copies: 1, hasBinding: false, hasStapling: false, hasLamination: false, pageRangeType: 'ALL', customRange: '' };
                  const rangeInfo = parsePageRangeCount(s.pageRangeType, s.customRange, doc.pageCount || 1);
                  return (
                    <div key={doc.id} className="rounded-2xl border border-gray-100 p-4 space-y-4 bg-gray-50/60">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-qubink-teal text-white text-[10px] font-bold flex items-center justify-center">{idx + 1}</span>
                          <p className="font-bold text-qubink-navy text-xs truncate">{doc.fileName}</p>
                        </div>
                        <span className="text-[11px] font-bold text-qubink-teal bg-qubink-softmint/80 px-2 py-0.5 rounded-lg border border-qubink-teal/20">
                          {rangeInfo.summaryText}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        {/* Print Type */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-qubink-muted mb-1.5">Color Mode</label>
                          <div className="flex gap-1.5">
                            {(['BW', 'COLOR'] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => updateDocumentSettings(doc.id, { printType: t })}
                                className={`flex-1 py-2 rounded-xl font-bold border transition-all text-[11px] ${s.printType === t ? 'bg-qubink-teal text-white border-qubink-teal' : 'bg-white text-qubink-muted border-gray-200 hover:border-gray-300'}`}
                              >
                                {t === 'BW' ? 'B&W' : 'Color'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Paper Size */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-qubink-muted mb-1.5">Paper Size</label>
                          <div className="flex gap-1.5">
                            {(['A4', 'A3'] as const).map((sz) => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => updateDocumentSettings(doc.id, { paperSize: sz })}
                                className={`flex-1 py-2 rounded-xl font-bold border transition-all text-[11px] ${s.paperSize === sz ? 'bg-qubink-teal text-white border-qubink-teal' : 'bg-white text-qubink-muted border-gray-200 hover:border-gray-300'}`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sides */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-qubink-muted mb-1.5">Sides</label>
                          <div className="flex gap-1.5">
                            {(['SINGLE', 'DOUBLE'] as const).map((sd) => (
                              <button
                                key={sd}
                                type="button"
                                onClick={() => updateDocumentSettings(doc.id, { sides: sd })}
                                className={`flex-1 py-2 rounded-xl font-bold border transition-all text-[11px] ${s.sides === sd ? 'bg-qubink-teal text-white border-qubink-teal' : 'bg-white text-qubink-muted border-gray-200 hover:border-gray-300'}`}
                              >
                                {sd === 'SINGLE' ? '1 Side' : 'Duplex'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Copies */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-qubink-muted mb-1.5">Copies</label>
                          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-2 py-1">
                            <button type="button" onClick={() => updateDocumentSettings(doc.id, { copies: Math.max(1, (s.copies || 1) - 1) })} className="p-1 rounded-lg hover:bg-gray-100 text-qubink-muted">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="flex-1 text-center font-extrabold text-qubink-navy">{s.copies || 1}</span>
                            <button type="button" onClick={() => updateDocumentSettings(doc.id, { copies: (s.copies || 1) + 1 })} className="p-1 rounded-lg hover:bg-gray-100 text-qubink-muted">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Add-ons */}
                        <div className="col-span-2 sm:col-span-2">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-qubink-muted mb-1.5">Add-ons</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { key: 'hasBinding', label: `Binding ₹${shopRates.bindingPrice}` },
                              { key: 'hasStapling', label: 'Stapling' },
                              { key: 'hasLamination', label: `Lamination ₹${shopRates.laminationPrice}` },
                            ].map(({ key, label }) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => updateDocumentSettings(doc.id, { [key]: !(s as any)[key] })}
                                className={`px-2.5 py-1.5 rounded-xl font-bold border transition-all text-[11px] flex items-center gap-1 ${(s as any)[key] ? 'bg-qubink-teal text-white border-qubink-teal' : 'bg-white text-qubink-muted border-gray-200 hover:border-gray-300'}`}
                              >
                                {(s as any)[key] && <Check className="w-3 h-3" />}
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Page Range Selection: All Pages vs Custom Range */}
                        <div className="col-span-2 sm:col-span-3 pt-3 border-t border-gray-200/80 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-qubink-navy">
                              Pages to Print ({rangeInfo.count} of {doc.pageCount} pages selected)
                            </label>
                            <span className="text-[11px] font-semibold text-qubink-muted">
                              Total document: <strong>{doc.pageCount}</strong> pages
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 max-w-xs">
                            <button
                              type="button"
                              onClick={() => updateDocumentSettings(doc.id, { pageRangeType: 'ALL' })}
                              className={`py-2 px-3 rounded-xl font-bold border transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                                s.pageRangeType !== 'CUSTOM'
                                  ? 'bg-qubink-teal text-white border-qubink-teal shadow-xs'
                                  : 'bg-white text-qubink-muted border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span>All Pages</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${s.pageRangeType !== 'CUSTOM' ? 'bg-white/20 text-white' : 'bg-gray-100 text-qubink-navy'}`}>
                                {doc.pageCount} pgs
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateDocumentSettings(doc.id, { pageRangeType: 'CUSTOM' })}
                              className={`py-2 px-3 rounded-xl font-bold border transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                                s.pageRangeType === 'CUSTOM'
                                  ? 'bg-qubink-teal text-white border-qubink-teal shadow-xs'
                                  : 'bg-white text-qubink-muted border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span>Custom Range</span>
                            </button>
                          </div>

                          {/* Custom Page Range Input Box */}
                          {s.pageRangeType === 'CUSTOM' && (
                            <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-2xs space-y-1.5 animate-in fade-in zoom-in-95">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-qubink-navy">Specify Page Numbers or Ranges</label>
                                <span className="text-[10px] text-qubink-muted">e.g. 1-10, 15, 20-25</span>
                              </div>
                              <input
                                type="text"
                                value={s.customRange || ''}
                                onChange={(e) => updateDocumentSettings(doc.id, { customRange: e.target.value })}
                                placeholder={`e.g. 1-${Math.min(10, doc.pageCount)}`}
                                className={`w-full px-3 py-2 rounded-lg border text-xs font-mono font-bold focus:outline-none focus:ring-2 ${
                                  rangeInfo.error ? 'border-red-300 focus:ring-red-400 bg-red-50/30 text-red-700' : 'border-gray-200 focus:ring-qubink-teal text-qubink-navy'
                                }`}
                              />
                              {rangeInfo.error ? (
                                <p className="text-[10px] text-red-600 font-semibold">{rangeInfo.error}</p>
                              ) : (
                                <p className="text-[10px] text-qubink-muted">
                                  Printing <strong>{rangeInfo.count}</strong> page{rangeInfo.count !== 1 ? 's' : ''}. The price is calculated for these {rangeInfo.count} pages.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- STEP 2: Fulfillment + Payment --- */}
        {step === 2 && (
          <div className="lg:col-span-2 space-y-6">
            {/* Fulfillment Method */}
            <div className="qubink-card p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-qubink-navy font-heading">Choose Fulfillment Method</h2>
                <p className="text-xs text-qubink-muted">How would you like to receive your prints?</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('PICKUP')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${cart.fulfillmentType === 'PICKUP' ? 'border-qubink-teal bg-qubink-softmint/40' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag className={`w-5 h-5 ${cart.fulfillmentType === 'PICKUP' ? 'text-qubink-teal' : 'text-gray-400'}`} />
                    <span className="font-bold text-qubink-navy text-sm">Store Pickup</span>
                    {cart.fulfillmentType === 'PICKUP' && <CheckCircle className="w-4 h-4 text-qubink-teal ml-auto" />}
                  </div>
                  <p className="text-xs text-qubink-muted">Visit the shop counter and collect — <strong className="text-emerald-600">FREE</strong></p>
                </button>

                {selectedShop?.isDeliveryAvailable ? (
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('DELIVERY')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${cart.fulfillmentType === 'DELIVERY' ? 'border-qubink-teal bg-qubink-softmint/40' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className={`w-5 h-5 ${cart.fulfillmentType === 'DELIVERY' ? 'text-qubink-teal' : 'text-gray-400'}`} />
                      <span className="font-bold text-qubink-navy text-sm">Home Delivery</span>
                      {cart.fulfillmentType === 'DELIVERY' && <CheckCircle className="w-4 h-4 text-qubink-teal ml-auto" />}
                    </div>
                    <p className="text-xs text-qubink-muted">Delivered to your door — <strong className="text-qubink-teal">₹{shopRates.deliveryFee}</strong></p>
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl border-2 border-dashed border-gray-200 opacity-50">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="w-5 h-5 text-gray-400" />
                      <span className="font-bold text-gray-400 text-sm">Home Delivery</span>
                    </div>
                    <p className="text-xs text-gray-400">Not available at this shop.</p>
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              {cart.fulfillmentType === 'DELIVERY' && (
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-qubink-navy">Delivery Address</label>
                    <button type="button" onClick={() => setShowAddressModal(true)} className="text-xs font-bold text-qubink-teal hover:underline flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add New
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {addresses.map((addr) => (
                      <div key={addr.id} onClick={() => setAddressId(addr.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${cart.addressId === addr.id ? 'border-qubink-teal bg-qubink-softmint/40' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-qubink-navy">{addr.label}</span>
                          {cart.addressId === addr.id && <CheckCircle className="w-3.5 h-3.5 text-qubink-teal" />}
                        </div>
                        <p className="text-qubink-muted line-clamp-1">{addr.addressLine}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{addr.city} - {addr.pincode}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coupon Promo Section */}
            <div className="qubink-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-qubink-teal" />
                  <h2 className="text-sm font-bold text-qubink-navy font-heading">Coupon / Promo Code</h2>
                </div>
                {couponApplied && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {couponCode} Active
                  </span>
                )}
              </div>

              {!couponApplied ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    placeholder="Enter coupon code..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-qubink-teal"
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    disabled={!couponInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-qubink-teal text-white text-xs font-bold hover:bg-qubink-teal/90 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 shadow-xs"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2.5 text-xs text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-black font-mono">{couponCode} Applied!</span>
                      <p className="text-[11px] text-emerald-600">Saved ₹{couponDiscount.toFixed(2)} on this order</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}

              {couponError && <p className="text-xs text-red-600 font-bold">{couponError}</p>}

              {/* Admin Coupons Display Underneath Coupon Box */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <span className="text-[11px] font-bold text-qubink-muted uppercase tracking-wider block">
                  Available Offers &amp; Promo Codes:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableCoupons.map((c) => {
                    const isThisApplied = couponApplied && couponCode === c.code;
                    return (
                      <div
                        key={c.code}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isThisApplied
                            ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400'
                            : 'bg-gray-50/70 border-gray-200 hover:border-qubink-teal/50 hover:bg-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md font-mono font-black text-[11px] bg-white text-qubink-teal border border-qubink-teal/30 shadow-2xs">
                              {c.code}
                            </span>
                            <span className="font-extrabold text-qubink-navy text-xs">
                              ₹{c.discount} OFF
                            </span>
                          </div>
                          <p className="text-[11px] text-qubink-muted leading-tight">
                            {c.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon(c.code)}
                          disabled={isThisApplied}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                            isThisApplied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white text-qubink-teal hover:bg-qubink-teal hover:text-white border border-qubink-teal/30'
                          }`}
                        >
                          {isThisApplied ? 'Applied ✓' : 'Apply'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="qubink-card p-6 space-y-4">
              <h2 className="text-sm font-bold text-qubink-navy font-heading">Payment Method</h2>

              <div className="space-y-3">
                {/* Cash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`w-full p-4 rounded-2xl border-2 flex items-start gap-3 text-left transition-all ${paymentMethod === 'CASH' ? 'border-qubink-teal bg-qubink-softmint/40' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-qubink-navy text-sm">Cash at Counter</span>
                      {paymentMethod === 'CASH' && <CheckCircle className="w-4 h-4 text-qubink-teal" />}
                    </div>
                    <p className="text-xs text-qubink-muted">Pay with cash when you collect your prints at the shop counter.</p>
                  </div>
                </button>

                {/* UPI */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`w-full p-4 rounded-2xl border-2 flex items-start gap-3 text-left transition-all ${paymentMethod === 'UPI' ? 'border-qubink-teal bg-qubink-softmint/40' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-qubink-navy text-sm">UPI Payment</span>
                      {paymentMethod === 'UPI' && <CheckCircle className="w-4 h-4 text-qubink-teal" />}
                    </div>
                    <p className="text-xs text-qubink-muted">Pay via any UPI app (GPay, PhonePe, Paytm, BHIM). Shop partner verifies manually.</p>
                  </div>
                </button>

                {/* UPI QR + UTR */}
                {paymentMethod === 'UPI' && (
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 space-y-4">
                    {selectedShop?.upiId ? (
                      <div className="text-center space-y-2">
                        <p className="text-xs font-bold text-qubink-navy">Scan QR Code to Pay</p>
                        {/* Dynamic UPI QR via free QR API */}
                        <div className="inline-block p-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=${selectedShop.upiId}&pn=${encodeURIComponent(selectedShop.name)}&am=${finalTotal.toFixed(2)}&cu=INR&tn=Qubink Print Order`)}`}
                            alt="UPI QR Code"
                            width={160}
                            height={160}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-qubink-muted">
                          <span className="font-mono font-bold text-qubink-navy">{selectedShop.upiId}</span>
                          <button
                            type="button"
                            onClick={() => { navigator.clipboard.writeText(selectedShop.upiId || ''); }}
                            className="p-1 rounded-md hover:bg-blue-100 text-blue-500"
                            title="Copy UPI ID"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs font-bold text-qubink-navy">Amount: <span className="text-qubink-teal">₹{finalTotal.toFixed(2)}</span></p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs font-bold text-amber-700">This shop hasn't set up their UPI ID yet.</p>
                        <p className="text-xs text-amber-600 mt-1">Please pay cash at the counter or choose another method.</p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-qubink-navy">
                        Enter UTR / Transaction Reference ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={upiRefId}
                        onChange={(e) => setUpiRefId(e.target.value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 22))}
                        placeholder="12-digit UTR or Ref ID from your UPI app"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <p className="text-[11px] text-qubink-muted">After paying via UPI app, enter the reference/UTR number shown in your payment confirmation. The shop partner will verify and confirm your order.</p>
                    </div>
                  </div>
                )}

                {/* Razorpay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('RAZORPAY')}
                  className={`w-full p-4 rounded-2xl border-2 flex items-start gap-3 text-left transition-all ${paymentMethod === 'RAZORPAY' ? 'border-qubink-teal bg-qubink-softmint/40' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-qubink-navy text-sm">Razorpay Online Payment</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-bold">Secure</span>
                      {paymentMethod === 'RAZORPAY' && <CheckCircle className="w-4 h-4 text-qubink-teal ml-auto" />}
                    </div>
                    <p className="text-xs text-qubink-muted">Pay securely via Card, Net Banking, or Wallets. Admin holds payment and settles periodically with the shop.</p>
                  </div>
                </button>
                {paymentMethod === 'RAZORPAY' && (
                  <div className="p-3 rounded-xl bg-violet-50 border border-violet-200/70 text-xs text-violet-700">
                    <span className="font-bold flex items-center gap-1.5 mb-0.5">
                      <CreditCard className="w-3.5 h-3.5" /> Razorpay Secure Checkout
                    </span>
                    Clicking &quot;Place Order&quot; below will simulate a successful payment. The amount is securely held by Qubink Admin and settled to the shop partner on a weekly basis.
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="qubink-card p-5 space-y-2">
              <label className="block text-xs font-bold text-qubink-navy">Special Instructions (Optional)</label>
              <textarea
                value={cart.notes}
                onChange={(e) => setCartNotes(e.target.value)}
                placeholder="e.g. Please bind with blue cover, staple top-left corner..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-qubink-teal"
              />
            </div>
          </div>
        )}

        {/* --- ORDER SUMMARY (Right Panel - always visible) --- */}
        <div className="space-y-5">
          <div className="qubink-card p-5 space-y-4 sticky top-20">
            <h2 className="text-sm font-bold text-qubink-navy font-heading border-b border-gray-100 pb-3">Order Summary</h2>

            {/* Shop */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 rounded-xl relative overflow-hidden bg-gray-200 flex-shrink-0">
                {selectedShop?.imageUrl && (
                  <Image src={selectedShop.imageUrl} alt={selectedShop.name} fill className="object-cover" />
                )}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-qubink-navy truncate">{selectedShop?.name}</p>
                <p className="text-[11px] text-qubink-muted">{cart.fulfillmentType === 'PICKUP' ? 'Store Pickup' : 'Home Delivery'}</p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-qubink-muted">
                <span>
                  Printing ({cart.documents.length} {cart.documents.length === 1 ? 'file' : 'files'},{' '}
                  {cart.documents.reduce((acc, d) => {
                    const s = cart.settingsMap[d.id];
                    return acc + parsePageRangeCount(s?.pageRangeType, s?.customRange, d.pageCount).count;
                  }, 0)}{' '}
                  pgs)
                </span>
                <span className="font-semibold text-qubink-navy">₹{priceBreakdown.subtotal.toFixed(2)}</span>
              </div>
              {priceBreakdown.bindingTotal > 0 && (
                <div className="flex justify-between text-qubink-muted">
                  <span>Binding</span>
                  <span className="font-semibold text-qubink-navy">₹{priceBreakdown.bindingTotal.toFixed(2)}</span>
                </div>
              )}
              {priceBreakdown.laminationTotal > 0 && (
                <div className="flex justify-between text-qubink-muted">
                  <span>Lamination</span>
                  <span className="font-semibold text-qubink-navy">₹{priceBreakdown.laminationTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-qubink-muted">
                <span>Fulfillment</span>
                <span className="font-semibold text-qubink-navy">{cart.fulfillmentType === 'DELIVERY' ? `₹${priceBreakdown.deliveryFee.toFixed(2)}` : 'FREE'}</span>
              </div>

              {/* Coupon Box & Underneath Available Admin Codes */}
              <div className="pt-2 pb-1 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-qubink-navy flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-qubink-teal" />
                    <span>Apply Coupon</span>
                  </span>
                  {couponApplied && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                      {couponCode} Active
                    </span>
                  )}
                </div>

                {!couponApplied ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. SAVE50)"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold uppercase focus:outline-none focus:border-qubink-teal bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      disabled={!couponInput.trim()}
                      className="px-3.5 py-2 rounded-xl bg-qubink-teal text-white font-bold text-xs hover:bg-qubink-teal/90 transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
                    >
                      Apply
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-800 font-mono text-xs">{couponCode} applied!</p>
                        <p className="text-[10px] text-emerald-600">You saved ₹{couponDiscount.toFixed(2)} on this order</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-[11px] text-red-600 font-bold">{couponError}</p>
                )}

                {/* Admin Created Codes Shown Underneath the Box */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-qubink-muted uppercase tracking-wider block">
                    Available Offers &amp; Codes:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {availableCoupons.map((c) => {
                      const isThisApplied = couponApplied && couponCode === c.code;
                      return (
                        <div
                          key={c.code}
                          className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 text-xs ${
                            isThisApplied
                              ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400'
                              : 'bg-white border-gray-200 hover:border-qubink-teal/50'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 rounded font-mono font-black text-[10px] bg-qubink-softmint text-qubink-teal border border-qubink-teal/20">
                                {c.code}
                              </span>
                              <span className="font-bold text-qubink-navy text-[11px]">₹{c.discount} OFF</span>
                            </div>
                            <p className="text-[10px] text-qubink-muted truncate mt-0.5">{c.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon(c.code)}
                            disabled={isThisApplied}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                              isThisApplied
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-gray-100 text-qubink-navy hover:bg-qubink-teal hover:text-white border border-gray-200'
                            }`}
                          >
                            {isThisApplied ? 'Applied ✓' : 'Apply'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount ({couponCode})</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200 flex justify-between text-sm">
                <span className="font-bold text-qubink-navy">Total</span>
                <span className="font-extrabold text-qubink-teal text-base">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Navigation Buttons */}
            {step === 1 ? (
              <button
                type="button"
                onClick={() => {
                  if (cart.documents.length === 0) { alert('Please upload at least one document.'); return; }
                  if (typeof window !== 'undefined') {
                    window.history.pushState({ step: 2 }, '');
                  }
                  setStep(2);
                }}
                disabled={cart.documents.length === 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-qubink-navy to-qubink-teal text-white font-bold text-sm shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 hover:opacity-95"
              >
                <span>Next: Choose Fulfillment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || cart.documents.length === 0}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-qubink-navy to-qubink-teal text-white font-bold text-sm shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 hover:opacity-95"
                >
                  {isSubmitting ? (
                    <span>Placing Order...</span>
                  ) : (
                    <>
                      <span>Place Order • ₹{finalTotal.toFixed(2)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2.5 rounded-2xl border border-gray-200 text-qubink-muted text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Upload & Specs
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (() => {
        const badge = getFileBadgeInfo(previewDoc.fileName, previewDoc.mimeType);
        return (
          <div className="qubink-modal-backdrop flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[90vh] border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-heading font-black text-[10px] shadow-2xs ${badge.badgeClass}`}>
                  <FileText className="w-4 h-4 mb-0.5" />
                  <span>{badge.ext}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-qubink-navy font-heading truncate">{previewDoc.fileName}</h3>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${badge.badgeClass}`}>
                      {badge.ext}
                    </span>
                  </div>
                  <p className="text-xs text-qubink-muted">{previewDoc.pageCount} pages • {((previewDoc.fileSize || 0) / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {previewDoc.fileUrl && (
                    <a href={previewDoc.fileUrl} download={previewDoc.fileName} className="p-2 rounded-xl bg-gray-100 hover:bg-emerald-100 text-gray-500 hover:text-emerald-600 transition-colors" title="Download">
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => setPreviewDoc(null)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview Body */}
              <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center">
                {previewDoc.fileUrl ? (
                  previewDoc.mimeType?.includes('image') ? (
                    <img src={previewDoc.fileUrl} alt={previewDoc.fileName} className="max-w-full rounded-2xl mx-auto border border-gray-100 shadow-sm" />
                  ) : previewDoc.mimeType?.includes('pdf') ? (
                    <iframe src={previewDoc.fileUrl} title={previewDoc.fileName} className="w-full rounded-2xl border border-gray-100 bg-white" style={{ height: '60vh' }} />
                  ) : (
                    <div className="text-center py-10 space-y-3 bg-white p-8 rounded-2xl border border-gray-100 shadow-xs max-w-md w-full">
                      <div className={`w-16 h-16 rounded-2xl mx-auto flex flex-col items-center justify-center font-heading font-black text-sm shadow-xs ${badge.badgeClass}`}>
                        <FileText className="w-7 h-7 mb-1" />
                        <span>{badge.ext}</span>
                      </div>
                      <p className="text-sm font-bold text-qubink-navy">{previewDoc.fileName}</p>
                      <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full ${badge.badgeClass}`}>
                        {badge.label}
                      </span>
                      <p className="text-xs text-qubink-muted">Preview is available by downloading or opening in your local viewer.</p>
                      <a href={previewDoc.fileUrl} download={previewDoc.fileName}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-qubink-teal text-white font-bold text-xs hover:bg-qubink-teal/90 transition-colors cursor-pointer shadow-xs"
                      >
                        <Download className="w-4 h-4" /> Download to View
                      </a>
                    </div>
                  )
                ) : (
                  <div className="text-center py-10 text-qubink-muted text-sm">No preview available.</div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-white">
                <div className="text-xs text-qubink-muted flex items-center gap-3">
                  <span><strong>Format:</strong> <span className="text-qubink-navy font-semibold">{badge.label}</span></span>
                  <span>•</span>
                  <span><strong>Pages:</strong> <span className="text-qubink-navy font-semibold">{previewDoc.pageCount}</span></span>
                  <span>•</span>
                  <span><strong>Size:</strong> <span className="text-qubink-navy font-semibold">{((previewDoc.fileSize || 0) / 1024 / 1024).toFixed(2)} MB</span></span>
                </div>
                <button onClick={() => setPreviewDoc(null)} className="px-5 py-2 rounded-xl bg-qubink-teal text-white text-xs font-bold hover:bg-qubink-teal/90 transition-colors cursor-pointer">
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ADD ADDRESS MODAL */}
      {showAddressModal && (
        <div className="qubink-modal-backdrop flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button onClick={() => setShowAddressModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-qubink-navy font-heading">Add Delivery Address</h3>
            <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-qubink-dark mb-1">Tag As</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Home', 'College', 'Office', 'Other'] as const).map((l) => (
                    <button key={l} type="button" onClick={() => setNewLabel(l)}
                      className={`py-1.5 rounded-lg font-bold border transition-colors ${newLabel === l ? 'bg-qubink-teal text-white border-qubink-teal' : 'bg-gray-50 text-qubink-muted border-gray-200'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-semibold text-qubink-dark mb-1">Full Street Address</label>
                <textarea value={newAddressLine} onChange={(e) => setNewAddressLine(e.target.value)} rows={2}
                  placeholder="e.g. Flat 304, Green Horizon Apts, Hosur Road"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-qubink-teal" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-qubink-dark mb-1">Landmark</label>
                  <input type="text" value={newLandmark} onChange={(e) => setNewLandmark(e.target.value)}
                    placeholder="Near temple" className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-qubink-teal" />
                </div>
                <div>
                  <label className="block font-semibold text-qubink-dark mb-1">City</label>
                  <input type="text" value={newCity} onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Bengaluru" required className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-qubink-teal" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-qubink-dark mb-1">Pincode</label>
                <input type="text" value={newPincode} onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="560001" required maxLength={6}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-qubink-teal" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-qubink-muted font-bold text-xs hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-qubink-teal text-white font-bold text-xs hover:bg-qubink-teal/90">
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

