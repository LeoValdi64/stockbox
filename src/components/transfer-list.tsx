"use client";

import { useState } from "react";
import { LogOut, LogIn, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface TransferItem {
  id: string;
  quantity: number;
  condition: string | null;
  product: {
    id: string;
    name: string;
    trackingType?: string;
  };
  asset: {
    id: string;
    barcode: string;
    serialNumber: string | null;
  } | null;
}

interface Transfer {
  id: string;
  type: string;
  createdAt: string | Date;
  notes: string | null;
  items: TransferItem[];
}

export function TransferList({ transfers }: { transfers: Transfer[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (transfers.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-zinc-500">
        No transfers yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {transfers.map((transfer) => {
        const isExpanded = expandedId === transfer.id;
        return (
          <div key={transfer.id}>
            <button
              className="w-full rounded-lg bg-zinc-800/50 px-3 py-2 text-left transition-colors hover:bg-zinc-800/80"
              onClick={() =>
                setExpandedId(isExpanded ? null : transfer.id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {transfer.type === "checkout" ? (
                    <LogOut className="h-3.5 w-3.5 text-amber-400" />
                  ) : (
                    <LogIn className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  <span className="text-sm font-medium">
                    {transfer.type === "checkout"
                      ? "Check Out"
                      : "Check In"}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {transfer.items.length} item
                    {transfer.items.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    {new Date(transfer.createdAt).toLocaleDateString()}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-3 border-l border-zinc-800 pl-3 pt-1 pb-1">
                    {transfer.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-1.5"
                      >
                        <div>
                          <p className="text-sm text-zinc-300">
                            {item.product.name}
                            {item.quantity > 1
                              ? ` x${item.quantity}`
                              : ""}
                          </p>
                          {item.asset && (
                            <p className="font-mono text-[10px] text-zinc-500">
                              {item.asset.barcode}
                              {item.asset.serialNumber &&
                                ` · ${item.asset.serialNumber}`}
                            </p>
                          )}
                        </div>
                        {item.condition && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              item.condition === "good"
                                ? "text-emerald-400"
                                : item.condition === "damaged"
                                  ? "text-red-400"
                                  : item.condition === "lost"
                                    ? "text-zinc-500"
                                    : "text-amber-400"
                            }`}
                          >
                            {item.condition}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {transfer.notes && (
                      <p className="mt-1 text-xs text-zinc-500 italic">
                        {transfer.notes}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
