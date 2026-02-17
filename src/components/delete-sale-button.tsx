"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteSale } from "@/lib/actions/sales";
import { toast } from "sonner";

export function DeleteSaleButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this sale? Stock will be restored.")) return;

    startTransition(async () => {
      try {
        await deleteSale(id);
        toast.success("Sale deleted, stock restored");
      } catch {
        toast.error("Failed to delete sale");
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 text-zinc-500 hover:text-red-400"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
