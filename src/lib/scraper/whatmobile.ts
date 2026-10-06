/**
 * WhatMobile.com.pk Scraper & Price Parser
 *
 * Extracts verified PKR and USD prices from WhatMobile product pages.
 */

import https from "https";

export interface ScrapedPriceResult {
  success: boolean;
  pricePkr?: number;
  usdPrice?: number;
  url: string;
  error?: string;
  statusCode?: number;
  heading?: string;
  pageTitle?: string;
  isVariantMismatch?: boolean;
  usedCachedUrl?: boolean;
}

export interface VariantSafetyResult {
  isSafe: boolean;
  reason?: string;
  expectedVariant?: string;
  actualVariant?: string;
}

// Canonical map for high-traffic phones where slug differs from WhatMobile URL path
export const WHATMOBILE_URL_MAP: Record<string, string> = {
  "samsung-galaxy-s24-ultra": "/Samsung_Galaxy-S24-Ultra",
  "samsung-galaxy-s24-plus": "/Samsung_Galaxy-S24-Plus",
  "samsung-galaxy-s24": "/Samsung_Galaxy-S24",
  "samsung-galaxy-a55-5g": "/Samsung_Galaxy-A55",
  "samsung-galaxy-a35-5g": "/Samsung_Galaxy-A35",
  "samsung-galaxy-a15": "/Samsung_Galaxy-A15",
  "samsung-galaxy-a05s": "/Samsung_Galaxy-A05s",
  "samsung-galaxy-a05": "/Samsung_Galaxy-A05",
  "samsung-galaxy-s23-fe": "/Samsung_Galaxy-S23-FE",
  "apple-iphone-15-pro-max": "/Apple_iPhone-15-Pro-Max",
  "apple-iphone-15-pro": "/Apple_iPhone-15-Pro",
  "apple-iphone-15": "/Apple_iPhone-15",
  "apple-iphone-14": "/Apple_iPhone-14",
  "apple-iphone-13": "/Apple_iPhone-13",
  "xiaomi-redmi-a3": "/Xiaomi_Redmi-A3",
  "xiaomi-14-ultra": "/Xiaomi_14-Ultra",
  "xiaomi-redmi-note-13": "/Xiaomi_Redmi-Note-13",
  "xiaomi-redmi-note-13-pro": "/Xiaomi_Redmi-Note-13-Pro",
  "xiaomi-poco-f6": "/Xiaomi_Poco-F6",
  "xiaomi-poco-x6-pro": "/Xiaomi_Poco-X6-Pro",
  "oppo-reno-11f-5g": "/Oppo_Reno-11F",
  "tecno-camon-30-pro-5g": "/Tecno_Camon-30-Pro",
  "realme-12-pro-plus-5g": "/Realme_12-Pro-Plus",
  "vivo-v30-5g": "/Vivo_V30",
  "sparx-edge-20-pro": "/Sparx_Edge-20-Pro",
  "infinix-smart-8": "/Infinix_Smart-8",
  "infinix-note-40": "/Infinix_Note-40",
  "infinix-hot-40-pro": "/Infinix_Hot-40-Pro",
  "infinix-gt-20-pro": "/Infinix_GT-20-Pro",
  "tecno-camon-30": "/Tecno_Camon-30",
  "tecno-spark-20-pro-plus": "/Tecno_Spark-20-Pro-Plus",
  "tecno-spark-go-2024": "/Tecno_Spark-Go-2024",
  "nokia-5710": "/Nokia_5710-Xpress-Audio",
  "itel-s23-plus": "/itel_S23-Plus",
  "itel-a70": "/itel_A70",
  "vivo-v30": "/Vivo_V30",
  "vivo-v30e": "/Vivo_V30e",
  "vivo-y27s": "/Vivo_Y27s",
  "oppo-reno-11-f": "/Oppo_Reno-11F",
  "realme-12-plus": "/Realme_12-Plus",
  "realme-c67": "/Realme_C67",
};

// In-memory runtime cache for confirmed working WhatMobile URLs
export const CONFIRMED_URL_CACHE = new Map<string, string>();

export function getCachedConfirmedUrl(slug: string): string | undefined {
  return CONFIRMED_URL_CACHE.get(slug) || WHATMOBILE_URL_MAP[slug];
}

