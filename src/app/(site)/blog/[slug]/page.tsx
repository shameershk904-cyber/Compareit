import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { contentToParagraphs, getPublishedBlogPostBySlug, getPublishedBlogPosts } from "@/lib/blog";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const posts = await getPublishedBlogPosts();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPublishedBlogPostBySlug(slug);
    if (!post) return { title: "Post Not Found | CompareIt.pk" };

    return {
      title: `${post.title} | CompareIt.pk Blog`,
      description: post.excerpt || post.content.slice(0, 160),
      alternates: { canonical: `/blog/${post.slug}` },
      openGraph: {
        title: post.title,
        description: post.excerpt || undefined,
        images: post.coverImage ? [{ url: post.coverImage }] : undefined,
      },
    };
  } catch {
    return { title: "Blog | CompareIt.pk" };
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  let post = null;
  try {
    post = await getPublishedBlogPostBySlug(slug);
  } catch (error) {
    console.error("Failed to load blog post:", error);
  }

  if (!post) notFound();

  const paragraphs = contentToParagraphs(post.content);
  const dateLabel = new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <article>
        <header className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-white">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm font-semibold text-white/85 hover:text-white mb-6"
            >
              ← All posts
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/85">
              <time dateTime={String(post.publishedAt || post.createdAt)}>{dateLabel}</time>
              {post.author ? (
                <>
                  <span>·</span>
                  <span>{post.author}</span>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          {post.coverImage ? (
            <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full max-h-[420px] object-cover"
              />
            </div>
          ) : null}

          {post.excerpt ? (
            <p className="text-lg text-slate-600 font-medium mb-8 border-l-4 border-orange-400 pl-4">
              {post.excerpt}
            </p>
          ) : null}

          <div className="space-y-5 text-slate-800 text-base sm:text-[17px] leading-relaxed">
            {paragraphs.map((paragraph, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
            >
              ← Back to Blog
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
