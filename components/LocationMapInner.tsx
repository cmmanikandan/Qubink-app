'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, MapPin, Navigation, ZoomIn, ZoomOut } from 'lucide-react';
import { GEOAPIFY_API_KEY } from '@/lib/geo';

interface LocationMapInnerProps {
  initialLat: number;
  initialLng: number;
  onCenterChange: (lat: number, lng: number) => void;
  isLocating?: boolean;
  onLocateMe?: () => void;
}

export default function LocationMapInner({
  initialLat,
  initialLng,
  onCenterChange,
  isLocating,
  onLocateMe,
}: LocationMapInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Default to Kallimandhayam/Dindigul if 0,0
    const startLat = initialLat || 10.5838;
    const startLng = initialLng || 77.6908;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 15,
      zoomControl: false,
    });

    // Add high quality OpenStreetMap / Geoapify tiles
    const tileUrl = GEOAPIFY_API_KEY
      ? `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://www.geoapify.com/">Geoapify</a>',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Listen to map drag / pan events
    map.on('movestart', () => {
      setIsPanning(true);
    });

    map.on('moveend', () => {
      setIsPanning(false);
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    });

    map.on('click', (e) => {
      map.panTo(e.latlng, { animate: true, duration: 0.5 });
    });

    // Force map to compute correct container size after mounting
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map center when props change from external search or city button
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (!initialLat || !initialLng) return;

    const currentCenter = mapInstanceRef.current.getCenter();
    const diffLat = Math.abs(currentCenter.lat - initialLat);
    const diffLng = Math.abs(currentCenter.lng - initialLng);

    // Only pan if significantly changed (> 10 meters)
    if (diffLat > 0.0001 || diffLng > 0.0001) {
      mapInstanceRef.current.flyTo([initialLat, initialLng], 16, {
        duration: 1.2,
      });
    }
  }, [initialLat, initialLng]);

  return (
    <div className="relative w-full h-[320px] md:h-[380px] rounded-2xl overflow-hidden shadow-inner border border-gray-200 bg-slate-100 select-none">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Center Delivery Pin */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none flex flex-col items-center transition-transform duration-200"
        style={{
          transform: isPanning
            ? 'translate(-50%, -120%) scale(1.1)'
            : 'translate(-50%, -100%) scale(1)',
        }}
      >
        {/* Floating Tooltip */}
        <div className="bg-qubink-navy text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap mb-1 flex items-center gap-1 border border-white/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{isPanning ? 'Locating...' : 'Delivery Pin'}</span>
        </div>

        {/* Pin Icon */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-red-500/30">
            <MapPin className="w-5 h-5 fill-white" />
          </div>
          {/* Needle / Pointer */}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-600 mx-auto" />
        </div>

        {/* Ground Shadow */}
        <div
          className={`w-4 h-1.5 bg-black/30 rounded-full blur-[1px] transition-all duration-200 ${
            isPanning ? 'opacity-20 scale-75' : 'opacity-60 scale-100'
          }`}
        />
      </div>

      {/* Zoom Controls (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-white/90 backdrop-blur-md rounded-xl shadow-md border border-gray-200 p-1">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          aria-label="Zoom in"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-qubink-navy font-bold transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          aria-label="Zoom out"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-qubink-navy font-bold transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Locate Me Button (Bottom Right) */}
      {onLocateMe && (
        <button
          type="button"
          onClick={onLocateMe}
          disabled={isLocating}
          className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-white text-qubink-teal hover:bg-qubink-teal hover:text-white px-3 py-2 rounded-xl shadow-lg border border-qubink-teal/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'GPS Re-center'}</span>
        </button>
      )}

      {/* Drag Helper Notice (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 bg-qubink-navy/85 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 shadow-md border border-white/10 pointer-events-none">
        <Crosshair className="w-3.5 h-3.5 text-qubink-mint" />
        <span>Pan or drag map to place exact pin</span>
      </div>
    </div>
  );
}
