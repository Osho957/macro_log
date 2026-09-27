import { NextResponse, type NextRequest } from "next/server";
import { searchUsdaFoods } from "@/lib/usda";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchUsdaFoods(query);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("USDA search error", err);
    return NextResponse.json(
      { error: "Failed to search USDA FoodData Central" },
      { status: 502 },
    );
  }
}
