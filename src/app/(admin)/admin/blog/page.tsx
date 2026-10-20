import { verifyServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { BlogClient, type BlogPostRecord } from "@/components/admin/BlogClient";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const { authenticated } = await verifyServerSession(["ADMIN", "EDITOR", "VIEWER"]);

  if (!authenticated) {
    redirect("/admin/login?error=AccessDenied");
  }

  let posts: BlogPostRecord[] = [];
  try {
    const raw = await prisma.blogPost.findMany({
      orderBy: [{ createdAt: "desc" }],
    });

    posts = raw.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      coverImage: p.coverImage,
      author: p.author,
      published: p.published,
      publishedAt: p.publishedAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to load blog posts:", error);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <BlogClient initialPosts={posts} />
    </div>
  );
}
