import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroRing } from "@/components/MacroRing";
import { WaterTracker } from "@/components/WaterTracker";
import { todayInTimezone } from "@/lib/dates";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("user_settings")
    .select("timezone, water_goal_ml")
    .eq("user_id", user!.id)
    .maybeSingle();

  const today = todayInTimezone(settings?.timezone ?? "UTC");

  const [{ data: entries }, { data: goals }, { data: waterLog }] =
    await Promise.all([
      supabase
        .from("log_entries")
        .select(
          "id, quantity, unit, calories, protein_g, carbs_g, fat_g, meals(name), foods(name, brand)",
        )
        .eq("logged_date", today)
        .order("created_at"),
      supabase
        .from("daily_goals")
        .select("calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g")
        .lte("effective_date", today)
        .order("effective_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("water_logs")
        .select("amount_ml")
        .eq("logged_date", today)
        .maybeSingle(),
    ]);

  const totals = (entries ?? []).reduce(
    (acc, e) => ({
      calories: acc.calories + Number(e.calories ?? 0),
      protein: acc.protein + Number(e.protein_g ?? 0),
      carbs: acc.carbs + Number(e.carbs_g ?? 0),
      fat: acc.fat + Number(e.fat_g ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const remaining = goals ? Math.max(0, goals.calorie_goal - totals.calories) : null;

  const entriesByMeal = new Map<string, typeof entries>();
  for (const entry of entries ?? []) {
    const mealName =
      (entry.meals as unknown as { name: string } | null)?.name ?? "Other";
    if (!entriesByMeal.has(mealName)) entriesByMeal.set(mealName, []);
    entriesByMeal.get(mealName)!.push(entry);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Calorie Tracker
          </p>
          <h1 className="text-sm font-bold text-ink-primary">
            Today&apos;s Diary
          </h1>
        </div>
        <SignOutButton />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-surface to-page p-5 shadow-sm">
        <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {remaining != null ? "Calories remaining" : "Calories eaten"}
            </p>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight text-ink-primary">
                {remaining != null ? remaining : Math.round(totals.calories)}
              </span>
              <span className="text-xs text-ink-muted">
                {remaining != null ? "kcal left" : "kcal"}
              </span>
            </div>
          </div>

          <CalorieRing consumed={totals.calories} goal={goals?.calorie_goal ?? null} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 text-center">
          <div className="rounded-xl bg-page/60 px-2 py-1.5">
            <span className="block text-[10px] text-ink-muted">Goal</span>
            <span className="text-xs font-bold text-ink-primary">
              {goals ? goals.calorie_goal.toLocaleString() : "-"}
            </span>
          </div>
          <div className="rounded-xl bg-page/60 px-2 py-1.5">
            <span className="block text-[10px] text-ink-muted">Food</span>
            <span className="text-xs font-bold text-accent">
              {Math.round(totals.calories).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5">
        <MacroRing
          label="Protein"
          color="protein"
          value={totals.protein}
          goal={goals?.protein_goal_g}
        />
        <MacroRing
          label="Carbs"
          color="carbs"
          value={totals.carbs}
          goal={goals?.carbs_goal_g}
        />
        <MacroRing
          label="Fat"
          color="fat"
          value={totals.fat}
          goal={goals?.fat_goal_g}
        />
      </div>

      <WaterTracker
        userId={user!.id}
        timezone={settings?.timezone ?? "UTC"}
        goalMl={settings?.water_goal_ml ?? 3000}
        initialAmountMl={waterLog?.amount_ml ?? 0}
      />

      <Link
        href="/log"
        className="rounded-xl bg-accent px-4 py-3 text-center text-sm font-bold text-page shadow-sm shadow-accent/20 transition-opacity hover:opacity-90"
      >
        + Log food
      </Link>

      <div className="space-y-4">
        {entriesByMeal.size === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-ink-muted">
            Nothing logged yet today.
          </p>
        )}

        {Array.from(entriesByMeal.entries()).map(([mealName, mealEntries]) => (
          <div
            key={mealName}
            className="overflow-hidden rounded-2xl border border-border bg-surface"
          >
            <h2 className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {mealName}
            </h2>
            <ul className="divide-y divide-border">
              {mealEntries!.map((entry) => {
                const food = entry.foods as unknown as {
                  name: string;
                  brand: string | null;
                } | null;
                return (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="text-ink-primary">
                      {food?.name ?? "Deleted food"}{" "}
                      <span className="text-ink-muted">
                        ({entry.quantity} {entry.unit})
                      </span>
                    </span>
                    <span className="font-medium text-ink-secondary">
                      {Math.round(Number(entry.calories))} kcal
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
