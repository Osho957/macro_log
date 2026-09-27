"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { NormalizedFood } from "@/types/food";

export interface RecentFood extends NormalizedFood {
  id: string;
}

export function RecentFoodsList({
  foods,
  onSelect,
}: {
  foods: RecentFood[];
  onSelect: (food: NormalizedFood) => void;
}) {
  const [items, setItems] = useState(foods);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("foods").delete().eq("id", id);
    setDeletingId(null);
    if (!error) {
      setItems((prev) => prev.filter((f) => f.id !== id));
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
        Recent Foods
      </h3>
      <div className="space-y-2">
        {items.map((food) => (
          <div
            key={food.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3.5"
          >
            <button
              onClick={() => onSelect(food)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-sm font-bold text-ink-primary">
                {food.name}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {food.servingSize}
                {food.servingUnit} · <span className="text-carbs">C: {food.carbsG ?? 0}g</span>{" "}
                · <span className="text-protein">P: {food.proteinG ?? 0}g</span>{" "}
                · <span className="text-fat">F: {food.fatG ?? 0}g</span>
              </p>
            </button>
            <div className="ml-3 flex shrink-0 items-center gap-3">
              <span className="text-sm font-bold text-ink-primary">
                {Math.round(food.calories)} kcal
              </span>
              <button
                onClick={() => handleDelete(food.id)}
                disabled={deletingId === food.id}
                aria-label={`Remove ${food.name}`}
                className="text-ink-muted hover:text-status-critical disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
