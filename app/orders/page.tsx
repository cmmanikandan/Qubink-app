'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import {
  FileText,
  ShoppingBag,
  Truck,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Printer,
  Plus,
} from 'lucide-react';

export default function MyOrdersPage() {
  const router = useRouter();
  const { orders } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'active') {
      return (
        o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'REJECTED'
      );
    }
    if (activeTab === 'completed') {
      return o.status === 'COMPLETED' || o.status === 'CANCELLED' || o.status === 'REJECTED';
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-qubink-navy font-heading">My Print Orders</h1>
          <p className="text-xs sm:text-sm text-qubink-muted">
            Track active prints or view past completed document orders.
          </p>
        </div>

        <button
          onClick={() => router.push('/order/new')}
          className="px-3.5 py-2 rounded-xl bg-qubink-teal text-white text-xs font-bold hover:bg-qubink-teal/90 shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Order</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'all', label: `All (${orders.length})` },
          {
            id: 'active',
            label: `Active (${
              orders.filter(
                (o) =>
                  o.status !== 'COMPLETED' &&
                  o.status !== 'CANCELLED' &&
                  o.status !== 'REJECTED'
              ).length
            })`,
          },
          {
            id: 'completed',
            label: `Completed (${
              orders.filter(
                (o) =>
                  o.status === 'COMPLETED' ||
                  o.status === 'CANCELLED' ||
                  o.status === 'REJECTED'
              ).length
            })`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-qubink-teal text-qubink-teal'
                : 'border-transparent text-qubink-muted hover:text-qubink-navy'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="qubink-card p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-qubink-navy font-heading">No orders yet</h3>
          <p className="text-xs text-qubink-muted">
            Your print orders and live tracking will appear here.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/home')}
              className="px-4 py-2 rounded-xl bg-qubink-teal text-white text-xs font-bold"
            >
              Browse Nearby Print Shops
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isActive =
              order.status !== 'COMPLETED' &&
              order.status !== 'CANCELLED' &&
              order.status !== 'REJECTED';

            return (
              <div
                key={order.id}
                onClick={() => router.push(`/order/${order.id}`)}
                className="qubink-card qubink-card-hover p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-sm sm:text-base text-qubink-navy font-heading group-hover:text-qubink-teal transition-colors">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'REJECTED' || order.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-qubink-softmint text-qubink-teal border border-qubink-teal/30'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-qubink-muted">
                    <strong className="text-qubink-dark font-semibold">{order.shopName}</strong>
                    <span className="mx-1.5">•</span>
                    <span>{order.items.length} document{order.items.length > 1 ? 's' : ''}</span>
                    <span className="mx-1.5">•</span>
                    <span>
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-qubink-navy font-bold bg-gray-100 px-2.5 py-1 rounded-lg">
                      {order.fulfillmentType === 'DELIVERY' ? (
                        <>
                          <Truck className="w-3.5 h-3.5 text-qubink-teal" /> Delivery
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" /> Store Pickup
                        </>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-qubink-teal bg-qubink-softmint px-2.5 py-1 rounded-lg border border-qubink-teal/20">
                      OTP: {(order.pickupCode.replace(/\D/g, '') || order.pickupCode).slice(0, 4)}
                    </span>
                    {order.paymentMethod && (
                      <span className="text-[11px] font-semibold text-qubink-muted">
                        • {order.paymentMethod}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-qubink-muted block">Total Amount</span>
                    <span className="text-base font-extrabold text-qubink-navy">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-qubink-teal flex items-center gap-1 group-hover:translate-x-1 transition-transform sm:mt-2">
                    <span>{isActive ? 'Track Live' : 'View Details'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
