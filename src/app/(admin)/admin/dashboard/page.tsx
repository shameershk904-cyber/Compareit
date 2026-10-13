import { verifyServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { DashboardClient } from "@/components/admin/DashboardClient";
import { ChangePasswordModal } from "@/components/admin/ChangePasswordModal";
import { type BannerRecord } from "@/components/admin/BannersClient";
import { resolveAnalyticsRange } from "@/lib/date-range";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { authenticated, user } = await verifyServerSession(["ADMIN", "EDITOR", "VIEWER"]);

  if (!authenticated || !user) {
    redirect("/admin/login?error=AccessDenied");
  }

  // Match DashboardClient default filter (Last 30 Days)
  const { startDate } = resolveAnalyticsRange("30d", "30d");

  let pageViews = 0;
  let uniqueVisitors = 0;
  let searchLogs = 0;
  let bannersCount = 0;
  let activeBannersCount = 0;
  let users = 1;
  let activityLogs = 0;
  let shootoutsCount = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let liveBanners: BannerRecord[] = [];
  let devices = { desktop: 0, mobile: 0, tablet: 0 };
  let countries: Array<{ country: string; count: number }> = [];
  let topSearches: Array<{ query: string; count: number }> = [];
  let zeroResultCount = 0;
  let topPages: Array<{ path: string; count: number }> = [];
  let dbError: string | null = null;

  const viewWhere = {
    createdAt: { gte: startDate },
    isBot: false,
  };
  const searchWhere = {
    createdAt: { gte: startDate },
  };

  try {
    const [
      pCount,
      uniqueSessionGroups,
      sCount,
      bCount,
      activeCount,
      uCount,
      aCount,
      compareCount,
      bannerAgg,
      rawBanners,
      deviceGroups,
      countryGroups,
      searchGroups,
      zeroCount,
      pageGroups,
    ] = await Promise.all([
      prisma.pageView.count({ where: viewWhere }),
      prisma.pageView.groupBy({
        by: ["sessionId"],
        where: viewWhere,
      }),
      prisma.searchLog.count({ where: searchWhere }),
      prisma.banner.count(),
      prisma.banner.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.activityLog.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.pageView.count({
        where: {
          ...viewWhere,
          path: { startsWith: "/compare" },
        },
      }),
      prisma.banner.aggregate({
        _sum: {
          impressions: true,
          clicks: true,
        },
      }),
      prisma.banner.findMany({
        take: 4,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      }),
      prisma.pageView.groupBy({
        by: ["device"],
        where: viewWhere,
        _count: { id: true },
      }).catch(() => []),
      prisma.pageView.groupBy({
        by: ["country"],
        where: viewWhere,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }).catch(() => []),
      prisma.searchLog.groupBy({
        by: ["query"],
        where: searchWhere,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }).catch(() => []),
      prisma.searchLog.count({
        where: { ...searchWhere, resultsCount: 0 },
      }).catch(() => 0),
      prisma.pageView.groupBy({
        by: ["path"],
        where: viewWhere,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }).catch(() => []),
    ]);

    pageViews = pCount;
    uniqueVisitors = uniqueSessionGroups.length;
    searchLogs = sCount;
    bannersCount = bCount;
    activeBannersCount = activeCount;
    users = uCount;
    activityLogs = aCount;
    shootoutsCount = compareCount;
    totalImpressions = bannerAgg._sum.impressions || 0;
    totalClicks = bannerAgg._sum.clicks || 0;
    zeroResultCount = zeroCount;

    for (const d of deviceGroups) {
      const dev = d.device?.toLowerCase() as "desktop" | "mobile" | "tablet";
      if (dev && dev in devices) {
        devices[dev] = d._count.id;
      }
    }

    countries = countryGroups.map((c) => ({
      country: c.country || "Unknown",
      count: c._count.id,
    }));

    topSearches = searchGroups.map((s) => ({
      query: s.query,
      count: s._count.id,
    }));

    topPages = pageGroups.map((p) => ({
      path: p.path,
      count: p._count.id,
    }));

    liveBanners = rawBanners.map((b) => ({
      id: b.id,
      title: b.title,
      desktopImage: b.desktopImage,
      mobileImage: b.mobileImage,
      altText: b.altText,
      linkUrl: b.linkUrl,
      placement: b.placement as BannerRecord["placement"],
      priority: b.priority,
      isActive: b.isActive,
      startDate: b.startDate?.toISOString() || null,
      endDate: b.endDate?.toISOString() || null,
      impressions: b.impressions,
      clicks: b.clicks,
      createdAt: b.createdAt.toISOString(),
    }));
  } catch (err: unknown) {
    console.warn("Prisma dashboard prefetch notice:", err);
    dbError = "Unable to connect to database. Live metrics could not be loaded.";
  }

  return (
    <>
      {user.mustChangePassword && <ChangePasswordModal isRequired={true} />}
      <DashboardClient
        stats={{
          pageViews,
          uniqueVisitors,
          searchLogs,
          banners: bannersCount,
          activeBanners: activeBannersCount,
          placementSlots: 4,
          users,
          activityLogs,
          shootoutsCount,
          totalImpressions,
          totalClicks,
          devices,
          countries,
          topSearches,
          zeroResultCount,
          topPages,
        }}
        liveBanners={liveBanners}
        error={dbError}
      />
    </>
  );
}
