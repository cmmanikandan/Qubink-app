'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/store';
import { Home, Store, FileText, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { role, orders } = useApp();

  // Only display mobile bottom navigation for customer experience routes
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

  if (role !== 'customer' || !isCustomerRoute) {
    return null;
  }

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'REJECTED'
  ).length;

  const navItems = [
    { label: 'Home', href: '/customer/home', altHref: '/home', icon: Home },
    { label: 'Shops', href: '/customer/shops', altHref: '/shops', icon: Store },
    {
      label: 'Orders',
      href: '/customer/orders',
      altHref: '/orders',
      icon: FileText,
      badge: activeOrdersCount > 0 ? activeOrdersCount : null,
    },
    { label: 'Profile', href: '/customer/profile', altHref: '/profile', icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <nav className="grid grid-cols-4 h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            pathname === item.altHref ||
            pathname.startsWith(item.href) ||
            pathname.startsWith(item.altHref);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center relative py-1 transition-all ${
                isActive ? 'text-qubink-teal' : 'text-qubink-muted hover:text-qubink-navy'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-qubink-teal text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] mt-1 font-medium transition-all ${
                  isActive ? 'font-bold text-qubink-navy' : ''
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-qubink-teal absolute bottom-1.5" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
