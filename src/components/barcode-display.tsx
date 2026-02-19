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
          width: printMode ? 1.5 : 2,
          height: printMode ? 40 : 60,
          displayValue: !printMode,
          background: printMode ? "#ffffff" : "transparent",
          lineColor: printMode ? "#000000" : "#ffffff",
          fontSize: 14,
          font: "monospace",
          margin: printMode ? 0 : 10,
          textMargin: printMode ? 0 : undefined,
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
