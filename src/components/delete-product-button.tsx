"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/lib/actions/inventory";
import { toast } from "sonner";

export function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return;

    startTransition(async () => {
      try {
        await deleteProduct(id);
        toast.success("Product deleted");
        router.push("/inventory");
      } catch {
        toast.error("Failed to delete product");
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="text-red-400 hover:bg-red-950 hover:text-red-300"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
