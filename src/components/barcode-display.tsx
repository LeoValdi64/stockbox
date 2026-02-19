"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeDisplayProps {
  value: string;
  printMode?: boolean;
}

export function BarcodeDisplay({ value, printMode = false }: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: printMode ? 1.5 : 2,
          height: printMode ? 40 : 60,
          displayValue: false,
          background: printMode ? "#ffffff" : "transparent",
          lineColor: printMode ? "#000000" : "#ffffff",
          fontSize: 14,
          font: "monospace",
          margin: printMode ? 0 : 10,
          textMargin: 0,
        });
        setError(false);
      } catch {
        setError(true);
      }
    }
  }, [value, printMode]);

  if (printMode) {
    return <svg ref={svgRef} />;
  }

  return (
    <div className="mt-2 flex flex-col items-center gap-2 rounded-lg bg-zinc-800 p-4">
      <svg ref={svgRef} />
      {!error && value && (
        <span className="font-mono text-xs text-zinc-400">{value}</span>
      )}
      {error && (
        <span className="text-xs text-red-400">Invalid barcode format</span>
      )}
    </div>
  );
}