export function setCachedConfirmedUrl(slug: string, urlOrPath: string): void {
  let path = urlOrPath;
  if (path.startsWith("http")) {
    try {
      path = new URL(path).pathname;
    } catch {}
  }
  if (path && path.startsWith("/")) {
    CONFIRMED_URL_CACHE.set(slug, path);
  }
}

/**
 * Resolves a WhatMobile path for a given phone slug, brand, and model
 */
export function resolveWhatMobilePath(slug: string, brand: string, model: string): string {
  if (WHATMOBILE_URL_MAP[slug]) {
    return WHATMOBILE_URL_MAP[slug];
  }

  const b = (brand || "").trim();
  const cleanBrand = b.replace(/\s+/g, "_");

  // Strip redundant leading brand if present in model (e.g. "Vivo Vivo V30 5G" -> "V30 5G")
  let cleanModel = (model || "").trim();
  while (cleanModel.toLowerCase().startsWith(b.toLowerCase() + " ")) {
    cleanModel = cleanModel.slice(b.length).trim();
  }

  // Handle sub-brands (e.g., Poco phones are filed under Xiaomi_Poco- on WhatMobile)
  let prefix = cleanBrand;
  if (/^poco/i.test(cleanModel) && cleanBrand.toLowerCase() !== "xiaomi") {
    prefix = "Xiaomi";
  }

  // Sanitize symbols: "+" -> "-Plus", strip trailing " 5G" or " 4G"
  cleanModel = cleanModel
    .replace(/\+/g, "-Plus")
    .replace(/\s+(5G|4G)$/i, "")
    .replace(/\s+/g, "-");

  return `/${prefix}_${cleanModel}`;
}

/**
 * Fetches HTML from WhatMobile with redirect handling, polite timeout, and browser headers
 */
