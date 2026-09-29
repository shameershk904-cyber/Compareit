/**
 * lib/phones.ts — Data-Access Layer for the Phone Catalog
 *
 * All public pages should import from here, not from phones.json directly.
 *
 * Caching strategy:
 *  - `unstable_cache` wraps every DB query with a tag-based cache.
 *  - Tag: `"phones"` — invalidated globally when any phone changes.
 *  - Tag: `"phone-${slug}"` — invalidated for a single phone page.
 *  - Admin edits call `revalidateTag("phones")` / `revalidateTag("phone-${slug}")`.
 *  - `revalidate: 3600` is a fallback TTL (1 hour) so stale data is never
 *    served indefinitely even if revalidation is missed.
 *
 * Fallback strategy:
 *  - Every function falls back to phones.json if the DB query fails.
 *    This means the site stays up even if Supabase is temporarily unreachable.
 *
 * Field mapping:
 *  - DB uses camelCase (Prisma convention). The public `Phone` type uses snake_case.
 *  - `dbPhoneToPhone()` maps between them, so all downstream components are unchanged.
 */

import { unstable_cache } from "next/cache";
import path from "path";
import fs from "fs";
import prisma from "@/lib/prisma";
import type { Phone, Retailer, WhatMobileSpecs } from "@/types";

// ─── Cache tags ───────────────────────────────────────────────────────────────
export const PHONES_TAG = "phones";
export const phoneTag = (slug: string) => `phone-${slug}`;

// ─── Fallback: read phones.json directly ─────────────────────────────────────
function readLocalPhones(): Phone[] {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "phones.json");
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as Phone[];
  } catch {
    return [];
  }
}

// ─── Type mapper: Prisma row → public Phone interface ────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbPhoneToPhone(row: any): Phone {
  return {
    id: (row.legacyId as string) ?? row.id,
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    image: row.image ?? "",
    price_pkr: row.pricePkr ?? 0,
    usd_price: row.usdPrice ?? 0,
    lowest_verified_price: row.lowestVerifiedPrice ?? 0,
    release_date: row.releaseDate ?? "",
    status: row.status ?? "Available",
    popular: row.popular ?? false,
    trending_rank: row.trendingRank ?? 0,
    pta_status: row.ptaStatus ?? "",
    pta_tax: row.ptaTax as Phone["pta_tax"] ?? undefined,
    warranty: row.warranty as Phone["warranty"] ?? undefined,
    memory: (row.memory ?? {}) as Phone["memory"],
    battery: (row.battery ?? {}) as Phone["battery"],
    display: (row.display ?? {}) as Phone["display"],
    platform: (row.platform ?? {}) as Phone["platform"],
    camera: (row.camera ?? {}) as Phone["camera"],
    connectivity: (row.connectivity ?? {}) as Phone["connectivity"],
    expert_verdict: row.expertVerdict as Phone["expert_verdict"] ?? undefined,
    color_variants: row.colorVariants as Phone["color_variants"] ?? undefined,
    detailed_specs: row.detailedSpecs as WhatMobileSpecs ?? undefined,
    competitor_ids: row.competitorIds as string[] ?? undefined,
    images: row.images as string[] ?? undefined,
    banners: row.banners as string[] ?? undefined,
    // Map PhoneRetailer rows back to the Retailer shape
    retailers: Array.isArray(row.retailers)
      ? (row.retailers as { store: string; price: number; delivery: string; inStock: boolean; condition: string; url: string }[]).map(
          (r): Retailer => ({
            store: r.store,
            price: r.price,
            delivery: r.delivery ?? "",
            in_stock: r.inStock ?? true,
            condition: r.condition ?? "",
            url: r.url ?? "",
          })
        )
      : undefined,
  };
}

// ─── getPhones ────────────────────────────────────────────────────────────────
/**
 * Returns all active phones. Results are cached by the `phones` tag.
 * Pass `{ revalidate: false }` in the cache options if you need live data.
 *
 * No filters are applied here — filtering is done client-side on the homepage
 * (same behaviour as the phones.json approach, keeping performance identical).
 */
// In-memory catalog cache for local instance speed (60s TTL ensures freshness across serverless instances)
let memoryPhonesCache: { data: Phone[]; expiresAt: number } | null = null;
const MEMORY_CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export function invalidatePhonesMemoryCache() {
  memoryPhonesCache = null;
}

const CHUNK_SIZE = 500;

