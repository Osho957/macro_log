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
  code?: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: OffNutriments;
}

interface OffProductResponse {
  status: number;
  product?: OffProduct;
}

interface OffSearchResponse {
  products?: OffProduct[];
}

const USER_AGENT = "CalorieTrackerApp/1.0";

function normalizeOffProduct(
  product: OffProduct,
  fallbackBarcode: string | null,
): NormalizedFood | null {
  if (!product.product_name) return null;

  const n = product.nutriments ?? {};
  const barcode = product.code ?? fallbackBarcode;

  return {
    source: "off",
    externalId: barcode,
    name: product.product_name,
    brand: product.brands ?? null,
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

export async function lookupBarcode(
  barcode: string,
): Promise<NormalizedFood | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode,
  )}.json`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Open Food Facts lookup failed: ${res.status}`);
  }

  const data = (await res.json()) as OffProductResponse;
  if (data.status !== 1 || !data.product) {
    return null;
  }

  return normalizeOffProduct(data.product, barcode);
}

/**
 * Text search against Open Food Facts, restricted to products sold in
 * India, since USDA FoodData Central only covers US-market foods/brands.
 */
export async function searchIndianFoods(
  query: string,
): Promise<NormalizedFood[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "15");
  url.searchParams.set("countries_tags", "en:india");
  url.searchParams.set(
    "fields",
    "code,product_name,brands,nutriments",
  );

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Open Food Facts search failed: ${res.status}`);
  }

  const data = (await res.json()) as OffSearchResponse;

  return (data.products ?? [])
    .map((p) => normalizeOffProduct(p, null))
    .filter((f): f is NormalizedFood => f != null && f.calories > 0);
}
