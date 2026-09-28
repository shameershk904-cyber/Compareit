/**
 * prisma/import-phones.ts
 *
 * Fast batch import script: loads public/data/phones.json into Supabase
 * `phones` + `phone_retailers` tables via Prisma createMany.
 *
 * SAFE TO RE-RUN:
 *  - Uses skipDuplicates: true on unique slug / legacyId.
 *  - Retailer rows are replaced wholesale for phones with retailers.
 *  - Reports newly inserted, skipped (already existing), and total in DB.
 *
 * Usage:
 *   npx tsx --env-file=.env.local prisma/import-phones.ts
 *   npx tsx --env-file=.env.local prisma/import-phones.ts --dry-run
 *   npx tsx --env-file=.env.local prisma/import-phones.ts --brand Apple
 */

import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const BRAND_FILTER = (() => {
  const idx = args.indexOf("--brand");
  return idx !== -1 ? args[idx + 1]?.toLowerCase() : null;
})();
const BATCH_SIZE = 100; // phones per DB batch query

// ─── Types ───────────────────────────────────────────────────────────────────
interface RawPhone {
  id: string;
  slug: string;
  brand: string;
  model: string;
  price_pkr?: number;
  lowest_verified_price?: number;
  usd_price?: number;
  image?: string;
  images?: string[];
  release_date?: string;
  status?: string;
  popular?: boolean;
  trending_rank?: number;
  pta_status?: string;
  pta_tax?: { passport: number; cnic: number };
  warranty?: { duration_months: number; provider: string };
  memory?: object;
  battery?: object;
  display?: object;
  platform?: object;
  camera?: object;
  connectivity?: object;
  expert_verdict?: object;
  color_variants?: object[];
  detailed_specs?: object;
  competitor_ids?: string[];
  banners?: string[];
  retailers?: {
    store: string;
    price: number;
    delivery?: string;
    in_stock?: boolean;
    condition?: string;
    url?: string;
  }[];
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  CompareIt.pk — phones.json → Supabase import");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (DRY_RUN) console.log("  🚧 DRY RUN — no writes will be made");
  if (BRAND_FILTER) console.log(`  🔍 Brand filter: "${BRAND_FILTER}"`);
  console.log();

  // Load source data
  const jsonPath = path.join(process.cwd(), "public", "data", "phones.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("❌  phones.json not found at", jsonPath);
    process.exit(1);
  }
  const allPhones: RawPhone[] = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  // Apply optional brand filter
  const phones = BRAND_FILTER
    ? allPhones.filter((p) => p.brand?.toLowerCase() === BRAND_FILTER)
    : allPhones;

  console.log(`📦  Source: ${allPhones.length} total phones in phones.json`);
  console.log(`📋  To process: ${phones.length} phones${BRAND_FILTER ? ` (brand="${BRAND_FILTER}")` : ""}`);
  console.log(`⚙️   Batch size: ${BATCH_SIZE}`);
  console.log();

  if (phones.length === 0) {
    console.log("Nothing to import. Exiting.");
    return;
  }

  if (DRY_RUN) {
    console.log("DRY RUN complete. Would process", phones.length, "phones.");
    return;
  }

  const prisma = new PrismaClient();

  let newlyInserted = 0;
  let alreadyExisting = 0;
  let skippedInvalid = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const initialCount = await prisma.phone.count();
    console.log(`📊  Current phones in Supabase before import: ${initialCount}\n`);

    // Chunk phones into batches
    const batches: RawPhone[][] = [];
    for (let i = 0; i < phones.length; i += BATCH_SIZE) {
      batches.push(phones.slice(i, i + BATCH_SIZE));
    }

    console.log(`🚀  Importing ${phones.length} phones in ${batches.length} batches...\n`);

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      const batchStart = batchIdx * BATCH_SIZE + 1;
      const batchEnd = Math.min(batchStart + batch.length - 1, phones.length);

      const validPhones: RawPhone[] = [];
      for (const p of batch) {
        if (!p.id || !p.slug) {
          skippedInvalid++;
        } else {
          validPhones.push(p);
        }
      }

      if (validPhones.length === 0) continue;

