import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";
import { ensureUniqueSlug, slugifyTitle } from "@/lib/blog";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateBlogSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().max(160).optional().nullable(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1).optional(),
  coverImage: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional(),
  author: z.string().max(100).optional().nullable(),
  published: z.boolean().optional(),
});

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
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateBlogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    const input = parsed.data;

    if (input.title !== undefined) data.title = input.title.trim();
    if (input.excerpt !== undefined) data.excerpt = input.excerpt?.trim() || null;
    if (input.content !== undefined) data.content = input.content;
    if (input.author !== undefined) data.author = input.author?.trim() || null;
    if (input.coverImage !== undefined) {
      data.coverImage = input.coverImage?.trim() || null;
    }

    if (input.slug !== undefined || input.title !== undefined) {
      const slugSource =
        input.slug?.trim() ||
        (input.title !== undefined ? input.title : existing.title);
      data.slug = await ensureUniqueSlug(slugifyTitle(slugSource) || slugSource, id);
    }

    if (input.published !== undefined) {
      data.published = input.published;
      // Stamp first publish time; keep it if the post is later unpublished
      if (input.published && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data,
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: "UPDATE_BLOG",
        entity: "BLOG",
        entityId: id,
        details: { changes: Object.keys(data), title: updated.title },
      },
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (err: unknown) {
    console.error("Update blog post error:", err);
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    await prisma.blogPost.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: "DELETE_BLOG",
        entity: "BLOG",
        entityId: id,
        details: { title: existing.title, slug: existing.slug },
      },
    });

    return NextResponse.json({ success: true, message: "Blog post deleted" });
  } catch (err: unknown) {
    console.error("Delete blog post error:", err);
    return NextResponse.json({ error: "Failed to delete blog post" }, { status: 500 });
  }
}
