"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  imageUrl?: string;
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
    { id: string; name: string; quantity: number; trackingType: string; imageUrl: string | null }[]
  >([]);
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const beepRef = useRef<AudioContext | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          if (items.find((i) => i.assetId === asset.id)) {
            toast.error("Already in list");
            return;
          }
          if (asset.currentProjectId) {
            toast.error(
              `Already checked out to ${asset.project?.name || "a project"}`
            );
            return;
          }
          setItems((prev) => [
            ...prev,
            {
              productId: asset.productId,
              productName: asset.product.name,
              trackingType: "serialized",
              imageUrl: asset.product.imageUrl || undefined,
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
                imageUrl: product.imageUrl || undefined,
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

  function handleSearch(query: string) {
    setSearchQuery(query);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
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
              imageUrl: p.imageUrl,
            }))
        );
      } catch {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 300);
  }

  function addFromSearch(product: {
    id: string;
    name: string;
    quantity: number;
    trackingType: string;
    imageUrl: string | null;
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
          imageUrl: product.imageUrl || undefined,
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
        setConfirmedCount(items.length);
        setShowSuccess(true);
      } catch {
        toast.error("Failed to check out items");
      }
    });
  }

  // Success screen
  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
        >
          <CheckCircle2 className="h-20 w-20 text-emerald-400" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold">Check-Out Complete</h2>
          <p className="mt-1 text-zinc-400">
            {confirmedCount} item{confirmedCount !== 1 ? "s" : ""} checked out
            to <span className="text-zinc-200">{projectName}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}`}>View Project</Link>
          </Button>
          <Button
            onClick={() => {
              setShowSuccess(false);
              setItems([]);
              setConfirmedCount(0);
            }}
          >
            Check Out More
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Search products by name..."
          className="border-zinc-800 bg-zinc-900 pl-9"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-500" />
        )}
      </div>

      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="p-2">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-800"
                    onClick={() => addFromSearch(product)}
                  >
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-800">
                        <Package className="h-4 w-4 text-zinc-500" />
                      </div>
                    )}
                    <div className="flex-1">
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
          </motion.div>
        )}
      </AnimatePresence>

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
              <AnimatePresence initial={false}>
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.productId}-${item.assetId || "bulk"}`}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-3 py-2"
                  >
                    {/* Thumbnail */}
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        width={36}
                        height={36}
                        className="h-9 w-9 flex-shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-zinc-700/50">
                        {item.assetId ? (
                          <Box className="h-4 w-4 text-zinc-500" />
                        ) : (
                          <Package className="h-4 w-4 text-zinc-500" />
                        )}
                      </div>
                    )}

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.productName}
                      </p>
                      {item.assetBarcode && (
                        <p className="font-mono text-[10px] text-zinc-500">
                          {item.assetBarcode}
                          {item.serialNumber && ` · ${item.serialNumber}`}
                        </p>
                      )}
                    </div>

                    {/* Controls */}
                    {!item.assetId ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
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
                          className="h-8 w-8"
                          onClick={() => updateQuantity(index, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500 hover:text-red-400"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-400"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sticky Confirm Button */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
        <div className="mx-auto max-w-lg">
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
      </div>
    </div>
  );
}
