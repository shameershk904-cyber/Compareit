import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";
import { MessageStatus } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET: List messages for Admin
export async function GET(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const inquiryParam = searchParams.get("inquiry");
  const search = searchParams.get("search")?.trim();

  try {
    const whereClause: Record<string, unknown> = {};

    if (statusParam && Object.values(MessageStatus).includes(statusParam as MessageStatus)) {
      whereClause.status = statusParam as MessageStatus;
    }

    if (inquiryParam && inquiryParam !== "all") {
      whereClause.inquiry = inquiryParam;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ];
    }

    const [messages, totalCount, unreadCount] = await Promise.all([
      prisma.contactMessage.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { status: "UNREAD" } }),
    ]);

    return NextResponse.json({
      messages,
      totalCount,
      unreadCount,
    });
  } catch (err) {
    console.error("[GET /api/admin/messages] Error:", err);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(MessageStatus).optional(),
  notes: z.string().optional().nullable(),
});

// PATCH: Update message status or admin notes
export async function PATCH(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { id, status, notes } = parsed.data;

    const dataToUpdate: Record<string, unknown> = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (notes !== undefined) dataToUpdate.notes = notes;

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/messages] Error:", err);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

// DELETE: Delete a message (Admin only)
export async function DELETE(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized. Admin role required." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    await prisma.contactMessage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/messages] Error:", err);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
