import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/product-form";
import { getProduct } from "@/lib/actions/inventory";
import { db } from "@/lib/db";

export default async function EditProductPage({
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

  let assetCount = 0;
  if (product.trackingType === "serialized") {
    assetCount = await db.asset.count({
      where: { productId: product.id },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/inventory/${product.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>

      <ProductForm product={product} assetCount={assetCount} />
    </div>
  );
}
