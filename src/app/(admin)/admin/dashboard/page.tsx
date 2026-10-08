import { verifyServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { DashboardClient } from "@/components/admin/DashboardClient";
import { ChangePasswordModal } from "@/components/admin/ChangePasswordModal";
import { type BannerRecord } from "@/components/admin/BannersClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { authenticated, user } = await verifyServerSession(["ADMIN", "EDITOR", "VIEWER"]);

  if (!authenticated || !user) {
    redirect("/admin/login?error=AccessDenied");
  }

  // Pre-fetch counts and banners from Prisma
  let pageViews = 0;
  let searchLogs = 0;
  let bannersCount = 0;
  let users = 1;
  let activityLogs = 0;
  let shootoutsCount = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let liveBanners: BannerRecord[] = [];
  let devices = { desktop: 0, mobile: 0, tablet: 0 };
  let topSearches: Array<{ query: string; count: number }> = [];
  let zeroResultCount = 0;
  let topPages: Array<{ path: string; count: number }> = [];
  let dbError: string | null = null;

  try {
    const [
      pCount,
      sCount,
      bCount,
      uCount,
      aCount,
      compareCount,
      bannerAgg,
      rawBanners,
      deviceGroups,
      searchGroups,
      zeroCount,
      pageGroups,
    ] = await Promise.all([
      prisma.pageView.count(),
      prisma.searchLog.count(),
      prisma.banner.count(),
      prisma.user.count(),
      prisma.activityLog.count(),
      prisma.pageView.count({
        where: {
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
        _count: { id: true },
      }).catch(() => []),
      prisma.searchLog.groupBy({
        by: ["query"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }).catch(() => []),
      prisma.searchLog.count({
        where: { resultsCount: 0 },
      }).catch(() => 0),
      prisma.pageView.groupBy({
        by: ["path"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }).catch(() => []),
    ]);

    pageViews = pCount;
    searchLogs = sCount;
    bannersCount = bCount;
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
          searchLogs,
          banners: bannersCount,
          users,
          activityLogs,
          shootoutsCount,
          totalImpressions,
          totalClicks,
          devices,
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

