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
  let liveBanners: BannerRecord[] = [];

  try {
    const [pCount, sCount, bCount, uCount, aCount, rawBanners] = await Promise.all([
      prisma.pageView.count(),
      prisma.searchLog.count(),
      prisma.banner.count(),
      prisma.user.count(),
      prisma.activityLog.count(),
      prisma.banner.findMany({
        take: 4,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      }),
    ]);

    pageViews = pCount;
    searchLogs = sCount;
    bannersCount = bCount;
    users = uCount;
    activityLogs = aCount;

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
  } catch (err) {
    console.warn("Prisma dashboard prefetch notice:", err);
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
        }}
        liveBanners={liveBanners}
      />
    </>
  );
}
