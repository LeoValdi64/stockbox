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
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    if (!printRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${productName}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .label {
              text-align: center;
              padding: 20px;
              border: 1px dashed #ccc;
              border-radius: 8px;
            }
            .product-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            @media print {
              .label { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="product-name">${productName}</div>
            ${printRef.current.innerHTML}
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
      <div ref={printRef}>
        <BarcodeDisplay value={barcode} />
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
