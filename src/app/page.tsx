import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, Coffee, Sun, Moon, Apple } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroRing } from "@/components/MacroRing";
import { WaterTracker } from "@/components/WaterTracker";
import { DeleteEntryButton } from "@/components/DeleteEntryButton";
import { addDays, formatDisplayDate, todayInTimezone } from "@/lib/dates";

const MEAL_ICONS: Record<string, typeof Coffee> = {
  Breakfast: Coffee,
  Lunch: Sun,
  Dinner: Moon,
  Snacks: Apple,
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
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
  const { date } = await searchParams;
  const selectedDate = date ?? today;
  const isToday = selectedDate === today;

  const [{ data: entries }, { data: goals }, { data: meals }, { data: waterLog }] =
    await Promise.all([
      supabase
        .from("log_entries")
        .select(
          "id, quantity, unit, calories, protein_g, carbs_g, fat_g, meal_id, meals(name), foods(name, brand)",
        )
        .eq("logged_date", selectedDate)
        .order("created_at"),
      supabase
        .from("daily_goals")
        .select("calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g")
        .lte("effective_date", selectedDate)
        .order("effective_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("meals").select("id, name").order("sort_order"),
      isToday
        ? supabase
            .from("water_logs")
            .select("amount_ml")
            .eq("logged_date", today)
            .maybeSingle()
        : Promise.resolve({ data: null }),
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

  const remaining = goals
    ? Math.max(0, goals.calorie_goal - totals.calories)
    : null;

  const entriesByMeal = new Map<
    string,
    { mealId: string | null; entries: NonNullable<typeof entries> }
  >();
  for (const meal of meals ?? []) {
    entriesByMeal.set(meal.name, { mealId: meal.id, entries: [] });
  }
  for (const entry of entries ?? []) {
    const mealName =
      (entry.meals as unknown as { name: string } | null)?.name ?? "Other";
    if (!entriesByMeal.has(mealName)) {
      entriesByMeal.set(mealName, { mealId: entry.meal_id, entries: [] });
    }
    entriesByMeal.get(mealName)!.entries.push(entry);
  }

  return (
    <>
      <AppHeader title="Today's Diary" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-4">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-2 text-xs">
        <Link
          href={`/?date=${addDays(selectedDate, -1)}`}
          className="p-1 text-ink-muted transition-colors hover:text-accent active:scale-90"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-1.5 font-semibold text-ink-secondary">
          <Calendar className="h-3.5 w-3.5 text-accent" />
          {isToday
            ? `Today, ${formatDisplayDate(selectedDate)}`
            : formatDisplayDate(selectedDate)}
        </div>
        <Link
          href={`/?date=${addDays(selectedDate, 1)}`}
          className="p-1 text-ink-muted transition-colors hover:text-accent active:scale-90"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
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

          <CalorieRing
            consumed={totals.calories}
            goal={goals?.calorie_goal ?? null}
          />
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

      {isToday && (
        <WaterTracker
          userId={user!.id}
          timezone={settings?.timezone ?? "UTC"}
          goalMl={settings?.water_goal_ml ?? 3000}
          initialAmountMl={waterLog?.amount_ml ?? 0}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
          Meal logs
        </h2>
        <Link
          href="/log"
          className="flex items-center gap-1 text-xs font-semibold text-accent"
        >
          + Log food
        </Link>
      </div>

      <div className="space-y-3">
        {Array.from(entriesByMeal.entries()).map(([mealName, group]) => {
          const mealCalories = group.entries.reduce(
            (sum, e) => sum + Number(e.calories ?? 0),
            0,
          );
          const MealIcon = MEAL_ICONS[mealName] ?? Apple;
          return (
            <div
              key={mealName}
              className="overflow-hidden rounded-2xl border border-border bg-surface p-3.5"
            >
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-bold text-ink-primary">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <MealIcon className="h-3.5 w-3.5" />
                  </span>
                  {mealName}{" "}
                  <span className="font-normal text-ink-muted">
                    ({Math.round(mealCalories)} kcal)
                  </span>
                </h3>
                <Link
                  href={group.mealId ? `/log?meal=${group.mealId}` : "/log"}
                  className="rounded-lg bg-page px-2 py-1 text-[11px] font-semibold text-accent"
                >
                  + Add
                </Link>
              </div>

              {group.entries.length === 0 ? (
                <p className="py-1.5 text-[11px] italic text-ink-muted">
                  No items logged yet
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {group.entries.map((entry) => {
                    const food = entry.foods as unknown as {
                      name: string;
                      brand: string | null;
                    } | null;
                    return (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span className="text-ink-primary">
                          {food?.name ?? "Deleted food"}{" "}
                          <span className="text-ink-muted">
                            ({entry.quantity} {entry.unit})
                          </span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="font-medium text-ink-secondary">
                            {Math.round(Number(entry.calories))} kcal
                          </span>
                          <DeleteEntryButton entryId={entry.id} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      </main>
    </>
  );
}
