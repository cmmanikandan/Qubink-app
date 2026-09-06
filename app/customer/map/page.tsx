'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { formatDistance } from '@/lib/geo';
import { MapPin, Star, Navigation, ArrowRight, Store, Clock } from 'lucide-react';
import { Shop } from '@/types';

export default function CustomerMapPage() {
  const router = useRouter();
  const { shops, pricing, userLocation, searchRadius, setSelectedShop } = useApp();
  const [selectedShop, setLocalSelectedShop] = useState<Shop | null>(shops[0] || null);

  const approvedShops = shops.filter((s) => s.status === 'APPROVED');

  return (
    <div className="relative h-[calc(100vh-8rem)] w-full overflow-hidden bg-[#e5e3df]">
      {/* Interactive Map Visual Simulation */}
      <div className="absolute inset-0 bg-[#e8ece9] flex items-center justify-center">
        {/* Visual Map Grid Roads */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#082f3f_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* User GPS Center Marker */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
          <span className="w-5 h-5 rounded-full bg-qubink-teal border-2 border-white shadow-lg animate-ping absolute" />
          <span className="w-4 h-4 rounded-full bg-qubink-teal border-2 border-white shadow-md relative z-10" />
          <span className="mt-1 px-2 py-0.5 rounded-full bg-qubink-navy text-white text-[10px] font-bold shadow-md">
            You Are Here
          </span>
        </div>

        {/* Shop Markers */}
        {approvedShops.map((shop, i) => {
          const offsets = [
            { top: '35%', left: '42%' },
            { top: '60%', left: '68%' },
            { top: '28%', left: '65%' },
            { top: '65%', left: '32%' },
          ];
          const pos = offsets[i % offsets.length];
          const isSelected = selectedShop?.id === shop.id;

          return (
            <div
              key={shop.id}
              style={{ top: pos.top, left: pos.left }}
              onClick={() => setLocalSelectedShop(shop)}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-transform hover:scale-110"
            >
              <div
                className={`p-2 rounded-2xl shadow-xl flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-qubink-navy text-white ring-4 ring-qubink-teal/40 scale-110'
                    : 'bg-white text-qubink-navy hover:bg-gray-50'
                }`}
              >
                <MapPin className={`w-4 h-4 ${isSelected ? 'text-qubink-mint' : 'text-qubink-teal'}`} />
                <span className="text-xs font-bold whitespace-nowrap">{shop.name.split(' ')[0]}</span>
                <span className="text-[10px] font-extrabold px-1 rounded bg-qubink-softmint text-qubink-teal">
                  ★{shop.rating}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Preview Sheet */}
      {selectedShop && (
        <div className="absolute bottom-4 inset-x-4 max-w-lg mx-auto z-30 animate-in slide-in-from-bottom duration-200">
          <div className="qubink-card p-4 bg-white/95 backdrop-blur-md shadow-2xl border border-gray-200/80 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  {selectedShop.isOpen ? 'Open Now' : 'Closed'}
                </span>
                <h3 className="font-extrabold text-sm text-qubink-navy font-heading mt-1">
                  {selectedShop.name}
                </h3>
                <p className="text-xs text-qubink-muted">{selectedShop.address}</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-extrabold text-qubink-teal flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {selectedShop.rating}
                </span>
                <span className="text-[11px] text-qubink-muted block mt-0.5">
                  {selectedShop.distanceKm !== undefined
                    ? formatDistance(selectedShop.distanceKm)
                    : 'Nearby'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="text-qubink-muted">B&W Print: </span>
                <span className="font-bold text-qubink-navy">
                  ₹{pricing[selectedShop.id]?.bwA4 || 2}/pg
                </span>
              </div>

              <button
                onClick={() => {
                  setSelectedShop(selectedShop.id);
                  router.push(`/customer/shop/${selectedShop.id}`);
                }}
                className="px-4 py-2 rounded-xl bg-qubink-teal text-white font-bold text-xs shadow-md hover:bg-qubink-teal/90 flex items-center gap-1.5"
              >
                <span>View Shop</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
