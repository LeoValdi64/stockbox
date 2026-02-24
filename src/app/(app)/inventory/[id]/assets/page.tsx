"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Box,
  MapPin,
  Loader2,
  Trash2,
  ScanBarcode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAssets, createAsset, deleteAsset } from "@/lib/actions/assets";
import { getProduct } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { BarcodeDisplay } from "@/components/barcode-display";

type Asset = Awaited<ReturnType<typeof getAssets>>[number];
type Product = NonNullable<Awaited<ReturnType<typeof getProduct>>>;

export default function AssetsPage() {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([
        getProduct(productId),
        getAssets(productId),
      ]);
      setProduct(p);
      setAssets(a);
    } catch {
      toast.error("Failed to load data");
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleAddUnit() {
    startTransition(async () => {
      try {
        await createAsset({
          productId,
          serialNumber: serialNumber || undefined,
          notes: notes || undefined,
        });
        toast.success("Unit added");
        setShowAddDialog(false);
        setSerialNumber("");
        setNotes("");
        loadData();
      } catch {
        toast.error("Failed to add unit");
      }
    });
  }

  function handleDelete(assetId: string) {
    if (!confirm("Delete this unit?")) return;
    startTransition(async () => {
      try {
        await deleteAsset(assetId);
        toast.success("Unit deleted");
        loadData();
      } catch {
        toast.error("Failed to delete unit");
      }
    });
  }

  const conditionColor: Record<string, string> = {
    good: "text-emerald-400",
    fair: "text-amber-400",
    damaged: "text-red-400",
    lost: "text-zinc-500",
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/inventory/${productId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Units</h1>
            <p className="text-sm text-zinc-400">{product?.name}</p>
          </div>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent className="border-zinc-800 bg-zinc-950">
            <DialogHeader>
              <DialogTitle>Add New Unit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Serial Number (optional)</Label>
                <Input
                  placeholder="e.g. SN-12345"
                  className="border-zinc-700 bg-zinc-800"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  placeholder="Any notes about this unit"
                  className="border-zinc-700 bg-zinc-800"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <p className="text-xs text-zinc-500">
                A unique barcode will be auto-generated for this unit.
              </p>
              <Button
                className="w-full"
                onClick={handleAddUnit}
                disabled={isPending}
              >
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Unit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-sm text-zinc-500">
        {assets.length} unit{assets.length !== 1 ? "s" : ""} total
      </div>

      {assets.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <Box className="h-10 w-10 text-zinc-600" />
            <p className="text-sm text-zinc-400">No units yet.</p>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add First Unit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {assets.map((asset) => (
            <Card key={asset.id} className="border-zinc-800 bg-zinc-900">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <ScanBarcode className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="font-mono text-xs text-zinc-300">
                        {asset.barcode}
                      </span>
                    </div>
                    {asset.serialNumber && (
                      <p className="text-xs text-zinc-400">
                        S/N: {asset.serialNumber}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${conditionColor[asset.condition] || ""}`}
                      >
                        {asset.condition}
                      </Badge>
                      {asset.project ? (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400">
                          <MapPin className="h-2.5 w-2.5" />
                          {asset.project.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400">
                          Warehouse
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-500 hover:text-red-400"
                    onClick={() => handleDelete(asset.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
