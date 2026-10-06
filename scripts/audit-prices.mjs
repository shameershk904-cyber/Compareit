/**
 * audit-prices.mjs
 *
 * Canonical WhatMobile price audit script.
 * Fetches a random sample of phones from the database, scrapes their live
 * WhatMobile pages through the production scraper (including the variant-
 * safety check and multi-tier URL fallback), and prints a categorised report.
 *
 * Usage:
 *   node --experimental-strip-types scripts/audit-prices.mjs [sampleSize] [minPricePkr] [maxBrandDiversity]
 *
 *   sampleSize      – number of phones to audit (default: 15)
 *   minPricePkr     – only include phones above this price (default: 0, all phones)
 *   maxBrandDiversity – max phones per brand (default: 3)
 *
 * Examples:
 *   node --experimental-strip-types scripts/audit-prices.mjs
 *   node --experimental-strip-types scripts/audit-prices.mjs 30
 *   node --experimental-strip-types scripts/audit-prices.mjs 20 15000 2
 */

import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { scrapeWhatMobilePhonePrice } from "../src/lib/scraper/whatmobile.ts";

// ─── Env setup ────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocalPath = join(__dirname, "../.env.local");
const envPath = join(__dirname, "../.env");
if (existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
else if (existsSync(envPath)) dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env.");
  process.exit(1);
}

const SUPABASE_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

// ─── CLI args ─────────────────────────────────────────────────────────────────

const [, , rawSize, rawMinPrice, rawDiversity] = process.argv;
const SAMPLE_SIZE = Math.max(1, parseInt(rawSize ?? "15", 10) || 15);
const MIN_PRICE = parseInt(rawMinPrice ?? "0", 10) || 0;
const MAX_PER_BRAND = Math.max(1, parseInt(rawDiversity ?? "3", 10) || 3);

// ─── DB fetch ─────────────────────────────────────────────────────────────────

