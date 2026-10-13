import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPhones } from "@/lib/phones";
import { matchPhoneSearch } from "@/lib/search";

export const dynamic = "force-dynamic";

/**
 * POST — log an intentional search (submit / Enter), with catalog resultsCount.
 * PATCH — attach clickedResult to the latest log for this session + query.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.query !== "string") {
      return NextResponse.json({ error: "Invalid search payload" }, { status: 400 });
    }

    const rawQuery = body.query.trim();
    if (!rawQuery || rawQuery.length < 2) {
      return new NextResponse(null, { status: 204 });
    }

    const normalized = rawQuery.toLowerCase().replace(/\s+/g, " ");
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null;

    // Prefer client-provided count; otherwise compute from catalog
    let resultsCount =
      typeof body.resultsCount === "number" ? Math.max(0, Math.floor(body.resultsCount)) : null;

    if (resultsCount === null) {
      try {
        const phones = await getPhones();
        resultsCount = phones.filter((p) => matchPhoneSearch(p, rawQuery).matches).length;
      } catch {
        resultsCount = 0;
      }
    }

    const clickedResult =
      typeof body.clickedResult === "string" ? body.clickedResult.slice(0, 200) : null;

    // Dedupe: same session + normalized query within 30s → update instead of spam rows
    if (sessionId) {
      const recent = await prisma.searchLog.findFirst({
        where: {
          sessionId,
          normalized: normalized.slice(0, 200),
          createdAt: { gte: new Date(Date.now() - 30_000) },
        },
        orderBy: { createdAt: "desc" },
      });

      if (recent) {
        await prisma.searchLog.update({
          where: { id: recent.id },
          data: {
            query: rawQuery.slice(0, 200),
            resultsCount,
            ...(clickedResult ? { clickedResult } : {}),
          },
        });
        return new NextResponse(null, { status: 204 });
      }
    }

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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.clickedResult !== "string") {
      return NextResponse.json({ error: "clickedResult required" }, { status: 400 });
    }

    const clickedResult = body.clickedResult.slice(0, 200);
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null;

    if (!sessionId) {
      return new NextResponse(null, { status: 204 });
    }

    const recent = await prisma.searchLog.findFirst({
      where: {
        sessionId,
        createdAt: { gte: new Date(Date.now() - 30 * 60_000) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recent) {
      await prisma.searchLog.update({
        where: { id: recent.id },
        data: { clickedResult },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Search click update error:", error);
    return new NextResponse(null, { status: 204 });
  }
}
