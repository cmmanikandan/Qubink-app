'use client';

import React from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { formatDistance } from '@/lib/geo';
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Navigation,
  CheckCircle2,
  Truck,
  ShoppingBag,
  ArrowLeft,
  Printer,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

export default function ShopDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { shops, pricing, setSelectedShop } = useApp();

  const shop = shops.find((s) => s.id === id) || shops[0];
  const rates = pricing[shop?.id || 'shop-1'] || {
    bwA4: 2.0,
    colorA4: 10.0,
    bwA3: 5.0,
    colorA3: 20.0,
    bindingPrice: 35.0,
    laminationPrice: 25.0,
    deliveryFee: 30.0,
  };

  const formattedAddress = React.useMemo(() => {
    if (!shop) return '';
    const raw = shop.address?.trim() || '';
    const city = shop.city?.trim() || '';
    const pincode = shop.pincode?.trim() || '';

    const parts = [raw];
    if (city && !raw.toLowerCase().includes(city.toLowerCase())) {
      parts.push(city);
    }
    if (pincode && !raw.includes(pincode)) {
      parts.push(pincode);
    }
    return parts.join(', ');
  }, [shop]);

  const handleOrderNow = () => {
    if (!shop?.isOpen) return;
    setSelectedShop(shop.id);
    router.push('/order/new');
  };

  const handleCall = () => {
    window.open(`tel:${shop.phone}`);
  };

  const handleDirections = () => {
    if (shop.mapUrl && (shop.mapUrl.startsWith('http://') || shop.mapUrl.startsWith('https://'))) {
      window.open(shop.mapUrl, '_blank');
      return;
    }
    const query = encodeURIComponent(`${shop.name}, ${formattedAddress}`);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      '_blank'
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-qubink-navy hover:text-qubink-teal transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Shops
      </button>

      {/* Hero Banner Card */}
      <div className="qubink-card overflow-hidden">
        <div className="relative h-60 sm:h-72 w-full bg-gray-100">
          <Image
            src={shop.imageUrl}
            alt={shop.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#082F3F]/80 via-[#082F3F]/30 to-transparent" />

          {/* Badges on Banner */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                shop.isOpen ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {shop.isOpen ? 'Open Now' : 'Closed • On Leave'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-qubink-navy backdrop-blur-md flex items-center gap-1 shadow-md">
              <MapPin className="w-3.5 h-3.5 text-qubink-teal" />
              {formatDistance(shop.distanceKm)}
            </span>
          </div>

          {/* Banner bottom info */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading">{shop.name}</h1>
            <p className="text-xs sm:text-sm text-gray-200 mt-1 line-clamp-1">{shop.description}</p>
          </div>
        </div>

        {/* Closed / On Leave Notice Banner if shop is closed */}
        {!shop.isOpen && (
          <div className="m-4 sm:m-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-800 block text-sm">Shop is Currently Closed / On Leave</span>
              <p className="text-amber-700/90 mt-0.5 leading-relaxed">
                This store is currently not accepting new print orders. You can browse their available services and pricing below, or check back during regular business hours ({shop.openingTime} - {shop.closingTime}).
              </p>
            </div>
          </div>
        )}

        {/* Quick Highlights Row */}
        <div className="p-4 sm:p-6 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-2">
            <div className="flex items-center justify-center gap-1 text-amber-500 font-extrabold text-lg">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{shop.rating.toFixed(1)}</span>
            </div>
            <span className="text-[11px] text-qubink-muted">
              {shop.reviewCount} Verified Reviews
            </span>
          </div>

          <div className="p-2 border-l border-gray-100">
            <div className="text-qubink-navy font-bold text-base flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-qubink-teal" />
              <span>{shop.estimatedPrepTime}</span>
            </div>
            <span className="text-[11px] text-qubink-muted">Est. Preparation</span>
          </div>

          <div className="p-2 border-l border-gray-100">
            <div className="text-qubink-navy font-bold text-sm sm:text-base">
              {shop.openingTime} - {shop.closingTime}
            </div>
            <span className="text-[11px] text-qubink-muted">Operating Hours</span>
          </div>

          <div className="p-2 border-l border-gray-100">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Pickup Free
              </span>
              {shop.isDeliveryAvailable && (
                <span className="text-xs font-bold text-qubink-teal bg-teal-50 px-2 py-0.5 rounded-md">
                  Delivery
                </span>
              )}
            </div>
            <span className="text-[11px] text-qubink-muted mt-1 block">Fulfillment</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-3">
          {shop.isOpen ? (
            <button
              onClick={handleOrderNow}
              className="flex-1 py-3.5 rounded-2xl bg-qubink-teal text-white font-bold text-base hover:bg-qubink-teal/90 shadow-lg shadow-qubink-teal/25 transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              <span>Order Prints Now</span>
            </button>
          ) : (
            <button
              disabled
              className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-400 border border-gray-200 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
              title="Shop is currently closed and not accepting orders"
            >
              <Printer className="w-5 h-5 opacity-60" />
              <span>Shop Closed • Not Accepting Orders</span>
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCall}
              className="flex-1 sm:flex-initial px-5 py-3.5 rounded-2xl border border-gray-200 bg-white text-qubink-navy font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-qubink-teal" />
              <span>Call</span>
            </button>
            <button
              onClick={handleDirections}
              className="flex-1 sm:flex-initial px-5 py-3.5 rounded-2xl border border-gray-200 bg-white text-qubink-navy font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4 text-qubink-navy" />
              <span>Directions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Address & Verification */}
      <div className="qubink-card p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-qubink-softmint flex items-center justify-center text-qubink-teal flex-shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-qubink-navy font-heading">Shop Location</h3>
            <button
              onClick={handleDirections}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-qubink-teal hover:underline"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-qubink-dark mt-1 font-medium leading-relaxed">{formattedAddress}</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Qubink Verified Print Partner</span>
          </div>
        </div>
      </div>

      {/* Services Provided */}
      <div className="qubink-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-qubink-navy font-heading">Services Offered</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {shop.services.map((svc) => (
            <div
              key={svc}
              className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-qubink-teal flex-shrink-0" />
              <span className="text-xs font-bold text-qubink-dark">{svc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Price List Table */}
      <div className="qubink-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-qubink-navy font-heading">Standard Price List</h2>
          <span className="text-xs text-qubink-muted">Live shop rates</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-qubink-muted uppercase text-[11px] font-bold">
                <th className="pb-3">Item / Service</th>
                <th className="pb-3">Specifications</th>
                <th className="pb-3 text-right">Shop Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              <tr>
                <td className="py-3 font-semibold text-qubink-navy">Black & White A4</td>
                <td className="py-3 text-qubink-muted">75 GSM standard bond paper</td>
                <td className="py-3 text-right font-bold text-qubink-navy">₹{rates.bwA4.toFixed(2)} / page</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-qubink-navy">Colour A4</td>
                <td className="py-3 text-qubink-muted">Digital laser high resolution</td>
                <td className="py-3 text-right font-bold text-qubink-teal">₹{rates.colorA4.toFixed(2)} / page</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-qubink-navy">Black & White A3</td>
                <td className="py-3 text-qubink-muted">Large format blueprint / drawings</td>
                <td className="py-3 text-right font-bold text-qubink-navy">₹{rates.bwA3.toFixed(2)} / page</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-qubink-navy">Colour A3</td>
                <td className="py-3 text-qubink-muted">High DPI photo grade large prints</td>
                <td className="py-3 text-right font-bold text-qubink-teal">₹{rates.colorA3.toFixed(2)} / page</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-qubink-navy">Spiral / Soft Binding</td>
                <td className="py-3 text-qubink-muted">With clear PVC plastic sheets</td>
                <td className="py-3 text-right font-bold text-qubink-navy">₹{rates.bindingPrice.toFixed(2)} / book</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-qubink-navy">Lamination (A4)</td>
                <td className="py-3 text-qubink-muted">Waterproof gloss thermal pouch</td>
                <td className="py-3 text-right font-bold text-qubink-navy">₹{rates.laminationPrice.toFixed(2)} / sheet</td>
              </tr>
              {shop.isDeliveryAvailable && (
                <tr>
                  <td className="py-3 font-semibold text-qubink-navy">Home Delivery</td>
                  <td className="py-3 text-qubink-muted">Within shop service area</td>
                  <td className="py-3 text-right font-bold text-emerald-600">₹{rates.deliveryFee.toFixed(2)} flat</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bottom Sticky Bar for Mobile */}
      <div className="sm:hidden fixed bottom-16 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-gray-200 z-30 shadow-lg">
        <button
          onClick={handleOrderNow}
          className="w-full py-3 rounded-xl bg-qubink-teal text-white font-bold text-sm shadow-md shadow-qubink-teal/20 flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Start Print Order</span>
        </button>
      </div>
    </div>
  );
}
