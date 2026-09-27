"use client";

import { useState } from "react";
import type { NormalizedFood } from "@/types/food";

const emptyForm = {
  name: "",
  brand: "",
  servingSize: "100",
  servingUnit: "g",
  calories: "",
  proteinG: "",
  carbsG: "",
  fatG: "",
};

export function CustomFoodForm({
  onSubmit,
}: {
  onSubmit: (food: NormalizedFood) => void;
}) {
  const [form, setForm] = useState(emptyForm);

  function update(key: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.calories) return;

    onSubmit({
      source: "custom",
      externalId: null,
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      servingSize: Number(form.servingSize) || 100,
      servingUnit: form.servingUnit.trim() || "g",
      calories: Number(form.calories) || 0,
      proteinG: form.proteinG ? Number(form.proteinG) : null,
      carbsG: form.carbsG ? Number(form.carbsG) : null,
      fatG: form.fatG ? Number(form.fatG) : null,
      fiberG: null,
      sugarG: null,
      sodiumMg: null,
      barcode: null,
    });

    setForm(emptyForm);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium">Name</label>
        <input
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Brand (optional)</label>
        <input
          value={form.brand}
          onChange={(e) => update("brand", e.target.value)}
          className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium">Serving size</label>
          <input
            type="number"
            min={0}
            value={form.servingSize}
            onChange={(e) => update("servingSize", e.target.value)}
            className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium">Unit</label>
          <input
            value={form.servingUnit}
            onChange={(e) => update("servingUnit", e.target.value)}
            className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Calories (per serving above)
        </label>
        <input
          required
          type="number"
          min={0}
          value={form.calories}
          onChange={(e) => update("calories", e.target.value)}
          className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium">Protein (g)</label>
          <input
            type="number"
            min={0}
            value={form.proteinG}
            onChange={(e) => update("proteinG", e.target.value)}
            className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium">Carbs (g)</label>
          <input
            type="number"
            min={0}
            value={form.carbsG}
            onChange={(e) => update("carbsG", e.target.value)}
            className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium">Fat (g)</label>
          <input
            type="number"
            min={0}
            value={form.fatG}
            onChange={(e) => update("fatG", e.target.value)}
            className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        Continue
      </button>
    </form>
  );
}
