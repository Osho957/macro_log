import type { NormalizedFood } from "@/types/food";

interface OffNutriments {
  "energy-kcal_100g"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
  sugars_100g?: number;
  sodium_100g?: number; // grams
}

interface OffProduct {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: OffNutriments;
}

interface OffResponse {
  status: number;
  product?: OffProduct;
}

export async function lookupBarcode(
  barcode: string,
): Promise<NormalizedFood | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode,
  )}.json`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "PersonalCalorieTracker/1.0 (personal use)",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Open Food Facts lookup failed: ${res.status}`);
  }

  const data = (await res.json()) as OffResponse;
  if (data.status !== 1 || !data.product) {
    return null;
  }

  const n = data.product.nutriments ?? {};

  return {
    source: "off",
    externalId: barcode,
    name: data.product.product_name || "Unknown product",
    brand: data.product.brands ?? null,
    servingSize: 100,
    servingUnit: "g",
    calories: n["energy-kcal_100g"] ?? 0,
    proteinG: n.proteins_100g ?? null,
    carbsG: n.carbohydrates_100g ?? null,
    fatG: n.fat_100g ?? null,
    fiberG: n.fiber_100g ?? null,
    sugarG: n.sugars_100g ?? null,
    sodiumMg: n.sodium_100g != null ? n.sodium_100g * 1000 : null,
    barcode,
  };
}
