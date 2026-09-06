'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { FileText, ArrowLeft, Download, ShieldCheck, Printer } from 'lucide-react';

export default function CustomerDocumentPreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { cart } = useApp();

  const doc = cart.documents.find((d) => d.id === id) || cart.documents[0];

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
          <h1 className="text-xl font-extrabold text-qubink-navy font-heading">
            Document Inspection
          </h1>
          <p className="text-xs text-qubink-muted">Secure private file preview</p>
        </div>
      </div>

      <div className="qubink-card p-6 space-y-4">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="w-12 h-12 rounded-2xl bg-qubink-softmint text-qubink-teal flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-qubink-navy">{doc?.name || 'Document'}</h3>
            <p className="text-xs text-qubink-muted">
              {doc?.pageCount || 1} pages • {doc?.fileType || 'PDF'}
            </p>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-gray-50 border border-gray-200 text-center space-y-2">
          <FileText className="w-12 h-12 text-gray-400 mx-auto" />
          <p className="text-xs font-bold text-qubink-navy">Print-Ready Document Attached</p>
          <p className="text-[11px] text-qubink-muted max-w-xs mx-auto">
            Uploaded securely to private storage. The assigned print shop can view this file once the
            order is accepted.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.push('/customer/print-options')}
            className="flex-1 py-3 rounded-xl bg-qubink-teal text-white font-bold text-xs shadow-md hover:bg-qubink-teal/90 flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Configure Print Options</span>
          </button>
        </div>
      </div>
    </div>
  );
}