      const batchData = validPhones.map((p) => ({
        legacyId: p.id,
        slug: p.slug,
        brand: p.brand ?? "",
        model: p.model ?? "",
        pricePkr: Math.max(0, Math.round(p.price_pkr ?? 0)),
        lowestVerifiedPrice: Math.max(0, Math.round(p.lowest_verified_price ?? 0)),
        usdPrice: p.usd_price ?? 0,
        image: p.image ?? "",
        images: (p.images ?? []) as object,
        releaseDate: String(p.release_date ?? ""),
        status: p.status ?? "Available",
        isActive: true,
        popular: p.popular ?? false,
        trendingRank: p.trending_rank ?? 0,
        ptaStatus: p.pta_status ?? "",
        ptaTax: p.pta_tax ?? null,
        warranty: p.warranty ?? null,
        memory: (p.memory ?? {}) as object,
        battery: (p.battery ?? {}) as object,
        display: (p.display ?? {}) as object,
        platform: (p.platform ?? {}) as object,
        camera: (p.camera ?? {}) as object,
        connectivity: (p.connectivity ?? {}) as object,
        expertVerdict: p.expert_verdict ?? null,
        colorVariants: (p.color_variants ?? []) as object,
        detailedSpecs: (p.detailed_specs ?? {}) as object,
        competitorIds: (p.competitor_ids ?? []) as object,
        banners: (p.banners ?? []) as object,
      }));

      try {
        const result = await prisma.phone.createMany({
          data: batchData as any,
          skipDuplicates: true,
        });

        const inserted = result.count;
        const skipped = batchData.length - inserted;

        newlyInserted += inserted;
        alreadyExisting += skipped;

        console.log(
          `  Batch ${batchIdx + 1}/${batches.length} (${batchStart}-${batchEnd}): +${inserted} inserted, ${skipped} already existed`
        );
      } catch (err: unknown) {
        failed += batchData.length;
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`[Batch ${batchIdx + 1}] ${msg}`);
        console.error(`  Batch ${batchIdx + 1} error:`, msg);
      }
    }

    // ─── Retailers sync ─────────────────────────────────────────────────────
    const phonesWithRetailers = phones.filter((p) => p.retailers && p.retailers.length > 0);
    console.log(`\n🏪  Syncing retailers for ${phonesWithRetailers.length} phones...`);

    if (phonesWithRetailers.length > 0) {
      // Fetch phone IDs in chunks of 200
      const phoneIdMap = new Map<string, string>();
      for (let i = 0; i < phonesWithRetailers.length; i += 200) {
        const chunk = phonesWithRetailers.slice(i, i + 200);
        const rows = await prisma.phone.findMany({
          where: { legacyId: { in: chunk.map((p) => p.id) } },
          select: { id: true, legacyId: true },
        });
        for (const row of rows) {
          if (row.legacyId) phoneIdMap.set(row.legacyId, row.id);
        }
      }

      // Collect all retailer records
      const allRetailers: {
        phoneId: string;
        store: string;
        price: number;
        delivery: string;
        inStock: boolean;
        condition: string;
        url: string;
      }[] = [];

      const phoneIdsToClear: string[] = [];

      for (const p of phonesWithRetailers) {
        const phoneDbId = phoneIdMap.get(p.id);
        if (!phoneDbId) continue;
        phoneIdsToClear.push(phoneDbId);

        for (const r of p.retailers ?? []) {
          allRetailers.push({
            phoneId: phoneDbId,
            store: r.store ?? "",
            price: Math.max(0, Math.round(r.price ?? 0)),
            delivery: r.delivery ?? "",
            inStock: r.in_stock ?? true,
            condition: r.condition ?? "",
            url: r.url ?? "",
          });
        }
      }

      // Clear existing retailers for these phones
      for (let i = 0; i < phoneIdsToClear.length; i += 200) {
        const idChunk = phoneIdsToClear.slice(i, i + 200);
        await prisma.phoneRetailer.deleteMany({
          where: { phoneId: { in: idChunk } },
        });
      }

      // Insert all retailers in chunks
      for (let i = 0; i < allRetailers.length; i += 300) {
        const rChunk = allRetailers.slice(i, i + 300);
        await prisma.phoneRetailer.createMany({
          data: rChunk,
        });
      }

      console.log(`  ✓ Synced ${allRetailers.length} retailer listings`);
    }

    const finalCount = await prisma.phone.count();
    const finalRetailerCount = await prisma.phoneRetailer.count();

    // ─── Report ─────────────────────────────────────────────────────────────
    console.log();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  IMPORT SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Newly imported      : ${newlyInserted}`);
    console.log(`  Already in database : ${alreadyExisting}`);
    console.log(`  Skipped (no id/slug): ${skippedInvalid}`);
    console.log(`  Failed batches      : ${failed}`);
    console.log(`  Total phones in DB  : ${finalCount} / ${allPhones.length}`);
    console.log(`  Total retailers in DB: ${finalRetailerCount}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (errors.length > 0) {
      console.log("\n  Errors:");
      errors.forEach((e) => console.log("  -", e));
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