async function fetchPhones() {
  const priceFilter = MIN_PRICE > 0 ? `&pricePkr=gte.${MIN_PRICE}` : "&pricePkr=gt.0";
  const url =
    `${SUPABASE_URL}/rest/v1/phones` +
    `?select=id,slug,brand,model,pricePkr,lowestVerifiedPrice,lastPriceCheck,` +
    `phone_retailers(id,store,price,url,lastCheckedAt)` +
    `${priceFilter}&limit=500`;

  const res = await fetch(url, { headers: SUPABASE_HEADERS });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Sampling ─────────────────────────────────────────────────────────────────

/**
 * Returns `count` phones spread across brands (≤ maxPerBrand per brand).
 * Uses a Fisher-Yates shuffle for proper randomness.
 */
function samplePhones(phones, count, maxPerBrand) {
  // Fisher-Yates shuffle
  const arr = [...phones];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  const selected = [];
  const brandCount = {};
  for (const p of arr) {
    const b = (p.brand || "Other").toLowerCase();
    if ((brandCount[b] || 0) < maxPerBrand) {
      selected.push(p);
      brandCount[b] = (brandCount[b] || 0) + 1;
      if (selected.length === count) break;
    }
  }
  return selected;
}

// ─── Reporting helpers ────────────────────────────────────────────────────────

const CATEGORIES = {
  MATCH: "✅  Match (identical price)",
  STALE: "⚠️   Stale (correct URL, price changed)",
  VARIANT_MISMATCH: "🛡️  Wrong (variant mismatch caught)",
  NOT_FOUND: "❌  Wrong (404 / unlisted on WhatMobile)",
  COMING_SOON: "🕐  Unreleased (Coming Soon)",
  DISCONTINUED: "⚠️   Discontinued (no active price)",
  ERROR: "💥  Error (scrape failed)",
};

function classifyResult(prev, scrapeRes) {
  if (!scrapeRes.success) {
    if (scrapeRes.isVariantMismatch) return CATEGORIES.VARIANT_MISMATCH;
    if (scrapeRes.statusCode === 404) return CATEGORIES.NOT_FOUND;
    const err = (scrapeRes.error || "").toLowerCase();
    if (err.includes("coming soon")) return CATEGORIES.COMING_SOON;
    if (err.includes("discontinued")) return CATEGORIES.DISCONTINUED;
    return CATEGORIES.ERROR;
  }
  if (scrapeRes.pricePkr === prev.storedPrice) return CATEGORIES.MATCH;
  return CATEGORIES.STALE;
}

function daysOld(dateStr) {
  if (!dateStr) return { str: "No record (~15d since seed)", num: 15 };
  const diff = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  return { str: `${diff.toFixed(1)} days`, num: parseFloat(diff.toFixed(1)) };
}

function fmtPrice(n) {
  return n != null ? `Rs. ${Number(n).toLocaleString()}` : "N/A";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═".repeat(72));
  console.log(`  WhatMobile Price Audit  |  sample=${SAMPLE_SIZE}  minPrice=${MIN_PRICE > 0 ? MIN_PRICE : "all"}  maxPerBrand=${MAX_PER_BRAND}`);
  console.log("═".repeat(72));

  console.log("\n📡 Fetching phones from database...");
  const allPhones = await fetchPhones();
  console.log(`   Retrieved ${allPhones.length} eligible phones.\n`);

  const selected = samplePhones(allPhones, SAMPLE_SIZE, MAX_PER_BRAND);
  if (selected.length === 0) {
    console.error("❌  No phones matched the filters. Try lowering minPricePkr.");
    process.exit(1);
  }

  console.log(`📋 Selected ${selected.length} phones:\n`);
  selected.forEach((p, i) => {
    const wmRetailer = p.phone_retailers?.find(r => r.store?.toLowerCase().includes("whatmobile"));
    console.log(
      `   ${String(i + 1).padStart(2)}. [${p.brand}] ${p.model}  ` +
      `stored=${fmtPrice(wmRetailer?.price ?? p.pricePkr)}  ` +
      `lastCheck=${p.lastPriceCheck ?? wmRetailer?.lastCheckedAt ?? "null"}`
    );
  });

  const now = new Date();
  const report = [];
  const counts = Object.fromEntries(Object.values(CATEGORIES).map(c => [c, 0]));

  console.log("\n🔍 Scraping WhatMobile...\n");

  for (let i = 0; i < selected.length; i++) {
    const p = selected[i];
    const wmRetailer = p.phone_retailers?.find(r => r.store?.toLowerCase().includes("whatmobile"));
    const storedPrice = wmRetailer?.price ?? p.pricePkr;
    const existingUrl = wmRetailer?.url;
    const age = daysOld(p.lastPriceCheck ?? wmRetailer?.lastCheckedAt);

    process.stdout.write(
      `[${String(i + 1).padStart(2)}/${selected.length}] ${p.brand} ${p.model} ... `
    );

    let scrapeRes;
    try {
      scrapeRes = await scrapeWhatMobilePhonePrice(p.slug, p.brand, p.model, existingUrl);
    } catch (err) {
      scrapeRes = { success: false, error: String(err), statusCode: 0, url: existingUrl ?? "" };
    }

    const category = classifyResult({ storedPrice }, scrapeRes);
    counts[category] = (counts[category] || 0) + 1;

    const livePriceFmt = scrapeRes.success ? fmtPrice(scrapeRes.pricePkr) : "N/A";
    console.log(`${category}`);
    if (scrapeRes.success) {
      console.log(
        `     stored=${fmtPrice(storedPrice)}  live=${livePriceFmt}  ` +
        `age=${age.str}  heading="${scrapeRes.heading ?? ""}"`
      );
    } else {
      console.log(`     error=${scrapeRes.error ?? "unknown"}  url=${scrapeRes.url}`);
    }

    report.push({
      idx: i + 1,
      slug: p.slug,
      brand: p.brand,
      model: p.model,
      storedPrice,
      livePrice: scrapeRes.pricePkr ?? null,
      category,
      daysOld: age.num,
      daysOldStr: age.str,
      lastPriceCheck: p.lastPriceCheck ?? wmRetailer?.lastCheckedAt ?? null,
      url: scrapeRes.url,
      heading: scrapeRes.heading ?? null,
      pageTitle: scrapeRes.pageTitle ?? null,
      isVariantMismatch: scrapeRes.isVariantMismatch ?? false,
      usedCachedUrl: scrapeRes.usedCachedUrl ?? false,
      statusCode: scrapeRes.statusCode,
      error: scrapeRes.success ? null : (scrapeRes.error ?? null),
    });

    // Polite delay between requests
    if (i < selected.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // ─── Summary ──────────────────────────────────────────────────────────────

  console.log("\n" + "═".repeat(72));
  console.log("  AUDIT SUMMARY");
  console.log("═".repeat(72));

  const total = report.length;
  const matchCount     = counts[CATEGORIES.MATCH] || 0;
  const staleCount     = counts[CATEGORIES.STALE] || 0;
  const variantCount   = counts[CATEGORIES.VARIANT_MISMATCH] || 0;
  const notFoundCount  = counts[CATEGORIES.NOT_FOUND] || 0;
  const comingSoon     = counts[CATEGORIES.COMING_SOON] || 0;
  const discontinued   = counts[CATEGORIES.DISCONTINUED] || 0;
  const errors         = counts[CATEGORIES.ERROR] || 0;

  const row = (label, n) =>
    console.log(`  ${label.padEnd(46)} ${String(n).padStart(3)} / ${total}  (${((n / total) * 100).toFixed(0)}%)`);

  row("✅  Exact price matches", matchCount);
  row("⚠️   Stale (correct URL, price changed)", staleCount);
  row("🛡️  Variant mismatches intercepted", variantCount);
  row("❌  Not found / wrong URL (404)", notFoundCount);
  row("🕐  Unreleased (coming soon)", comingSoon);
  row("⚠️   Discontinued", discontinued);
  row("💥  Scrape errors", errors);

  const avgAge = report
    .filter(r => r.daysOld != null)
    .reduce((sum, r) => sum + r.daysOld, 0) / (report.filter(r => r.daysOld != null).length || 1);

  console.log(`\n  Average price-check age : ${avgAge.toFixed(1)} days`);
  console.log(`  Ran at                  : ${now.toISOString()}`);
  console.log("═".repeat(72));

  // Stale price delta summary
  const staleItems = report.filter(r => r.category === CATEGORIES.STALE && r.livePrice);
  if (staleItems.length > 0) {
    console.log("\n  Price deltas for stale phones:");
    staleItems.forEach(r => {
      const delta = r.livePrice - r.storedPrice;
      const sign = delta >= 0 ? "+" : "";
      console.log(
        `    [${r.brand}] ${r.model.padEnd(30)} stored=${fmtPrice(r.storedPrice)}  live=${fmtPrice(r.livePrice)}  Δ=${sign}${delta.toLocaleString()}`
      );
    });
  }

  // Variant mismatches detail
  const vmItems = report.filter(r => r.category === CATEGORIES.VARIANT_MISMATCH);
  if (vmItems.length > 0) {
    console.log("\n  Blocked variant mismatches:");
    vmItems.forEach(r => {
      console.log(`    [${r.brand}] ${r.model}  →  page heading: "${r.heading}"`);
      console.log(`    Error: ${r.error}`);
    });
  }

  console.log();
}

main().catch(err => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});
