import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProduct } from "@/lib/actions/inventory";
import { DeleteProductButton } from "@/components/delete-product-button";
import { BarcodeDisplay } from "@/components/barcode-display";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product: Awaited<ReturnType<typeof getProduct>> | null = null;

  try {
    product = await getProduct(id);
  } catch {
    product = null;
  }

  if (!product) {
    notFound();
  }

  const isLowStock =
    product.minStock !== null && product.quantity <= product.minStock;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/inventory/${product.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <DeleteProductButton id={product.id} />
        </div>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Quantity</span>
            <span
              className={`text-lg font-bold ${
                isLowStock ? "text-red-400" : ""
              }`}
            >
              {product.quantity}
              {product.minStock !== null && (
                <span className="ml-1 text-sm text-zinc-500">
                  / min {product.minStock}
                </span>
              )}
            </span>
          </div>

          {isLowStock && (
            <Badge variant="destructive" className="w-full justify-center">
              Low Stock Alert
            </Badge>
          )}

          {product.description && (
            <div>
              <span className="text-sm text-zinc-400">Description</span>
              <p className="mt-1 text-sm">{product.description}</p>
            </div>
          )}

          {product.category && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Category</span>
              <Badge variant="secondary">{product.category}</Badge>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {product.costPrice !== null && (
              <div>
                <span className="text-sm text-zinc-400">Cost Price</span>
                <p className="text-lg font-medium">
                  ${product.costPrice.toFixed(2)}
                </p>
              </div>
            )}
            {product.salePrice !== null && (
              <div>
                <span className="text-sm text-zinc-400">Sale Price</span>
                <p className="text-lg font-medium">
                  ${product.salePrice.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {product.barcode && (
            <div>
              <span className="text-sm text-zinc-400">Barcode</span>
              <BarcodeDisplay value={product.barcode} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
