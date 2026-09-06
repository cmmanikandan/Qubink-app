'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { Bell, CheckCheck, ChevronRight, FileText, ArrowLeft } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();

  const handleNotificationClick = (id: string, orderId?: string) => {
    markNotificationRead(id);
    if (orderId) {
      router.push(`/order/${orderId}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6 selection:bg-qubink-teal selection:text-white">
      {/* Header with Mobile Back Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 sm:p-2.5 rounded-xl hover:bg-gray-100 text-qubink-navy transition-colors cursor-pointer"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-qubink-navy font-heading">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-qubink-teal/15 text-qubink-teal text-[11px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-qubink-muted">
              Live updates on your printing jobs & pickup alerts
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-qubink-softmint text-qubink-navy hover:text-qubink-teal text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mark all as read</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="qubink-card p-12 text-center max-w-md mx-auto space-y-3 border border-gray-200/80 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-qubink-softmint flex items-center justify-center mx-auto text-qubink-teal">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-qubink-navy font-heading">
            You&apos;re all caught up
          </h3>
          <p className="text-xs text-qubink-muted leading-relaxed max-w-xs mx-auto">
            Live updates on your printing orders, counter pickup readiness, and shop receipts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n.id, n.orderId)}
              className={`qubink-card p-4 flex items-start gap-3.5 cursor-pointer transition-all border ${
                !n.isRead
                  ? 'bg-qubink-softmint/40 border-qubink-teal/30 shadow-2xs hover:border-qubink-teal'
                  : 'bg-white border-gray-200/80 hover:border-gray-300 opacity-90'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  !n.isRead ? 'bg-qubink-teal text-white shadow-xs' : 'bg-gray-100 text-qubink-muted'
                }`}
              >
                <FileText className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={`text-xs font-bold truncate ${
                      !n.isRead ? 'text-qubink-navy' : 'text-qubink-dark'
                    }`}
                  >
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-qubink-muted whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-qubink-muted mt-1 leading-relaxed">{n.message}</p>
              </div>

              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 self-center" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
