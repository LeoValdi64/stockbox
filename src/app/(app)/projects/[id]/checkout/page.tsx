"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ScanBarcode,
  Search,
  Minus,
  Plus,
  Trash2,
  Loader2,
  LogOut,
  Package,
  Box,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarcodeScanner } from "@/components/barcode-scanner";
import {
  getProducts,
  getProductByBarcode,
} from "@/lib/actions/inventory";
import { getAssetByBarcode } from "@/lib/actions/assets";
import { getProject } from "@/lib/actions/projects";
import { createCheckout } from "@/lib/actions/transfers";
import { toast } from "sonner";

interface CheckoutItem {
  productId: string;
  productName: string;
  trackingType: string;
  assetId?: string;
  assetBarcode?: string;
  serialNumber?: string;
  quantity: number;
  maxQuantity?: number;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [projectName, setProjectName] = useState("");
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; quantity: number; trackingType: string }[]
  >([]);
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);
  const beepRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const project = await getProject(projectId);
        if (project) setProjectName(project.name);
      } catch {}
    }
    load();
  }, [projectId]);

  function playBeep() {
    try {
      if (!beepRef.current) {
        beepRef.current = new AudioContext();
      }
      const ctx = beepRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 1200;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  function vibrate() {
    try {
      navigator.vibrate?.(100);
    } catch {}
  }

  const handleScan = useCallback(
    async (barcode: string) => {
      // First try asset barcode (serialized)
      try {
        const asset = await getAssetByBarcode(barcode);
        if (asset) {
          // Check if already in list
          if (items.find((i) => i.assetId === asset.id)) {
            toast.error("Already in list");
            return;
          }
          if (asset.currentProjectId) {
            toast.error(`Already checked out to ${asset.project?.name || "a project"}`);
            return;
          }
          setItems((prev) => [
            ...prev,
            {
              productId: asset.productId,
              productName: asset.product.name,
              trackingType: "serialized",
              assetId: asset.id,
              assetBarcode: asset.barcode,
              serialNumber: asset.serialNumber || undefined,
              quantity: 1,
            },
          ]);
          playBeep();
          vibrate();
          toast.success(`Added: ${asset.product.name} (${asset.barcode})`);
          return;
        }
      } catch {}

      // Try product barcode (bulk)
      try {
        const product = await getProductByBarcode(barcode);
        if (product) {
          if (product.trackingType === "serialized") {
            toast.error("Scan individual unit barcodes for serialized items");
            return;
          }
          const existing = items.find(
            (i) => i.productId === product.id && !i.assetId
          );
          if (existing) {
            setItems((prev) =>
              prev.map((i) =>
                i.productId === product.id && !i.assetId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              )
            );
          } else {
            setItems((prev) => [
              ...prev,
              {
                productId: product.id,
                productName: product.name,
                trackingType: "bulk",
                quantity: 1,
                maxQuantity: product.quantity,
              },
            ]);
          }
          playBeep();
          vibrate();
          toast.success(`Added: ${product.name}`);
          return;
        }
      } catch {}

      toast.error(`No product found: ${barcode}`);
    },
    [items]
  );

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
        results
          .filter((p) => p.trackingType === "bulk" && p.quantity > 0)
          .map((p) => ({
            id: p.id,
            name: p.name,
            quantity: p.quantity,
            trackingType: p.trackingType,
          }))
      );
    } catch {
      setSearchResults([]);
    }
    setIsSearching(false);
  }

  function addFromSearch(product: {
    id: string;
    name: string;
    quantity: number;
    trackingType: string;
  }) {
    const existing = items.find(
      (i) => i.productId === product.id && !i.assetId
    );
    if (existing) {
      setItems(
        items.map((i) =>
          i.productId === product.id && !i.assetId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          productName: product.name,
          trackingType: product.trackingType,
          quantity: 1,
          maxQuantity: product.quantity,
        },
      ]);
    }
    setSearchQuery("");
    setSearchResults([]);
    toast.success(`Added: ${product.name}`);
  }

  function updateQuantity(index: number, delta: number) {
    setItems(
      items
        .map((item, i) => {
          if (i !== index) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (item.maxQuantity && newQty > item.maxQuantity) return item;
          return { ...item, quantity: newQty };
        })
        .filter((i): i is CheckoutItem => i !== null)
    );
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function handleConfirm() {
    if (items.length === 0) {
      toast.error("Add items first");
      return;
    }

    startTransition(async () => {
      try {
        await createCheckout({
          projectId,
          items: items.map((item) => ({
            productId: item.productId,
            assetId: item.assetId,
            quantity: item.quantity,
          })),
        });
        toast.success(
          `Checked out ${items.length} item${items.length !== 1 ? "s" : ""} to ${projectName}`
        );
        router.push(`/projects/${projectId}`);
      } catch {
        toast.error("Failed to check out items");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Check Out</h1>
          <p className="text-sm text-zinc-400">{projectName}</p>
        </div>
      </div>

      {/* Scanner */}
      {showScanner ? (
        <div className="space-y-2">
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
            continuous
          />
          <p className="text-center text-xs text-zinc-500">
            Rapid-fire mode: keep scanning items
          </p>
        </div>
      ) : (
        <Button
          className="w-full py-6 text-lg"
          onClick={() => setShowScanner(true)}
        >
          <ScanBarcode className="mr-2 h-6 w-6" />
          Start Scanning
        </Button>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search bulk items..."
            className="border-zinc-800 bg-zinc-900 pl-9"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {searchResults.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-2">
            {searchResults.map((product) => (
              <button
                key={product.id}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-800"
                onClick={() => addFromSearch(product)}
              >
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-zinc-500">
                    {product.quantity} available
                  </p>
                </div>
                <Plus className="h-4 w-4 text-zinc-400" />
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="pt-4 pb-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-zinc-400">
            <LogOut className="h-4 w-4" />
            Items to check out ({items.length})
          </div>

          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">
              Scan or search items to add them.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={`${item.productId}-${item.assetId || index}`}
                  className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {item.assetId ? (
                        <Box className="h-3.5 w-3.5 text-zinc-400" />
                      ) : (
                        <Package className="h-3.5 w-3.5 text-zinc-400" />
                      )}
                      <p className="truncate text-sm font-medium">
                        {item.productName}
                      </p>
                    </div>
                    {item.assetBarcode && (
                      <p className="ml-5.5 font-mono text-[10px] text-zinc-500">
                        {item.assetBarcode}
                        {item.serialNumber && ` · ${item.serialNumber}`}
                      </p>
                    )}
                  </div>
                  {!item.assetId ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(index, -1)}
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
                        onClick={() => updateQuantity(index, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-500 hover:text-red-400"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-500 hover:text-red-400"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleConfirm}
        disabled={isPending || items.length === 0}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Check className="mr-2 h-4 w-4" />
        )}
        Confirm Check-Out ({items.length} item
        {items.length !== 1 ? "s" : ""})
      </Button>
    </div>
  );
}
