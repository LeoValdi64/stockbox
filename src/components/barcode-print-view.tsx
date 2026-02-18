"use client";

import { useRef } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarcodeDisplay } from "@/components/barcode-display";
import { QRCodeSVG } from "qrcode.react";

interface BarcodePrintViewProps {
  barcode: string;
  productName: string;
}

export function BarcodePrintView({ barcode, productName }: BarcodePrintViewProps) {
  const printBarcodeRef = useRef<HTMLDivElement>(null);
  const printQrRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    if (!printBarcodeRef.current || !printQrRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${productName}</title>
          <style>
            @page {
              size: 57mm 32mm;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              width: 57mm;
              height: 32mm;
              margin: 0;
              padding: 2mm;
              font-family: Arial, Helvetica, sans-serif;
              background: white;
              color: black;
              overflow: hidden;
            }
            .label {
              display: flex;
              align-items: center;
              width: 100%;
              height: 100%;
              gap: 2mm;
            }
            .barcode-section {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-width: 0;
              overflow: hidden;
            }
            .product-name {
              font-size: 10pt;
              font-weight: bold;
              line-height: 1.1;
              text-align: center;
              max-width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              margin-bottom: 1mm;
            }
            .barcode-section svg {
              max-width: 100%;
              height: auto;
              max-height: 14mm;
            }
            .barcode-value {
              font-size: 8pt;
              font-family: 'Courier New', Courier, monospace;
              text-align: center;
              margin-top: 0.5mm;
            }
            .qr-section {
              flex-shrink: 0;
              width: 20mm;
              height: 20mm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-section svg {
              width: 20mm !important;
              height: 20mm !important;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="barcode-section">
              <div class="product-name">${productName}</div>
              ${printBarcodeRef.current.innerHTML}
              <div class="barcode-value">${barcode}</div>
            </div>
            <div class="qr-section">
              ${printQrRef.current.innerHTML}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">Barcode / QR</span>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handlePrint}
        >
          <Printer className="h-3.5 w-3.5" />
          Print Label
        </Button>
      </div>
      <BarcodeDisplay value={barcode} />
      {/* Hidden print-mode versions with black colors for printing */}
      <div ref={printBarcodeRef} className="hidden">
        <BarcodeDisplay value={barcode} printMode />
      </div>
      <div ref={printQrRef} className="hidden">
        <QRCodeSVG
          value={barcode}
          size={76}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <div className="flex justify-center rounded-lg bg-zinc-800 p-4">
        <QRCodeSVG
          value={barcode}
          size={120}
          bgColor="transparent"
          fgColor="#d4d4d8"
        />
      </div>
    </div>
  );
}
