import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";
import { BannerPlacement } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bannerSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  desktopImage: z.string().url("Valid desktop image URL is required"),
  mobileImage: z.string().url().optional().nullable(),
  altText: z.string().max(150).optional().nullable(),
  linkUrl: z.string().url("Valid destination URL is required"),
  placement: z.nativeEnum(BannerPlacement).default(BannerPlacement.HERO),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

// GET: List all banners for admin
export async function GET(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const banners = await prisma.banner.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ banners });
  } catch (err: unknown) {
    console.error("List banners error:", err);
    return NextResponse.json({ error: "Failed to list banners" }, { status: 500 });
  }
}

// POST: Create a banner
export async function POST(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = bannerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const {
      title,
      desktopImage,
      mobileImage,
      altText,
      linkUrl,
      placement,
      priority,
      isActive,
      startDate,
      endDate,
    } = parsed.data;

    const banner = await prisma.banner.create({
      data: {
        title,
        desktopImage,
        mobileImage: mobileImage || null,
        altText: altText || null,
        linkUrl,
        placement,
        priority,
        isActive,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    // Record Activity Log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: "CREATE_BANNER",
        entity: "BANNER",
        entityId: banner.id,
        details: {
          title: banner.title,
          placement: banner.placement,
          priority: banner.priority,
        },
      },
    });

    return NextResponse.json({ success: true, banner }, { status: 201 });
  } catch (err: unknown) {
    console.error("Create banner error:", err);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}
