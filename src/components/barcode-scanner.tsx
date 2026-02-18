"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  // Keep callback ref in sync without triggering effect re-runs
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const handleScan = useCallback((decodedText: string) => {
    onScanRef.current(decodedText);
  }, []);

  useEffect(() => {
    let scanner: { clear: () => Promise<void>; stop: () => Promise<void> } | null = null;
    let stopped = false;

    async function startScanner() {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

        if (!scannerRef.current || stopped) return;

        const scannerId = "barcode-scanner-" + Date.now();
        scannerRef.current.id = scannerId;

        const formatsToSupport = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
        ];

        const html5QrCode = new Html5Qrcode(scannerId, {
          formatsToSupport,
          verbose: false,
        });
        html5QrCodeRef.current = html5QrCode;
        scanner = html5QrCode as unknown as typeof scanner;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 300, height: 200 },
          },
          (decodedText: string) => {
            handleScan(decodedText);
          },
          () => {}
        );
      } catch {
        setError(
          "Camera access denied. Please allow camera permissions to scan barcodes."
        );
      }
    }

    startScanner();

    return () => {
      stopped = true;
      if (scanner) {
        try {
          const s = scanner;
          const state = (s as unknown as { getState?: () => number })?.getState?.();
          // Only stop if scanner is actively running (state 2 = scanning)
          if (state === undefined || state === 2) {
            s.stop().then(() => s.clear().catch(() => {})).catch(() => {
              s.clear().catch(() => {});
            });
          } else {
            s.clear().catch(() => {});
          }
        } catch {
          // Scanner already stopped, ignore
        }
      }
    };
  }, [handleScan]);

  return (
    <div className="relative">
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 bg-zinc-900/80"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {error ? (
        <div className="flex flex-col items-center gap-4 rounded-xl bg-zinc-900 p-8 text-center">
          <Camera className="h-12 w-12 text-zinc-600" />
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      ) : (
        <div
          ref={scannerRef}
          className="overflow-hidden rounded-xl bg-zinc-900"
        />
      )}
    </div>
  );
}
