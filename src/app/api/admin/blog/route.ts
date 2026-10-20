import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";
import { ensureUniqueSlug, slugifyTitle } from "@/lib/blog";
import { z } from "zod";

export const dynamic = "force-dynamic";

const blogSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().max(160).optional().nullable(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1, "Content is required"),
  coverImage: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional(),
  author: z.string().max(100).optional().nullable(),
  published: z.boolean().default(false),
});

export async function GET() {
  const { authenticated, user, error } = await verifyServerSession([
    "ADMIN",
    "EDITOR",
    "VIEWER",
  ]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: [{ createdAt: "desc" }],
    });
    return NextResponse.json({ posts });
  } catch (err: unknown) {
    console.error("List blog posts error:", err);
    return NextResponse.json({ error: "Failed to list blog posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = blogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { title, excerpt, content, author, published } = parsed.data;
    const coverImage = parsed.data.coverImage?.trim() || null;
    const slugBase = parsed.data.slug?.trim() || title;
    const slug = await ensureUniqueSlug(slugifyTitle(slugBase) || title);

    const post = await prisma.blogPost.create({
      data: {
        title: title.trim(),
        slug,
        excerpt: excerpt?.trim() || null,
        content,
        coverImage,
        author: author?.trim() || null,
        published,
        publishedAt: published ? new Date() : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: "CREATE_BLOG",
        entity: "BLOG",
        entityId: post.id,
        details: { title: post.title, slug: post.slug, published: post.published },
      },
    });

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (err: unknown) {
    console.error("Create blog post error:", err);
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}
