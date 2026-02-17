"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export function BarcodeDisplay({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          background: "transparent",
          lineColor: "#d4d4d8",
          fontSize: 14,
          font: "monospace",
          margin: 10,
        });
      } catch {
        // Invalid barcode format, show text fallback
      }
    }
  }, [value]);

  return (
    <div className="mt-2 flex justify-center rounded-lg bg-zinc-800 p-4">
      <svg ref={svgRef} />
    </div>
  );
}
