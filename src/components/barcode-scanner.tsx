"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: { clear: () => Promise<void>; stop: () => Promise<void> } | null = null;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!scannerRef.current) return;

        const scannerId = "barcode-scanner-" + Date.now();
        scannerRef.current.id = scannerId;

        const html5QrCode = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = html5QrCode;
        scanner = html5QrCode as unknown as typeof scanner;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          (decodedText: string) => {
            onScan(decodedText);
            html5QrCode.stop().catch(() => {});
          },
          () => {}
        );
      } catch (err) {
        setError(
          "Camera access denied. Please allow camera permissions to scan barcodes."
        );
      }
    }

    startScanner();

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
        scanner.clear().catch(() => {});
      }
    };
  }, [onScan]);

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
