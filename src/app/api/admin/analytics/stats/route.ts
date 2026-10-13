import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";
import { resolveAnalyticsRange } from "@/lib/date-range";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR", "VIEWER"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const { range, startDate } = resolveAnalyticsRange(
    req.nextUrl.searchParams.get("range"),
    "7d"
  );

  try {
    // 1. Fetch raw views within date range
    const views = await prisma.pageView.findMany({
      where: {
        createdAt: { gte: startDate },
        isBot: false,
      },
      select: {
        id: true,
        path: true,
        referrer: true,
        device: true,
        browser: true,
        os: true,
        country: true,
        ipHash: true,
        sessionId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const totalPageViews = views.length;
    // Prefer sessionId for uniqueness — ipHash rotates daily and inflates multi-day counts
    const uniqueVisitors = new Set(views.map((v) => v.sessionId)).size;
    const totalSessions = uniqueVisitors;
    const viewsPerSession =
      totalSessions > 0 ? (totalPageViews / totalSessions).toFixed(1) : "0";

    // 2. Aggregate Time Series
    // If today: group by hour (00:00 to 23:00)
    // If multi-day: group by YYYY-MM-DD (or YYYY-MM for long "all" spans)
    const timeMap: Record<string, { pageviews: number; visitors: Set<string> }> = {};

    if (range === "today") {
      for (let h = 0; h <= 23; h++) {
        const label = `${h.toString().padStart(2, "0")}:00`;
        timeMap[label] = { pageviews: 0, visitors: new Set() };
      }
      for (const v of views) {
        const d = new Date(v.createdAt);
        const label = `${d.getHours().toString().padStart(2, "0")}:00`;
        if (timeMap[label]) {
          timeMap[label].pageviews++;
          timeMap[label].visitors.add(v.sessionId);
        }
      }
    } else if (range === "all") {
      // Monthly buckets so chart covers full history (not just last 90 days)
      for (const v of views) {
        const label = new Date(v.createdAt).toISOString().slice(0, 7); // YYYY-MM
        if (!timeMap[label]) {
          timeMap[label] = { pageviews: 0, visitors: new Set() };
        }
        timeMap[label].pageviews++;
        timeMap[label].visitors.add(v.sessionId);
      }
    } else {
      const daysCount = range === "30d" ? 30 : range === "quarterly" ? 90 : 7;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toISOString().slice(5, 10); // MM-DD
        timeMap[label] = { pageviews: 0, visitors: new Set() };
      }
      for (const v of views) {
        const label = new Date(v.createdAt).toISOString().slice(5, 10);
        if (timeMap[label]) {
          timeMap[label].pageviews++;
          timeMap[label].visitors.add(v.sessionId);
        }
      }
    }

    const timeSeries = Object.entries(timeMap).map(([time, data]) => ({
      time,
      pageviews: data.pageviews,
      visitors: data.visitors.size,
    }));

    // 3. Top Pages
    const pageCounts: Record<string, number> = {};
    for (const v of views) {
      pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
    }
    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({
        path,
        views: count,
        percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // 4. Device Breakdown
    const deviceCounts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
    for (const v of views) {
      const dev = v.device?.toLowerCase() || "desktop";
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    }
    const devices = [
      { name: "Mobile", value: deviceCounts.mobile, color: "#f59e0b" },
      { name: "Desktop", value: deviceCounts.desktop, color: "#3b82f6" },
      { name: "Tablet", value: deviceCounts.tablet, color: "#10b981" },
    ];

    // 5. Top Browsers
    const browserCounts: Record<string, number> = {};
    for (const v of views) {
      const b = v.browser || "Other";
      browserCounts[b] = (browserCounts[b] || 0) + 1;
    }
    const browsers = Object.entries(browserCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 6. Top Operating Systems
    const osCounts: Record<string, number> = {};
    for (const v of views) {
      const os = v.os || "Other";
      osCounts[os] = (osCounts[os] || 0) + 1;
    }
    const osList = Object.entries(osCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 7. Top Referrers
    const referrerCounts: Record<string, number> = {};
    for (const v of views) {
      let ref = "Direct";
      if (v.referrer) {
        try {
          const url = new URL(v.referrer);
          ref = url.hostname.replace(/^www\./, "");
        } catch {
          ref = v.referrer.slice(0, 30);
        }
      }
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    }
    const topReferrers = Object.entries(referrerCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      summary: {
        totalPageViews,
        uniqueVisitors,
        totalSessions,
        viewsPerSession,
        range,
      },
      timeSeries,
      topPages,
      devices,
      browsers,
      osList,
      topReferrers,
    });
  } catch (err: unknown) {
    console.error("Analytics stats error:", err);
    return NextResponse.json(
      { error: "Failed to query analytics data from database" },
      { status: 500 }
    );
  }
}
