'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ScanLine } from 'lucide-react';

interface QrCameraScannerProps {
  onScan: (code: string) => void;
}

export default function QrCameraScanner({ onScan }: QrCameraScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const regionId = 'qr-camera-region';

  const startScanner = async () => {
    setError(null);
    try {
      // Dynamic import so it doesn't break SSR
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          // Extract 4 digits from QR data
          const digits = decodedText.replace(/\D/g, '').slice(0, 4);
          if (digits.length === 4) {
            setLastScan(digits);
            onScan(digits);
            stopScanner();
          }
        },
        undefined
      );
      setScanning(true);
    } catch (err: any) {
      setError(
        err?.message?.includes('Permission')
          ? 'Camera permission denied. Please allow camera access in browser settings.'
          : 'Could not start camera. Make sure a camera is available.'
      );
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Camera Preview Region */}
      <div
        id={regionId}
        className={`rounded-2xl overflow-hidden border-2 transition-all ${scanning ? 'border-qubink-teal bg-black' : 'border-dashed border-gray-200 bg-gray-50 min-h-[60px]'}`}
        style={{ minHeight: scanning ? '260px' : undefined }}
      />

      {/* Toggle Button */}
      <button
        type="button"
        onClick={scanning ? stopScanner : startScanner}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-xs ${
          scanning
            ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
            : 'bg-qubink-softmint border border-qubink-teal/30 text-qubink-teal hover:bg-qubink-teal hover:text-white'
        }`}
      >
        {scanning ? (
          <>
            <CameraOff className="w-4 h-4" />
            <span>Stop Camera</span>
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            <span>Open Camera to Scan QR</span>
          </>
        )}
      </button>

      {/* Scanning hint */}
      {scanning && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-qubink-teal animate-pulse">
          <ScanLine className="w-4 h-4" />
          <span>Point camera at customer's QR code…</span>
        </div>
      )}

      {/* Last scan result */}
      {lastScan && !scanning && (
        <div className="text-center text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 rounded-xl p-2">
          ✓ QR scanned! Code <span className="font-black font-mono">{lastScan}</span> filled in above.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">
          {error}
        </div>
      )}
    </div>
  );
}
