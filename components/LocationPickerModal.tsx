'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Search,
  Navigation,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Building2,
  Compass,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { CustomerAddress } from '@/types';
import {
  reverseGeocodeWithGeoapify,
  searchLocationWithGeoapify,
  GeoapifyLocationResult,
} from '@/lib/geo';

// SSR-safe dynamic import of Leaflet map
const LocationMap = dynamic(() => import('./LocationMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] md:h-[380px] rounded-2xl bg-gray-100 flex flex-col items-center justify-center gap-2 text-qubink-muted border border-gray-200">
      <Loader2 className="w-7 h-7 animate-spin text-qubink-teal" />
      <span className="text-xs font-semibold">Loading Location Map...</span>
    </div>
  ),
});

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_TOWNS = [
  { name: 'Kallimandhayam', pin: '624616', lat: 10.5838, lng: 77.6908, city: 'Dindigul' },
  { name: 'MKCE Thalavapalayam', pin: '639113', lat: 10.9892, lng: 78.0287, city: 'Karur' },
  { name: 'Dindigul Town', pin: '624001', lat: 10.3673, lng: 77.9803, city: 'Dindigul' },
  { name: 'Karur City', pin: '639002', lat: 10.9601, lng: 78.0766, city: 'Karur' },
  { name: 'Coimbatore', pin: '641001', lat: 11.0168, lng: 76.9558, city: 'Coimbatore' },
  { name: 'Madurai', pin: '625001', lat: 9.9252, lng: 78.1198, city: 'Madurai' },
];

