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
  "itel-a50c-special-edition": "/itel_A50c",
  "itel-itel-a50c-special-edition": "/itel_A50c",
  "itel-s23-plus": "/itel_S23-Plus",
  "itel-a70": "/itel_A70",
  "vivo-v30": "/Vivo_V30",
  "vivo-v30e": "/Vivo_V30e",
  "vivo-y27s": "/Vivo_Y27s",
  "oppo-reno-11-f": "/Oppo_Reno-11F",
  "realme-12-plus": "/Realme_12-Plus",
  "realme-c67": "/Realme_C67",
};

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
 * Scrapes WhatMobile for a phone's price
 */
export async function scrapeWhatMobilePhonePrice(
  slug: string,
  brand: string,
  model: string,
  existingUrl?: string
): Promise<ScrapedPriceResult> {
  const targetPath =
    existingUrl && existingUrl.includes("whatmobile.com.pk")
      ? new URL(existingUrl).pathname
      : resolveWhatMobilePath(slug, brand, model);

  const fullUrl = `https://www.whatmobile.com.pk${targetPath.startsWith("/") ? targetPath : `/${targetPath}`}`;

  try {
    const { status, html } = await fetchWhatMobileHtml(targetPath);

    if (status !== 200) {
      return {
        success: false,
        url: fullUrl,
        statusCode: status,
        error: `HTTP status ${status}`,
      };
    }

    const parsed = parseWhatMobilePrice(html);
    if (!parsed || !parsed.pricePkr) {
      if (html.includes("Coming Soon")) {
        const expMatch = html.match(/Expected\s+Rs\.?:\s*<[^>]+>([\d,]+)<\/[^>]+>/i);
        const expPrice = expMatch ? parseInt(expMatch[1].replace(/,/g, ""), 10) : undefined;
        return {
          success: false,
          url: fullUrl,
          statusCode: 200,
          error: `Unreleased model: Marked as 'Coming Soon' on WhatMobile${expPrice ? ` (Expected: Rs ${expPrice.toLocaleString()})` : ""}`,
        };
      }

      if (html.includes("Discontinued")) {
        return {
          success: false,
          url: fullUrl,
          statusCode: 200,
          error: "Model marked as 'Discontinued' on WhatMobile (no active retail price)",
        };
      }

      return {
        success: false,
        url: fullUrl,
        statusCode: 200,
        error: "Price element not found in HTML (possible unlisted or discontinued model)",
      };
    }

    return {
      success: true,
      pricePkr: parsed.pricePkr,
      usdPrice: parsed.usdPrice,
      url: fullUrl,
      statusCode: 200,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      url: fullUrl,
      error: message,
    };
  }
}
