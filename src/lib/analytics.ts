import * as crypto from "crypto";

export interface ParsedUA {
  device: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  isBot: boolean;
}

/**
 * Parses user agent string to determine device category, browser name, operating system, and bot flags.
 */
export function parseUserAgent(ua: string | null | undefined): ParsedUA {
  if (!ua) {
    return { device: "desktop", browser: "Unknown", os: "Unknown", isBot: false };
  }

  // 1. Detect Bots & Crawlers
  const isBot =
    /bot|crawler|spider|crawling|googlebot|bingbot|yandex|duckduckbot|slurp|baiduspider|headlesschrome|facebookexternalhit|whatsapp|telegram/i.test(
      ua
    );

  // 2. Detect Device Type
  let device: "desktop" | "mobile" | "tablet" = "desktop";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    device = "tablet";
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    device = "mobile";
  }

  // 3. Detect Operating System
  let os = "Other";
  if (/windows nt 10\.0/i.test(ua)) os = "Windows 10/11";
  else if (/windows nt 6\.3/i.test(ua)) os = "Windows 8.1";
  else if (/windows nt 6\.1/i.test(ua)) os = "Windows 7";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/cros/i.test(ua)) os = "ChromeOS";

  // 4. Detect Browser
  let browser = "Other";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/samsungbrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/opr|opera/i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";

  return { device, browser, os, isBot };
}

/**
 * Extracts client IP address from proxy headers (Cloudflare, Vercel, Nginx, or direct socket).
 */
export function extractClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the very first (client) IP in comma-separated list
    const ip = forwardedFor.split(",")[0].trim();
    if (ip) return ip;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Generates a privacy-friendly daily-salted SHA-256 hash from client IP.
 * The daily rotating salt ensures IP addresses cannot be reverse-engineered or tracked across days (GDPR compliant).
 */
export function generateDailyIpHash(ip: string): string {
  const salt = process.env.ANALYTICS_SALT || "compareit-pk-analytics-salt-secret";
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return crypto
    .createHash("sha256")
    .update(`${ip}:${salt}:${today}`)
    .digest("hex")
    .slice(0, 32);
}
