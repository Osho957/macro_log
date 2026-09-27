import { NextResponse, type NextRequest } from "next/server";
import { searchIndianFoods } from "@/lib/openFoodFacts";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchIndianFoods(query);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Open Food Facts search error", err);
    return NextResponse.json(
      { error: "Failed to search Open Food Facts" },
      { status: 502 },
    );
  }
}
