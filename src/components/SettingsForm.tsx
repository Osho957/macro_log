"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { todayInTimezone } from "@/lib/dates";

export function SettingsForm({
  userId,
  timezone,
  weightUnit,
  goals,
}: {
  userId: string;
  timezone: string;
  weightUnit: string;
  goals: {
    calorie_goal: number;
    protein_goal_g: number | null;
    carbs_goal_g: number | null;
    fat_goal_g: number | null;
  } | null;
}) {
  const router = useRouter();
  const [calorieGoal, setCalorieGoal] = useState(
    String(goals?.calorie_goal ?? ""),
  );
  const [proteinGoal, setProteinGoal] = useState(
    String(goals?.protein_goal_g ?? ""),
  );
  const [carbsGoal, setCarbsGoal] = useState(
    String(goals?.carbs_goal_g ?? ""),
  );
  const [fatGoal, setFatGoal] = useState(String(goals?.fat_goal_g ?? ""));
  const [unit, setUnit] = useState(weightUnit);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const today = todayInTimezone(timezone);

    await Promise.all([
      calorieGoal
        ? supabase.from("daily_goals").upsert(
            {
              user_id: userId,
              effective_date: today,
              calorie_goal: Number(calorieGoal),
              protein_goal_g: proteinGoal ? Number(proteinGoal) : null,
              carbs_goal_g: carbsGoal ? Number(carbsGoal) : null,
              fat_goal_g: fatGoal ? Number(fatGoal) : null,
            },
            { onConflict: "user_id,effective_date" },
          )
        : Promise.resolve(),
      supabase
        .from("user_settings")
        .update({ weight_unit: unit })
        .eq("user_id", userId),
    ]);

    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <h2 className="mb-2 text-sm font-semibold">Daily goals</h2>
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-sm">Calories</label>
            <input
              type="number"
              min={0}
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(e.target.value)}
              className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-sm">Protein (g)</label>
              <input
                type="number"
                min={0}
                value={proteinGoal}
                onChange={(e) => setProteinGoal(e.target.value)}
                className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm">Carbs (g)</label>
              <input
                type="number"
                min={0}
                value={carbsGoal}
                onChange={(e) => setCarbsGoal(e.target.value)}
                className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm">Fat (g)</label>
              <input
                type="number"
                min={0}
                value={fatGoal}
                onChange={(e) => setFatGoal(e.target.value)}
                className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold">Weight unit</label>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-full rounded-md border border-black/10 px-3 py-2 dark:border-white/10 dark:bg-black/20"
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
      </div>

      <p className="text-xs text-black/50 dark:text-white/50">
        Timezone: {timezone} (auto-detected from your device)
      </p>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
      </button>
    </form>
  );
}
