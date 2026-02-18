"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeDisplayProps {
  value: string;
  printMode?: boolean;
}

export function BarcodeDisplay({ value, printMode = false }: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          background: printMode ? "#ffffff" : "transparent",
          lineColor: printMode ? "#000000" : "#d4d4d8",
          fontSize: 14,
          font: "monospace",
          margin: 10,
          textMargin: printMode ? 5 : undefined,
        });
      } catch {
        // Invalid barcode format, show text fallback
      }
    }
  }, [value, printMode]);

  if (printMode) {
    return <svg ref={svgRef} />;
  }

  return (
    <div className="mt-2 flex justify-center rounded-lg bg-zinc-800 p-4">
      <svg ref={svgRef} />
    </div>
  );
}
