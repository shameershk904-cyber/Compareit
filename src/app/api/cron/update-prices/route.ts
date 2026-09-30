import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag, updateTag, revalidatePath } from "next/cache";
import { PHONES_TAG, phoneTag, invalidatePhonesMemoryCache } from "@/lib/phones";
import { scrapeWhatMobilePhonePrice } from "@/lib/scraper/whatmobile";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s if on Vercel Pro, or gracefully finishes within 10-15s

const BATCH_SIZE = 20;
const CONCURRENCY = 3;
const MAX_CONSECUTIVE_FAILURES = 3;

interface UpdateResultDetail {
  slug: string;
  brand: string;
  model: string;
  status: "updated" | "skipped" | "failed";
  oldPrice: number;
  newPrice?: number;
  retailerPrice?: number;
  sourceUrl?: string;
  reason?: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // 1. Authentication Guard: Check Vercel Cron Secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const secretParam = url.searchParams.get("secret");
  const isDryRun = url.searchParams.get("dryRun") === "true";
  const limitParam = parseInt(url.searchParams.get("limit") || `${BATCH_SIZE}`, 10);
  const targetSlug = url.searchParams.get("slug");

  // In production, require CRON_SECRET matching Authorization header or query param
  const isAuthorized =
    Boolean(cronSecret && (authHeader === `Bearer ${cronSecret}` || secretParam === cronSecret)) ||
    (process.env.NODE_ENV === "development" && (!cronSecret || secretParam === "dev-test"));

