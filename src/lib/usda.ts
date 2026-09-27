import type { NormalizedFood } from "@/types/food";

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

// FDC nutrient IDs for the macros we care about (per 100g / per Foundation-Legacy serving).
const NUTRIENT_IDS = {
  calories: 1008, // Energy (kcal)
  protein: 1003,
  carbs: 1005,
  fat: 1004,
  fiber: 1079,
  sugar: 2000,
  sodium: 1093, // mg
};

interface FdcNutrient {
  nutrientId?: number;
  nutrientNumber?: string;
  value?: number;
}

interface FdcLabelNutrients {
  calories?: { value: number };
  protein?: { value: number };
  carbohydrates?: { value: number };
  fat?: { value: number };
  fiber?: { value: number };
  sugars?: { value: number };
  sodium?: { value: number };
}

interface FdcFood {
  fdcId: number;
  description: string;
  brandName?: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: FdcNutrient[];
  labelNutrients?: FdcLabelNutrients;
}

function nutrientValue(nutrients: FdcNutrient[] | undefined, id: number) {
  const match = nutrients?.find((n) => n.nutrientId === id);
  return match?.value ?? null;
}

function normalizeFdcFood(food: FdcFood): NormalizedFood {
  const hasLabelNutrients = Boolean(food.labelNutrients);

  if (hasLabelNutrients) {
    const n = food.labelNutrients!;
    return {
      source: "usda",
      externalId: String(food.fdcId),
      name: food.description,
      brand: food.brandName ?? food.brandOwner ?? null,
      servingSize: food.servingSize ?? 1,
      servingUnit: food.servingSizeUnit ?? "serving",
      calories: n.calories?.value ?? 0,
      proteinG: n.protein?.value ?? null,
      carbsG: n.carbohydrates?.value ?? null,
      fatG: n.fat?.value ?? null,
      fiberG: n.fiber?.value ?? null,
      sugarG: n.sugars?.value ?? null,
      sodiumMg: n.sodium?.value ?? null,
      barcode: null,
    };
  }

  const nutrients = food.foodNutrients;
  return {
    source: "usda",
    externalId: String(food.fdcId),
    name: food.description,
    brand: food.brandName ?? food.brandOwner ?? null,
    servingSize: 100,
    servingUnit: "g",
    calories: nutrientValue(nutrients, NUTRIENT_IDS.calories) ?? 0,
    proteinG: nutrientValue(nutrients, NUTRIENT_IDS.protein),
    carbsG: nutrientValue(nutrients, NUTRIENT_IDS.carbs),
    fatG: nutrientValue(nutrients, NUTRIENT_IDS.fat),
    fiberG: nutrientValue(nutrients, NUTRIENT_IDS.fiber),
    sugarG: nutrientValue(nutrients, NUTRIENT_IDS.sugar),
    sodiumMg: nutrientValue(nutrients, NUTRIENT_IDS.sodium),
    barcode: null,
  };
}

export async function searchUsdaFoods(query: string): Promise<NormalizedFood[]> {
  const apiKey = process.env.USDA_FDC_API_KEY;
  if (!apiKey) {
    throw new Error("USDA_FDC_API_KEY is not configured");
  }

  const url = new URL(`${USDA_BASE}/foods/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("pageSize", "25");
  url.searchParams.set(
    "dataType",
    "Branded,Foundation,SR Legacy",
  );

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`USDA search failed: ${res.status}`);
  }

  const data = (await res.json()) as { foods?: FdcFood[] };
  return (data.foods ?? []).map(normalizeFdcFood);
}
