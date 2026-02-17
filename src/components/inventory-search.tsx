"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function InventorySearch({
  initialSearch,
  initialCategory,
}: {
  initialSearch?: string;
  initialCategory?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) params.set("q", value);
      if (initialCategory) params.set("category", initialCategory);
      router.push(`/inventory?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <Input
        placeholder="Search products or barcodes..."
        className="border-zinc-800 bg-zinc-900 pl-9 pr-8"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {search && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-zinc-500"
          onClick={() => handleSearch("")}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
