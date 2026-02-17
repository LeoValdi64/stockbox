import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/product-form";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ barcode?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Add Product</h1>
      </div>

      <ProductForm initialBarcode={params.barcode} />
    </div>
  );
}
