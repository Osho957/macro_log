import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchCommonFoods } from "@/lib/commonFoods";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const supabase = await createClient();
    const results = await searchCommonFoods(supabase, query);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Common foods search error", err);
    return NextResponse.json(
      { error: "Failed to search common foods" },
      { status: 502 },
    );
  }
}
