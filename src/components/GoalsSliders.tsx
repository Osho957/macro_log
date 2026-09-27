"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingDown, Anchor, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayInTimezone } from "@/lib/dates";
import {
  ACTIVITY_MULTIPLIERS,
  calculateBmr,
  type ActivityLevel,
  type GoalType,
  type Sex,
} from "@/lib/calorieCalculator";

interface Profile {
  sex: Sex | null;
  age: number | null;
  height_cm: number | null;
  activity_level: ActivityLevel | null;
}

const GOAL_PILLS: { value: GoalType; label: string; Icon: typeof TrendingDown }[] = [
  { value: "lose", label: "Cut (Fat Loss)", Icon: TrendingDown },
  { value: "maintain", label: "Maintain", Icon: Anchor },
  { value: "gain", label: "Lean Bulk", Icon: TrendingUp },
];

export function GoalsSliders({
  userId,
  timezone,
  weightUnit,
  profile,
  latestWeight,
  initialCalorieGoal,
  initialMacros,
}: {
  userId: string;
  timezone: string;
  weightUnit: string;
  profile: Profile;
  latestWeight: number | null;
  initialCalorieGoal: number | null;
  initialMacros: { protein: number; carbs: number; fat: number } | null;
}) {
  const router = useRouter();
  const [goalType, setGoalType] = useState<GoalType>("maintain");
  const [calorieTarget, setCalorieTarget] = useState(
    initialCalorieGoal ?? 2300,
  );

  const weightKg =
    latestWeight != null
      ? weightUnit === "lb"
        ? latestWeight * 0.453592
        : latestWeight
      : null;

  const bmr =
    weightKg && profile.age && profile.height_cm && profile.sex
      ? calculateBmr({
          sex: profile.sex,
          age: profile.age,
          heightCm: profile.height_cm,
          weightKg,
          activityLevel: profile.activity_level ?? "sedentary",
          goalType,
        })
      : null;
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activity_level ?? "sedentary"];

  const initialTotal = initialMacros
    ? initialMacros.protein * 4 + initialMacros.carbs * 4 + initialMacros.fat * 9
    : null;

  const [proteinPct, setProteinPct] = useState(
    initialTotal ? Math.round(((initialMacros!.protein * 4) / initialTotal) * 100) : 30,
  );
  const [carbsPct, setCarbsPct] = useState(
    initialTotal ? Math.round(((initialMacros!.carbs * 4) / initialTotal) * 100) : 45,
  );
  const [fatPct, setFatPct] = useState(
    initialTotal ? 100 - proteinPct - carbsPct : 25,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleProteinChange(value: number) {
    const remaining = 100 - value;
    const ratio = carbsPct + fatPct || 1;
    setProteinPct(value);
    setCarbsPct(Math.round((carbsPct / ratio) * remaining));
    setFatPct(remaining - Math.round((carbsPct / ratio) * remaining));
  }

  function handleCarbsChange(value: number) {
    const remaining = 100 - value;
    const ratio = proteinPct + fatPct || 1;
    setCarbsPct(value);
    setProteinPct(Math.round((proteinPct / ratio) * remaining));
    setFatPct(remaining - Math.round((proteinPct / ratio) * remaining));
  }

  function handleFatChange(value: number) {
    const remaining = 100 - value;
    const ratio = proteinPct + carbsPct || 1;
    setFatPct(value);
    setProteinPct(Math.round((proteinPct / ratio) * remaining));
    setCarbsPct(remaining - Math.round((proteinPct / ratio) * remaining));
  }

  const proteinG = Math.round((calorieTarget * (proteinPct / 100)) / 4);
  const carbsG = Math.round((calorieTarget * (carbsPct / 100)) / 4);
  const fatG = Math.round((calorieTarget * (fatPct / 100)) / 9);
  const sumPct = proteinPct + carbsPct + fatPct;

  const waterTargetMl = useMemo(
    () => (weightKg ? Math.round(weightKg * 35) : 3000),
    [weightKg],
  );

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const supabase = createClient();
    const today = todayInTimezone(timezone);

    const [goalsRes, settingsRes] = await Promise.all([
      supabase.from("daily_goals").upsert(
        {
          user_id: userId,
          effective_date: today,
          calorie_goal: calorieTarget,
          protein_goal_g: proteinG,
          carbs_goal_g: carbsG,
          fat_goal_g: fatG,
        },
        { onConflict: "user_id,effective_date" },
      ),
      supabase
        .from("user_settings")
        .update({ goal_type: goalType, water_goal_ml: waterTargetMl })
        .eq("user_id", userId),
    ]);

    setSaving(false);

    if (goalsRes.error || settingsRes.error) {
      setError(
        goalsRes.error?.message ??
          settingsRes.error?.message ??
          "Couldn't save. Please try again.",
      );
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
            Primary Goal
          </h3>
          <span className="rounded-full border border-accent/20 bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
            Customized
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {GOAL_PILLS.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setGoalType(value)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center text-xs font-bold transition ${
                goalType === value
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border bg-page text-ink-muted hover:text-ink-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs">
            <span className="text-ink-muted">Daily Calorie Target:</span>
            <span className="text-sm font-bold text-accent">
              {calorieTarget.toLocaleString()} kcal
            </span>
          </div>
          <input
            type="range"
            min={1400}
            max={3500}
            step={50}
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-[10px] text-ink-muted">
            <span>1,400 (Aggressive Deficit)</span>
            <span>3,500 (Heavy Mass)</span>
          </div>
        </div>
      </div>

      <div className="space-y-3.5 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
            Macro Split Ratio
          </h3>
          <span className="font-mono text-xs font-bold text-accent">
            Total: {sumPct}%
          </span>
        </div>

        <MacroSlider
          label="Protein"
          colorClass="text-protein"
          accentClass="accent-protein"
          value={proteinPct}
          grams={proteinG}
          onChange={handleProteinChange}
          min={15}
          max={50}
        />
        <MacroSlider
          label="Carbs"
          colorClass="text-carbs"
          accentClass="accent-carbs"
          value={carbsPct}
          grams={carbsG}
          onChange={handleCarbsChange}
          min={20}
          max={65}
        />
        <MacroSlider
          label="Fats"
          colorClass="text-fat"
          accentClass="accent-fat"
          value={fatPct}
          grams={fatG}
          onChange={handleFatChange}
          min={15}
          max={45}
        />

        {error && <p className="text-xs text-status-critical">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-2 w-full rounded-xl border border-accent/20 bg-page py-2 text-xs font-bold text-accent transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Target Preset"}
        </button>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
          Biometrics Baseline
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <BaselineCell
            label="Height / Current Wt"
            value={
              profile.height_cm && latestWeight
                ? `${profile.height_cm} cm / ${latestWeight} ${weightUnit}`
                : "Set in profile"
            }
          />
          <BaselineCell
            label="Calculated BMR"
            value={bmr ? `${bmr} kcal/day` : "-"}
          />
          <BaselineCell
            label="Activity Multiplier"
            value={`${multiplier}x`}
            accent
          />
          <BaselineCell
            label="Water Target"
            value={`${waterTargetMl.toLocaleString()} ml`}
            water
          />
        </div>
      </div>
    </div>
  );
}

function MacroSlider({
  label,
  colorClass,
  accentClass,
  value,
  grams,
  onChange,
  min,
  max,
}: {
  label: string;
  colorClass: string;
  accentClass: string;
  value: number;
  grams: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={`flex items-center gap-1 font-semibold ${colorClass}`}>
          {label}: {value}%
        </span>
        <span className="font-mono font-bold text-ink-secondary">{grams}g</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full ${accentClass}`}
      />
    </div>
  );
}

function BaselineCell({
  label,
  value,
  accent,
  water,
}: {
  label: string;
  value: string;
  accent?: boolean;
  water?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-page p-2.5">
      <span className="block text-[10px] text-ink-muted">{label}</span>
      <span
        className={`font-bold ${
          water ? "text-water" : accent ? "text-accent" : "text-ink-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
