import { Zap } from "lucide-react";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getTodayFast } from "@/lib/supabase/queries";
import { AppHeader } from "@/components/AppHeader";
import { WeeklyCalorieChart } from "@/components/WeeklyCalorieChart";
import { MacroDonutChart } from "@/components/MacroDonutChart";
import { WeightTrendMini } from "@/components/WeightTrendMini";
import { addDays } from "@/lib/dates";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default async function TrendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getAuthUser();

  const today = await getTodayFast(user!.id);
  const startDate = addDays(today, -6);

  const [{ data: entries }, { data: goals }, { data: weightLogs }] =
    await Promise.all([
      supabase
        .from("log_entries")
        .select("logged_date, calories, protein_g, carbs_g, fat_g")
        .gte("logged_date", startDate)
        .lte("logged_date", today),
      supabase
        .from("daily_goals")
        .select("calorie_goal")
        .lte("effective_date", today)
        .order("effective_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("weight_logs")
        .select("logged_date, weight, unit")
        .gte("logged_date", startDate)
        .lte("logged_date", today)
        .order("logged_date"),
    ]);

  const dateRange = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const totalsByDate = new Map<
    string,
    { calories: number; protein: number; carbs: number; fat: number }
  >();
  for (const entry of entries ?? []) {
    const existing = totalsByDate.get(entry.logged_date) ?? {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };
    existing.calories += Number(entry.calories ?? 0);
    existing.protein += Number(entry.protein_g ?? 0);
    existing.carbs += Number(entry.carbs_g ?? 0);
    existing.fat += Number(entry.fat_g ?? 0);
    totalsByDate.set(entry.logged_date, existing);
  }

  const chartDays = dateRange.map((date) => {
    const dow = new Date(date + "T00:00:00").getDay();
    const isToday = date === today;
    return {
      label: isToday ? "Today" : DAY_LABELS[dow],
      calories: totalsByDate.get(date)?.calories ?? 0,
    };
  });

  const daysLogged = dateRange.filter((d) => totalsByDate.has(d));
  const avgProtein =
    daysLogged.reduce((s, d) => s + (totalsByDate.get(d)?.protein ?? 0), 0) /
    (daysLogged.length || 1);
  const avgCarbs =
    daysLogged.reduce((s, d) => s + (totalsByDate.get(d)?.carbs ?? 0), 0) /
    (daysLogged.length || 1);
  const avgFat =
    daysLogged.reduce((s, d) => s + (totalsByDate.get(d)?.fat ?? 0), 0) /
    (daysLogged.length || 1);

  const avgCalories =
    daysLogged.reduce((s, d) => s + (totalsByDate.get(d)?.calories ?? 0), 0) /
    (daysLogged.length || 1);
  const avgDeficit = goals ? Math.round(avgCalories - goals.calorie_goal) : null;

  const weightByDate = new Map(
    (weightLogs ?? []).map((w) => [w.logged_date, w.weight]),
  );
  const weightDays = dateRange.map((date) => {
    const dow = new Date(date + "T00:00:00").getDay();
    return {
      label: date === today ? "Today" : DAY_LABELS[dow],
      weight: weightByDate.get(date) ?? null,
    };
  });
  const latestWeight = [...(weightLogs ?? [])].reverse()[0];
  const firstWeight = (weightLogs ?? [])[0];
  const weightDelta =
    latestWeight && firstWeight && latestWeight.logged_date !== firstWeight.logged_date
      ? Math.round((Number(latestWeight.weight) - Number(firstWeight.weight)) * 10) / 10
      : null;

  const streak = daysLogged.length;

  return (
    <>
      <AppHeader title="Nutrition Analytics" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-4">
        <div className="flex items-center justify-between rounded-2xl border border-accent/30 bg-gradient-to-r from-accent-soft to-transparent p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-page shadow-lg shadow-accent/30">
              <Zap className="h-5 w-5 fill-page" />
            </div>
            <div>
              <span className="block text-xs font-bold text-ink-primary">
                {streak}-Day Logging Streak!
              </span>
              <p className="text-[11px] text-accent">
                Last 7 days tracked: {daysLogged.length}/7
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-ink-primary">
                Weekly Calorie Deficit/Surplus
              </h3>
              <p className="text-[11px] text-ink-muted">
                Target: {goals ? `${goals.calorie_goal.toLocaleString()} kcal/day` : "No goal set"}
              </p>
            </div>
            {avgDeficit != null && (
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
                  avgDeficit <= 0
                    ? "border-accent/20 bg-accent-soft text-accent"
                    : "border-status-warning/30 bg-status-warning/10 text-status-warning"
                }`}
              >
                {avgDeficit > 0 ? "+" : ""}
                {avgDeficit} avg
              </span>
            )}
          </div>

          <div className="pt-2">
            <WeeklyCalorieChart days={chartDays} goal={goals?.calorie_goal ?? null} />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <h3 className="text-xs font-bold text-ink-primary">
            Macro Ratio Balance (Last 7 Days)
          </h3>

          <div className="flex items-center justify-between">
            <MacroDonutChart protein={avgProtein} carbs={avgCarbs} fat={avgFat} />

            <div className="flex-1 space-y-2 pl-4 text-xs">
              <LegendRow color="protein" label="Protein" grams={avgProtein} total={avgProtein + avgCarbs + avgFat} />
              <LegendRow color="carbs" label="Carbs" grams={avgCarbs} total={avgProtein + avgCarbs + avgFat} />
              <LegendRow color="fat" label="Fats" grams={avgFat} total={avgProtein + avgCarbs + avgFat} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-ink-primary">
                Weight Trend
              </span>
              <p className="text-[11px] text-ink-muted">
                Logged {(weightLogs ?? []).length} times this week
              </p>
            </div>
            <div className="text-right">
              <span className="block text-sm font-black text-ink-primary">
                {latestWeight ? `${latestWeight.weight} ${latestWeight.unit}` : "-"}
              </span>
              {weightDelta != null && (
                <span
                  className={`block text-[10px] font-semibold ${
                    weightDelta <= 0 ? "text-accent" : "text-status-warning"
                  }`}
                >
                  {weightDelta > 0 ? "+" : ""}
                  {weightDelta} kg this week
                </span>
              )}
            </div>
          </div>

          <WeightTrendMini days={weightDays} />
        </div>
      </main>
    </>
  );
}

const LEGEND_DOT_CLASSES = {
  protein: "bg-protein",
  carbs: "bg-carbs",
  fat: "bg-fat",
} as const;

function LegendRow({
  color,
  label,
  grams,
  total,
}: {
  color: "protein" | "carbs" | "fat";
  label: string;
  grams: number;
  total: number;
}) {
  const pct = total ? Math.round((grams / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${LEGEND_DOT_CLASSES[color]}`}
        />
        <span className="text-ink-secondary">{label}</span>
      </div>
      <span className="font-bold text-ink-primary">
        {Math.round(grams)}g avg ({pct}%)
      </span>
    </div>
  );
}
