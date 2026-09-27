import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { GoalsSliders } from "@/components/GoalsSliders";
import { GoalCalculator } from "@/components/GoalCalculator";
import { SettingsForm } from "@/components/SettingsForm";
import { WeightTracker } from "@/components/WeightTracker";
import { SignOutButton } from "@/components/SignOutButton";
import { todayInTimezone } from "@/lib/dates";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("user_settings")
    .select(
      "timezone, weight_unit, age, height_cm, sex, activity_level, goal_type, water_goal_ml",
    )
    .eq("user_id", user!.id)
    .maybeSingle();

  const timezone = settings?.timezone ?? "UTC";
  const weightUnit = settings?.weight_unit ?? "kg";
  const today = todayInTimezone(timezone);

  const { data: goals } = await supabase
    .from("daily_goals")
    .select("calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g")
    .lte("effective_date", today)
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: weightLogs } = await supabase
    .from("weight_logs")
    .select("id, logged_date, weight, unit")
    .order("logged_date", { ascending: false })
    .limit(10);

  const profile = {
    sex: settings?.sex ?? null,
    age: settings?.age ?? null,
    height_cm: settings?.height_cm ?? null,
    activity_level: settings?.activity_level ?? null,
    goal_type: settings?.goal_type ?? null,
  };
  const latestWeight = weightLogs?.[0]?.weight ?? null;

  return (
    <>
      <AppHeader title="Target & Macro Split" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-4">
        <GoalsSliders
          userId={user!.id}
          timezone={timezone}
          weightUnit={weightUnit}
          profile={profile}
          latestWeight={latestWeight}
          initialCalorieGoal={goals?.calorie_goal ?? null}
          initialMacros={
            goals
              ? {
                  protein: goals.protein_goal_g ?? 0,
                  carbs: goals.carbs_goal_g ?? 0,
                  fat: goals.fat_goal_g ?? 0,
                }
              : null
          }
        />

        <GoalCalculator
          userId={user!.id}
          timezone={timezone}
          weightUnit={weightUnit}
          profile={profile}
          latestWeight={latestWeight}
        />

        <WeightTracker
          userId={user!.id}
          timezone={timezone}
          unit={weightUnit}
          recentLogs={weightLogs ?? []}
        />

        <SettingsForm
          userId={user!.id}
          timezone={timezone}
          weightUnit={weightUnit}
        />

        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
          <Link href="/library" className="text-sm font-semibold text-accent">
            Food Library
          </Link>
          <SignOutButton />
        </div>
      </main>
    </>
  );
}
