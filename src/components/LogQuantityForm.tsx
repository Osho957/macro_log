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
  // Small-count units (piece, tbsp, etc.) need a much finer slider than
  // gram/ml-based foods, where a step of 5g out of 400g makes sense.
  const isSmallUnit = food.servingSize <= 20;
  const sliderMax = isSmallUnit
    ? Math.max(10, Math.round(food.servingSize * 5))
    : Math.max(400, Math.round(food.servingSize * 3));
  const sliderStep = isSmallUnit ? (food.servingSize <= 1 ? 0.5 : 1) : 5;
  const [amount, setAmount] = useState(food.servingSize);
  const [mealId, setMealId] = useState(defaultMealId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mealName = meals.find((m) => m.id === mealId)?.name ?? "Meal";

  const calories = scaleNutrient(food.calories, amount, food.servingSize) ?? 0;
  const carbs = scaleNutrient(food.carbsG, amount, food.servingSize) ?? 0;
  const protein = scaleNutrient(food.proteinG, amount, food.servingSize) ?? 0;
  const fat = scaleNutrient(food.fatG, amount, food.servingSize) ?? 0;

  async function handleConfirm() {
    setError(null);
    setSaving(true);
    try {
      await onConfirm({ mealId, quantity: amount });
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Couldn't save this entry. Please try again.";
      setError(message);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between">
        <div>
          {food.brand && (
            <span className="text-[10px] font-bold uppercase text-accent">
              {food.brand}
            </span>
          )}
          <p className="text-base font-bold text-ink-primary">{food.name}</p>
        </div>
        <button
          onClick={onCancel}
          className="rounded-full bg-page px-2 py-1 text-xs text-ink-muted hover:text-ink-primary"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-ink-muted">Meal</label>
        <select
          value={mealId}
          onChange={(e) => setMealId(e.target.value)}
          className="w-full rounded-lg border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-accent"
        >
          {meals.map((meal) => (
            <option key={meal.id} value={meal.id}>
              {meal.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5 rounded-xl border border-border bg-page p-3">
        <div className="flex justify-between text-xs">
          <span className="text-ink-muted">Serving Size:</span>
          <span className="font-bold text-ink-primary">
            {amount} {food.servingUnit}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={sliderMax}
          step={sliderStep}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-[10px] text-ink-muted">
          <span>0{food.servingUnit}</span>
          <span>
            {Math.round(sliderMax / 2)}
            {food.servingUnit}
          </span>
          <span>
            {sliderMax}
            {food.servingUnit}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <PreviewCell label="Cals" value={Math.round(calories)} colorClass="text-accent" />
        <PreviewCell label="Carbs" value={`${Math.round(carbs)}g`} colorClass="text-carbs" />
        <PreviewCell label="Prot" value={`${Math.round(protein)}g`} colorClass="text-protein" />
        <PreviewCell label="Fat" value={`${Math.round(fat)}g`} colorClass="text-fat" />
      </div>

      {error && <p className="text-sm text-status-critical">{error}</p>}

      <button
        onClick={handleConfirm}
        disabled={saving}
        className="w-full rounded-2xl bg-accent py-3 text-xs font-bold tracking-wide text-page shadow-lg shadow-accent/20 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving..." : `Add to ${mealName}`}
      </button>
    </div>
  );
}

function PreviewCell({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string | number;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-page p-2">
      <span className="block text-[10px] text-ink-muted">{label}</span>
      <span className={`text-xs font-bold ${colorClass}`}>{value}</span>
    </div>
  );
}
