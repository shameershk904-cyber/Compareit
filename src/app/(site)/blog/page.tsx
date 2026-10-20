import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog - CompareIt.pk | Smartphone Guides, Tips & Market Insights",
  description:
    "Read the latest smartphone buying guides, price tips, PTA tax explainers, and Pakistan mobile market insights from CompareIt.pk.",
  alternates: {
    canonical: "/blog",
  },
};

export const revalidate = 60;

export default async function BlogPage() {
  let posts: Awaited<ReturnType<typeof getPublishedBlogPosts>> = [];
  try {
    posts = await getPublishedBlogPosts();
  } catch (error) {
    console.error("Failed to load published blogs:", error);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center text-white">
          <p className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            CompareIt.pk Journal
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">Blog</h1>
          <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto">
            Buying guides, price tips, and Pakistan smartphone market insights — written for real shoppers.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {posts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-slate-200 bg-white">
            <h2 className="text-xl font-bold text-slate-900">No posts published yet</h2>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Check back soon — new guides and market updates are on the way.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 px-5 py-2.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => {
              const dateLabel = new Date(
                post.publishedAt || post.createdAt
              ).toLocaleDateString("en-PK", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <article
                  key={post.id}
                  className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all"
                >
                  <Link href={`/blog/${post.slug}`} className="block">
                    {post.coverImage ? (
                      <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                        <span className="text-orange-400 text-4xl font-black opacity-40">CI</span>
                      </div>
                    )}
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <time dateTime={String(post.publishedAt || post.createdAt)}>
                          {dateLabel}
                        </time>
                        {post.author ? (
                          <>
                            <span>·</span>
                            <span>{post.author}</span>
                          </>
                        ) : null}
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      {post.excerpt ? (
                        <p className="mt-2 text-sm text-slate-600 line-clamp-3">{post.excerpt}</p>
                      ) : null}
                      <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-orange-600">
                        Read more
                        <span aria-hidden>→</span>
                      </span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
