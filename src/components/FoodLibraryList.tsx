"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Food } from "@/types/food";

interface FoodRow {
  id: string;
  source: Food["source"];
  name: string;
  brand: string | null;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

export function FoodLibraryList({ foods }: { foods: FoodRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("foods").delete().eq("id", id);
    router.refresh();
  }

  if (foods.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        No foods yet. Anything you search, scan, or add manually while
        logging will show up here.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-black/10 dark:divide-white/10">
      {foods.map((food) => (
        <li key={food.id} className="py-3">
          {editingId === food.id ? (
            <EditFoodForm
              food={food}
              onDone={() => {
                setEditingId(null);
                router.refresh();
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{food.name}</p>
                <p className="text-xs text-black/50 dark:text-white/50">
                  {food.brand ? `${food.brand} · ` : ""}
                  {food.calories} kcal per {food.serving_size}
                  {food.serving_unit}
                  {" · "}
                  {food.source}
                </p>
              </div>
              <div className="flex gap-3 text-xs">
                {food.source === "custom" && (
                  <button
                    onClick={() => setEditingId(food.id)}
                    className="underline"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(food.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function EditFoodForm({
  food,
  onDone,
  onCancel,
}: {
  food: FoodRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(food.name);
  const [calories, setCalories] = useState(String(food.calories));
  const [proteinG, setProteinG] = useState(String(food.protein_g ?? ""));
  const [carbsG, setCarbsG] = useState(String(food.carbs_g ?? ""));
  const [fatG, setFatG] = useState(String(food.fat_g ?? ""));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("foods")
      .update({
        name,
        calories: Number(calories) || 0,
        protein_g: proteinG ? Number(proteinG) : null,
        carbs_g: carbsG ? Number(carbsG) : null,
        fat_g: fatG ? Number(fatG) : null,
      })
      .eq("id", food.id);
    onDone();
  }

  return (
    <div className="space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/10 dark:bg-black/20"
      />
      <div className="flex gap-2">
        <input
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="kcal"
          className="w-full rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/10 dark:bg-black/20"
        />
        <input
          value={proteinG}
          onChange={(e) => setProteinG(e.target.value)}
          placeholder="protein g"
          className="w-full rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/10 dark:bg-black/20"
        />
        <input
          value={carbsG}
          onChange={(e) => setCarbsG(e.target.value)}
          placeholder="carbs g"
          className="w-full rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/10 dark:bg-black/20"
        />
        <input
          value={fatG}
          onChange={(e) => setFatG(e.target.value)}
          placeholder="fat g"
          className="w-full rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/10 dark:bg-black/20"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-black px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-black/10 px-3 py-1 text-xs dark:border-white/10"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
