import { NextResponse } from "next/server";
import { lookupBarcode } from "@/lib/openFoodFacts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ barcode: string }> },
) {
  const { barcode } = await params;

  try {
    const food = await lookupBarcode(barcode);
    if (!food) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ food });
  } catch (err) {
    console.error("Open Food Facts lookup error", err);
    return NextResponse.json(
      { error: "Failed to look up barcode" },
      { status: 502 },
    );
  }
}
