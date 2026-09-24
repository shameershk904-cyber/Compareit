import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.query !== "string") {
      return NextResponse.json({ error: "Invalid search payload" }, { status: 400 });
    }

    const rawQuery = body.query.trim();
    if (!rawQuery) {
      return new NextResponse(null, { status: 204 });
    }

    const normalized = rawQuery.toLowerCase().replace(/\s+/g, " ");
    const resultsCount = typeof body.resultsCount === "number" ? Math.max(0, body.resultsCount) : 0;
    const clickedResult = typeof body.clickedResult === "string" ? body.clickedResult.slice(0, 200) : null;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null;

    await prisma.searchLog.create({
      data: {
        query: rawQuery.slice(0, 200),
        normalized: normalized.slice(0, 200),
        resultsCount,
        clickedResult,
        sessionId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Search logging error:", error);
    return new NextResponse(null, { status: 204 });
  }
}
