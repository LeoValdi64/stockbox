"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/lib/actions/projects";
import { toast } from "sonner";

export function DeleteProjectButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }

    startTransition(async () => {
      try {
        await deleteProject(id);
        toast.success("Project deleted");
        router.push("/projects");
      } catch {
        toast.error("Failed to delete project");
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={confirming ? "border-red-500 text-red-400" : ""}
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