export default function LocationPickerModal({ isOpen, onClose }: LocationPickerModalProps) {
  const { userLocation, setManualLocation, addresses } = useApp();

  // Current map center state
  const [currentLat, setCurrentLat] = useState<number>(userLocation.lat || 10.5838);
  const [currentLng, setCurrentLng] = useState<number>(userLocation.lng || 77.6908);
  const [resolvedAddress, setResolvedAddress] = useState<string>(
    userLocation.areaName || 'Kallimandhayam, Dindigul'
  );
  const [resolvedCity, setResolvedCity] = useState<string>(userLocation.city || 'Dindigul');
  const [resolvedPincode, setResolvedPincode] = useState<string>(userLocation.pincode || '624616');

  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);
  const [isIspWarning, setIsIspWarning] = useState<boolean>(false);

  // Search autocomplete
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GeoapifyLocationResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize when modal opens
  useEffect(() => {
    if (isOpen) {
      // If previous location was cached to Kerala (lat < 9.5), reset to user's home in Kallimandhayam
      let lat = userLocation.lat && userLocation.lat !== 0 ? userLocation.lat : 10.5838;
      let lng = userLocation.lng && userLocation.lng !== 0 ? userLocation.lng : 77.6908;
      let area = userLocation.areaName || 'Kallimandhayam, Dindigul';
      let city = userLocation.city || 'Dindigul';
      let pin = userLocation.pincode || '624616';

      if (lat < 9.5 || area.toLowerCase().includes('thiruvananthapuram') || area.toLowerCase().includes('vanchiyoor')) {
        lat = 10.5838;
        lng = 77.6908;
        area = 'Kallimandhayam, Dindigul';
        city = 'Dindigul';
        pin = '624616';
      }

      setCurrentLat(lat);
      setCurrentLng(lng);
      setResolvedAddress(area);
      setResolvedCity(city);
      setResolvedPincode(pin);
      setIsIspWarning(false);
    }
  }, [isOpen, userLocation]);

  // Handle map center change when user drags or clicks map
  const handleMapCenterChange = async (lat: number, lng: number) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    setIsResolving(true);

    try {
      const res = await reverseGeocodeWithGeoapify(lat, lng);
      if (res) {
        setResolvedAddress(res.areaName);
        setResolvedCity(res.city || res.district || 'Dindigul');
        setResolvedPincode(res.pincode || '');
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
    } finally {
      setIsResolving(false);
    }
  };

  // High Accuracy GPS locate
  const handleGpsLocate = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGpsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCurrentLat(latitude);
        setCurrentLng(longitude);

        // If accuracy is poor (> 4000 meters), it's likely a desktop ISP server in Namakkal
        if (accuracy > 4000) {
          setIsIspWarning(true);
        } else {
          setIsIspWarning(false);
        }

        await handleMapCenterChange(latitude, longitude);
        setIsGpsLocating(false);
      },
      (err) => {
        console.warn('GPS error:', err);
        setIsGpsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Search autocomplete handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocationWithGeoapify(val);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectSearchResult = (result: GeoapifyLocationResult) => {
    setCurrentLat(result.lat);
    setCurrentLng(result.lng);
    setResolvedAddress(result.areaName);
    setResolvedCity(result.city || result.district || 'Dindigul');
    setResolvedPincode(result.pincode || '');
    setSearchQuery('');
    setSearchResults([]);
    setIsIspWarning(false);
  };

  // Save selected location
  const handleConfirmLocation = () => {
    setManualLocation(
      resolvedAddress || 'Selected Location',
      resolvedPincode || '',
      { lat: currentLat, lng: currentLng },
      resolvedCity
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="qubink-modal-backdrop flex items-center justify-center p-3 md:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-qubink-softmint text-qubink-teal flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5 text-qubink-teal" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-qubink-navy font-heading">
                Pin Your Exact Location
              </h2>
              <p className="text-[11px] text-qubink-muted">
                Drag the map to place the delivery pin on your shop or home
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 md:p-5 overflow-y-auto space-y-3.5 flex-grow">
          {/* Search bar */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-qubink-muted absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search area, landmark, college (e.g. Kallimandhayam, MKCE)..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-qubink-teal bg-gray-50/50 hover:bg-white transition-colors"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-qubink-teal animate-spin absolute right-3 pointer-events-none" />
              )}
            </div>

            {/* Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSearchResult(item)}
                    className="p-3 hover:bg-qubink-softmint/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-3.5 h-3.5 text-qubink-teal shrink-0" />
                      <div>
                        <p className="font-bold text-qubink-navy">{item.areaName}</p>
                        <p className="text-[10px] text-qubink-muted">{item.formatted}</p>
                      </div>
                    </div>
                    {item.pincode && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-qubink-dark shrink-0">
                        {item.pincode}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ISP Warning Alert if desktop broadband puts them in Namakkal */}
          {isIspWarning && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Broadband ISP Hub Detected (~Namakkal)</p>
                <p className="text-[11px] text-amber-800">
                  Laptops lack hardware GPS and route through ISP towers. Please drag the pin on the map or tap <b>Kallimandhayam</b> below to set your exact location.
                </p>
              </div>
            </div>
          )}

          {/* Quick Town Shortcut Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <span className="font-bold text-qubink-navy shrink-0 mr-1 flex items-center gap-1">
              <Compass className="w-3 h-3 text-qubink-teal" /> Quick:
            </span>
            {QUICK_TOWNS.map((town) => (
              <button
                key={town.name}
                type="button"
                onClick={() => {
                  setCurrentLat(town.lat);
                  setCurrentLng(town.lng);
                  setResolvedAddress(town.name);
                  setResolvedCity(town.city);
                  setResolvedPincode(town.pin);
                  setIsIspWarning(false);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all border cursor-pointer ${
                  resolvedAddress.includes(town.name)
                    ? 'bg-qubink-teal text-white border-qubink-teal shadow-2xs'
                    : 'bg-gray-100 hover:bg-qubink-softmint hover:text-qubink-teal text-qubink-dark border-transparent'
                }`}
              >
                {town.name}
              </button>
            ))}
          </div>

          {/* Leaflet Interactive Map */}
          <LocationMap
            initialLat={currentLat}
            initialLng={currentLng}
            onCenterChange={handleMapCenterChange}
            isLocating={isGpsLocating}
            onLocateMe={handleGpsLocate}
          />

          {/* Live Address Preview Card */}
          <div className="p-3.5 rounded-2xl bg-qubink-softmint/50 border border-qubink-teal/20 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-qubink-teal text-white flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-qubink-teal uppercase tracking-wider flex items-center gap-1.5">
                  <span>Selected Pin Address</span>
                  {isResolving && <Loader2 className="w-3 h-3 animate-spin text-qubink-teal" />}
                </p>
                <p className="text-xs md:text-sm font-bold text-qubink-navy truncate">
                  {resolvedAddress || 'Pinning location...'}
                </p>
                <p className="text-[11px] text-qubink-muted flex items-center gap-2">
                  <span>City: {resolvedCity}</span>
                  {resolvedPincode && <span>• PIN: {resolvedPincode}</span>}
                  <span className="text-[9px] font-mono text-gray-400">
                    ({currentLat.toFixed(4)}, {currentLng.toFixed(4)})
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Saved Addresses Shortcut if customer logged in */}
          {addresses.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-bold text-qubink-navy uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3 h-3 text-qubink-teal" /> Or Pick From Saved Addresses
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {addresses.map((addr: CustomerAddress) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      const locName = addr.landmark
                        ? `${addr.landmark}, ${addr.city}`
                        : `${addr.addressLine.slice(0, 20)}, ${addr.city}`;
                      setManualLocation(locName, addr.pincode);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-gray-50 hover:bg-qubink-softmint border border-gray-200 hover:border-qubink-teal/30 text-left transition-all cursor-pointer flex items-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-qubink-teal shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-qubink-navy">{addr.label}</p>
                      <p className="text-[10px] text-qubink-muted truncate">{addr.addressLine}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Confirm Button */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-qubink-muted hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmLocation}
            className="flex-1 max-w-xs flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-qubink-teal text-white text-xs md:text-sm font-bold shadow-md hover:bg-qubink-navy transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Set Location</span>
          </button>
        </div>
      </div>
    </div>
  );
}
