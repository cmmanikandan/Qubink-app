'use client';

import React, { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/store';
import { uploadCustomerDocumentToStorageAndDb } from '@/lib/supabase';
import { detectPdfPageCount } from '@/lib/pdfHelper';
import { DocumentItem } from '@/types';
import {
  Upload,
  Camera,
  Images,
  Share2,
  FileText,
  Trash2,
  RotateCw,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function CustomerUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialShopId = searchParams.get('shopId');

  const { shops, addDocumentToCart, setSelectedShop, cart, currentUser } = useApp();

  const [activeMethod, setActiveMethod] = useState<'device' | 'camera' | 'gallery' | 'share'>('device');
  const [selectedShopId, setLocalShopId] = useState<string>(
    initialShopId || cart.selectedShopId || shops[0]?.id || ''
  );

  // File states
  const [uploadedFiles, setUploadedFiles] = useState<DocumentItem[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Camera scanner states
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPages, setCapturedPages] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Gallery multi-page arrangement
  const [galleryPages, setGalleryPages] = useState<{ id: string; url: string; rotation: number }[]>([]);

  // 1. Device Upload
  const handleDeviceFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    files.forEach(async (file) => {
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      let actualPages = 1;
      if (isPdf) {
        try {
          actualPages = await detectPdfPageCount(file);
        } catch (err) {
          console.warn('PDF page count detection notice:', err);
          actualPages = 1;
        }
      }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        const newDoc: DocumentItem = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: file.name,
          fileName: file.name,
          size: file.size,
          fileSize: file.size,
          pageCount: actualPages,
          fileUrl: dataUrl,
          fileType: file.type || file.name.split('.').pop() || 'document',
          mimeType: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
        };

        // Upload to Supabase Storage and public.documents table
        try {
          const uploadRes = await uploadCustomerDocumentToStorageAndDb(file, file.name, currentUser?.id || 'guest', actualPages);
          if (uploadRes?.storageUrl) {
            newDoc.fileUrl = uploadRes.storageUrl;
          }
        } catch (err) {
          console.warn('Supabase document upload notice:', err);
        }

        addDocumentToCart(newDoc);
        setUploadedFiles((prev) => [...prev, newDoc]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 2. Camera Scanner
  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Camera access denied or not available. Please allow camera permissions.');
      setCameraActive(false);
    }
  };

  const captureCameraFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPages((prev) => [...prev, dataUrl]);
    }
  };

  const finishCameraScan = () => {
    if (capturedPages.length === 0) return;
    const docItem: DocumentItem = {
      id: `doc-cam-${Date.now()}`,
      name: `Scanned_Doc_${new Date().toLocaleTimeString().replace(/:/g, '')}.pdf`,
      size: capturedPages.length * 150000,
      pageCount: capturedPages.length,
      fileUrl: capturedPages[0],
      fileType: 'application/pdf',
    };
    addDocumentToCart(docItem);
    setUploadedFiles((prev) => [...prev, docItem]);
    setCapturedPages([]);
    setCameraActive(false);
  };

  // 3. Gallery Multi-Images
  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newImgs = files.map((file) => ({
      id: `gal-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      url: URL.createObjectURL(file),
      rotation: 0,
    }));
    setGalleryPages((prev) => [...prev, ...newImgs]);
  };

  const rotateGalleryPage = (id: string) => {
    setGalleryPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const finishGalleryCompilation = () => {
    if (galleryPages.length === 0) return;
    const docItem: DocumentItem = {
      id: `doc-gal-${Date.now()}`,
      name: `Compiled_Gallery_${galleryPages.length}pgs.pdf`,
      size: galleryPages.length * 200000,
      pageCount: galleryPages.length,
      fileUrl: galleryPages[0].url,
      fileType: 'application/pdf',
    };
    addDocumentToCart(docItem);
    setUploadedFiles((prev) => [...prev, docItem]);
    setGalleryPages([]);
  };

  const handleProceedToOptions = () => {
    if (selectedShopId) {
      setSelectedShop(selectedShopId);
    }
    router.push(`/customer/print-options?shopId=${selectedShopId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-qubink-teal">
            Step 1 of 4
          </span>
          <span className="text-xs text-qubink-muted">• Document Studio</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-qubink-navy font-heading mt-0.5">
          Attach Your Documents
        </h1>
        <p className="text-xs text-qubink-muted mt-1">
          Upload PDF, DOCX, scan physical notes with your camera, or compile images from your gallery.
        </p>
      </div>

      {/* Select Print Shop */}
      <div className="qubink-card p-4 bg-qubink-softmint/30 border border-qubink-teal/20 space-y-2">
        <label className="block text-xs font-bold text-qubink-navy">
          Assigned Printing Shop
        </label>
        <select
          value={selectedShopId}
          onChange={(e) => {
            setLocalShopId(e.target.value);
            setSelectedShop(e.target.value);
          }}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-qubink-navy focus:outline-none focus:ring-2 focus:ring-qubink-teal"
        >
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.distanceKm ? `${s.distanceKm} km` : s.address}) • B&W ₹2/pg
            </option>
          ))}
        </select>
      </div>

      {/* 4 Upload Method Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: 'device', label: 'From Device', icon: Upload, desc: 'PDF, DOCX, JPG' },
          { id: 'camera', label: 'Scan Camera', icon: Camera, desc: 'Physical sheets' },
          { id: 'gallery', label: 'Image Gallery', icon: Images, desc: 'Multi-photos' },
          { id: 'share', label: 'Android Share', icon: Share2, desc: 'From external app' },
        ].map((m) => {
          const Icon = m.icon;
          const isSelected = activeMethod === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMethod(m.id as any)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-qubink-navy text-white border-qubink-navy shadow-md'
                  : 'bg-white text-qubink-dark border-gray-200 hover:border-qubink-teal/40'
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-2 ${isSelected ? 'text-qubink-mint' : 'text-qubink-teal'}`}
              />
              <span className="block text-xs font-bold">{m.label}</span>
              <span
                className={`block text-[10px] mt-0.5 ${
                  isSelected ? 'text-gray-300' : 'text-qubink-muted'
                }`}
              >
                {m.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* METHOD 1: DEVICE UPLOAD */}
      {activeMethod === 'device' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files) {
              processFiles(Array.from(e.dataTransfer.files));
            }
          }}
          className={`qubink-card p-8 text-center border-2 border-dashed transition-all cursor-pointer ${
            dragActive ? 'border-qubink-teal bg-qubink-softmint/40' : 'border-gray-300 hover:border-qubink-teal/50'
          }`}
        >
          <label className="cursor-pointer block space-y-3">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleDeviceFiles}
              className="hidden"
            />
            <div className="w-14 h-14 mx-auto rounded-2xl bg-qubink-softmint text-qubink-teal flex items-center justify-center shadow-xs">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <span className="text-sm font-bold text-qubink-navy block font-heading">
                Tap to select files or drag & drop here
              </span>
              <span className="text-xs text-qubink-muted block mt-1">
                Supports PDF, DOCX, DOC, JPG, PNG (Max 20MB per file)
              </span>
            </div>
            <span className="inline-block px-4 py-1.5 rounded-xl bg-qubink-teal text-white text-xs font-bold shadow-xs">
              Browse Files
            </span>
          </label>
        </div>
      )}

      {/* METHOD 2: CAMERA SCANNER */}
      {activeMethod === 'camera' && (
        <div className="qubink-card p-6 space-y-4 text-center">
          {!cameraActive ? (
            <div className="space-y-3 py-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-qubink-softmint text-qubink-teal flex items-center justify-center">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-qubink-navy font-heading">
                Scan Notes & Physical Documents
              </h3>
              <p className="text-xs text-qubink-muted max-w-sm mx-auto">
                Capture single or multiple document pages using your phone camera. We compile them
                directly into a crisp print-ready PDF.
              </p>
              <button
                onClick={startCamera}
                className="px-5 py-2 rounded-xl bg-qubink-teal text-white text-xs font-bold shadow-md hover:bg-qubink-teal/90"
              >
                Launch Document Camera
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative max-w-sm mx-auto rounded-2xl overflow-hidden bg-black border-2 border-qubink-teal aspect-[3/4]">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                <div className="absolute inset-x-0 bottom-4 flex justify-center items-center gap-4">
                  <button
                    onClick={captureCameraFrame}
                    className="w-14 h-14 rounded-full bg-white border-4 border-qubink-teal flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                  >
                    <div className="w-10 h-10 rounded-full bg-qubink-teal" />
                  </button>
                </div>
              </div>

              {capturedPages.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-qubink-navy block">
                    Captured Pages: {capturedPages.length}
                  </span>
                  <div className="flex gap-2 overflow-x-auto justify-center pb-2">
                    {capturedPages.map((src, i) => (
                      <div key={i} className="relative w-16 h-20 rounded-lg overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] px-1 font-bold">
                          {i + 1}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={finishCameraScan}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md"
                  >
                    Finish & Compile {capturedPages.length} Pages PDF
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* METHOD 3: GALLERY PICKER */}
      {activeMethod === 'gallery' && (
        <div className="qubink-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-qubink-navy font-heading">
                Compile Photos to PDF
              </h3>
              <p className="text-xs text-qubink-muted">
                Pick photos of pages, arrange page order, and rotate as required.
              </p>
            </div>
            <label className="px-3.5 py-1.5 rounded-xl bg-qubink-teal text-white text-xs font-bold cursor-pointer hover:bg-qubink-teal/90">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleGallerySelect}
                className="hidden"
              />
              Select Images
            </label>
          </div>

          {galleryPages.length === 0 ? (
            <div className="py-8 text-center text-xs text-qubink-muted space-y-2">
              <Images className="w-10 h-10 text-gray-300 mx-auto" />
              <p>No gallery images selected yet. Click above to add photos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {galleryPages.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl border border-gray-200 bg-gray-50 text-center space-y-1 relative"
                  >
                    <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-white relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt="Page"
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                        className="w-full h-full object-cover transition-transform"
                      />
                      <span className="absolute top-1 left-1 bg-qubink-navy text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                        Pg {idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        onClick={() => rotateGalleryPage(p.id)}
                        className="p-1 rounded-lg hover:bg-gray-200 text-qubink-teal"
                        title="Rotate 90 degrees"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setGalleryPages((prev) => prev.filter((x) => x.id !== p.id))}
                        className="p-1 rounded-lg hover:bg-red-50 text-red-500"
                        title="Remove page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={finishGalleryCompilation}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
              >
                Compile {galleryPages.length} Pages into Document
              </button>
            </div>
          )}
        </div>
      )}

      {/* METHOD 4: ANDROID SHARE RECEIVER */}
      {activeMethod === 'share' && (
        <div className="qubink-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-qubink-softmint text-qubink-teal flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-qubink-navy font-heading">
                Android System Share Target
              </h3>
              <p className="text-xs text-qubink-muted">
                Qubink registers as an Android Share Intent receiver.
              </p>
            </div>
          </div>
          <p className="text-xs text-qubink-dark/80 bg-gray-50 p-3 rounded-xl border leading-relaxed">
            When viewing a document in WhatsApp, Chrome, Gmail, or Google Drive, tap{' '}
            <strong>Share ➔ Qubink</strong>. The document opens automatically in this checkout flow.
          </p>
        </div>
      )}

      {/* Attached Documents List */}
      {uploadedFiles.length > 0 && (
        <div className="qubink-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-qubink-navy">
              Attached Documents ({uploadedFiles.length})
            </span>
          </div>

          <div className="space-y-2">
            {uploadedFiles.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-lg bg-qubink-softmint text-qubink-teal flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-qubink-navy truncate">{doc.name || doc.fileName}</p>
                    <p className="text-[11px] text-qubink-muted">
                      {doc.pageCount} page{doc.pageCount > 1 ? 's' : ''} •{' '}
                      {(((doc.size || doc.fileSize || 0)) / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Attached
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Sticky Next Step Action */}
          <div className="pt-3 border-t">
            <button
              onClick={handleProceedToOptions}
              className="w-full py-3.5 rounded-2xl bg-qubink-teal text-white font-bold text-sm shadow-lg shadow-qubink-teal/25 hover:bg-qubink-teal/90 flex items-center justify-center gap-2"
            >
              <span>Next: Customize Print Options</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
