'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/store';
import { formatDistance } from '@/lib/geo';
import {
  List,
  Map as MapIcon,
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  Truck,
  ShoppingBag,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  X,
} from 'lucide-react';
import { Shop } from '@/types';

function ShopsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') === 'map' ? 'map' : 'list';

  const { shops, pricing, userLocation, searchRadius, setSearchRadius, setSelectedShop } = useApp();

  const [viewMode, setViewMode] = useState<'list' | 'map'>(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'nearest' | 'rating' | 'name'>('nearest');
  const [filterDelivery, setFilterDelivery] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedMapShop, setSelectedMapShop] = useState<Shop | null>(shops[0] || null);

  const allMatchingShops = shops
    .filter((s) => s.status === 'APPROVED')
    .filter((s) => {
      if (
        searchQuery &&
        !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !s.services.some((svc) => svc.toLowerCase().includes(searchQuery.toLowerCase())) &&
        !s.address.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (filterDelivery && !s.isDeliveryAvailable) return false;
      if (filterOpen && !s.isOpen) return false;
      return true;
    });

  const nearbyShops = allMatchingShops
    .filter((s) => s.distanceKm !== undefined && s.distanceKm <= searchRadius)
    .sort((a, b) => {
      if (sortBy === 'nearest') return (a.distanceKm || 0) - (b.distanceKm || 0);
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const extendedShops = allMatchingShops
    .filter((s) => s.distanceKm === undefined || s.distanceKm > searchRadius)
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  const filteredShops: Shop[] = [...nearbyShops, ...extendedShops];

  const handleSelectShop = (shopId: string) => {
    setSelectedShop(shopId);
    router.push(`/shop/${shopId}`);
  };

  const renderShopCard = (shop: Shop) => {
    const rates = pricing[shop.id] || { bwA4: 2.0, colorA4: 10.0 };
    return (
      <div
        key={shop.id}
        onClick={() => handleSelectShop(shop.id)}
        className={`qubink-card qubink-card-hover overflow-hidden flex flex-col justify-between cursor-pointer group transition-all ${
          !shop.isOpen ? 'opacity-75 bg-gray-50/70 border-dashed border-gray-300 hover:opacity-90' : ''
        }`}
      >
        <div>
          <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
            <Image
              src={shop.imageUrl}
              alt={shop.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            <div className="absolute top-3 left-3">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md ${
                  shop.isOpen ? 'bg-emerald-500/90 text-white' : 'bg-rose-600/90 text-white'
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

            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-white text-xs font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{shop.rating.toFixed(1)}</span>
              <span className="text-gray-300 text-[10px]">({shop.reviewCount})</span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-base font-bold text-qubink-navy font-heading group-hover:text-qubink-teal transition-colors">
                {shop.name}
              </h3>
              <p className="text-xs text-qubink-muted line-clamp-1 mt-0.5">
                {shop.address}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="px-2.5 py-1 rounded-lg bg-gray-100 text-qubink-dark font-medium">
                B&W A4: <span className="font-bold text-qubink-navy">₹{rates.bwA4}</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-teal-50 text-qubink-teal font-medium border border-teal-100">
                Colour: <span className="font-bold">₹{rates.colorA4}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {shop.services.map((svc) => (
                <span
                  key={svc}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-gray-50 text-qubink-muted border border-gray-100"
                >
                  {svc}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 pt-0 border-t border-gray-100 mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-qubink-muted">
            <span className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <ShoppingBag className="w-3 h-3" /> Pickup
            </span>
            {shop.isDeliveryAvailable && (
              <span className="flex items-center gap-1 font-medium text-qubink-teal bg-teal-50 px-2 py-0.5 rounded-md">
                <Truck className="w-3 h-3" /> Delivery
              </span>
            )}
          </div>

          {shop.isOpen ? (
            <span className="text-xs font-bold text-qubink-teal flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              View Shop <ChevronRight className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="text-xs font-bold text-gray-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Closed • Details <ChevronRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-qubink-navy font-heading">
            Print & Xerox Shops
          </h1>
          <p className="text-xs sm:text-sm text-qubink-muted">
            {nearbyShops.length > 0
              ? `Found ${nearbyShops.length} shops within ${searchRadius} km of ${userLocation.areaName || userLocation.city || 'your location'}`
              : `No shops within ${searchRadius} km • Showing closest shops in surrounding areas`}
          </p>
        </div>

        {/* List / Map Switcher */}
        <div className="flex items-center bg-gray-200/70 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-qubink-navy shadow-sm'
                : 'text-qubink-muted hover:text-qubink-navy'
            }`}
          >
            <List className="w-4 h-4" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'map'
                ? 'bg-qubink-teal text-white shadow-sm'
                : 'text-qubink-muted hover:text-qubink-navy'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Map View</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="qubink-card p-4 space-y-3 border-gray-200">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-qubink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search shops by name, service or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-qubink-teal"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-qubink-dark"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap cursor-pointer ${
                filterOpen
                  ? 'bg-qubink-navy text-white border-qubink-navy'
                  : 'bg-white text-qubink-dark border-gray-200 hover:bg-gray-50'
              }`}
            >
              Open Now Only
            </button>

            <button
              onClick={() => setFilterDelivery(!filterDelivery)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap cursor-pointer ${
                filterDelivery
                  ? 'bg-qubink-navy text-white border-qubink-navy'
                  : 'bg-white text-qubink-dark border-gray-200 hover:bg-gray-50'
              }`}
            >
              Delivery Available
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-qubink-dark border border-gray-200 focus:outline-none focus:ring-2 focus:ring-qubink-teal cursor-pointer"
            >
              <option value="nearest">Sort: Nearest</option>
              <option value="rating">Sort: Top Rated</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>

        {/* Radius Filter Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto">
          <span className="text-[11px] font-bold text-qubink-muted uppercase whitespace-nowrap">
            Radius:
          </span>
          {[2, 5, 10, 25, 50].map((km) => (
            <button
              key={km}
              onClick={() => setSearchRadius(km)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                searchRadius === km
                  ? 'bg-qubink-teal text-white border-qubink-teal shadow-xs'
                  : 'bg-gray-50 text-qubink-muted border-gray-200 hover:bg-gray-100'
              }`}
            >
              {km} km
            </button>
          ))}
        </div>
      </div>

      {/* Main View: List or Map */}
      {viewMode === 'list' ? (
        nearbyShops.length === 0 ? (
          /* Case 1: No shops in immediate radius */
          <div className="space-y-8">
            {/* Notice Card */}
            <div className="bg-gradient-to-b from-amber-50/80 to-white rounded-3xl p-8 text-center border border-amber-200/80 shadow-xs max-w-xl mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-qubink-navy font-heading">
                No Print Shops Found Within {searchRadius} km
              </h3>
              <p className="text-xs text-qubink-muted max-w-md mx-auto leading-relaxed">
                There are no active print centers in your immediate {searchRadius} km radius of{' '}
                <span className="font-semibold text-qubink-navy">
                  {userLocation.areaName || userLocation.city || 'your current area'}
                </span>
                .
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setSearchRadius(searchRadius >= 25 ? 50 : 25);
                    setFilterDelivery(false);
                    setFilterOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-qubink-teal text-white text-xs font-bold hover:bg-qubink-teal/90 shadow-xs transition-all cursor-pointer"
                >
                  Expand Radius to {searchRadius >= 25 ? '50 km' : '25 km'}
                </button>
              </div>
            </div>

            {/* Under that: Show closest extended shops */}
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
                      Printing centers located slightly beyond your {searchRadius} km radius, sorted from closest to furthest
                    </p>
                  </div>
                  <span className="text-xs font-bold text-qubink-teal bg-qubink-softmint px-3 py-1 rounded-full self-start sm:self-auto">
                    {extendedShops.length} shops available
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {extendedShops.map((shop) => renderShopCard(shop))}
                </div>
              </div>
            ) : (
              <div className="qubink-card p-8 text-center max-w-md mx-auto space-y-2">
                <p className="text-xs text-qubink-muted">
                  No shops match your active search or filter filters.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Case 2: Nearby shops available */
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {nearbyShops.map((shop) => renderShopCard(shop))}
            </div>

            {/* If there are also shops in the extended radius, show them below */}
            {extendedShops.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-gray-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-qubink-navy font-heading">
                      More Print Shops in Surrounding Region ({extendedShops.length})
                    </h3>
                    <p className="text-[11px] text-qubink-muted">
                      Centers beyond your immediate {searchRadius} km radius
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {extendedShops.map((shop) => renderShopCard(shop))}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* Interactive Map View */
        <div className="relative h-[550px] rounded-3xl overflow-hidden qubink-card border-gray-200 flex flex-col">
          {/* Simulated Map Visual Canvas */}
          <div className="relative flex-1 w-full bg-[#E5EEF0] overflow-hidden">
            {/* Map Roads & Area Visual lines */}
            <div className="absolute inset-0 opacity-40">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                    <path
                      d="M 80 0 L 0 0 0 80"
                      fill="none"
                      stroke="#cad7db"
                      strokeWidth="2"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <path
                  d="M -50 150 Q 200 120 400 300 T 900 450"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="12"
                />
                <path
                  d="M 250 -50 L 350 600"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="10"
                />
                <path
                  d="M 600 -50 L 500 600"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="8"
                />
              </svg>
            </div>

            {/* Customer Location Center Marker */}
            <div className="absolute top-[48%] left-[45%] transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-blue-600 border-4 border-white shadow-xl animate-pulse" />
              <div className="px-2 py-0.5 rounded-full bg-qubink-navy text-white text-[10px] font-bold shadow-md mt-1">
                You are here
              </div>
            </div>

            {/* Shop Markers */}
            {filteredShops.map((shop, idx) => {
              // Distribute pins across map canvas
              const positions = [
                { top: '35%', left: '32%' },
                { top: '42%', left: '60%' },
                { top: '65%', left: '38%' },
                { top: '25%', left: '72%' },
                { top: '70%', left: '65%' },
              ];
              const pos = positions[idx % positions.length];
              const isSelected = selectedMapShop?.id === shop.id;

              return (
                <div
                  key={shop.id}
                  style={{ top: pos.top, left: pos.left }}
                  onClick={() => setSelectedMapShop(shop)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group"
                >
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg transition-all duration-300 ${
                      isSelected
                        ? 'bg-qubink-teal text-white ring-4 ring-qubink-teal/30 scale-110'
                        : 'bg-white text-qubink-navy hover:scale-105 border border-gray-200'
                    }`}
                  >
                    <MapPin
                      className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-qubink-teal'}`}
                    />
                    <span className="text-xs font-bold truncate max-w-[120px]">{shop.name}</span>
                  </div>
                  {/* Pin tail */}
                  <div
                    className={`w-2 h-2 rotate-45 mx-auto -mt-1 ${
                      isSelected ? 'bg-qubink-teal' : 'bg-white'
                    }`}
                  />
                </div>
              );
            })}

            {/* Floating Selected Shop Card at bottom of map */}
            {selectedMapShop && (
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-qubink-teal/20 space-y-3 animate-in fade-in slide-in-from-bottom-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden relative flex-shrink-0 bg-gray-100">
                        <Image
                          src={selectedMapShop.imageUrl}
                          alt={selectedMapShop.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-qubink-navy font-heading line-clamp-1">
                          {selectedMapShop.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-qubink-muted">
                          <span className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {selectedMapShop.rating.toFixed(1)}
                          </span>
                          <span>•</span>
                          <span className="text-qubink-teal font-semibold">
                            {formatDistance(selectedMapShop.distanceKm)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMapShop(null)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                    <div className="text-qubink-muted">
                      Status:{' '}
                      <span
                        className={`font-semibold ${
                          selectedMapShop.isOpen ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {selectedMapShop.isOpen ? 'Open Now' : 'Closed'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSelectShop(selectedMapShop.id)}
                      className="px-4 py-1.5 rounded-xl bg-qubink-teal text-white text-xs font-bold hover:bg-qubink-teal/90 shadow-sm flex items-center gap-1"
                    >
                      <span>View Shop</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-qubink-muted">Loading nearby print shops...</div>}>
      <ShopsContent />
    </Suspense>
  );
}
