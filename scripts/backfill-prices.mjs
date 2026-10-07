/**
 * backfill-prices.mjs
 *
 * One-time full-catalog WhatMobile price backfill.
 * Runs locally — no Vercel function timeout — against all active phones.
 * Uses the production scraper (variant-safety + multi-tier URL fallback).
 *
 * Usage:
 *   node --experimental-strip-types scripts/backfill-prices.mjs [options]
 *
 * Options (all optional, env vars override CLI where noted):
 *   --concurrency=N         Parallel requests per chunk    (default: 3)
 *   --delay=N               Inter-chunk delay in ms        (default: 300, +0-150ms jitter)
 *   --circuit-breaker=N     Max consecutive 429/403 before pause (default: 3)
 *   --cooldown=N            Cooldown ms when circuit breaker trips (default: 60000)
 *   --progress-every=N      Log progress every N phones    (default: 100)
 *   --dry-run               Scrape without writing to DB
 *   --limit=N               Cap total phones processed     (default: all)
 *   --resume-after=SLUG     Skip phones until (exclusive) this slug
 *
 * Examples:
 *   node --experimental-strip-types scripts/backfill-prices.mjs
 *   node --experimental-strip-types scripts/backfill-prices.mjs --dry-run --limit=50
 *   node --experimental-strip-types scripts/backfill-prices.mjs --concurrency=2 --delay=500
 */

import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, writeFileSync } from "fs";
import { scrapeWhatMobilePhonePrice } from "../src/lib/scraper/whatmobile.ts";

// ─── Env ──────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocalPath = join(__dirname, "../.env.local");
const envPath = join(__dirname, "../.env");
if (existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
else if (existsSync(envPath)) dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.startsWith("[") || SUPABASE_SERVICE_ROLE_KEY.trim().length < 50) {
  console.error("❌  Missing or invalid SUPABASE_SERVICE_ROLE_KEY. Real service role key is required (anon-key fallback removed).");
  process.exit(1);
}

const SUPABASE_WRITE_KEY = SUPABASE_SERVICE_ROLE_KEY;

// ─── CLI arg parsing ──────────────────────────────────────────────────────────

function getArg(name, defaultValue) {
  const flag = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(flag));
  if (found) return found.slice(flag.length);
  return defaultValue;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

const CONCURRENCY      = Math.max(1, parseInt(getArg("concurrency", "3"), 10));
const BASE_DELAY_MS    = Math.max(0, parseInt(getArg("delay", "300"), 10));
const JITTER_MS        = 150;
const CB_THRESHOLD     = Math.max(1, parseInt(getArg("circuit-breaker", "3"), 10));
const COOLDOWN_MS      = Math.max(1000, parseInt(getArg("cooldown", "60000"), 10));
const PROGRESS_EVERY   = Math.max(1, parseInt(getArg("progress-every", "100"), 10));
const LIMIT            = parseInt(getArg("limit", "0"), 10); // 0 = all
const RESUME_AFTER     = getArg("resume-after", "");
const DRY_RUN          = hasFlag("dry-run");

// ─── Supabase helpers ─────────────────────────────────────────────────────────

const READ_HEADERS  = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` };
const WRITE_HEADERS = { apikey: SUPABASE_WRITE_KEY, Authorization: `Bearer ${SUPABASE_WRITE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" };

async function supabaseFetch(path, opts = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, { ...opts, headers: { ...(opts.write ? WRITE_HEADERS : READ_HEADERS), ...opts.headers } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status} on ${path}: ${text}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text || text.trim().length === 0) return null;
  return JSON.parse(text);
}

function generateCuid() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 12);
  const rand2 = Math.random().toString(36).substring(2, 6);
  return `c${ts}${rand}${rand2}`;
}

