"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createProduct, updateProduct } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProductFormProps {
  product?: {
    id: string;
    name: string;
    description: string | null;
    barcode: string | null;
    quantity: number;
    minStock: number | null;
    category: string | null;
    costPrice: number | null;
    salePrice: number | null;
  };
  initialBarcode?: string;
}

export function ProductForm({ product, initialBarcode }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    barcode: product?.barcode ?? initialBarcode ?? "",
    quantity: product?.quantity ?? 0,
    minStock: product?.minStock ?? "",
    category: product?.category ?? "",
    costPrice: product?.costPrice ?? "",
    salePrice: product?.salePrice ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    startTransition(async () => {
      try {
        const data = {
          name: form.name.trim(),
          description: form.description || undefined,
          barcode: form.barcode || undefined,
          quantity: Number(form.quantity) || 0,
          minStock: form.minStock ? Number(form.minStock) : undefined,
          category: form.category || undefined,
          costPrice: form.costPrice ? Number(form.costPrice) : undefined,
          salePrice: form.salePrice ? Number(form.salePrice) : undefined,
        };

        if (product) {
          await updateProduct(product.id, data);
          toast.success("Product updated");
          router.push(`/inventory/${product.id}`);
        } else {
          const newProduct = await createProduct(data);
          toast.success("Product created");
          router.push("/inventory");
        }
      } catch (err) {
        toast.error("Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Product name"
              className="border-zinc-700 bg-zinc-800"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              className="border-zinc-700 bg-zinc-800"
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              placeholder="Scan or enter barcode"
              className="border-zinc-700 bg-zinc-800"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                className="border-zinc-700 bg-zinc-800"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Low Stock Alert</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                placeholder="Optional"
                className="border-zinc-700 bg-zinc-800"
                value={form.minStock}
                onChange={(e) =>
                  setForm({ ...form, minStock: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g. Electronics, Clothing"
              className="border-zinc-700 bg-zinc-800"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="border-zinc-700 bg-zinc-800"
                value={form.costPrice}
                onChange={(e) =>
                  setForm({ ...form, costPrice: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale Price</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="border-zinc-700 bg-zinc-800"
                value={form.salePrice}
                onChange={(e) =>
                  setForm({ ...form, salePrice: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {product ? "Update" : "Create"} Product
        </Button>
      </div>
    </form>
  );
}
