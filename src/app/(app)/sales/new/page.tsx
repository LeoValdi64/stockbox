"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ScanBarcode,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProducts, getProductByBarcode } from "@/lib/actions/inventory";
import { createSale } from "@/lib/actions/sales";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { toast } from "sonner";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  maxQuantity: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; salePrice: number | null; quantity: number }[]
  >([]);
  const [notes, setNotes] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await getProducts(query);
      setSearchResults(
        results.filter(
          (p: { quantity: number }) => p.quantity > 0
        )
      );
    } catch {
      setSearchResults([]);
    }
    setIsSearching(false);
  }

  function addToCart(product: {
    id: string;
    name: string;
    salePrice: number | null;
    quantity: number;
  }) {
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= existing.maxQuantity) {
        toast.error("Maximum stock reached");
        return;
      }
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.salePrice ?? 0,
          quantity: 1,
          maxQuantity: product.quantity,
        },
      ]);
    }
    setSearchQuery("");
    setSearchResults([]);
    toast.success(`Added ${product.name}`);
  }

  function updateCartQuantity(productId: string, delta: number) {
    setCart(
      cart
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.maxQuantity) return item;
          return { ...item, quantity: newQty };
        })
        .filter((item): item is CartItem => item !== null)
    );
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter((item) => item.productId !== productId));
  }

  const handleScan = useCallback(
    async (barcode: string) => {
      setShowScanner(false);
      try {
        const product = await getProductByBarcode(barcode);
        if (product && product.quantity > 0) {
          addToCart(product);
        } else if (product) {
          toast.error(`${product.name} is out of stock`);
        } else {
          toast.error(`No product found for barcode: ${barcode}`);
        }
      } catch {
        toast.error("Failed to look up barcode");
      }
    },
    [cart]
  );

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  function handleCompleteSale() {
    if (cart.length === 0) {
      toast.error("Add items to the cart first");
      return;
    }

    startTransition(async () => {
      try {
        await createSale({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          notes: notes || undefined,
        });
        toast.success("Sale completed!");
        router.push("/sales");
      } catch {
        toast.error("Failed to complete sale");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sales">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New Sale</h1>
      </div>

      {/* Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Search + Scan */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search products..."
            className="border-zinc-800 bg-zinc-900 pl-9"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowScanner(!showScanner)}
        >
          <ScanBarcode className="h-4 w-4" />
        </Button>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-2">
            {searchResults.map((product) => (
              <button
                key={product.id}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-800"
                onClick={() => addToCart(product)}
              >
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-zinc-500">
                    {product.quantity} in stock
                  </p>
                </div>
                <span className="text-sm text-zinc-400">
                  ${(product.salePrice ?? 0).toFixed(2)}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cart */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="pt-4 pb-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-zinc-400">
            <ShoppingCart className="h-4 w-4" />
            Cart ({cart.length} item{cart.length !== 1 ? "s" : ""})
          </div>

          {cart.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">
              Search or scan items to add them here.
            </p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-zinc-500">
                      ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateCartQuantity(item.productId, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateCartQuantity(item.productId, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-500 hover:text-red-400"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Textarea
        placeholder="Sale notes (optional)"
        className="border-zinc-800 bg-zinc-900"
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {/* Total + Complete */}
      <div className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3">
        <span className="text-zinc-400">Total</span>
        <span className="text-2xl font-bold">${total.toFixed(2)}</span>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={handleCompleteSale}
        disabled={isPending || cart.length === 0}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Complete Sale
      </Button>
    </div>
  );
}
