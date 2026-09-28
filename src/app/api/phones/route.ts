import { NextResponse } from "next/server";
import { getPhones } from "@/lib/phones";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const phones = await getPhones();
    return NextResponse.json(phones);
  } catch (error) {
    console.error("API /api/phones error:", error);
    return NextResponse.json({ error: "Failed to fetch phones" }, { status: 500 });
  }
}
