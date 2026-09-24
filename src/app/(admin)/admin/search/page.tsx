import { verifyServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SearchClient } from "@/components/admin/SearchClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search Monitoring | CompareIt.pk Admin",
  description: "Monitor user search queries, missing phones, and keyword demand",
};

export default async function SearchMonitoringPage() {
  const { authenticated, user } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    redirect("/admin/login?error=AccessDenied");
  }

  // Pre-fetch 7-day search stats
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let initialData = null;

  try {
    const logs = await prisma.searchLog.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
    });

    const totalSearches = logs.length;
    const clickedSearches = logs.filter((l) => Boolean(l.clickedResult)).length;
    const ctr = totalSearches > 0 ? Math.round((clickedSearches / totalSearches) * 100) : 0;

    const keywordMap: Record<
      string,
      {
        query: string;
        normalized: string;
        count: number;
        resultsCount: number;
        clicks: number;
        lastSearched: string;
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
          lastSearched: log.createdAt.toISOString(),
        };
      }
      keywordMap[norm].count++;
      if (log.clickedResult) keywordMap[norm].clicks++;
    }

    const allKeywords = Object.values(keywordMap);
    const topKeywords = [...allKeywords].sort((a, b) => b.count - a.count).slice(0, 20);
    const zeroResults = allKeywords
      .filter((k) => k.resultsCount === 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    const zeroResultTotalCount = logs.filter((l) => l.resultsCount === 0).length;

    const recentSearches = logs.slice(0, 20).map((l) => ({
      id: l.id,
      query: l.query,
      resultsCount: l.resultsCount,
      clickedResult: l.clickedResult,
      createdAt: l.createdAt.toISOString(),
    }));

    initialData = {
      summary: {
        totalSearches,
        uniqueKeywords: allKeywords.length,
        zeroResultCount: zeroResultTotalCount,
        ctr,
        range: "7d",
      },
      topKeywords,
      zeroResults,
      recentSearches,
    };
  } catch (err) {
    console.error("Search pre-fetch error:", err);
  }

  return <SearchClient initialData={initialData} />;
}
