import { verifyServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { BannersClient, type BannerRecord } from "@/components/admin/BannersClient";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const { authenticated } = await verifyServerSession(["ADMIN", "EDITOR"]);

  if (!authenticated) {
    redirect("/admin/login?error=AccessDenied");
  }

  let banners: BannerRecord[] = [];
  try {
    const rawBanners = await prisma.banner.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    banners = rawBanners.map((b) => ({
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
  } catch (error) {
    console.error("Failed to load banners:", error);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <BannersClient initialBanners={banners} />
    </div>
  );
}
