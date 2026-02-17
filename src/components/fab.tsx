"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ScanBarcode, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function FAB() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
      {/* Menu items */}
      {open && (
        <>
          <Link
            href="/inventory/scan"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2.5 text-sm font-medium shadow-lg transition-transform active:scale-95"
          >
            <ScanBarcode className="h-4 w-4" />
            Scan Barcode
          </Link>
          <Link
            href="/inventory/new"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2.5 text-sm font-medium shadow-lg transition-transform active:scale-95"
          >
            <Package className="h-4 w-4" />
            Add Product
          </Link>
        </>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all active:scale-95",
          open
            ? "bg-zinc-700 rotate-45"
            : "bg-white text-zinc-950"
        )}
      >
        {open ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[-1] bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
