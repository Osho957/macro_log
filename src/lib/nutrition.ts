import type { SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedFood } from "@/types/food";

/** Scales a per-serving nutrient value by how many servings were logged. */
export function scaleNutrient(
  value: number | null,
  quantity: number,
): number | null {
  if (value == null) return null;
  return Math.round(value * quantity * 100) / 100;
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
    quantity: number;
  },
) {
  const { userId, food, mealId, loggedDate, quantity } = args;

  let foodId: string;

  if (food.source === "custom") {
    const { data, error } = await supabase
      .from("foods")
      .insert({
        user_id: userId,
        source: food.source,
        external_id: null,
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
      })
      .select("id")
      .single();

    if (error) throw error;
    foodId = data.id;
  } else {
    const { data, error } = await supabase
      .from("foods")
      .upsert(
        {
          user_id: userId,
          source: food.source,
          external_id: food.externalId,
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
        },
        { onConflict: "user_id,source,external_id" },
      )
      .select("id")
      .single();

    if (error) throw error;
    foodId = data.id;
  }

  const { error: logError } = await supabase.from("log_entries").insert({
    user_id: userId,
    food_id: foodId,
    meal_id: mealId,
    logged_date: loggedDate,
    quantity,
    unit: food.servingUnit,
    calories: scaleNutrient(food.calories, quantity),
    protein_g: scaleNutrient(food.proteinG, quantity),
    carbs_g: scaleNutrient(food.carbsG, quantity),
    fat_g: scaleNutrient(food.fatG, quantity),
  });

  if (logError) throw logError;
}
