"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { todayInTimezone } from "@/lib/dates";

export function ManualGoalsForm({
  userId,
  timezone,
  goals,
}: {
  userId: string;
  timezone: string;
  goals: {
    calorie_goal: number;
    protein_goal_g: number | null;
    carbs_goal_g: number | null;
    fat_goal_g: number | null;
  } | null;
}) {
  const router = useRouter();
  const [calories, setCalories] = useState(String(goals?.calorie_goal ?? ""));
  const [protein, setProtein] = useState(String(goals?.protein_goal_g ?? ""));
  const [carbs, setCarbs] = useState(String(goals?.carbs_goal_g ?? ""));
  const [fat, setFat] = useState(String(goals?.fat_goal_g ?? ""));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!calories) return;

    setSaving(true);
    setSaved(false);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.from("daily_goals").upsert(
      {
        user_id: userId,
        effective_date: todayInTimezone(timezone),
        calorie_goal: Number(calories),
        protein_goal_g: protein ? Number(protein) : null,
        carbs_goal_g: carbs ? Number(carbs) : null,
        fat_goal_g: fat ? Number(fat) : null,
      },
      { onConflict: "user_id,effective_date" },
    );

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-3 rounded-2xl border border-border bg-surface p-4"
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
        Set custom goals
      </h3>

      <div className="space-y-1">
        <label className="text-sm">Calories</label>
        <input
          type="number"
          min={0}
          required
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-protein">Protein (g)</label>
          <input
            type="number"
            min={0}
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-carbs">Carbs (g)</label>
          <input
            type="number"
            min={0}
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-fat">Fat (g)</label>
          <input
            type="number"
            min={0}
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
          />
        </div>
      </div>

      {(protein || carbs || fat) && (
        <MacroKcalSummary
          calories={Number(calories) || 0}
          macroKcal={
            (Number(protein) || 0) * 4 +
            (Number(carbs) || 0) * 4 +
            (Number(fat) || 0) * 9
          }
        />
      )}

      {error && <p className="text-sm text-status-critical">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-accent py-2.5 text-sm font-bold text-page transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save custom goals"}
      </button>
    </form>
  );
}

function MacroKcalSummary({
  calories,
  macroKcal,
}: {
  calories: number;
  macroKcal: number;
}) {
  const mismatch = calories > 0 && Math.abs(macroKcal - calories) > 50;
  return (
    <p className={`text-xs ${mismatch ? "text-status-warning" : "text-ink-muted"}`}>
      Macros add up to {Math.round(macroKcal)} kcal
      {mismatch ? ` (target is ${calories})` : ""}
    </p>
  );
}
