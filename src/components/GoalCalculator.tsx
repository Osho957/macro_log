"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { todayInTimezone } from "@/lib/dates";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  calculateGoalTargets,
  type ActivityLevel,
  type GoalType,
  type Sex,
} from "@/lib/calorieCalculator";

interface Profile {
  sex: Sex | null;
  age: number | null;
  height_cm: number | null;
  activity_level: ActivityLevel | null;
  goal_type: GoalType | null;
}

export function GoalCalculator({
  userId,
  timezone,
  weightUnit,
  profile,
  latestWeight,
}: {
  userId: string;
  timezone: string;
  weightUnit: string;
  profile: Profile;
  latestWeight: number | null;
}) {
  const router = useRouter();
  const [sex, setSex] = useState<Sex>(profile.sex ?? "male");
  const [age, setAge] = useState(String(profile.age ?? ""));
  const [heightCm, setHeightCm] = useState(String(profile.height_cm ?? ""));
  const [weight, setWeight] = useState(String(latestWeight ?? ""));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    profile.activity_level ?? "sedentary",
  );
  const [goalType, setGoalType] = useState<GoalType>(
    profile.goal_type ?? "maintain",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weightKg = useMemo(() => {
    const value = Number(weight);
    if (!value) return null;
    return weightUnit === "lb" ? value * 0.453592 : value;
  }, [weight, weightUnit]);

  const targets = useMemo(() => {
    const ageNum = Number(age);
    const heightNum = Number(heightCm);
    if (!ageNum || !heightNum || !weightKg) return null;

    return calculateGoalTargets({
      sex,
      age: ageNum,
      heightCm: heightNum,
      weightKg,
      activityLevel,
      goalType,
    });
  }, [sex, age, heightCm, weightKg, activityLevel, goalType]);

  async function handleSave() {
    if (!targets) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const today = todayInTimezone(timezone);

    const [settingsRes, goalsRes, weightRes] = await Promise.all([
      supabase
        .from("user_settings")
        .update({
          age: Number(age),
          height_cm: Number(heightCm),
          sex,
          activity_level: activityLevel,
          goal_type: goalType,
        })
        .eq("user_id", userId),
      supabase.from("daily_goals").upsert(
        {
          user_id: userId,
          effective_date: today,
          calorie_goal: targets.calorieGoal,
          protein_goal_g: targets.proteinG,
          carbs_goal_g: targets.carbsG,
          fat_goal_g: targets.fatG,
        },
        { onConflict: "user_id,effective_date" },
      ),
      supabase.from("weight_logs").upsert(
        {
          user_id: userId,
          logged_date: today,
          weight: Number(weight),
          unit: weightUnit,
        },
        { onConflict: "user_id,logged_date" },
      ),
    ]);

    setSaving(false);

    if (settingsRes.error || goalsRes.error || weightRes.error) {
      setError("Couldn't save. Please try again.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <div>
        <h2 className="text-sm font-semibold">Goal calculator</h2>
        <p className="text-xs text-ink-muted">
          Tell us about yourself and we&apos;ll estimate your daily calorie
          and macro targets.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm">Sex</label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
            className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm">Age</label>
          <input
            type="number"
            min={0}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Height (cm)</label>
          <input
            type="number"
            min={0}
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Weight ({weightUnit})</label>
          <input
            type="number"
            min={0}
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm">Activity level</label>
        <select
          value={activityLevel}
          onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
          className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
        >
          {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
            <option key={level} value={level}>
              {ACTIVITY_LABELS[level]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm">Goal</label>
        <select
          value={goalType}
          onChange={(e) => setGoalType(e.target.value as GoalType)}
          className="w-full rounded-lg border border-border bg-page px-3 py-2 text-ink-primary outline-none focus:border-accent"
        >
          {(Object.keys(GOAL_LABELS) as GoalType[]).map((goal) => (
            <option key={goal} value={goal}>
              {GOAL_LABELS[goal]}
            </option>
          ))}
        </select>
      </div>

      {targets && (
        <div className="rounded-xl bg-page p-4 text-sm">
          <p className="font-semibold">
            {targets.calorieGoal} kcal / day
          </p>
          <p className="text-xs text-ink-muted">
            BMR {targets.bmr} kcal · Maintenance (TDEE) {targets.tdee} kcal
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-medium">{targets.proteinG}g</p>
              <p className="text-xs text-ink-muted">Protein</p>
            </div>
            <div>
              <p className="font-medium">{targets.carbsG}g</p>
              <p className="text-xs text-ink-muted">Carbs</p>
            </div>
            <div>
              <p className="font-medium">{targets.fatG}g</p>
              <p className="text-xs text-ink-muted">Fat</p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-status-critical">{error}</p>}

      <button
        onClick={handleSave}
        disabled={!targets || saving}
        className="w-full rounded-lg bg-ink-primary px-3 py-2.5 text-sm font-medium text-page transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "Saved - goals updated" : "Use these goals"}
      </button>
    </div>
  );
}
