"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ScanBarcode, Plus, Minus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { getProductByBarcode, adjustQuantity } from "@/lib/actions/inventory";
import { toast } from "sonner";

export default function ScanPage() {
  const [scanning, setScanning] = useState(true);
  const [scannedProduct, setScannedProduct] = useState<{
    id: string;
    name: string;
    quantity: number;
    salePrice: number | null;
    imageUrl: string | null;
    category: string | null;
    description: string | null;
  } | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [displayQuantity, setDisplayQuantity] = useState(0);
  const autoResumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear auto-resume timer on unmount
  useEffect(() => {
    return () => {
      if (autoResumeTimerRef.current) {
        clearTimeout(autoResumeTimerRef.current);
      }
    };
  }, []);

  const resumeScanning = useCallback(() => {
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    setScanning(true);
    setScannedProduct(null);
    setScannedBarcode(null);
  }, []);

  // Listen for restart-scan event from bottom nav
  useEffect(() => {
    const handleRestart = () => {
      resumeScanning();
    };
    window.addEventListener("stockbox:restart-scan", handleRestart);
    return () => {
      window.removeEventListener("stockbox:restart-scan", handleRestart);
    };
  }, [resumeScanning]);

  const scheduleAutoResume = useCallback(() => {
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
    }
    autoResumeTimerRef.current = setTimeout(() => {
      resumeScanning();
    }, 1500);
  }, [resumeScanning]);

  const handleScan = useCallback(
    async (barcode: string) => {
      setScanning(false);
      setScannedBarcode(barcode);
      if (autoResumeTimerRef.current) {
        clearTimeout(autoResumeTimerRef.current);
        autoResumeTimerRef.current = null;
      }
      toast.info(`Scanned: ${barcode}`);

      try {
        const product = await getProductByBarcode(barcode);
        if (product) {
          setScannedProduct(product);
          setDisplayQuantity(product.quantity);
        } else {
          setScannedProduct(null);
        }
      } catch {
        setScannedProduct(null);
      }
    },
    []
  );

  const handleAdjust = useCallback(
    async (delta: number) => {
      if (!scannedProduct) return;

      // Optimistic update
      const newQty = Math.max(0, displayQuantity + delta);
      setDisplayQuantity(newQty);

      try {
        const serverQty = await adjustQuantity(scannedProduct.id, delta);
        setDisplayQuantity(serverQty);
        toast.success(
          `${scannedProduct.name}: ${serverQty} in stock`
        );
      } catch {
        // Revert on error
        setDisplayQuantity(displayQuantity);
        toast.error("Failed to update quantity");
        return;
      }

      // Auto-resume scanning after 1.5s
      scheduleAutoResume();
    },
    [scannedProduct, displayQuantity, scheduleAutoResume]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Scan Barcode</h1>
      </div>

      {scanning ? (
        <BarcodeScanner onScan={handleScan} />
      ) : (
        <div className="space-y-4">
          {/* Scanned result */}
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="pt-6">
              <div className="text-center">
                <ScanBarcode className="mx-auto h-8 w-8 text-zinc-400" />
                <p className="mt-2 font-mono text-sm text-zinc-400">
                  {scannedBarcode}
                </p>
              </div>
            </CardContent>
          </Card>

          {scannedProduct ? (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {scannedProduct.imageUrl ? (
                    <Image
                      src={scannedProduct.imageUrl}
                      alt={scannedProduct.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
                      <Package className="h-8 w-8 text-zinc-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-medium">{scannedProduct.name}</p>
                    {scannedProduct.category && (
                      <p className="text-xs font-medium text-zinc-500">
                        {scannedProduct.category}
                      </p>
                    )}
                    {scannedProduct.salePrice !== null && (
                      <p className="mt-1 text-sm font-semibold text-emerald-400">
                        ${scannedProduct.salePrice.toFixed(2)}
                      </p>
                    )}
                    {scannedProduct.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                        {scannedProduct.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Big quantity display with +/- buttons */}
                <div className="mt-5 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full border-zinc-700 text-xl"
                    onClick={() => handleAdjust(-1)}
                    disabled={displayQuantity <= 0}
                  >
                    <Minus className="h-6 w-6" />
                  </Button>
                  <div className="text-center">
                    <p className="text-5xl font-bold tabular-nums">
                      {displayQuantity}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">in stock</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full border-zinc-700 text-xl"
                    onClick={() => handleAdjust(1)}
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>

                {/* View Product link */}
                <div className="mt-4 flex flex-col items-center gap-2">
                  <Link
                    href={`/inventory/${scannedProduct.id}`}
                    className="text-sm text-zinc-400 underline underline-offset-2 hover:text-zinc-300"
                  >
                    View Product
                  </Link>
                </div>

                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={resumeScanning}
                  >
                    Scan Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-zinc-400">
                  No product found with this barcode.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button className="flex-1" asChild>
                    <Link
                      href={`/inventory/new?barcode=${encodeURIComponent(
                        scannedBarcode ?? ""
                      )}`}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Create Product
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={resumeScanning}
                  >
                    Scan Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
