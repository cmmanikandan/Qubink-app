'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/store';
import { Store, Truck, MapPin, CheckCircle2, ArrowRight, Plus, Loader2 } from 'lucide-react';

function FulfillmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopIdParam = searchParams.get('shopId');

  const {
    cart,
    shops,
    pricing,
    addresses,
    setFulfillmentType,
    setAddressId,
  } = useApp();

  const shop =
    shops.find((s) => s.id === (shopIdParam || cart.selectedShopId)) || shops[0];
  const rates = pricing[shop?.id] || {
    bwA4: 2.0,
    colorA4: 10.0,
    bwA3: 5.0,
    colorA3: 20.0,
    bindingPrice: 35.0,
    laminationPrice: 25.0,
    deliveryFee: 30.0,
  };

  const isPickupAllowed = shop?.isPickupAvailable ?? true;
  const isDeliveryAllowed = shop?.isDeliveryAvailable ?? false;

  const handleSelectFulfillment = (type: 'PICKUP' | 'DELIVERY') => {
    setFulfillmentType(type);
    if (type === 'DELIVERY' && !cart.addressId && addresses.length > 0) {
      setAddressId(addresses[0].id);
    }
  };

  const handleProceed = () => {
    if (cart.fulfillmentType === 'DELIVERY' && !cart.addressId) {
      alert('Please select or add a delivery address.');
      return;
    }
    router.push(`/customer/checkout?shopId=${shop?.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-qubink-teal">
            Step 3 of 4
          </span>
          <span className="text-xs text-qubink-muted">• Collection Method</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-qubink-navy font-heading mt-0.5">
          Pickup or Home Delivery
        </h1>
        <p className="text-xs text-qubink-muted mt-1">
          Select how you want to receive your printed documents from <strong>{shop?.name}</strong>.
        </p>
      </div>

      <div className="space-y-4">
        {/* Option 1: Shop Pickup */}
        {isPickupAllowed && (
          <div
            onClick={() => handleSelectFulfillment('PICKUP')}
            className={`qubink-card p-5 cursor-pointer border-2 transition-all ${
              cart.fulfillmentType === 'PICKUP'
                ? 'border-qubink-teal bg-qubink-softmint/20 shadow-md'
                : 'border-transparent hover:border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-qubink-softmint text-qubink-teal flex items-center justify-center flex-shrink-0">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-qubink-navy font-heading">
                      🏪 Pickup from Shop
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      FREE
                    </span>
                  </div>
                  <p className="text-xs text-qubink-muted mt-1 leading-relaxed">
                    Collect directly from <strong>{shop?.name}</strong> counter when ready. Skip
                    the queue by showing your 6-digit pickup QR code.
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    📍 {shop?.address} (Ready in {shop?.estimatedPrepTime || '15-20 mins'})
                  </p>
                </div>
              </div>

              {cart.fulfillmentType === 'PICKUP' && (
                <CheckCircle2 className="w-5 h-5 text-qubink-teal flex-shrink-0" />
              )}
            </div>
          </div>
        )}

        {/* Option 2: Home Delivery */}
        {isDeliveryAllowed ? (
          <div
            onClick={() => handleSelectFulfillment('DELIVERY')}
            className={`qubink-card p-5 cursor-pointer border-2 transition-all ${
              cart.fulfillmentType === 'DELIVERY'
                ? 'border-qubink-teal bg-qubink-softmint/20 shadow-md'
                : 'border-transparent hover:border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-qubink-softmint text-qubink-teal flex items-center justify-center flex-shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-qubink-navy font-heading">
                      🚚 Home / Campus Delivery
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-qubink-navy text-white text-[10px] font-bold">
                      +₹{rates.deliveryFee.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-qubink-muted mt-1 leading-relaxed">
                    Printed documents securely delivered right to your doorstep or college hostel.
                  </p>
                </div>
              </div>

              {cart.fulfillmentType === 'DELIVERY' && (
                <CheckCircle2 className="w-5 h-5 text-qubink-teal flex-shrink-0" />
              )}
            </div>

            {/* Address selector if delivery is chosen */}
            {cart.fulfillmentType === 'DELIVERY' && (
              <div className="mt-4 pt-4 border-t border-gray-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-qubink-navy">
                    Select Delivery Destination
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/customer/address');
                    }}
                    className="text-xs font-bold text-qubink-teal hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add New</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {addresses.map((addr) => {
                    const isSelectedAddr = cart.addressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddressId(addr.id);
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                          isSelectedAddr
                            ? 'border-qubink-teal bg-white ring-1 ring-qubink-teal'
                            : 'border-gray-200 bg-gray-50/60'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-qubink-teal flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-qubink-navy">{addr.label}</span>
                            <p className="text-qubink-muted mt-0.5">
                              {addr.addressLine}, {addr.city} - {addr.pincode}
                            </p>
                          </div>
                        </div>
                        {isSelectedAddr && (
                          <span className="w-2 h-2 rounded-full bg-qubink-teal flex-shrink-0 mt-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-qubink-muted text-center">
            Note: This shop offers <strong>Counter Pickup only</strong>. Delivery is currently
            unavailable for this location.
          </div>
        )}

        {/* Proceed Button */}
        <div className="pt-2">
          <button
            onClick={handleProceed}
            className="w-full py-3.5 rounded-2xl bg-qubink-teal text-white font-bold text-sm shadow-lg shadow-qubink-teal/25 hover:bg-qubink-teal/90 flex items-center justify-center gap-2"
          >
            <span>Next: Review Order & Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FulfillmentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-qubink-muted flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-qubink-teal" />
          <span>Loading delivery & pickup options...</span>
        </div>
      }
    >
      <FulfillmentContent />
    </Suspense>
  );
}
