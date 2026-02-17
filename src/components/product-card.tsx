"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Minus, Plus, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adjustQuantity } from "@/lib/actions/inventory";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    quantity: number;
    minStock: number | null;
    category: string | null;
    salePrice: number | null;
    barcode: string | null;
    imageUrl: string | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [qty, setQty] = useState(product.quantity);
  const [isPending, startTransition] = useTransition();
  const isLowStock = product.minStock !== null && qty <= product.minStock;

  function handleAdjust(delta: number) {
    const newQty = Math.max(0, qty + delta);
    setQty(newQty);
    startTransition(async () => {
      try {
        const serverQty = await adjustQuantity(product.id, delta);
        setQty(serverQty);
      } catch {
        setQty(qty);
      }
    });
  }

  return (
    <Card
      className={`border-zinc-800 bg-zinc-900 transition-colors hover:bg-zinc-900/80 ${
        isLowStock ? "border-red-900/50" : ""
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Image placeholder */}
        <Link
          href={`/inventory/${product.id}`}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800"
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <Package className="h-6 w-6 text-zinc-600" />
          )}
        </Link>

        {/* Info */}
        <Link
          href={`/inventory/${product.id}`}
          className="min-w-0 flex-1"
        >
          <p className="truncate text-sm font-medium">{product.name}</p>
          <div className="flex items-center gap-2">
            {product.salePrice !== null && (
              <span className="text-xs text-zinc-400">
                ${product.salePrice.toFixed(2)}
              </span>
            )}
            {product.category && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {product.category}
              </Badge>
            )}
          </div>
        </Link>

        {/* Quantity controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-white"
            onClick={() => handleAdjust(-1)}
            disabled={isPending || qty <= 0}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span
            className={`min-w-[2rem] text-center text-sm font-semibold ${
              isLowStock ? "text-red-400" : ""
            }`}
          >
            {qty}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-white"
            onClick={() => handleAdjust(1)}
            disabled={isPending}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
