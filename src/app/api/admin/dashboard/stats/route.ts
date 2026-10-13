import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";
import { resolveAnalyticsRange } from "@/lib/date-range";

export const dynamic = "force-dynamic";

/** Real public placement slots currently mounted on the site */
const PLACEMENT_SLOT_COUNT = 4;

export async function GET(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession([
    "ADMIN",
    "EDITOR",
    "VIEWER",
  ]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const { range, startDate } = resolveAnalyticsRange(
    req.nextUrl.searchParams.get("range"),
    "30d"
  );

  const viewWhere = {
    createdAt: { gte: startDate },
    isBot: false,
  };

  const searchWhere = {
    createdAt: { gte: startDate },
  };

  try {
    const [
      pageViews,
      uniqueSessionGroups,
      searchLogs,
      shootoutsCount,
      bannersCount,
      activeBannersCount,
      bannerAgg,
      deviceGroups,
      countryGroups,
      searchGroups,
      zeroResultCount,
      pageGroups,
      users,
      activityLogs,
    ] = await Promise.all([
      prisma.pageView.count({ where: viewWhere }),
      // sessionId is stable within a browser session (unlike daily-rotated ipHash)
      prisma.pageView.groupBy({
        by: ["sessionId"],
        where: viewWhere,
      }),
      prisma.searchLog.count({ where: searchWhere }),
      prisma.pageView.count({
        where: {
          ...viewWhere,
          path: { startsWith: "/compare" },
        },
      }),
      prisma.banner.count(),
      prisma.banner.count({ where: { isActive: true } }),
      prisma.banner.aggregate({
        _sum: { impressions: true, clicks: true },
      }),
      prisma.pageView.groupBy({
        by: ["device"],
        where: viewWhere,
        _count: { id: true },
      }),
      prisma.pageView.groupBy({
        by: ["country"],
        where: viewWhere,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.searchLog.groupBy({
        by: ["query"],
        where: searchWhere,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.searchLog.count({
        where: { ...searchWhere, resultsCount: 0 },
      }),
      prisma.pageView.groupBy({
        by: ["path"],
        where: viewWhere,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.user.count(),
      prisma.activityLog.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    for (const d of deviceGroups) {
      const dev = d.device?.toLowerCase() as keyof typeof devices;
      if (dev && dev in devices) {
        devices[dev] = d._count.id;
      }
    }

    const countries = countryGroups.map((c) => ({
      country: c.country || "Unknown",
      count: c._count.id,
    }));

    return NextResponse.json({
      range,
      startDate: startDate.toISOString(),
      pageViews,
      uniqueVisitors: uniqueSessionGroups.length,
      searchLogs,
      shootoutsCount,
      banners: bannersCount,
      activeBanners: activeBannersCount,
      placementSlots: PLACEMENT_SLOT_COUNT,
      users,
      activityLogs,
      totalImpressions: bannerAgg._sum.impressions || 0,
      totalClicks: bannerAgg._sum.clicks || 0,
      devices,
      countries,
      topSearches: searchGroups.map((s) => ({
        query: s.query,
        count: s._count.id,
      })),
      zeroResultCount,
      topPages: pageGroups.map((p) => ({
        path: p.path,
        count: p._count.id,
      })),
    });
  } catch (err: unknown) {
    console.error("Dashboard stats error:", err);
    return NextResponse.json(
      { error: "Failed to query dashboard analytics from database" },
      { status: 500 }
    );
  }
}
