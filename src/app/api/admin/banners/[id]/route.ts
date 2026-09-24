import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";
import { BannerPlacement } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateBannerSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  desktopImage: z.string().url().optional(),
  mobileImage: z.string().url().optional().nullable(),
  altText: z.string().max(150).optional().nullable(),
  linkUrl: z.string().url().optional(),
  placement: z.nativeEnum(BannerPlacement).optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

// PUT: Update banner
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateBannerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const data: any = { ...parsed.data };
    if ("startDate" in data) {
      data.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if ("endDate" in data) {
      data.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    const updated = await prisma.banner.update({
      where: { id },
      data,
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: "UPDATE_BANNER",
        entity: "BANNER",
        entityId: id,
        details: { changes: Object.keys(data), title: updated.title },
      },
    });

    return NextResponse.json({ success: true, banner: updated });
  } catch (err: any) {
    console.error("Update banner error:", err);
    return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
  }
}

// DELETE: Delete banner
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    await prisma.banner.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: "DELETE_BANNER",
        entity: "BANNER",
        entityId: id,
        details: { title: existing.title, placement: existing.placement },
      },
    });

    return NextResponse.json({ success: true, message: "Banner deleted" });
  } catch (err: any) {
    console.error("Delete banner error:", err);
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}
