import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/SettingsForm";
import { WeightTracker } from "@/components/WeightTracker";
import { GoalCalculator } from "@/components/GoalCalculator";
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
      "timezone, weight_unit, age, height_cm, sex, activity_level, goal_type",
    )
    .eq("user_id", user!.id)
    .maybeSingle();

  const timezone = settings?.timezone ?? "UTC";
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

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Settings</h1>
        <SignOutButton />
      </div>

      <GoalCalculator
        userId={user!.id}
        timezone={timezone}
        weightUnit={settings?.weight_unit ?? "kg"}
        profile={{
          sex: settings?.sex ?? null,
          age: settings?.age ?? null,
          height_cm: settings?.height_cm ?? null,
          activity_level: settings?.activity_level ?? null,
          goal_type: settings?.goal_type ?? null,
        }}
        latestWeight={weightLogs?.[0]?.weight ?? null}
      />

      <SettingsForm
        userId={user!.id}
        timezone={timezone}
        weightUnit={settings?.weight_unit ?? "kg"}
        goals={goals ?? null}
      />

      <WeightTracker
        userId={user!.id}
        timezone={timezone}
        unit={settings?.weight_unit ?? "kg"}
        recentLogs={weightLogs ?? []}
      />
    </main>
  );
}