const CATALOG_PHONE_SELECT = {
  id: true,
  legacyId: true,
  slug: true,
  brand: true,
  model: true,
  pricePkr: true,
  lowestVerifiedPrice: true,
  usdPrice: true,
  image: true,
  releaseDate: true,
  status: true,
  isActive: true,
  popular: true,
  trendingRank: true,
  ptaStatus: true,
  ptaTax: true,
  warranty: true,
  memory: true,
  battery: true,
  display: true,
  platform: true,
  camera: true,
  connectivity: true,
  retailers: true,
} as const;

// Cached chunk count query (tagged with PHONES_TAG, 60s TTL)
const getPhoneChunkCount = unstable_cache(
  async (): Promise<number> => {
    try {
      const count = await prisma.phone.count({ where: { isActive: true } });
      return Math.max(1, Math.ceil(count / CHUNK_SIZE));
    } catch {
      return 1;
    }
  },
  ["phones-chunk-count"],
  { tags: [PHONES_TAG], revalidate: 60 }
);

// Cached chunk query (each chunk is ~800 KB, well within Next.js 2MB limit, tagged with PHONES_TAG, 60s TTL)
const getPhoneChunk = (chunkIndex: number) =>
  unstable_cache(
    async (): Promise<Phone[]> => {
      try {
        const rows = await prisma.phone.findMany({
          where: { isActive: true },
          select: CATALOG_PHONE_SELECT,
          orderBy: [
            { popular: "desc" },
            { lowestVerifiedPrice: "desc" },
            { pricePkr: "desc" },
            { id: "asc" },
          ],
          skip: chunkIndex * CHUNK_SIZE,
          take: CHUNK_SIZE,
        });
        return rows.map(dbPhoneToPhone);
      } catch (err) {
        console.error(`[lib/phones] getPhoneChunk(${chunkIndex}) DB error:`, err);
        return [];
      }
    },
    [`phones-chunk-${chunkIndex}`],
    { tags: [PHONES_TAG, `phones-chunk-${chunkIndex}`], revalidate: 60 }
  )();

export async function getPhones(): Promise<Phone[]> {
  const now = Date.now();
  if (memoryPhonesCache && memoryPhonesCache.expiresAt > now) {
    return memoryPhonesCache.data;
  }

  try {
    const totalChunks = await getPhoneChunkCount();
    const chunkPromises: Promise<Phone[]>[] = [];
    for (let i = 0; i < totalChunks; i++) {
      chunkPromises.push(getPhoneChunk(i));
    }
    const chunkResults = await Promise.all(chunkPromises);
    const combined = chunkResults.flat();

    // If all or virtually all phones loaded successfully from DB, cache and return them
    if (combined.length >= 4000) {
      memoryPhonesCache = { data: combined, expiresAt: now + MEMORY_CACHE_TTL_MS };
      return combined;
    }

    // Safeguard: If DB returned a partial list (e.g. serverless PgBouncer pooler dropped chunks to 1500),
    // merge with the complete 4,434 catalog so the website NEVER displays an incomplete catalog!
    console.warn(`[lib/phones] Incomplete catalog from DB (${combined.length} phones). Merging with complete local catalog.`);
    const local = readLocalPhones();
    if (local.length > combined.length) {
      const localSlugs = new Set(local.map((p) => p.slug));
      const newFromDb = combined.filter((p) => !localSlugs.has(p.slug));
      const full = [...newFromDb, ...local];
      memoryPhonesCache = { data: full, expiresAt: now + MEMORY_CACHE_TTL_MS };
      return full;
    }

    memoryPhonesCache = { data: combined, expiresAt: now + MEMORY_CACHE_TTL_MS };
    return combined;
  } catch (err) {
    console.error("[lib/phones] getPhones error, falling back to JSON:", err);
    const local = readLocalPhones();
    memoryPhonesCache = { data: local, expiresAt: now + MEMORY_CACHE_TTL_MS };
    return local;
  }
}

// ─── getPhoneBySlug ───────────────────────────────────────────────────────────
/**
 * Returns a single phone by slug (or legacy id). Cached by `phone-{slug}` tag.
 * Dedicated tagged entry with 60-second TTL.
 * Falls back to phones.json on error.
 */
