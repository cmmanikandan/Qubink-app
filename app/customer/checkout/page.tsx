'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import {
  Store,
  FileText,
  Truck,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    shops,
    pricing,
    addresses,
    calculatePricing,
    placeOrder,
    setCartNotes,
  } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const shop = shops.find((s) => s.id === cart.selectedShopId) || shops[0];

  const priceCalc = calculatePricing(
    shop?.id || 'shop-1',
    cart.documents,
    cart.settingsMap,
    cart.fulfillmentType
  );

  const selectedAddress = addresses.find((a) => a.id === cart.addressId);

  const handlePlaceOrder = async () => {
    try {
      setIsSubmitting(true);
      const newOrder = await placeOrder();
      router.push(`/customer/order-success?orderId=${newOrder.id}`);
    } catch (err: any) {
      alert(err?.message || 'Could not place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-qubink-teal">
            Step 4 of 4
          </span>
          <span className="text-xs text-qubink-muted">• Order Summary & Confirmation</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-qubink-navy font-heading mt-0.5">
          Order Summary & Checkout
        </h1>
        <p className="text-xs text-qubink-muted mt-1">
          Review your document print requirements before sending to <strong>{shop?.name}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Job Breakdown */}
        <div className="md:col-span-2 space-y-4">
          {/* Shop Card */}
          <div className="qubink-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-qubink-softmint text-qubink-teal flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-qubink-navy">{shop?.name}</h3>
                <p className="text-xs text-qubink-muted">{shop?.address}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-qubink-teal flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{shop?.estimatedPrepTime || '15-20 mins'}</span>
            </span>
          </div>

          {/* Document Items List */}
          <div className="qubink-card p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-qubink-muted">
              Document Specifications ({cart.documents.length})
            </h4>

            <div className="space-y-2">
              {cart.documents.map((doc) => {
                const s = cart.settingsMap[doc.id] || {
                  printType: 'BW',
                  sides: 'SINGLE',
                  paperSize: 'A4',
                  copies: 1,
                  hasBinding: false,
                  hasStapling: false,
                  hasLamination: false,
                };

                return (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-qubink-teal flex-shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-qubink-navy truncate">{doc.name || doc.fileName}</p>
                        <p className="text-[11px] text-qubink-muted">
                          {doc.pageCount} pgs • {s.printType === 'COLOR' ? 'Colour' : 'B&W'} •{' '}
                          {s.sides === 'DOUBLE' ? 'Back-to-Back' : 'Single'} • {s.paperSize} •{' '}
                          {s.copies} set(s)
                          {s.hasBinding && ' • Spiral'}
                          {s.hasLamination && ' • Laminated'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fulfillment details */}
          <div className="qubink-card p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-qubink-muted">
              Fulfillment Selection
            </h4>
            {cart.fulfillmentType === 'PICKUP' ? (
              <div className="flex items-center gap-2 text-xs font-bold text-qubink-navy">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Counter Pickup (No Extra Charge)</span>
              </div>
            ) : (
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold text-qubink-navy">
                  <Truck className="w-4 h-4 text-qubink-teal" />
                  <span>Home Delivery (+₹{priceCalc.deliveryFee.toFixed(2)})</span>
                </div>
                {selectedAddress && (
                  <p className="text-qubink-muted pl-6">
                    Deliver to: {selectedAddress.addressLine}, {selectedAddress.city} -{' '}
                    {selectedAddress.pincode}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Instructions Notes */}
          <div className="qubink-card p-4 space-y-2">
            <label className="block text-xs font-bold text-qubink-navy">
              Special Instructions for Shop (Optional)
            </label>
            <textarea
              value={cart.notes}
              onChange={(e) => setCartNotes(e.target.value)}
              placeholder="e.g. Please staple top left corner firmly or call upon printing..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-qubink-teal"
            />
          </div>
        </div>

        {/* Right Column: Dynamic Bill Breakdown */}
        <div className="space-y-4">
          <div className="qubink-card p-5 space-y-4 sticky top-20">
            <h3 className="font-bold text-sm text-qubink-navy font-heading border-b pb-2">
              Payment & Bill Breakdown
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-qubink-muted">
                <span>Printing Charges</span>
                <span className="font-semibold text-qubink-navy">
                  ₹{priceCalc.subtotal.toFixed(2)}
                </span>
              </div>

              {priceCalc.bindingTotal > 0 && (
                <div className="flex justify-between text-qubink-muted">
                  <span>Spiral Binding</span>
                  <span className="font-semibold text-qubink-navy">
                    ₹{priceCalc.bindingTotal.toFixed(2)}
                  </span>
                </div>
              )}

              {priceCalc.laminationTotal > 0 && (
                <div className="flex justify-between text-qubink-muted">
                  <span>Lamination</span>
                  <span className="font-semibold text-qubink-navy">
                    ₹{priceCalc.laminationTotal.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-qubink-muted">
                <span>
                  {cart.fulfillmentType === 'PICKUP' ? 'Counter Pickup' : 'Delivery Fee'}
                </span>
                <span className="font-semibold text-qubink-navy">
                  {cart.fulfillmentType === 'PICKUP'
                    ? 'FREE'
                    : `₹${priceCalc.deliveryFee.toFixed(2)}`}
                </span>
              </div>

              <div className="pt-3 border-t flex justify-between items-baseline">
                <span className="font-extrabold text-sm text-qubink-navy">Total Payable</span>
                <span className="font-extrabold text-xl text-qubink-teal font-heading">
                  ₹{priceCalc.total.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-qubink-teal text-white font-bold text-sm shadow-lg shadow-qubink-teal/25 hover:bg-qubink-teal/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Sending to Shop...</span>
              ) : (
                <>
                  <span>Confirm & Place Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center gap-2 text-[11px] text-qubink-muted justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Counter Settlement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
