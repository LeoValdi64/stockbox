"use client";

import { useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarcodeDisplay } from "@/components/barcode-display";
import { QRCodeSVG } from "qrcode.react";

interface BarcodePrintViewProps {
  barcode: string;
  productName: string;
}

export function BarcodePrintView({ barcode, productName }: BarcodePrintViewProps) {
  const [printType, setPrintType] = useState<"barcode" | "qr">("barcode");
  const printBarcodeRef = useRef<HTMLDivElement>(null);
  const printQrRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const ref = printType === "barcode" ? printBarcodeRef.current : printQrRef.current;
    if (!ref) return;

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
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .label {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
              gap: 1mm;
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
            }
            .code-container {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .code-container svg {
              max-width: 100%;
              height: auto;
              max-height: 18mm;
            }
            .barcode-value {
              font-size: 7pt;
              font-family: 'Courier New', Courier, monospace;
              text-align: center;
              margin-top: 0.5mm;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="product-name">${productName}</div>
            <div class="code-container">
              ${ref.innerHTML}
            </div>
            <div class="barcode-value">${barcode}</div>
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

      {/* Toggle buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPrintType("barcode")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            printType === "barcode"
              ? "border-white bg-white text-black"
              : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          Barcode
        </button>
        <button
          type="button"
          onClick={() => setPrintType("qr")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            printType === "qr"
              ? "border-white bg-white text-black"
              : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          QR Code
        </button>
      </div>

      {/* Display selected */}
      {printType === "barcode" ? (
        <BarcodeDisplay value={barcode} />
      ) : (
        <div className="flex justify-center rounded-lg bg-zinc-800 p-4">
          <QRCodeSVG
            value={barcode}
            size={120}
            bgColor="transparent"
            fgColor="#d4d4d8"
          />
        </div>
      )}

      {/* Hidden print-mode versions */}
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
    </div>
  );
}
