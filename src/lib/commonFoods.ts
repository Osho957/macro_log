import type { SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedFood } from "@/types/food";

export async function searchCommonFoods(
  supabase: SupabaseClient,
  query: string,
): Promise<NormalizedFood[]> {
  const { data, error } = await supabase
    .from("common_foods")
    .select(
      "id, name, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg",
    )
    .ilike("name", `%${query}%`)
    .limit(15);

  if (error) throw error;

  return (data ?? []).map((f) => ({
    source: "common" as const,
    externalId: f.id,
    name: f.name,
    brand: null,
    servingSize: f.serving_size,
    servingUnit: f.serving_unit,
    calories: f.calories,
    proteinG: f.protein_g,
    carbsG: f.carbs_g,
    fatG: f.fat_g,
    fiberG: f.fiber_g,
    sugarG: f.sugar_g,
    sodiumMg: f.sodium_mg,
    barcode: null,
  }));
}