async function fetchAllActivePhones() {
  // Supabase REST API: paginate in chunks of 1000
  let all = [];
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const page = await supabaseFetch(
      `/phones?select=id,slug,brand,model,pricePkr,lowestVerifiedPrice,usdPrice,lastPriceCheck,` +
      `phone_retailers(id,store,price,url)` +
      `&isActive=eq.true&order=lastPriceCheck.asc.nullsfirst,popular.desc` +
      `&limit=${pageSize}&offset=${offset}`
    );
    if (!page || page.length === 0) break;
    all = all.concat(page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

async function upsertRetailer(phoneId, price, url, existingRetailers = []) {
  const existingWhatMobile = existingRetailers?.find((r) => r.store === "WhatMobile");
  if (existingWhatMobile) {
    await supabaseFetch(`/phone_retailers?id=eq.${existingWhatMobile.id}`, {
      method: "PATCH",
      write: true,
      body: JSON.stringify({
        price,
        url,
        inStock: true,
        lastCheckedAt: new Date().toISOString(),
      }),
    });
  } else {
    // Generate cuid for new row since PostgreSQL id column has NOT NULL constraint
    const id = generateCuid();
    try {
      await supabaseFetch(`/phone_retailers`, {
        method: "POST",
        write: true,
        body: JSON.stringify({
          id,
          phoneId,
          store: "WhatMobile",
          price,
          url,
          delivery: "Official Market Benchmark",
          inStock: true,
          condition: "Brand New (Official Warranty)",
          lastCheckedAt: new Date().toISOString(),
        }),
      });
    } catch (err) {
      // In case of conflict/race, try PATCH by phoneId & store
      if (String(err).includes("23505")) {
        await supabaseFetch(`/phone_retailers?phoneId=eq.${phoneId}&store=eq.WhatMobile`, {
          method: "PATCH",
          write: true,
          body: JSON.stringify({
            price,
            url,
            inStock: true,
            lastCheckedAt: new Date().toISOString(),
          }),
        });
      } else {
        throw err;
      }
    }
  }
}

async function updatePhone(id, fields) {
  await supabaseFetch(`/phones?id=eq.${id}`, {
    method: "PATCH",
    write: true,
    body: JSON.stringify(fields),
  });
}

// ─── Time utilities ───────────────────────────────────────────────────────────

function fmtDuration(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}m ${rem}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function fmtPrice(n) {
  return n != null ? `Rs. ${Number(n).toLocaleString()}` : "N/A";
}

function eta(processed, total, elapsedMs) {
  if (processed === 0) return "calculating…";
  const msPerPhone = elapsedMs / processed;
  return fmtDuration(msPerPhone * (total - processed));
}

// ─── Result classification ────────────────────────────────────────────────────

function classifyError(scrapeRes) {
  if (scrapeRes.isVariantMismatch) return "variant_mismatch";
  if (scrapeRes.statusCode === 404) return "not_found_404";
  if (scrapeRes.statusCode === 429) return "rate_limited_429";
  if (scrapeRes.statusCode === 403) return "blocked_403";
  const e = (scrapeRes.error ?? "").toLowerCase();
  if (e.includes("coming soon"))   return "coming_soon";
  if (e.includes("discontinued"))  return "discontinued";
  if (e.includes("timeout"))       return "timeout";
  return "other_error";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═".repeat(74));
  console.log("  COMPAREIT — Full-Catalog WhatMobile Price Backfill");
  console.log("═".repeat(74));
  if (DRY_RUN) console.log("  ⚠️  DRY RUN — no database writes will occur");
  console.log(`  concurrency=${CONCURRENCY}  delay=${BASE_DELAY_MS}+${JITTER_MS}ms jitter  circuit-breaker=${CB_THRESHOLD}  cooldown=${fmtDuration(COOLDOWN_MS)}`);
  console.log();

  // ─── Fetch catalog ───────────────────────────────────────────────────────────
  process.stdout.write("📡 Fetching catalog from Supabase… ");
  let phones = await fetchAllActivePhones();
  console.log(`${phones.length} active phones found.`);

  // Apply --resume-after
  if (RESUME_AFTER) {
    const idx = phones.findIndex((p) => p.slug === RESUME_AFTER);
    if (idx === -1) {
      console.warn(`⚠️  --resume-after slug "${RESUME_AFTER}" not found, starting from beginning.`);
    } else {
      phones = phones.slice(idx + 1);
      console.log(`  Resuming after "${RESUME_AFTER}" → ${phones.length} phones remaining.`);
    }
  }

  // Apply --limit
  if (LIMIT > 0 && phones.length > LIMIT) {
    phones = phones.slice(0, LIMIT);
    console.log(`  --limit applied → processing ${phones.length} phones.`);
  }

  const TOTAL = phones.length;

  // ─── Time estimate ───────────────────────────────────────────────────────────
  const chunksCount = Math.ceil(TOTAL / CONCURRENCY);
  const avgChunkMs  = 2000 + BASE_DELAY_MS + JITTER_MS / 2; // 2s scrape avg + delay
  const estMs       = chunksCount * avgChunkMs;
  console.log();
  console.log(`⏱  Estimated duration: ~${fmtDuration(estMs)}`);
  console.log(`   (${TOTAL} phones / ${CONCURRENCY} concurrent = ${chunksCount} chunks × ~${fmtDuration(avgChunkMs)} avg/chunk)`);
  console.log(`   Safe to let this run in the background.\n`);

  // ─── State ───────────────────────────────────────────────────────────────────
  const startTime = Date.now();
  let updatedCount     = 0;
  let priceChangedCount = 0;
  let failedCount      = 0;
  let consecutiveFails = 0;
  let cbTrips          = 0;
  const failuresByCategory = {};
  const failures = []; // { slug, brand, model, category, error, url }

  let processed = 0;

  // ─── Progress printer ────────────────────────────────────────────────────────
  function printProgress() {
    const elapsed = Date.now() - startTime;
    const pct     = ((processed / TOTAL) * 100).toFixed(1);
    const etaStr  = eta(processed, TOTAL, elapsed);
    console.log(
      `  [${String(processed).padStart(4)}/${TOTAL}]  ${pct}%  ` +
      `✅ updated=${updatedCount}  ❌ failed=${failedCount}  ` +
      `elapsed=${fmtDuration(elapsed)}  ETA=${etaStr}`
    );
  }

  console.log("🚀 Starting backfill…\n");

  // ─── Main loop ───────────────────────────────────────────────────────────────
  for (let i = 0; i < phones.length; i += CONCURRENCY) {
    const chunk = phones.slice(i, i + CONCURRENCY);

    await Promise.all(chunk.map(async (phone) => {
      const wmRetailer     = phone.phone_retailers?.find((r) => r.store === "WhatMobile");
      const existingUrl    = wmRetailer?.url ?? undefined;
      const storedPrice    = wmRetailer?.price ?? phone.pricePkr;

      let scrapeRes;
      try {
        scrapeRes = await scrapeWhatMobilePhonePrice(
          phone.slug,
          phone.brand,
          phone.model,
          existingUrl
        );
      } catch (err) {
        scrapeRes = { success: false, error: String(err), statusCode: 0, url: existingUrl ?? "" };
      }

      if (!scrapeRes.success || !scrapeRes.pricePkr) {
        failedCount++;
        consecutiveFails++;
        const cat = classifyError(scrapeRes);
        failuresByCategory[cat] = (failuresByCategory[cat] || 0) + 1;
        failures.push({
          slug: phone.slug,
          brand: phone.brand,
          model: phone.model,
          category: cat,
          error: scrapeRes.error ?? "No price",
          url: scrapeRes.url,
        });

        // Always stamp lastPriceCheck so this phone moves to the back of the queue
        if (!DRY_RUN) {
          try {
            await updatePhone(phone.id, { lastPriceCheck: new Date().toISOString() });
          } catch { /* non-fatal */ }
        }

        // Circuit breaker: trip on rate-limit / block patterns
        if (scrapeRes.statusCode === 429 || scrapeRes.statusCode === 403) {
          if (consecutiveFails >= CB_THRESHOLD) {
            cbTrips++;
            console.warn(
              `\n  ⚡ Circuit breaker tripped (${consecutiveFails} consecutive 4xx). ` +
              `Cooling down for ${fmtDuration(COOLDOWN_MS)}…`
            );
            await new Promise((r) => setTimeout(r, COOLDOWN_MS));
            consecutiveFails = 0;
            console.log("  ↩️  Resuming after cooldown.\n");
          }
        }
      } else {
        consecutiveFails = 0;
        const newPrice = scrapeRes.pricePkr;
        const changed  = newPrice !== storedPrice;
        if (changed) priceChangedCount++;
        updatedCount++;

        if (!DRY_RUN) {
          try {
            await upsertRetailer(phone.id, newPrice, scrapeRes.url, phone.phone_retailers);
            const lowestVerifiedPrice =
              phone.lowestVerifiedPrice > 0
                ? Math.min(phone.lowestVerifiedPrice, newPrice)
                : newPrice;
            await updatePhone(phone.id, {
              pricePkr: newPrice,
              lowestVerifiedPrice,
              ...(scrapeRes.usdPrice ? { usdPrice: scrapeRes.usdPrice } : {}),
              lastPriceCheck: new Date().toISOString(),
            });
          } catch (dbErr) {
            // DB write failed — count as failure
            updatedCount--;
            failedCount++;
            const cat = "db_write_error";
            failuresByCategory[cat] = (failuresByCategory[cat] || 0) + 1;
            failures.push({
              slug: phone.slug,
              brand: phone.brand,
              model: phone.model,
              category: cat,
              error: String(dbErr),
              url: scrapeRes.url,
            });
          }
        }
      }
    }));

    processed = Math.min(i + CONCURRENCY, TOTAL);

    // Progress report every N phones or at end
    if (processed % PROGRESS_EVERY < CONCURRENCY || processed === TOTAL) {
      printProgress();
    }

    // Polite inter-chunk delay
    if (i + CONCURRENCY < phones.length) {
      const delay = BASE_DELAY_MS + Math.floor(Math.random() * JITTER_MS);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // ─── Final report ─────────────────────────────────────────────────────────────
  const totalMs = Date.now() - startTime;
  console.log();
  console.log("═".repeat(74));
  console.log("  BACKFILL COMPLETE");
  console.log("═".repeat(74));
  console.log();

  const row = (label, value) =>
    console.log(`  ${label.padEnd(44)} ${String(value).padStart(6)}`);

  row("Total phones processed",          processed);
  row("✅  Successfully updated",        updatedCount);
  row("   of which price actually changed", priceChangedCount);
  row("   price verified unchanged",     updatedCount - priceChangedCount);
  row("❌  Failed (all causes)",         failedCount);
  console.log();

  if (Object.keys(failuresByCategory).length > 0) {
    console.log("  Failure breakdown by cause:");
    const labels = {
      not_found_404:    "404 Not found / bad URL",
      variant_mismatch: "Variant mismatch (safety blocked)",
      coming_soon:      "Unreleased / Coming Soon",
      discontinued:     "Discontinued (no active price)",
      rate_limited_429: "Rate-limited (429)",
      blocked_403:      "Blocked by server (403)",
      timeout:          "Timeout",
      db_write_error:   "DB write error",
      other_error:      "Other / unknown error",
    };
    for (const [cat, count] of Object.entries(failuresByCategory).sort(([, a], [, b]) => b - a)) {
      row(`   ${labels[cat] ?? cat}`, count);
    }
  }

  console.log();
  row("Circuit-breaker trips",           cbTrips);
  row("Total wall time",                 fmtDuration(totalMs));
  row("Average per phone",               `${Math.round(totalMs / processed)}ms`);
  console.log(`  Finished at: ${new Date().toISOString()}`);
  if (DRY_RUN) console.log("\n  ⚠️  DRY RUN — no data was written to the database.");

  // Persist failure log so you can investigate or re-run specific slugs
  if (failures.length > 0) {
    const reportPath = join(__dirname, "backfill-failures.json");
    writeFileSync(reportPath, JSON.stringify(failures, null, 2), "utf8");
    console.log(`\n  📄 Failure details saved to: scripts/backfill-failures.json`);
    console.log(`     (Re-run failed phones with: --resume-after or target individual slugs via the cron route)`);
  }

  console.log();
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});
