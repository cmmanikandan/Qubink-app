'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { Star, ArrowLeft, Store, MessageSquare, ThumbsUp } from 'lucide-react';

export default function CustomerReviewsPage() {
  const router = useRouter();
  const { orders } = useApp();

  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 text-qubink-navy"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-qubink-navy font-heading">
            My Print Reviews
          </h1>
          <p className="text-xs text-qubink-muted">Feedback shared with local print shops</p>
        </div>
      </div>

      <div className="space-y-3">
        {completedOrders.length === 0 ? (
          <div className="qubink-card p-8 text-center text-qubink-muted space-y-2">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-qubink-navy">No reviews yet</p>
            <p className="text-xs">
              Complete a document print order to leave your rating and review for the shop.
            </p>
          </div>
        ) : (
          completedOrders.map((order) => (
            <div key={order.id} className="qubink-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-qubink-softmint text-qubink-teal flex items-center justify-center font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-qubink-navy">{order.shopName}</h3>
                    <p className="text-[11px] text-qubink-muted">
                      Order {order.orderNumber} • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                  <Star className="w-4 h-4 fill-current" />
                  <span>5.0</span>
                </div>
              </div>

              <p className="text-xs text-qubink-dark bg-gray-50/80 p-3 rounded-xl border border-gray-100 leading-relaxed">
                &ldquo;Exceptional paper quality and the binding was neat and durable. Order was
                ready on time for quick pickup.&rdquo;
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