  if (!isAuthorized) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Invalid or missing CRON_SECRET token.",
      },
      { status: 401 }
    );
  }

  try {
    // 2. Query candidates: prioritize phones with oldest (or null) lastPriceCheck
    const whereClause: Record<string, unknown> = { isActive: true };
    if (targetSlug) {
      whereClause.slug = targetSlug;
    }

    const phones = await prisma.phone.findMany({
      where: whereClause,
      orderBy: [{ lastPriceCheck: { sort: "asc", nulls: "first" } }, { popular: "desc" }],
      take: Math.min(limitParam, 30),
      select: {
        id: true,
        slug: true,
        brand: true,
        model: true,
        pricePkr: true,
        lowestVerifiedPrice: true,
        usdPrice: true,
        lastPriceCheck: true,
        retailers: {
          where: { store: "WhatMobile" },
          select: { id: true, price: true, url: true },
        },
      },
    });

    if (phones.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No candidate phones to update.",
        updated: 0,
        skipped: 0,
        failed: 0,
        durationMs: Date.now() - startTime,
      });
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    let consecutiveFailures = 0;
    let circuitBreakerTripped = false;
    const details: UpdateResultDetail[] = [];
    const updatedSlugs: string[] = [];

    // 3. Process candidate phones in polite concurrent chunks (concurrency: 3)
    for (let i = 0; i < phones.length; i += CONCURRENCY) {
      if (circuitBreakerTripped) {
        console.warn(
          `[CRON:update-prices] Circuit breaker active after ${consecutiveFailures} consecutive failures. Stopping batch.`
        );
        break;
      }

      const chunk = phones.slice(i, i + CONCURRENCY);

      await Promise.all(
        chunk.map(async (phone) => {
          if (circuitBreakerTripped) return;

          const existingWhatMobileUrl = phone.retailers?.[0]?.url;

          try {
            const scrapeRes = await scrapeWhatMobilePhonePrice(
              phone.slug,
              phone.brand,
              phone.model,
              existingWhatMobileUrl
            );

            if (!scrapeRes.success || !scrapeRes.pricePkr) {
              failedCount++;
              if (scrapeRes.statusCode && (scrapeRes.statusCode === 403 || scrapeRes.statusCode === 429)) {
                consecutiveFailures++;
                if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                  circuitBreakerTripped = true;
                }
              }

              // Always update lastPriceCheck so stale/unannounced/discontinued phones move to back of queue
              if (!isDryRun) {
                await prisma.phone.update({
                  where: { id: phone.id },
                  data: { lastPriceCheck: new Date() },
                });
              }

              details.push({
                slug: phone.slug,
                brand: phone.brand,
                model: phone.model,
                status: "failed",
                oldPrice: phone.pricePkr,
                sourceUrl: scrapeRes.url,
                reason: scrapeRes.error || "No valid price returned",
              });

              return;
            }

            // Scrape succeeded: reset consecutive failure counter
            consecutiveFailures = 0;
            const newPkrPrice = scrapeRes.pricePkr;
            const hasPriceChanged = newPkrPrice !== phone.pricePkr;

            if (!isDryRun) {
              // 4. Update or Insert WhatMobile row in PhoneRetailer
              await prisma.phoneRetailer.upsert({
                where: {
                  phoneId_store: {
                    phoneId: phone.id,
                    store: "WhatMobile",
                  },
                },
                create: {
                  phoneId: phone.id,
                  store: "WhatMobile",
                  price: newPkrPrice,
                  delivery: "Official Market Benchmark",
                  inStock: true,
                  condition: "Brand New (Official Warranty)",
                  url: scrapeRes.url,
                  lastCheckedAt: new Date(),
                },
                update: {
                  price: newPkrPrice,
                  url: scrapeRes.url,
                  inStock: true,
                  lastCheckedAt: new Date(),
                },
              });

              // 5. Update Phone model: pricePkr, usdPrice (if available), lowestVerifiedPrice, lastPriceCheck
              const lowestVerifiedPrice =
                phone.lowestVerifiedPrice > 0
                  ? Math.min(phone.lowestVerifiedPrice, newPkrPrice)
                  : newPkrPrice;

              await prisma.phone.update({
                where: { id: phone.id },
                data: {
                  pricePkr: newPkrPrice,
                  lowestVerifiedPrice,
                  ...(scrapeRes.usdPrice ? { usdPrice: scrapeRes.usdPrice } : {}),
                  lastPriceCheck: new Date(),
                },
              });
            }

            updatedCount++;
            updatedSlugs.push(phone.slug);

            details.push({
              slug: phone.slug,
              brand: phone.brand,
              model: phone.model,
              status: "updated",
              oldPrice: phone.pricePkr,
              newPrice: newPkrPrice,
              sourceUrl: scrapeRes.url,
              reason: hasPriceChanged
                ? `Price updated from Rs ${phone.pricePkr.toLocaleString()} to Rs ${newPkrPrice.toLocaleString()}`
                : "Price verified unchanged",
            });
          } catch (err: unknown) {
            failedCount++;
            consecutiveFailures++;
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
              circuitBreakerTripped = true;
            }
            const errMsg = err instanceof Error ? err.message : String(err);
            console.error(`[CRON:update-prices] Error updating ${phone.slug}:`, errMsg);

            // Update lastPriceCheck so it doesn't block the queue
            if (!isDryRun) {
              try {
                await prisma.phone.update({
                  where: { id: phone.id },
                  data: { lastPriceCheck: new Date() },
                });
              } catch {}
            }

            details.push({
              slug: phone.slug,
              brand: phone.brand,
              model: phone.model,
              status: "failed",
              oldPrice: phone.pricePkr,
              reason: errMsg,
            });
          }
        })
      );

      // Polite inter-chunk delay (250ms - 400ms) to respect target server
      if (i + CONCURRENCY < phones.length && !circuitBreakerTripped) {
        await new Promise((resolve) => setTimeout(resolve, 250 + Math.random() * 150));
      }
    }

    // 6. Purge Next.js cache tags so changes reflect immediately across the app
    if (!isDryRun && updatedSlugs.length > 0) {
      try {
        invalidatePhonesMemoryCache();
        updateTag(PHONES_TAG);
        revalidateTag(PHONES_TAG, { expire: 0 });

        for (const slug of updatedSlugs) {
          updateTag(phoneTag(slug));
          revalidateTag(phoneTag(slug), { expire: 0 });
          revalidatePath(`/phone/${slug}`, "page");
        }

        revalidatePath("/", "layout");
        revalidatePath("/compare", "page");
      } catch (cacheErr) {
        console.error("[CRON:update-prices] Cache purge error:", cacheErr);
      }
    }

    // 7. Audit log in database
    if (!isDryRun) {
      try {
        await prisma.activityLog.create({
          data: {
            userEmail: "system:vercel-cron",
            action: "CRON_PRICE_UPDATE",
            entity: "PHONE",
            details: {
              batchSize: phones.length,
              updatedCount,
              skippedCount,
              failedCount,
              circuitBreakerTripped,
              durationMs: Date.now() - startTime,
            },
          },
        });
      } catch (logErr) {
        console.error("[CRON:update-prices] Audit log write error:", logErr);
      }
    }

    return NextResponse.json({
      success: true,
      dryRun: isDryRun,
      summary: {
        totalCandidates: phones.length,
        updated: updatedCount,
        skipped: skippedCount,
        failed: failedCount,
        circuitBreakerTripped,
        durationMs: Date.now() - startTime,
      },
      details,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[CRON:update-prices] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