function fetchWhatMobileHtml(urlPath: string, timeoutMs = 8000): Promise<{ status: number; html: string }> {
  return new Promise((resolve, reject) => {
    const cleanPath = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
    const options = {
      hostname: "www.whatmobile.com.pk",
      path: cleanPath,
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    };

    const req = https.request(options, (res) => {
      // Follow 301/302 redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectPath = res.headers.location;
        if (redirectPath.startsWith("http")) {
          try {
            const parsed = new URL(redirectPath);
            redirectPath = parsed.pathname + parsed.search;
          } catch {
            // Keep as is
          }
        }
        return fetchWhatMobileHtml(redirectPath, timeoutMs).then(resolve).catch(reject);
      }

      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({ status: res.statusCode || 200, html: data });
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Timeout after ${timeoutMs}ms fetching ${urlPath}`));
    });

    req.on("error", (err) => reject(err));
    req.end();
  });
}

/**
 * Parses live PKR and USD prices from WhatMobile HTML
 */
export function parseWhatMobilePrice(html: string): { pricePkr?: number; usdPrice?: number } | null {
  if (!html || typeof html !== "string") return null;

  // Pattern 1: Price in Rs: <strong>52,999</strong>
  // Pattern 2: Price in Rs: <b>52,999</b> or Price in Rs: 52,999
  const pkrMatch =
    html.match(/Price\s+in\s+Rs\.?:\s*<[^>]+>([\d,]+)<\/[^>]+>/i) ||
    html.match(/Price\s+in\s+Rs\.?:?\s*([\d,]+)/i);

  let pricePkr: number | undefined;
  if (pkrMatch && pkrMatch[1]) {
    const rawDigits = pkrMatch[1].replace(/,/g, "").trim();
    const parsed = parseInt(rawDigits, 10);
    // Sanity check: valid retail phone price in PKR is typically 3,000 to 1,500,000
    if (!isNaN(parsed) && parsed >= 1000 && parsed <= 2000000) {
      pricePkr = parsed;
    }
  }

  // Parse USD: Price in USD: <strong>$162</strong>
  const usdMatch =
    html.match(/Price\s+in\s+USD:\s*<[^>]+>\$?([\d,]+)<\/[^>]+>/i) ||
    html.match(/Price\s+in\s+USD:?\s*\$?([\d,]+)/i);

  let usdPrice: number | undefined;
  if (usdMatch && usdMatch[1]) {
    const rawDigits = usdMatch[1].replace(/,/g, "").trim();
    const parsed = parseInt(rawDigits, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 5000) {
      usdPrice = parsed;
    }
  }

  if (pricePkr !== undefined) {
    return { pricePkr, usdPrice };
  }

  return null;
}

/**
 * Canonical variant tokens that distinguish model editions within a phone family
 */
export const VARIANT_KEYWORDS: string[] = [
  "special edition",
  "fan edition",
  "pro plus",
  "pro+",
  "pro max",
  "pro",
  "plus",
  "ultra",
  "max",
  "lite",
  "mini",
  "fe",
  "neo",
  "gt",
  "play",
  "power",
  "prime",
  "se",
  "youth",
  "zoom",
  "sport",
  "explorer",
  "turbo",
  "ace",
];

function normalizeText(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts distinct variant tokens from text (e.g. "Special Edition", "Pro Max")
 */
export function extractVariantTokens(text: string): string[] {
  const norm = normalizeText(text);
  const words = norm.split(" ");
  const found = new Set<string>();

  for (const kw of VARIANT_KEYWORDS) {
    const kwNorm = normalizeText(kw);
    if (kwNorm.includes(" ")) {
      if (norm.includes(kwNorm)) {
        found.add(kwNorm);
      }
    } else {
      if (words.includes(kwNorm)) {
        found.add(kwNorm);
      }
    }
  }

  // Remove subsumed substrings: if "pro max" is present, don't also treat as separate "pro" or "max"
  if (found.has("pro max")) {
    found.delete("pro");
    found.delete("max");
  }
  if (found.has("pro plus")) {
    found.delete("pro");
    found.delete("plus");
  }

  return Array.from(found);
}

/**
 * Validates that a scraped page's title and heading actually correspond to the intended phone variant,
 * preventing silent wrong-product matches (e.g. base model matching a Special Edition or Pro variant).
 */
export function checkVariantSafety(
  brand: string,
  model: string,
  pageHeading: string,
  pageTitle: string
): VariantSafetyResult {
  const modelVariants = extractVariantTokens(model);
  const pageText = `${pageHeading || ""} ${pageTitle || ""}`;
  const pageVariants = extractVariantTokens(pageText);

  // 1. If DB model requires specific variant(s), page MUST contain them
  for (const v of modelVariants) {
    if (!pageVariants.includes(v)) {
      return {
        isSafe: false,
        reason: `Model requires variant '${v}', but page only contains [${pageVariants.join(", ") || "none"}]`,
        expectedVariant: v,
        actualVariant: pageVariants.join(", ") || "none",
      };
    }
  }

  // 2. If page has prominent variant(s) that DB model DOES NOT have, it is a mismatch
  // E.g. DB is base "iPhone 15", page is "iPhone 15 Pro"
  for (const pv of pageVariants) {
    if (!modelVariants.includes(pv)) {
      return {
        isSafe: false,
        reason: `Page is for variant '${pv}', but model is '${model}' (not a '${pv}' variant)`,
        expectedVariant: modelVariants.join(", ") || "none",
        actualVariant: pv,
      };
    }
  }

  // 3. Network generation check (5G vs 4G)
  const normModel = normalizeText(model);
  const normPage = normalizeText(pageText);
  const modelHas5G = /\b5g\b/.test(normModel);
  const modelHas4G = /\b4g\b/.test(normModel);
  const pageHas5G = /\b5g\b/.test(normPage);
  const pageHas4G = /\b4g\b/.test(normPage);

  if (modelHas4G && pageHas5G && !pageHas4G) {
    return {
      isSafe: false,
      reason: "Model specifies 4G, but page represents a 5G variant",
      expectedVariant: "4G",
      actualVariant: "5G",
    };
  }

  // 4. Core identifier check: verify core numeric / key tokens are present on page
  let coreModel = normalizeText(model);
  for (const v of modelVariants) {
    coreModel = coreModel.replace(new RegExp(`\\b${v}\\b`, "g"), "").trim();
  }
  coreModel = coreModel.replace(/\s+/g, " ").trim();

  if (coreModel.length >= 2) {
    const coreWords = coreModel.split(" ").filter((w) => w.length > 1);
    const missingCoreWord = coreWords.some((w) => !normPage.includes(w));
    if (missingCoreWord) {
      return {
        isSafe: false,
        reason: `Core model '${coreModel}' not found in page heading or title`,
        expectedVariant: coreModel,
        actualVariant: pageText.slice(0, 50),
      };
    }
  }

  return { isSafe: true };
}

/**
 * Generates intelligent fallback candidate paths for WhatMobile
 */
export function generateFallbackPaths(slug: string, brand: string, model: string): string[] {
  const fallbacks: string[] = [];
  const b = (brand || "").trim();
  const cleanBrand = b.replace(/\s+/g, "_");
  let cleanModel = (model || "").trim();
  while (cleanModel.toLowerCase().startsWith(b.toLowerCase() + " ")) {
    cleanModel = cleanModel.slice(b.length).trim();
  }

  // 1. Nokia XpressAudio / Xpress Audio
  if (b.toLowerCase() === "nokia" && cleanModel.includes("5710")) {
    fallbacks.push("/Nokia_5710-Xpress-Audio");
    fallbacks.push("/Nokia_5710-XpressAudio");
  }

  // 2. Sub-brand Poco under Xiaomi
  if (/^poco/i.test(cleanModel)) {
    const pocoModel = cleanModel.replace(/^poco\s*/i, "Poco-");
    fallbacks.push(`/Xiaomi_${pocoModel}`);
  }

  // 3. Lowercase brand prefix (e.g. itel_ vs Itel_)
  if (cleanBrand.toLowerCase() === "itel") {
    const itelModel = cleanModel.replace(/\+/g, "-Plus").replace(/\s+/g, "-");
    fallbacks.push(`/itel_${itelModel}`);
    fallbacks.push(`/Itel_${itelModel}`);
  }

  // 4. Strip trailing 5G / 4G
  if (/\s+(5G|4G)$/i.test(cleanModel)) {
    const stripped = cleanModel
      .replace(/\s+(5G|4G)$/i, "")
      .trim()
      .replace(/\+/g, "-Plus")
      .replace(/\s+/g, "-");
    fallbacks.push(`/${cleanBrand}_${stripped}`);
  }

  // 5. Hyphen variations for multi-word models
  const hyphenModel = cleanModel.replace(/\s+/g, "-").replace(/\+/g, "-Plus");
  fallbacks.push(`/${cleanBrand}_${hyphenModel}`);

  return fallbacks;
}

/**
 * Returns prioritized list of candidate WhatMobile paths to try:
 * 1. Cached confirmed URL from DB / caller
 * 2. Runtime cached confirmed URL
 * 3. Static canonical map
 * 4. Primary resolved path
 * 5. Intelligent fallback variations
 */
export function getCandidateWhatMobilePaths(
  slug: string,
  brand: string,
  model: string,
  existingUrl?: string
): string[] {
  const candidates: string[] = [];

  // 1. Cached confirmed URL from DB / caller
  if (existingUrl && existingUrl.includes("whatmobile.com.pk")) {
    try {
      const parsed = new URL(existingUrl);
      if (parsed.pathname && parsed.pathname.length > 1 && !candidates.includes(parsed.pathname)) {
        candidates.push(parsed.pathname);
      }
    } catch {}
  }

  // 2. Runtime cached confirmed URL
  const runtimeCached = CONFIRMED_URL_CACHE.get(slug);
  if (runtimeCached && !candidates.includes(runtimeCached)) {
    candidates.push(runtimeCached);
  }

  // 3. Static canonical map
  if (WHATMOBILE_URL_MAP[slug] && !candidates.includes(WHATMOBILE_URL_MAP[slug])) {
    candidates.push(WHATMOBILE_URL_MAP[slug]);
  }

  // 4. Primary resolved path
  const primaryPath = resolveWhatMobilePath(slug, brand, model);
  if (!candidates.includes(primaryPath)) {
    candidates.push(primaryPath);
  }

  // 5. Intelligent fallback variations
  const fallbacks = generateFallbackPaths(slug, brand, model);
  for (const fb of fallbacks) {
    if (!candidates.includes(fb)) {
      candidates.push(fb);
    }
  }

  return candidates;
}

/**
 * Scrapes WhatMobile for a phone's price using cached confirmed URLs,
 * candidate fallbacks, and strict variant-suffix safety checks.
 */
export async function scrapeWhatMobilePhonePrice(
  slug: string,
  brand: string,
  model: string,
  existingUrl?: string
): Promise<ScrapedPriceResult> {
  const candidatePaths = getCandidateWhatMobilePaths(slug, brand, model, existingUrl);
  let lastError = "";
  let lastStatusCode = 404;
  let variantMismatchError = "";
  let variantMismatchHeading = "";
  let variantMismatchTitle = "";

  for (let i = 0; i < candidatePaths.length; i++) {
    const targetPath = candidatePaths[i];
    const fullUrl = `https://www.whatmobile.com.pk${targetPath.startsWith("/") ? targetPath : `/${targetPath}`}`;

    try {
      const { status, html } = await fetchWhatMobileHtml(targetPath);

      if (
        status === 404 ||
        html.includes("Page Not Found") ||
        html.includes("404 - Not Found")
      ) {
        lastStatusCode = 404;
        continue; // Fallback to next candidate
      }

      if (status !== 200) {
        lastStatusCode = status;
        lastError = `HTTP status ${status}`;
        continue;
      }

      // Extract page title & heading
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const pageTitle = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";

      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const specHeadingMatch = html.match(/class="specs-mainheading"[^>]*>([\s\S]*?)<\/td>/i);
      const rawHeading = h1Match ? h1Match[1] : specHeadingMatch ? specHeadingMatch[1] : "";
      const pageHeading = rawHeading.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

      // Check soft-404 where WhatMobile returns 200 but renders error template
      if (!pageHeading && (!pageTitle || pageTitle.toLowerCase().startsWith("whatmobile"))) {
        lastStatusCode = 404;
        continue;
      }

      // VARIANT-SUFFIX SAFETY CHECK: verify that this page is truly for the requested variant
      const safety = checkVariantSafety(brand, model, pageHeading, pageTitle);
      if (!safety.isSafe) {
        variantMismatchError = `Variant mismatch: ${safety.reason}`;
        variantMismatchHeading = pageHeading;
        variantMismatchTitle = pageTitle;
        // Do NOT accept wrong variant! Continue trying other candidate paths if available
        continue;
      }

      // Parse price
      const parsed = parseWhatMobilePrice(html);
      if (!parsed || !parsed.pricePkr) {
        if (html.includes("Coming Soon")) {
          const expMatch = html.match(/Expected\s+Rs\.?:\s*<[^>]+>([\d,]+)<\/[^>]+>/i);
          const expPrice = expMatch ? parseInt(expMatch[1].replace(/,/g, ""), 10) : undefined;
          return {
            success: false,
            url: fullUrl,
            statusCode: 200,
            heading: pageHeading,
            pageTitle,
            error: `Unreleased model: Marked as 'Coming Soon' on WhatMobile${expPrice ? ` (Expected: Rs ${expPrice.toLocaleString()})` : ""}`,
          };
        }

        if (html.includes("Discontinued")) {
          return {
            success: false,
            url: fullUrl,
            statusCode: 200,
            heading: pageHeading,
            pageTitle,
            error: "Model marked as 'Discontinued' on WhatMobile (no active retail price)",
          };
        }

        lastError = "Price element not found in HTML (possible unlisted or discontinued model)";
        continue;
      }

      // Successful scrape: Cache confirmed working path
      setCachedConfirmedUrl(slug, targetPath);

      return {
        success: true,
        pricePkr: parsed.pricePkr,
        usdPrice: parsed.usdPrice,
        url: fullUrl,
        statusCode: 200,
        heading: pageHeading,
        pageTitle,
        usedCachedUrl: i === 0 && Boolean(existingUrl || CONFIRMED_URL_CACHE.has(slug)),
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  // All candidates failed or were rejected
  const primaryFallback = `https://www.whatmobile.com.pk${candidatePaths[0] || resolveWhatMobilePath(slug, brand, model)}`;

  if (variantMismatchError) {
    return {
      success: false,
      url: primaryFallback,
      statusCode: 200,
      isVariantMismatch: true,
      heading: variantMismatchHeading,
      pageTitle: variantMismatchTitle,
      error: variantMismatchError,
    };
  }

  return {
    success: false,
    url: primaryFallback,
    statusCode: lastStatusCode,
    error: lastError || `HTTP status ${lastStatusCode}: URL not found on WhatMobile`,
  };
}
