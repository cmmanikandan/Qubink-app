'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { formatDistance } from '@/lib/geo';
import { Shop } from '@/types';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Truck,
  ShoppingBag,
  ArrowRight,
  Filter,
  Copy,
  Printer,
  Scan,
  BookOpen,
  Sparkles,
  SlidersHorizontal,
  Navigation,
} from 'lucide-react';

const SERVICE_CATEGORIES = [
  { id: 'Xerox', label: 'Xerox', icon: Copy, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { id: 'Printing', label: 'Printing', icon: Printer, color: 'bg-teal-50 text-qubink-teal border-teal-100' },
  { id: 'Scanning', label: 'Scanning', icon: Scan, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'Binding', label: 'Binding', icon: BookOpen, color: 'bg-amber-50 text-amber-600 border-amber-100' },
];

export default function CustomerHomePage() {
  const router = useRouter();
  const {
    shops,
    pricing,
    userLocation,
    searchRadius,
    setSearchRadius,
    locationStatus,
    requestLocation,
    setSelectedShop,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterDeliveryOnly, setFilterDeliveryOnly] = useState(false);
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);

  // Filter approved shops matching filters
  const allMatchingShops = shops
    .filter((s) => s.status === 'APPROVED')
    .filter((s) => {
      // Search query
      if (
        searchQuery &&
        !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !s.services.some((svc) => svc.toLowerCase().includes(searchQuery.toLowerCase())) &&
        !s.address.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      // Category filter
      if (selectedCategory && !s.services.includes(selectedCategory)) return false;
      // Delivery filter
      if (filterDeliveryOnly && !s.isDeliveryAvailable) return false;
      // Open filter
      if (filterOpenOnly && !s.isOpen) return false;

      return true;
    });

  const nearbyShops = allMatchingShops
    .filter((s) => s.distanceKm !== undefined && s.distanceKm <= searchRadius)
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  const extendedShops = allMatchingShops
    .filter((s) => s.distanceKm === undefined || s.distanceKm > searchRadius)
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  const visibleShops = [...nearbyShops, ...extendedShops];

  const handleStartOrder = (shopId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedShop(shopId);
    router.push('/order/new');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
      {/* Location Permission Prompt Card (polite) */}
      {locationStatus === 'prompt' && (
        <div className="rounded-2xl bg-gradient-to-r from-qubink-softmint to-teal-50/70 border border-qubink-teal/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-qubink-teal text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-qubink-navy font-heading">
                Find the closest print shops in seconds
              </h4>
              <p className="text-xs text-qubink-muted">
                Allow location access to calculate exact distances & delivery times accurately.
              </p>
            </div>
          </div>
          <button
            onClick={requestLocation}
            className="px-4 py-2 rounded-xl bg-qubink-navy text-white text-xs font-bold hover:bg-qubink-navy/90 transition-all self-end sm:self-auto shadow-sm"
          >
            Enable Location
          </button>
        </div>
      )}

      {/* Hero Banner / Search Bar */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#082F3F] via-[#0B3A4F] to-[#00A99D] p-6 sm:p-8 text-white shadow-xl shadow-qubink-navy/15 overflow-hidden">
        {/* Background glow circle */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-qubink-mint/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-qubink-mint">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zero Queue • Fast Digital Printing & Xerox</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight leading-tight">
            Print Documents Without Waiting in Line
          </h1>
          <p className="text-sm sm:text-base text-gray-200/90 font-normal">
            Upload files, customize pages & binding, and pick up ready prints or get doorstep delivery.
          </p>

          {/* Search Input Box */}
          <div className="pt-2">
            <div className="relative flex items-center bg-white rounded-2xl shadow-lg p-1.5 focus-within:ring-2 focus-within:ring-qubink-mint">
              <Search className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search printing shops, Xerox, or binding near you..."
                className="w-full bg-transparent px-3 py-2 text-sm text-qubink-navy placeholder:text-gray-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Service Category Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-qubink-navy font-heading">Popular Services</h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-semibold text-qubink-teal hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {SERVICE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                className={`qubink-card p-4 flex flex-col items-center text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-qubink-teal bg-qubink-softmint/50 border-qubink-teal'
                    : 'hover:border-qubink-teal/30 hover:shadow-md'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 border ${cat.color}`}
                >
                  <Icon className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-sm font-bold text-qubink-navy font-heading">{cat.label}</span>
                <span className="text-[11px] text-qubink-muted mt-0.5">Instant Service</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-qubink-navy font-heading">
            Nearby Printing Shops
          </h2>
          <span className="text-xs font-semibold text-qubink-teal bg-qubink-softmint px-2.5 py-1 rounded-full border border-qubink-teal/20">
            {visibleShops.length} Found
          </span>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterDeliveryOnly(!filterDeliveryOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              filterDeliveryOnly
                ? 'bg-qubink-teal text-white border-qubink-teal shadow-xs'
                : 'bg-white text-qubink-muted border-gray-200 hover:border-gray-300'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Home Delivery
          </button>

          <button
            onClick={() => setFilterOpenOnly(!filterOpenOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              filterOpenOnly
                ? 'bg-qubink-navy text-white border-qubink-navy shadow-xs'
                : 'bg-white text-qubink-muted border-gray-200 hover:border-gray-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Open Now
          </button>

          <Link
            href="/shops?view=map"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-qubink-navy border border-gray-200 hover:border-qubink-teal hover:text-qubink-teal transition-all flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-qubink-teal" />
            Map View
          </Link>
        </div>
      </div>

      {/* Shops Section */}
      {(() => {
        const renderHomeShopCard = (shop: Shop) => {
          const rates = pricing[shop.id] || { bwA4: 2.0, colorA4: 10.0 };
          return (
            <div
              key={shop.id}
              onClick={() => router.push(`/shop/${shop.id}`)}
              className={`qubink-card qubink-card-hover overflow-hidden flex flex-col justify-between cursor-pointer group transition-all ${
                !shop.isOpen ? 'opacity-75 bg-gray-50/70 border-dashed border-gray-300 hover:opacity-90' : ''
              }`}
            >
              <div>
                {/* Shop Image Banner */}
                <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                  <Image
                    src={shop.imageUrl}
                    alt={shop.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Status & Distance Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-xs ${
                        shop.isOpen
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-rose-600/90 text-white'
                      }`}
                    >
                      {shop.isOpen ? 'Open Now' : 'Closed • On Leave'}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-qubink-navy backdrop-blur-md flex items-center gap-1 shadow-sm">
                      <MapPin className="w-3 h-3 text-qubink-teal" />
                      {formatDistance(shop.distanceKm)}
                    </span>
                  </div>

                  {/* Rating Pill bottom left */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-white text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{shop.rating.toFixed(1)}</span>
                    <span className="text-gray-300 text-[10px]">({shop.reviewCount})</span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-qubink-navy font-heading group-hover:text-qubink-teal transition-colors line-clamp-1">
                      {shop.name}
                    </h3>
                    <p className="text-xs text-qubink-muted line-clamp-1 mt-0.5">
                      {shop.address}
                    </p>
                  </div>

                  {/* Pricing Tags */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="px-2.5 py-1 rounded-lg bg-gray-100 text-qubink-dark font-medium">
                      B&W A4: <span className="font-bold text-qubink-navy">₹{rates.bwA4}</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-teal-50 text-qubink-teal font-medium border border-teal-100">
                      Colour: <span className="font-bold">₹{rates.colorA4}</span>
                    </div>
                  </div>

                  {/* Services Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {shop.services.slice(0, 3).map((svc: string) => (
                      <span
                        key={svc}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-gray-50 text-qubink-muted border border-gray-100"
                      >
                        {svc}
                      </span>
                    ))}
                    {shop.services.length > 3 && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-400">
                        +{shop.services.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer: Fulfillment badges & Order CTA */}
              <div className="p-4 pt-0 border-t border-gray-100 mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-qubink-muted">
                  <span className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <ShoppingBag className="w-3 h-3" /> Pickup Free
                  </span>
                  {shop.isDeliveryAvailable && (
                    <span className="flex items-center gap-1 font-medium text-qubink-teal bg-teal-50 px-2 py-0.5 rounded-md">
                      <Truck className="w-3 h-3" /> Delivery
                    </span>
                  )}
                </div>

                {shop.isOpen ? (
                  <button
                    onClick={(e) => handleStartOrder(shop.id, e)}
                    className="px-3.5 py-2 rounded-xl bg-qubink-teal text-white text-xs font-bold hover:bg-qubink-teal/90 transition-all flex items-center gap-1 shadow-sm shadow-qubink-teal/20 cursor-pointer"
                  >
                    <span>Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded-xl border border-gray-200">
                    Closed • On Leave
                  </span>
                )}
              </div>
            </div>
          );
        };

        if (nearbyShops.length === 0) {
          return (
            <div className="space-y-8">
              {/* Notice: No shops within selected radius */}
              <div className="bg-gradient-to-b from-amber-50/80 to-white rounded-3xl p-8 text-center border border-amber-200/80 shadow-xs max-w-xl mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-qubink-navy font-heading">
                  No Printing Shops Found Within {searchRadius} km
                </h3>
                <p className="text-xs text-qubink-muted max-w-md mx-auto leading-relaxed">
                  There are currently no active print shops within your immediate {searchRadius} km radius of{' '}
                  <span className="font-semibold text-qubink-navy">
                    {userLocation.areaName || userLocation.city || 'your current area'}
                  </span>
                  .
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setSearchRadius(searchRadius >= 25 ? 50 : 25)}
                    className="px-4 py-2 rounded-xl bg-qubink-teal text-white text-xs font-bold hover:bg-qubink-teal/90 shadow-xs transition-all cursor-pointer"
                  >
                    Expand Search Radius to {searchRadius >= 25 ? '50 km' : '25 km'}
                  </button>
                </div>
              </div>

              {/* Show extended / longest shops underneath */}
              {extendedShops.length > 0 ? (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-qubink-teal animate-pulse" />
                        <h2 className="text-base sm:text-lg font-black text-qubink-navy font-heading">
                          Available Shops in Surrounding Areas (Closest First)
                        </h2>
                      </div>
                      <p className="text-xs text-qubink-muted mt-0.5">
                        Print partners located further away, sorted by closest distance to you
                      </p>
                    </div>
                    <span className="text-xs font-bold text-qubink-teal bg-qubink-softmint px-3 py-1 rounded-full self-start sm:self-auto">
                      {extendedShops.length} shops found
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {extendedShops.map((shop) => renderHomeShopCard(shop))}
                  </div>
                </div>
              ) : (
                <div className="qubink-card p-8 text-center max-w-md mx-auto space-y-2">
                  <p className="text-xs text-qubink-muted">
                    No printing shops match your active filters.
                  </p>
                </div>
              )}
            </div>
          );
        }

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {nearbyShops.map((shop) => renderHomeShopCard(shop))}
            </div>

            {extendedShops.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-gray-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-qubink-navy font-heading">
                      More Print Shops in Surrounding Region ({extendedShops.length})
                    </h3>
                    <p className="text-[11px] text-qubink-muted">
                      Centers located beyond your immediate {searchRadius} km radius
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {extendedShops.map((shop) => renderHomeShopCard(shop))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
