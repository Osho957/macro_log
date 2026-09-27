import type { SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedFood } from "@/types/food";

/**
 * Scales a nutrient value (given per `servingSize`, e.g. per 100g) by the
 * actual amount consumed, in the same unit as servingSize.
 */
export function scaleNutrient(
  value: number | null,
  amount: number,
  servingSize: number,
): number | null {
  if (value == null) return null;
  if (!servingSize) return null;
  return Math.round(value * (amount / servingSize) * 100) / 100;
}

/** Formats a macro gram value to at most 1 decimal place for display
 * (external food APIs often return long floats like 8.3333333333333). */
export function formatMacro(value: number | null): string {
  if (value == null) return "0";
  const rounded = Math.round(value * 10) / 10;
  return String(rounded);
}

/** Stable, deterministic id for a custom food so re-adding the same name
 * (by trimmed, case-insensitive match) updates the existing row instead of
 * creating a duplicate. */
function slugifyCustomFoodName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Ensures a food exists in the user's personal `foods` library (inserting it
 * if this is the first time they've used this USDA/OFF/custom item), then
 * logs a diary entry against it with macros snapshotted at the chosen
 * quantity so later edits to the food don't rewrite diary history.
 */
export async function logFood(
  supabase: SupabaseClient,
  args: {
    userId: string;
    food: NormalizedFood;
    mealId: string;
    loggedDate: string;
    /** Amount consumed, in the same unit as food.servingUnit (e.g. grams). */
    amount: number;
  },
) {
  const { userId, food, mealId, loggedDate, amount } = args;

  const externalId =
    food.source === "custom"
      ? slugifyCustomFoodName(food.name)
      : food.externalId;

  const { data, error } = await supabase
    .from("foods")
    .upsert(
      {
        user_id: userId,
        source: food.source,
        external_id: externalId,
        name: food.name,
        brand: food.brand,
        serving_size: food.servingSize,
        serving_unit: food.servingUnit,
        calories: food.calories,
        protein_g: food.proteinG,
        carbs_g: food.carbsG,
        fat_g: food.fatG,
        fiber_g: food.fiberG,
        sugar_g: food.sugarG,
        sodium_mg: food.sodiumMg,
        barcode: food.barcode,
        last_logged_at: new Date().toISOString(),
      },
      { onConflict: "user_id,source,external_id" },
    )
    .select("id")
    .single();

  if (error) throw error;
  const foodId = data.id;

  const { error: logError } = await supabase.from("log_entries").insert({
    user_id: userId,
    food_id: foodId,
    meal_id: mealId,
    logged_date: loggedDate,
    quantity: amount,
    unit: food.servingUnit,
    calories: scaleNutrient(food.calories, amount, food.servingSize),
    protein_g: scaleNutrient(food.proteinG, amount, food.servingSize),
    carbs_g: scaleNutrient(food.carbsG, amount, food.servingSize),
    fat_g: scaleNutrient(food.fatG, amount, food.servingSize),
    food_name: food.name,
    food_brand: food.brand,
  });

  if (logError) throw logError;
}
