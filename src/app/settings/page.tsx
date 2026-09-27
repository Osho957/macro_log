import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/SettingsForm";
import { SignOutButton } from "@/components/SignOutButton";
import { todayInTimezone } from "@/lib/dates";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("user_settings")
    .select("timezone, weight_unit")
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

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Settings</h1>
        <SignOutButton />
      </div>

      <SettingsForm
        userId={user!.id}
        timezone={timezone}
        weightUnit={settings?.weight_unit ?? "kg"}
        goals={goals ?? null}
      />
    </main>
  );
}
