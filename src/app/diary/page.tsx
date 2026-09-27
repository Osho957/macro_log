import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addDays, formatDisplayDate, todayInTimezone } from "@/lib/dates";
import { DeleteEntryButton } from "@/components/DeleteEntryButton";

export default async function DiaryPage({
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
    .select("timezone")
    .eq("user_id", user!.id)
    .maybeSingle();

  const today = todayInTimezone(settings?.timezone ?? "UTC");
  const { date } = await searchParams;
  const selectedDate = date ?? today;

  const { data: entries } = await supabase
    .from("log_entries")
    .select(
      "id, quantity, unit, calories, protein_g, carbs_g, fat_g, meals(name), foods(name, brand)",
    )
    .eq("logged_date", selectedDate)
    .order("created_at");

  const totalCalories = (entries ?? []).reduce(
    (sum, e) => sum + Number(e.calories ?? 0),
    0,
  );

  const entriesByMeal = new Map<string, typeof entries>();
  for (const entry of entries ?? []) {
    const mealName =
      (entry.meals as unknown as { name: string } | null)?.name ?? "Other";
    if (!entriesByMeal.has(mealName)) entriesByMeal.set(mealName, []);
    entriesByMeal.get(mealName)!.push(entry);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-xl font-semibold">Diary</h1>

      <div className="flex items-center justify-between">
        <Link
          href={`/diary?date=${addDays(selectedDate, -1)}`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          ← Prev
        </Link>
        <div className="text-center">
          <p className="text-sm font-medium">
            {formatDisplayDate(selectedDate)}
          </p>
          {selectedDate !== today && (
            <Link
              href="/diary"
              className="text-xs text-ink-muted underline"
            >
              Jump to today
            </Link>
          )}
        </div>
        <Link
          href={`/diary?date=${addDays(selectedDate, 1)}`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          Next →
        </Link>
      </div>

      <p className="text-sm text-ink-muted">
        {Math.round(totalCalories)} kcal total
      </p>

      <div className="space-y-4">
        {entriesByMeal.size === 0 && (
          <p className="text-sm text-ink-muted">
            Nothing logged on this day.
          </p>
        )}

        {Array.from(entriesByMeal.entries()).map(([mealName, mealEntries]) => (
          <div key={mealName}>
            <h2 className="mb-1 text-sm font-semibold">{mealName}</h2>
            <ul className="divide-y divide-border">
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
                      <span className="text-ink-muted">
                        ({entry.quantity} {entry.unit})
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-ink-muted">
                        {Math.round(Number(entry.calories))} kcal
                      </span>
                      <DeleteEntryButton entryId={entry.id} />
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
