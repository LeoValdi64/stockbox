"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const onScanRef = useRef(onScan);
  const lastScannedRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

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
    let detector: { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } | null = null;

    async function start() {
      try {
        // Get camera stream
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

        // Try native BarcodeDetector first (Chrome 83+, much faster)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        if ("BarcodeDetector" in window) {
          try {
            detector = new win.BarcodeDetector({
              formats: [
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
              ],
            });
          } catch {
            detector = null;
          }
        }

        // If no native detector, fall back to html5-qrcode
        if (!detector) {
          await startFallbackScanner();
          return;
        }

        // Native scanning loop - runs at ~30fps, very fast
        async function scanLoop() {
          if (stopped || !videoRef.current || !detector) return;

          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              handleScan(barcodes[0].rawValue);
            }
          } catch {
            // Ignore detection errors
          }

          if (!stopped) {
            animFrameRef.current = requestAnimationFrame(scanLoop);
          }
        }

        scanLoop();
      } catch {
        setError(
          "Camera access denied. Please allow camera permissions to scan barcodes."
        );
        setScanning(false);
      }
    }

    async function startFallbackScanner() {
      // Fallback: use html5-qrcode with aggressive settings
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
          "html5-qrcode"
        );

        if (stopped || !canvasRef.current) return;

        // Stop the direct video since html5-qrcode manages its own
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        const scannerId = "barcode-fallback-" + Date.now();
        canvasRef.current.id = scannerId;

        const formats = [
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
          formatsToSupport: formats,
          verbose: false,
        });

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 30,
            qrbox: { width: 350, height: 200 },
            aspectRatio: 1.777,
            disableFlip: false,
          },
          (decodedText: string) => {
            handleScan(decodedText);
          },
          () => {}
        );
      } catch {
        setError("Failed to start scanner.");
        setScanning(false);
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
      {scanning && (
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
          {/* Scan area guide */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-72 rounded-lg border-2 border-white/30" />
          </div>
          {/* Fallback container (hidden when native detector works) */}
          <div
            ref={canvasRef}
            className="absolute inset-0"
            style={{ display: "none" }}
          />
        </div>
      )}
    </div>
  );
}
