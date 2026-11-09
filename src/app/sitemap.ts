import type { MetadataRoute } from "next";
import { getPublishedBlogPosts } from "@/lib/blog";
import { getPhones } from "@/lib/phones";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/trending"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/new-in"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/coming-soon"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/compare"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  let phoneRoutes: MetadataRoute.Sitemap = [];
  try {
    const phones = await getPhones();
    phoneRoutes = phones
      .filter((phone) => Boolean(phone.slug))
      .map((phone) => ({
        url: absoluteUrl(`/phone/${phone.slug}`),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: phone.popular || (phone.trending_rank ?? 0) > 0 ? 0.8 : 0.6,
      }));
  } catch (error) {
    console.error("[sitemap] Failed to load phones:", error);
  }

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPublishedBlogPosts();
    blogRoutes = posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.publishedAt || post.createdAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("[sitemap] Failed to load blog posts:", error);
  }

  return [...staticRoutes, ...blogRoutes, ...phoneRoutes];
}
