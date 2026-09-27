import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import { todayInTimezone } from "@/lib/dates";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("user_settings")
    .select("timezone")
    .eq("user_id", user!.id)
    .maybeSingle();

  const today = todayInTimezone(settings?.timezone ?? "UTC");

  const [{ data: entries }, { data: goals }] = await Promise.all([
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

  const entriesByMeal = new Map<string, typeof entries>();
  for (const entry of entries ?? []) {
    const mealName = (entry.meals as unknown as { name: string } | null)
      ?.name ?? "Other";
    if (!entriesByMeal.has(mealName)) entriesByMeal.set(mealName, []);
    entriesByMeal.get(mealName)!.push(entry);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Today</h1>
        <SignOutButton />
      </div>
      <p className="text-sm text-black/60 dark:text-white/60">
        Signed in as {user?.email}
      </p>

      <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <p className="text-2xl font-semibold">
          {Math.round(totals.calories)}
          {goals && (
            <span className="text-base font-normal text-black/50 dark:text-white/50">
              {" "}
              / {goals.calorie_goal} kcal
            </span>
          )}
          {!goals && (
            <span className="text-base font-normal text-black/50 dark:text-white/50">
              {" "}
              kcal
            </span>
          )}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <MacroStat
            label="Protein"
            value={totals.protein}
            goal={goals?.protein_goal_g}
          />
          <MacroStat
            label="Carbs"
            value={totals.carbs}
            goal={goals?.carbs_goal_g}
          />
          <MacroStat label="Fat" value={totals.fat} goal={goals?.fat_goal_g} />
        </div>
      </div>

      <Link
        href="/log"
        className="rounded-md bg-black px-3 py-2 text-center text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        + Log food
      </Link>

      <div className="space-y-4">
        {entriesByMeal.size === 0 && (
          <p className="text-sm text-black/60 dark:text-white/60">
            Nothing logged yet today.
          </p>
        )}

        {Array.from(entriesByMeal.entries()).map(([mealName, mealEntries]) => (
          <div key={mealName}>
            <h2 className="mb-1 text-sm font-semibold">{mealName}</h2>
            <ul className="divide-y divide-black/10 dark:divide-white/10">
              {mealEntries!.map((entry) => {
                const food = entry.foods as unknown as {
                  name: string;
                  brand: string | null;
                } | null;
                return (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span>
                      {food?.name ?? "Deleted food"}{" "}
                      <span className="text-black/50 dark:text-white/50">
                        ({entry.quantity} {entry.unit})
                      </span>
                    </span>
                    <span className="text-black/60 dark:text-white/60">
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

function MacroStat({
  label,
  value,
  goal,
}: {
  label: string;
  value: number;
  goal?: number | null;
}) {
  return (
    <div className="rounded-md bg-black/5 p-2 text-center dark:bg-white/10">
      <p className="font-medium">
        {Math.round(value)}g{goal ? ` / ${goal}g` : ""}
      </p>
      <p className="text-black/50 dark:text-white/50">{label}</p>
    </div>
  );
}
