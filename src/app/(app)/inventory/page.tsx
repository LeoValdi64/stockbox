import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/lib/actions/inventory";
import { ProductCard } from "@/components/product-card";
import { InventorySearch } from "@/components/inventory-search";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button size="sm" asChild>
          <Link href="/inventory/new">
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Link>
        </Button>
      </div>

      <InventorySearch
        initialSearch={params.q}
        initialCategory={params.category}
      />

      <Suspense
        fallback={
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-zinc-900"
              />
            ))}
          </div>
        }
      >
        <ProductList search={params.q} category={params.category} />
      </Suspense>
    </div>
  );
}

async function ProductList({
  search,
  category,
}: {
  search?: string;
  category?: string;
}) {
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    products = await getProducts(search, category);
  } catch {
    products = [];
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">
          {search || category
            ? "No products match your search."
            : "No products yet. Add your first product!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
