'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/store';
import {
  FileText,
  Sliders,
  Check,
  ArrowRight,
  Printer,
  BookOpen,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function PrintOptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopIdParam = searchParams.get('shopId');

  const { cart, shops, pricing, updateDocumentSettings } = useApp();

  const shop =
    shops.find((s) => s.id === (shopIdParam || cart.selectedShopId)) || shops[0];
  const rates = pricing[shop?.id] || {
    bwA4: 2.0,
    colorA4: 10.0,
    bwA3: 5.0,
    colorA3: 20.0,
    bindingPrice: 35.0,
    laminationPrice: 25.0,
    deliveryFee: 30.0,
  };

  const docs = cart.documents;

  // Selected doc to customize (defaults to first doc)
  const [selectedDocId, setSelectedDocId] = useState<string>(docs[0]?.id || '');
  const activeDoc = docs.find((d) => d.id === selectedDocId) || docs[0];
  const settings = (activeDoc && cart.settingsMap[activeDoc.id]) || {
    printType: 'BW',
    sides: 'SINGLE',
    paperSize: 'A4',
    copies: 1,
    hasBinding: false,
    hasStapling: false,
    hasLamination: false,
  };

  const handleUpdate = (updates: any) => {
    if (!activeDoc) return;
    updateDocumentSettings(activeDoc.id, updates);
  };

  // Price estimate for current document
  const perPageRate =
    settings.printType === 'COLOR'
      ? settings.paperSize === 'A3'
        ? rates.colorA3
        : rates.colorA4
      : settings.paperSize === 'A3'
      ? rates.bwA3
      : rates.bwA4;

  const docPageCount = activeDoc?.pageCount || 1;
  const printingCost = perPageRate * docPageCount * settings.copies;
  const bindingCost = settings.hasBinding ? rates.bindingPrice * settings.copies : 0;
  const laminationCost = settings.hasLamination
    ? rates.laminationPrice * docPageCount * settings.copies
    : 0;
  const staplingCost = settings.hasStapling ? 5 * settings.copies : 0;
  const currentDocTotal = printingCost + bindingCost + laminationCost + staplingCost;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-qubink-teal">
            Step 2 of 4
          </span>
          <span className="text-xs text-qubink-muted">• Print Specifications</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-qubink-navy font-heading mt-0.5">
          Customize Print Options
        </h1>
        <p className="text-xs text-qubink-muted mt-1">
          Rates provided live by <strong>{shop?.name}</strong>. Prices update dynamically.
        </p>
      </div>

      {/* Multi-document switcher */}
      {docs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {docs.map((d, index) => {
            const isSel = d.id === selectedDocId;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDocId(d.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSel
                    ? 'bg-qubink-teal text-white border-qubink-teal shadow-xs'
                    : 'bg-white text-qubink-navy border-gray-200 hover:border-gray-300'
                }`}
              >
                Doc {index + 1}: {(d.name || d.fileName || 'Doc').substring(0, 15)}...
              </button>
            );
          })}
        </div>
      )}

      {/* Settings Grid */}
      <div className="qubink-card p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-qubink-teal" />
            <div>
              <p className="font-bold text-sm text-qubink-navy truncate max-w-xs">
                {activeDoc?.name || activeDoc?.fileName || 'Document File'}
              </p>
              <p className="text-xs text-qubink-muted">
                {activeDoc?.pageCount || 1} pages detected
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-qubink-muted block">Doc Total</span>
            <span className="text-base font-extrabold text-qubink-teal font-heading">
              ₹{currentDocTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 1. Print Type: B&W vs Colour */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-qubink-navy">
            1. Colour Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleUpdate({ printType: 'BW' })}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                settings.printType === 'BW'
                  ? 'border-qubink-teal bg-qubink-softmint/40 ring-1 ring-qubink-teal'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-qubink-navy">Black & White</span>
                <span className="text-xs font-bold text-qubink-teal">₹{rates.bwA4}/pg</span>
              </div>
              <p className="text-[11px] text-qubink-muted mt-0.5">
                Standard crisp document printing
              </p>
            </button>

            <button
              onClick={() => handleUpdate({ printType: 'COLOR' })}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                settings.printType === 'COLOR'
                  ? 'border-qubink-teal bg-qubink-softmint/40 ring-1 ring-qubink-teal'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-qubink-navy">Full Colour</span>
                <span className="text-xs font-bold text-qubink-teal">₹{rates.colorA4}/pg</span>
              </div>
              <p className="text-[11px] text-qubink-muted mt-0.5">
                High-definition laser colour prints
              </p>
            </button>
          </div>
        </div>

        {/* 2. Sides: Single vs Double */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-qubink-navy">
            2. Print Sides
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleUpdate({ sides: 'SINGLE' })}
              className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                settings.sides === 'SINGLE'
                  ? 'border-qubink-teal bg-qubink-softmint/40 text-qubink-navy ring-1 ring-qubink-teal'
                  : 'border-gray-200 text-qubink-muted hover:border-gray-300'
              }`}
            >
              Single Sided (Front Only)
            </button>
            <button
              onClick={() => handleUpdate({ sides: 'DOUBLE' })}
              className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                settings.sides === 'DOUBLE'
                  ? 'border-qubink-teal bg-qubink-softmint/40 text-qubink-navy ring-1 ring-qubink-teal'
                  : 'border-gray-200 text-qubink-muted hover:border-gray-300'
              }`}
            >
              Back-to-Back (Duplex)
            </button>
          </div>
        </div>

        {/* 3. Paper Size & Copies */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-qubink-navy">
              3. Paper Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleUpdate({ paperSize: 'A4' })}
                className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                  settings.paperSize === 'A4'
                    ? 'bg-qubink-navy text-white border-qubink-navy shadow-xs'
                    : 'bg-white text-qubink-muted border-gray-200'
                }`}
              >
                A4 (Standard)
              </button>
              <button
                onClick={() => handleUpdate({ paperSize: 'A3' })}
                className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                  settings.paperSize === 'A3'
                    ? 'bg-qubink-navy text-white border-qubink-navy shadow-xs'
                    : 'bg-white text-qubink-muted border-gray-200'
                }`}
              >
                A3 (Poster / Ledger)
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-qubink-navy">
              4. Number of Copies (Sets)
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdate({ copies: Math.max(1, settings.copies - 1) })}
                className="w-10 h-10 rounded-xl border border-gray-200 font-bold text-base hover:bg-gray-100 flex items-center justify-center text-qubink-navy"
              >
                -
              </button>
              <span className="font-extrabold text-base text-qubink-navy min-w-[24px] text-center">
                {settings.copies}
              </span>
              <button
                onClick={() => handleUpdate({ copies: settings.copies + 1 })}
                className="w-10 h-10 rounded-xl border border-gray-200 font-bold text-base hover:bg-gray-100 flex items-center justify-center text-qubink-navy"
              >
                +
              </button>
              <span className="text-xs text-qubink-muted">
                {settings.copies > 1 ? `${settings.copies} identical sets` : '1 set'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Finishing Add-ons */}
        <div className="space-y-2 pt-2 border-t">
          <label className="block text-xs font-bold text-qubink-navy">
            5. Finishing & Binding Add-ons
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Spiral Binding */}
            <button
              onClick={() => handleUpdate({ hasBinding: !settings.hasBinding })}
              className={`p-3 rounded-xl border text-left transition-all ${
                settings.hasBinding
                  ? 'border-qubink-teal bg-qubink-softmint/40 ring-1 ring-qubink-teal'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-qubink-navy">Spiral Binding</span>
                <span className="text-xs font-bold text-qubink-teal">
                  +₹{rates.bindingPrice}
                </span>
              </div>
              <p className="text-[10px] text-qubink-muted mt-0.5">Plastic coil & cover</p>
            </button>

            {/* Stapling */}
            <button
              onClick={() => handleUpdate({ hasStapling: !settings.hasStapling })}
              className={`p-3 rounded-xl border text-left transition-all ${
                settings.hasStapling
                  ? 'border-qubink-teal bg-qubink-softmint/40 ring-1 ring-qubink-teal'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-qubink-navy">Corner Stapling</span>
                <span className="text-xs font-bold text-qubink-teal">+₹5</span>
              </div>
              <p className="text-[10px] text-qubink-muted mt-0.5">Top-left staple punch</p>
            </button>

            {/* Lamination */}
            <button
              onClick={() => handleUpdate({ hasLamination: !settings.hasLamination })}
              className={`p-3 rounded-xl border text-left transition-all ${
                settings.hasLamination
                  ? 'border-qubink-teal bg-qubink-softmint/40 ring-1 ring-qubink-teal'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-qubink-navy">Lamination</span>
                <span className="text-xs font-bold text-qubink-teal">
                  +₹{rates.laminationPrice}/pg
                </span>
              </div>
              <p className="text-[10px] text-qubink-muted mt-0.5">Gloss thermal laminate</p>
            </button>
          </div>
        </div>

        {/* Proceed Action */}
        <div className="pt-4 border-t">
          <button
            onClick={() => router.push(`/customer/fulfillment?shopId=${shop?.id}`)}
            className="w-full py-3.5 rounded-2xl bg-qubink-teal text-white font-bold text-sm shadow-lg shadow-qubink-teal/25 hover:bg-qubink-teal/90 flex items-center justify-center gap-2"
          >
            <span>Next: Choose Pickup or Home Delivery</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
