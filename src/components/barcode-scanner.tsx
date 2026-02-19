"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
}

const BARCODE_FORMATS = [
  "code_128",
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_39",
  "code_93",
  "itf",
  "codabar",
  "qr_code",
] as const;

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const lastScannedRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const handleScan = useCallback((decodedText: string) => {
    const now = Date.now();
    if (
      decodedText === lastScannedRef.current &&
      now - lastScanTimeRef.current < 1000
    ) {
      return;
    }
    lastScannedRef.current = decodedText;
    lastScanTimeRef.current = now;
    onScanRef.current(decodedText);
  }, []);

  useEffect(() => {
    let stopped = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let detector: any = null;

    async function start() {
      try {
        // 1. Get camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // 2. Get BarcodeDetector (native or polyfill)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;

        if ("BarcodeDetector" in window) {
          // Native (Chrome/Edge/Android)
          detector = new win.BarcodeDetector({
            formats: [...BARCODE_FORMATS],
          });
        } else {
          // Polyfill (Safari/iOS/Firefox) — uses ZXing WASM, same speed
          const { BarcodeDetector: Polyfill } = await import("barcode-detector");
          detector = new Polyfill({
            formats: [...BARCODE_FORMATS],
          });
        }

        setReady(true);

        // 3. Scan loop — runs on every animation frame (~30-60fps)
        async function scanLoop() {
          if (stopped || !videoRef.current || !detector) return;

          try {
            if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                handleScan(barcodes[0].rawValue);
              }
            }
          } catch {
            // Ignore frame errors
          }

          if (!stopped) {
            animFrameRef.current = requestAnimationFrame(scanLoop);
          }
        }

        scanLoop();
      } catch (err) {
        console.error("Scanner error:", err);
        setError(
          "Camera access denied. Please allow camera permissions to scan barcodes."
        );
      }
    }

    start();

    return () => {
      stopped = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
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
      {ready && (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1">
          <Zap className="h-3 w-3 text-green-400" />
          <span className="text-xs font-medium text-green-400">Scanning</span>
        </div>
      )}
      {error ? (
        <div className="flex flex-col items-center gap-4 rounded-xl bg-zinc-900 p-8 text-center">
          <Camera className="h-12 w-12 text-zinc-600" />
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl bg-zinc-900">
          <video
            ref={videoRef}
            className="w-full"
            playsInline
            muted
            autoPlay
          />
          {/* Scan guide overlay */}
          {ready && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-32 w-72 rounded-lg border-2 border-white/30" />
            </div>
          )}
          {/* Loading */}
          {!ready && !error && (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
