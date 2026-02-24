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
  LogIn,
  Package,
  Box,
  Check,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { getProductByBarcode } from "@/lib/actions/inventory";
import { getAssetByBarcode } from "@/lib/actions/assets";
import { getProject } from "@/lib/actions/projects";
import { getProjectCheckedOutItems, createCheckin } from "@/lib/actions/transfers";
import { toast } from "sonner";

interface CheckinItem {
  productId: string;
  productName: string;
  trackingType: string;
  imageUrl?: string;
  assetId?: string;
  assetBarcode?: string;
  serialNumber?: string;
  quantity: number;
  maxQuantity?: number;
  condition: string;
  consumed: boolean;
}

export default function CheckinPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [projectName, setProjectName] = useState("");
  const [items, setItems] = useState<CheckinItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [checkedOutItems, setCheckedOutItems] = useState<{
    bulkItems: { productId: string; productName: string; quantity: number; imageUrl?: string }[];
    assets: {
      id: string;
      barcode: string;
      serialNumber: string | null;
      condition: string;
      productId: string;
      product: { id: string; name: string; imageUrl?: string | null };
    }[];
  }>({ bulkItems: [], assets: [] });
  const beepRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [project, items] = await Promise.all([
          getProject(projectId),
          getProjectCheckedOutItems(projectId),
        ]);
        if (project) setProjectName(project.name);
        if (items) setCheckedOutItems(items);
      } catch {}
    }
    load();
  }, [projectId]);

  function playBeep() {
    try {
      if (!beepRef.current) beepRef.current = new AudioContext();
      const ctx = beepRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  const handleScan = useCallback(
    async (barcode: string) => {
      // Try asset barcode first
      try {
        const asset = await getAssetByBarcode(barcode);
        if (asset && asset.currentProjectId === projectId) {
          if (items.find((i) => i.assetId === asset.id)) {
            toast.error("Already in return list");
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
              condition: asset.condition,
              consumed: false,
            },
          ]);
          playBeep();
          navigator.vibrate?.(100);
          toast.success(`Returning: ${asset.product.name} (${asset.barcode})`);
          return;
        } else if (asset) {
          toast.error("This asset is not checked out to this project");
          return;
        }
      } catch {}

      // Try product barcode (bulk)
      try {
        const product = await getProductByBarcode(barcode);
        if (product && product.trackingType === "bulk") {
          const checkedOutItem = checkedOutItems.bulkItems.find(
            (i) => i.productId === product.id
          );
          if (!checkedOutItem || checkedOutItem.quantity <= 0) {
            toast.error("This product is not checked out to this project");
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
                maxQuantity: checkedOutItem.quantity,
                condition: "good",
                consumed: false,
              },
            ]);
          }
          playBeep();
          navigator.vibrate?.(100);
          toast.success(`Returning: ${product.name}`);
          return;
        }
      } catch {}

      toast.error(`Not found or not checked out: ${barcode}`);
    },
    [items, projectId, checkedOutItems]
  );

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
        .filter((i): i is CheckinItem => i !== null)
    );
  }

  function updateCondition(index: number, condition: string) {
    setItems(
      items.map((item, i) => (i === index ? { ...item, condition } : item))
    );
  }

  function toggleConsumed(index: number) {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, consumed: !item.consumed } : item
      )
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
        // Items marked consumed don't get checked in (quantity stays deducted)
        const returningItems = items.filter((i) => !i.consumed);
        if (returningItems.length > 0) {
          await createCheckin({
            projectId,
            items: returningItems.map((item) => ({
              productId: item.productId,
              assetId: item.assetId,
              quantity: item.quantity,
              condition: item.condition,
            })),
          });
        }
        setConfirmedCount(items.length);
        setShowSuccess(true);
      } catch {
        toast.error("Failed to check in items");
      }
    });
  }

  // Filter checked-out items by search query for quick-add
  const filteredBulkItems = searchQuery.trim()
    ? checkedOutItems.bulkItems.filter((i) =>
        i.productName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Success screen
  if (showSuccess) {
    const consumedItems = items.filter((i) => i.consumed);
    const returnedItems = items.filter((i) => !i.consumed);

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
          <h2 className="text-2xl font-bold">Check-In Complete</h2>
          <p className="mt-1 text-zinc-400">
            {returnedItems.length > 0 && (
              <>
                {returnedItems.length} item
                {returnedItems.length !== 1 ? "s" : ""} returned
              </>
            )}
            {consumedItems.length > 0 && (
              <>
                {returnedItems.length > 0 ? ", " : ""}
                {consumedItems.length} consumed
              </>
            )}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/projects/${projectId}`}>View Project</Link>
        </Button>
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
          <h1 className="text-2xl font-bold">Check In</h1>
          <p className="text-sm text-zinc-400">{projectName}</p>
        </div>
      </div>

      {/* Currently checked out summary */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="pt-4 pb-4">
          <p className="mb-2 text-xs font-medium text-zinc-400">
            Currently at project:
          </p>
          {checkedOutItems.bulkItems.length === 0 &&
          checkedOutItems.assets.length === 0 ? (
            <p className="text-sm text-zinc-500">Nothing checked out.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {checkedOutItems.bulkItems.map((item) => (
                <Badge
                  key={item.productId}
                  variant="secondary"
                  className="text-[10px]"
                >
                  {item.productName} x{item.quantity}
                </Badge>
              ))}
              {checkedOutItems.assets.map((asset) => (
                <Badge
                  key={asset.id}
                  variant="secondary"
                  className="text-[10px]"
                >
                  {asset.product.name} ({asset.barcode})
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scanner */}
      {showScanner ? (
        <div className="space-y-2">
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
            continuous
          />
          <p className="text-center text-xs text-zinc-500">
            Scan returning items
          </p>
        </div>
      ) : (
        <Button
          className="w-full py-6 text-lg"
          onClick={() => setShowScanner(true)}
        >
          <ScanBarcode className="mr-2 h-6 w-6" />
          Scan Returning Items
        </Button>
      )}

      {/* Search for bulk items at this project */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Search items at this project..."
          className="border-zinc-800 bg-zinc-900 pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <AnimatePresence>
        {filteredBulkItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="p-2">
                {filteredBulkItems.map((item) => (
                  <button
                    key={item.productId}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-800"
                    onClick={() => {
                      const existing = items.find(
                        (i) => i.productId === item.productId && !i.assetId
                      );
                      if (existing) {
                        setItems(
                          items.map((i) =>
                            i.productId === item.productId && !i.assetId
                              ? { ...i, quantity: i.quantity + 1 }
                              : i
                          )
                        );
                      } else {
                        setItems([
                          ...items,
                          {
                            productId: item.productId,
                            productName: item.productName,
                            trackingType: "bulk",
                            quantity: 1,
                            maxQuantity: item.quantity,
                            condition: "good",
                            consumed: false,
                          },
                        ]);
                      }
                      setSearchQuery("");
                      toast.success(`Added: ${item.productName}`);
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-800">
                      <Package className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-zinc-500">
                        {item.quantity} at project
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
            <LogIn className="h-4 w-4" />
            Items to check in ({items.length})
          </div>

          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">
              Scan returning items to add them.
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
                    className={`rounded-lg px-3 py-2 ${
                      item.consumed
                        ? "bg-zinc-800/30 opacity-60"
                        : "bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
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
                        <p
                          className={`truncate text-sm font-medium ${
                            item.consumed ? "line-through" : ""
                          }`}
                        >
                          {item.productName}
                        </p>
                        {item.assetBarcode && (
                          <p className="font-mono text-[10px] text-zinc-500">
                            {item.assetBarcode}
                          </p>
                        )}
                        {item.consumed && (
                          <Badge
                            variant="outline"
                            className="mt-1 border-amber-500/30 text-[10px] text-amber-400"
                          >
                            Consumed — won&apos;t return to inventory
                          </Badge>
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
                    </div>

                    {/* Condition selector + consumed toggle */}
                    <div className="mt-2 flex items-center gap-2 pl-12">
                      {item.assetId && (
                        <Select
                          value={item.condition}
                          onValueChange={(v) => updateCondition(index, v)}
                        >
                          <SelectTrigger className="h-7 w-28 border-zinc-700 bg-zinc-800 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-zinc-700 bg-zinc-900">
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="damaged">Damaged</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        variant={item.consumed ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleConsumed(index)}
                      >
                        <Ban className="mr-1 h-3 w-3" />
                        {item.consumed ? "Consumed" : "Mark consumed"}
                      </Button>
                    </div>
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
            Confirm Check-In ({items.length} item
            {items.length !== 1 ? "s" : ""})
          </Button>
        </div>
      </div>
    </div>
  );
}
