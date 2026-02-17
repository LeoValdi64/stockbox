"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createCategory,
  deleteCategory,
} from "@/lib/actions/categories";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  color: string | null;
}

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export function CategoriesManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleAdd() {
    if (!newName.trim()) return;

    startTransition(async () => {
      try {
        const category = await createCategory({
          name: newName.trim(),
          color: selectedColor,
        });
        setCategories([...categories, category]);
        setNewName("");
        toast.success("Category created");
      } catch {
        toast.error("Failed to create category");
      }
    });
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteCategory(id);
        setCategories(categories.filter((c) => c.id !== id));
        toast.success("Category deleted");
      } catch {
        toast.error("Failed to delete category");
      }
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-3">
      {/* Existing categories */}
      {categories.length === 0 ? (
        <p className="text-sm text-zinc-500">No categories yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              className="group gap-1 py-1 pr-1"
              style={
                category.color
                  ? { borderColor: category.color + "40" }
                  : undefined
              }
            >
              {category.color && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
              )}
              {category.name}
              <button
                className="ml-1 rounded p-0.5 text-zinc-500 hover:text-red-400"
                onClick={() => handleDelete(category.id)}
                disabled={isPending}
              >
                {deletingId === category.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add new */}
      <div className="flex gap-2">
        <Input
          placeholder="New category"
          className="border-zinc-700 bg-zinc-800"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button
          size="icon"
          onClick={handleAdd}
          disabled={isPending || !newName.trim()}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Color picker */}
      <div className="flex gap-1.5">
        {COLORS.map((color) => (
          <button
            key={color}
            className={`h-6 w-6 rounded-full transition-transform ${
              selectedColor === color
                ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                : "hover:scale-105"
            }`}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
    </div>
  );
}
