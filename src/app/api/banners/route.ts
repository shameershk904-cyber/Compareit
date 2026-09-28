import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BannerPlacement } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const placementParam = req.nextUrl.searchParams.get("placement") || "HERO";
  const placement =
    placementParam in BannerPlacement
      ? (placementParam as BannerPlacement)
      : BannerPlacement.HERO;

  const now = new Date();

  try {
    const banners = await prisma.banner.findMany({
      where: {
        placement,
        isActive: true,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        desktopImage: true,
        mobileImage: true,
        altText: true,
        linkUrl: true,
        placement: true,
      },
    });

    return NextResponse.json(
      { banners },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: unknown) {
    console.error("Public banners query error:", err);
    return NextResponse.json({ banners: [] }, { status: 200 });
  }
}
