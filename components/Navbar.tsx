'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import Logo from '@/components/Logo';
import {
  MapPin,
  Bell,
  ChevronDown,
  Navigation,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import { searchLocationWithGeoapify, GeoapifyLocationResult } from '@/lib/geo';
import LocationPickerModal from '@/components/LocationPickerModal';

export default function Navbar() {
  const {
    role,
    currentUser,
    userLocation,
    addresses,
    notifications,
    searchRadius,
    setSearchRadius,
    setManualLocation,
    requestLocation,
  } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const [showLocationModal, setShowLocationModal] = useState(false);


  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  const getInitials = () => {
    if (currentUser?.fullName?.trim()) {
      const parts = currentUser.fullName.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (currentUser?.name?.trim()) {
      return currentUser.name.trim().slice(0, 2).toUpperCase();
    }
    return 'CU';
  };

  // Only render Navbar for customer experience routes
  const isCustomerRoute =
    pathname &&
    pathname !== '/' &&
    (pathname.startsWith('/customer') ||
      pathname.startsWith('/home') ||
      pathname.startsWith('/shops') ||
      pathname.startsWith('/order') ||
      pathname.startsWith('/orders') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/notifications') ||
      pathname.startsWith('/addresses') ||
      pathname.startsWith('/reviews'));

  if (!isCustomerRoute) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-30 qubink-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-6">
              <Link href={role === 'shop' ? '/shop-portal' : role === 'admin' ? '/admin' : '/home'}>
                <Logo size="md" />
              </Link>

              {/* Customer Location Pill (Desktop & Tablet) */}
              {role === 'customer' && (
                userLocation.areaName ? (
                  <button
                    onClick={() => setShowLocationModal(true)}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-qubink-softmint/70 border border-qubink-teal/20 text-xs font-semibold text-qubink-navy hover:bg-qubink-softmint transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-qubink-teal flex-shrink-0" />
                    <span className="truncate max-w-[150px]">{userLocation.areaName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-qubink-teal/15 text-qubink-teal font-medium">
                      {searchRadius} km
                    </span>
                    <ChevronDown className="w-3 h-3 text-qubink-muted" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLocationModal(true)}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 animate-bounce" />
                    <span>Select Location</span>
                    <ChevronDown className="w-3 h-3 text-amber-600" />
                  </button>
                )
              )}
            </div>

            {/* Desktop Navigation Links based on role */}
            <nav className="hidden lg:flex items-center gap-1">
              {role === 'customer' && (
                <>
                  <Link
                    href="/home"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === '/home'
                        ? 'text-qubink-teal bg-qubink-softmint'
                        : 'text-qubink-muted hover:text-qubink-navy'
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    href="/shops"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/shops')
                        ? 'text-qubink-teal bg-qubink-softmint'
                        : 'text-qubink-muted hover:text-qubink-navy'
                    }`}
                  >
                    Nearby Shops
                  </Link>
                  <Link
                    href="/orders"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/orders') || pathname.startsWith('/order/')
                        ? 'text-qubink-teal bg-qubink-softmint'
                        : 'text-qubink-muted hover:text-qubink-navy'
                    }`}
                  >
                    My Orders
                  </Link>
                </>
              )}

              {role === 'shop' && (
                <>
                  <Link
                    href="/shop-portal"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === '/shop-portal'
                        ? 'text-qubink-teal bg-qubink-softmint'
                        : 'text-qubink-muted hover:text-qubink-navy'
                    }`}
                  >
                    Dashboard & Orders
                  </Link>
                  <Link
                    href="/shop-portal/pricing"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/shop-portal/pricing')
                        ? 'text-qubink-teal bg-qubink-softmint'
                        : 'text-qubink-muted hover:text-qubink-navy'
                    }`}
                  >
                    Live Pricing
                  </Link>
                  <Link
                    href="/shop-portal/profile"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/shop-portal/profile')
                        ? 'text-qubink-teal bg-qubink-softmint'
                        : 'text-qubink-muted hover:text-qubink-navy'
                    }`}
                  >
                    Shop Profile
                  </Link>
                </>
              )}

              {role === 'admin' && (
                <>
                  <Link
                    href="/admin"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === '/admin'
                        ? 'text-qubink-teal bg-qubink-softmint'
                        : 'text-qubink-muted hover:text-qubink-navy'
                    }`}
                  >
                    KPI Overview
                  </Link>
                  <Link
                    href="/admin/shops"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/admin/shops')
                        ? 'text-qubink-teal bg-qubink-softmint'
                        : 'text-qubink-muted hover:text-qubink-navy'
                    }`}
                  >
                    Shop Approvals
                  </Link>
                  <Link
                    href="/admin/customers"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/admin/customers')
                        ? 'text-qubink-teal bg-qubink-softmint'
                        : 'text-qubink-muted hover:text-qubink-navy'
                    }`}
                  >
                    Customers
                  </Link>
                  <Link
                    href="/admin/orders"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/admin/orders')
                        ? 'text-qubink-teal bg-qubink-softmint'
                        : 'text-qubink-muted hover:text-qubink-navy'
                    }`}
                  >
                    All Orders
                  </Link>
                  <Link
                    href="/admin/reports"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/admin/reports')
                        ? 'text-qubink-teal bg-qubink-softmint'
                        : 'text-qubink-muted hover:text-qubink-navy'
                    }`}
                  >
                    Reports
                  </Link>
                </>
              )}
            </nav>

            {/* Right: Notifications & Profile */}
            <div className="flex items-center gap-3">
              {/* Notification Icon */}
              <Link
                href="/notifications"
                className="relative p-2 rounded-xl text-qubink-navy hover:bg-qubink-softmint transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center px-0.5 leading-none shadow-sm">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </Link>

              {/* Profile Link */}
              <Link
                href="/profile"
                className="p-0.5 rounded-full ring-2 ring-transparent hover:ring-qubink-teal transition-all flex items-center justify-center"
                title="Profile"
              >
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName || currentUser.name || 'User Profile'}
                    className="w-8 h-8 rounded-full object-cover border border-qubink-teal/30 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-qubink-navy to-qubink-teal text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {getInitials()}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Location Picker Modal with Interactive Draggable Map */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </>
  );
}
