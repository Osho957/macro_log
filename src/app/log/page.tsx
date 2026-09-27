import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { LogFoodClient } from "@/components/LogFoodClient";

export default async function LogFoodPage({
  searchParams,
}: {
  searchParams: Promise<{ meal?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: meals }, { data: recentFoods }] = await Promise.all([
    supabase.from("meals").select("id, name").order("sort_order"),
    supabase
      .from("foods")
      .select(
        "id, source, external_id, name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, barcode",
      )
      .order("last_logged_at", { ascending: false })
      .limit(15),
  ]);

  const { meal } = await searchParams;

  return (
    <>
      <AppHeader title="Search & Log Food" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-4">
        <LogFoodClient
          userId={user!.id}
          meals={meals ?? []}
          defaultMealId={meal}
          recentFoods={(recentFoods ?? []).map((f) => ({
            id: f.id,
            source: f.source,
            externalId: f.external_id,
            name: f.name,
            brand: f.brand,
            servingSize: f.serving_size,
            servingUnit: f.serving_unit,
            calories: f.calories,
            proteinG: f.protein_g,
            carbsG: f.carbs_g,
            fatG: f.fat_g,
            fiberG: f.fiber_g,
            sugarG: f.sugar_g,
            sodiumMg: f.sodium_mg,
            barcode: f.barcode,
          }))}
        />
      </main>
    </>
  );
}