export const getPhoneBySlug = (slug: string) =>
  unstable_cache(
    async (): Promise<Phone | null> => {
      try {
        const row = await prisma.phone.findFirst({
          where: {
            isActive: true,
            OR: [{ slug }, { legacyId: slug }],
          },
          include: { retailers: true },
        });
        return row ? dbPhoneToPhone(row) : null;
      } catch (err) {
        console.error(`[lib/phones] getPhoneBySlug(${slug}) DB error, falling back to JSON:`, err);
        const phones = readLocalPhones();
        return phones.find((p) => p.slug === slug || p.id === slug) ?? null;
      }
    },
    [`getPhoneBySlug-${slug}`],
    { tags: [PHONES_TAG, phoneTag(slug)], revalidate: 60 }
  )();

// ─── getPhonesByBrand ─────────────────────────────────────────────────────────
/**
 * Returns all active phones for a given brand. Cached with 60-second TTL.
 */
export const getPhonesByBrand = (brand: string) =>
  unstable_cache(
    async (): Promise<Phone[]> => {
      try {
        const rows = await prisma.phone.findMany({
          where: { isActive: true, brand: { equals: brand, mode: "insensitive" } },
          include: { retailers: true },
          orderBy: [{ trendingRank: "asc" }, { pricePkr: "asc" }],
        });
        return rows.map(dbPhoneToPhone);
      } catch (err) {
        console.error(`[lib/phones] getPhonesByBrand(${brand}) error, falling back:`, err);
        const phones = readLocalPhones();
        return phones.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
      }
    },
    [`getPhonesByBrand-${brand}`],
    { tags: [PHONES_TAG, `brand-${brand.toLowerCase()}`], revalidate: 60 }
  )();

// ─── getCompetitors ───────────────────────────────────────────────────────────
/**
 * Resolves up to `limit` competitor phones for a given phone.
 * Mirrors the logic that was previously inlined in the [slug]/page.tsx.
 */
export async function getCompetitors(phone: Phone, limit = 2): Promise<Phone[]> {
  // Fetch the full catalog once (cached) — avoids N+1 queries
  const allPhones = await getPhones();
  const competitors: Phone[] = [];

  // 1. Explicit competitor_ids
  if (phone.competitor_ids && phone.competitor_ids.length > 0) {
    for (const cid of phone.competitor_ids) {
      const match = allPhones.find((p) => p.id === cid || p.slug === cid);
      if (match && !competitors.some((c) => c.id === match.id)) {
        competitors.push(match);
      }
      if (competitors.length >= limit) return competitors;
    }
  }

  // 2. Exact match for Itel A50C to pair with Redmi A3 and Infinix Smart 8 as shown in design
  if (competitors.length < limit && (phone.slug.includes("a50c") || phone.model.toLowerCase().includes("a50c"))) {
    const redmi = allPhones.find((p) => p.slug === "xiaomi-redmi-a3");
    const infinix = allPhones.find((p) => p.slug === "infinix-smart-8");
    if (redmi && !competitors.some((c) => c.id === redmi.id)) competitors.push(redmi);
    if (infinix && !competitors.some((c) => c.id === infinix.id)) competitors.push(infinix);
  }

  // 3. Fallback: price-range match from rival brands (±45%)
  if (competitors.length < limit) {
    const targetPrice = phone.lowest_verified_price || phone.price_pkr;
    const candidates = allPhones
      .filter(
        (p) =>
          p.id !== phone.id &&
          p.slug !== phone.slug &&
          !competitors.some((c) => c.id === p.id) &&
          p.brand !== phone.brand &&
          Math.abs((p.lowest_verified_price || p.price_pkr) - targetPrice) <=
            targetPrice * 0.45
      )
      .sort(
        (a, b) =>
          Math.abs((a.lowest_verified_price || a.price_pkr) - targetPrice) -
          Math.abs((b.lowest_verified_price || b.price_pkr) - targetPrice)
      );

    for (const c of candidates) {
      competitors.push(c);
      if (competitors.length >= limit) break;
    }
  }

  return competitors;
}

// ─── revalidation helpers (for admin use) ─────────────────────────────────────
/**
 * Call from admin server actions after creating/updating/deleting a phone.
 * Import `revalidateTag` from "next/cache" in your server action and call:
 *
 *   import { revalidateTag } from "next/cache";
 *   import { PHONES_TAG, phoneTag } from "@/lib/phones";
 *
 *   revalidateTag(PHONES_TAG);               // refreshes all phone pages
 *   revalidateTag(phoneTag("apple-iphone-16")); // refreshes one phone page
 */
