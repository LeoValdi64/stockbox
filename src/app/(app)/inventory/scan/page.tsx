"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ScanBarcode, Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { getProductByBarcode } from "@/lib/actions/inventory";
import { toast } from "sonner";

export default function ScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [scannedProduct, setScannedProduct] = useState<{
    id: string;
    name: string;
    quantity: number;
    salePrice: number | null;
  } | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  const handleScan = useCallback(
    async (barcode: string) => {
      setScanning(false);
      setScannedBarcode(barcode);
      toast.info(`Scanned: ${barcode}`);

      try {
        const product = await getProductByBarcode(barcode);
        if (product) {
          setScannedProduct(product);
        } else {
          setScannedProduct(null);
        }
      } catch {
        setScannedProduct(null);
      }
    },
    []
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
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800">
                    <Package className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{scannedProduct.name}</p>
                    <p className="text-sm text-zinc-400">
                      {scannedProduct.quantity} in stock
                      {scannedProduct.salePrice !== null &&
                        ` · $${scannedProduct.salePrice.toFixed(2)}`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button className="flex-1" asChild>
                    <Link href={`/inventory/${scannedProduct.id}`}>
                      View Product
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setScanning(true);
                      setScannedProduct(null);
                      setScannedBarcode(null);
                    }}
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
                    onClick={() => {
                      setScanning(true);
                      setScannedProduct(null);
                      setScannedBarcode(null);
                    }}
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
