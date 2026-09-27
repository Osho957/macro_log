export type FoodSource = "custom" | "usda" | "off";

export interface NormalizedFood {
  source: FoodSource;
  externalId: string | null;
  name: string;
  brand: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  barcode: string | null;
}

export interface Food extends NormalizedFood {
  id: string;
}
