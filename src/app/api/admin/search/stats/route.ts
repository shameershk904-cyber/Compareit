import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const range = req.nextUrl.searchParams.get("range") || "7d";
  const now = new Date();
  let startDate = new Date();

  if (range === "today") {
    startDate.setHours(0, 0, 0, 0);
  } else if (range === "30d") {
    startDate.setDate(now.getDate() - 30);
  } else if (range === "all") {
    startDate = new Date(2025, 0, 1);
  } else {
    startDate.setDate(now.getDate() - 7);
  }

  try {
    const logs = await prisma.searchLog.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalSearches = logs.length;
    const clickedSearches = logs.filter((l) => Boolean(l.clickedResult)).length;
    const ctr = totalSearches > 0 ? Math.round((clickedSearches / totalSearches) * 100) : 0;

    // Group by normalized keyword
    const keywordMap: Record<
      string,
      {
        query: string;
        normalized: string;
        count: number;
        resultsCount: number;
        clicks: number;
        lastSearched: Date;
      }
    > = {};

    for (const log of logs) {
      const norm = log.normalized;
      if (!keywordMap[norm]) {
        keywordMap[norm] = {
          query: log.query,
          normalized: norm,
          count: 0,
          resultsCount: log.resultsCount,
          clicks: 0,
          lastSearched: log.createdAt,
        };
      }
      keywordMap[norm].count++;
      if (log.clickedResult) keywordMap[norm].clicks++;
      if (log.createdAt > keywordMap[norm].lastSearched) {
        keywordMap[norm].lastSearched = log.createdAt;
      }
    }

    const allKeywords = Object.values(keywordMap);
    const topKeywords = [...allKeywords].sort((a, b) => b.count - a.count).slice(0, 20);

    // Filter zero-result keywords
    const zeroResults = allKeywords
      .filter((k) => k.resultsCount === 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const zeroResultTotalCount = logs.filter((l) => l.resultsCount === 0).length;

    // Recent 20 searches
    const recentSearches = logs.slice(0, 20).map((l) => ({
      id: l.id,
      query: l.query,
      resultsCount: l.resultsCount,
      clickedResult: l.clickedResult,
      createdAt: l.createdAt,
    }));

    return NextResponse.json({
      summary: {
        totalSearches,
        uniqueKeywords: allKeywords.length,
        zeroResultCount: zeroResultTotalCount,
        ctr,
        range,
      },
      topKeywords,
      zeroResults,
      recentSearches,
    });
  } catch (err: unknown) {
    console.error("Search stats query error:", err);
    return NextResponse.json(
      { error: "Failed to query search telemetry" },
      { status: 500 }
    );
  }
}
