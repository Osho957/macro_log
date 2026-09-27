"use client";

import { useState } from "react";
import type { NormalizedFood } from "@/types/food";
import { scaleNutrient } from "@/lib/nutrition";

interface Meal {
  id: string;
  name: string;
}

export function LogQuantityForm({
  food,
  meals,
  defaultMealId,
  onCancel,
  onConfirm,
}: {
  food: NormalizedFood;
  meals: Meal[];
  defaultMealId: string;
  onCancel: () => void;
  onConfirm: (args: { mealId: string; quantity: number }) => Promise<void>;
}) {
  const [mealId, setMealId] = useState(defaultMealId);
  const [amount, setAmount] = useState(food.servingSize);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calories = scaleNutrient(food.calories, amount, food.servingSize) ?? 0;

  async function handleConfirm() {
    setError(null);
    setSaving(true);
    try {
      await onConfirm({ mealId, quantity: amount });
    } catch {
      setError("Couldn't save this entry. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div>
        <p className="font-medium">{food.name}</p>
        {food.brand && (
          <p className="text-sm text-black/60 dark:text-white/60">
            {food.brand}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium">Meal</label>
          <select
            value={mealId}
            onChange={(e) => setMealId(e.target.value)}
            className="w-full rounded-md border border-black/10 px-2 py-1.5 dark:border-white/10 dark:bg-black/20"
          >
            {meals.map((meal) => (
              <option key={meal.id} value={meal.id}>
                {meal.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-28 space-y-1">
          <label className="text-sm font-medium">
            Amount ({food.servingUnit})
          </label>
          <input
            type="number"
            min={0}
            step="0.1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-md border border-black/10 px-2 py-1.5 dark:border-white/10 dark:bg-black/20"
          />
        </div>
      </div>

      <p className="text-sm text-black/60 dark:text-white/60">
        {calories} kcal for {amount} {food.servingUnit} (this food is{" "}
        {food.calories} kcal per {food.servingSize} {food.servingUnit})
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={saving}
          className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {saving ? "Saving..." : "Log it"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/10"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
