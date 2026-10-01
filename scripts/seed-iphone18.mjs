/**
 * seed-iphone18.mjs
 * Upserts Apple iPhone 18 Pro & 18 Pro Max into the DB.
 *
 * Data sources:
 *  - Specs: Apple official / Wikipedia / GSMArena (Sept 2026 launch)
 *  - PKR price estimates: Pakistan open market (PriceOye + local retailers, Oct 2026)
 *    iPhone 18 Pro 256GB:     ~Rs. 435,000 (Non-PTA open market)
 *    iPhone 18 Pro Max 256GB: ~Rs. 490,000 (Non-PTA open market)
 *
 * Run: node scripts/seed-iphone18.mjs
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env");
const envLocalPath = join(__dirname, "../.env.local");

if (existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
else if (existsSync(envPath)) dotenv.config({ path: envPath });

const prisma = new PrismaClient({ log: ["warn", "error"] });

// ── Shared helpers ─────────────────────────────────────────────────────────────
const PTA_TAX_PRO = { passport: 85000, cnic: 105000 };       // ~$1199 bracket
const PTA_TAX_PRO_MAX = { passport: 100000, cnic: 125000 };  // ~$1299 bracket

const RETAILERS_PRO = [
  { store: "PriceOye",     price: 435000, delivery: "1-3 days", inStock: true,  condition: "New", url: "https://priceoye.pk" },
  { store: "Phone Bazaar", price: 440000, delivery: "Same day",  inStock: true,  condition: "New", url: "https://phonebazaar.pk" },
  { store: "Zmobiles",     price: 442000, delivery: "1-2 days",  inStock: true,  condition: "New", url: "https://zmobiles.pk" },
];

const RETAILERS_PRO_MAX = [
  { store: "PriceOye",     price: 490000, delivery: "1-3 days", inStock: true,  condition: "New", url: "https://priceoye.pk" },
  { store: "Phone Bazaar", price: 498000, delivery: "Same day",  inStock: true,  condition: "New", url: "https://phonebazaar.pk" },
  { store: "Zmobiles",     price: 495000, delivery: "1-2 days",  inStock: true,  condition: "New", url: "https://zmobiles.pk" },
];

// ── Phone definitions ──────────────────────────────────────────────────────────
const phones = [
  {
    slug:               "apple-iphone-18-pro",
    legacyId:           "apple-iphone-18-pro",
    brand:              "Apple",
    model:              "iPhone 18 Pro",
    pricePkr:           435000,
    lowestVerifiedPrice:435000,
    usdPrice:           1199,
    releaseDate:        "September 18, 2026",
    status:             "Available",
    isActive:           true,
    popular:            true,
    trendingRank:       1,
    ptaStatus:          "Non-PTA / JV",
    ptaTax:             PTA_TAX_PRO,
    warranty:           { duration_months: 12, provider: "Apple Authorized" },
    memory: {
      ram:      "12GB LPDDR5X",
      storage:  "256GB / 512GB / 1TB / 2TB",
      card_slot: "No",
    },
    battery: {
      capacity:   "3,960 mAh",
      charging:   "40W wired, 25W MagSafe",
      type:       "Li-Ion",
    },
    display: {
      size:       "6.3\"",
      type:       "Super Retina XDR OLED, 120Hz ProMotion",
      resolution: "2622 × 1206 px (~460 ppi)",
      protection: "Ceramic Shield 2",
    },
    platform: {
      os:       "iOS 27",
      chipset:  "Apple A20 Pro",
      cpu:       "Hexa-core",
      gpu:       "Apple GPU (6-core)",
    },
    camera: {
      main:    "48 MP (f/1.4-2.8 variable aperture, OIS, sensor-shift)",
      ultrawide:"12 MP (f/2.2, 120° FOV)",
      telephoto:"12 MP (f/2.8, 5× optical zoom, OIS)",
      selfie:  "12 MP (f/1.9, autofocus)",
      video:   "4K@120fps, ProRes, Log Video",
    },
    connectivity: {
      network:    "5G SA/NSA",
      wifi:       "Wi-Fi 7 (802.11be)",
      bluetooth:  "5.4",
      nfc:        true,
      usb:        "USB-C (USB 4, 40Gb/s)",
      sim:        "Nano-SIM + eSIM / Dual eSIM",
    },
    colorVariants: ["Black", "Silver", "Glacier", "Burgundy"],
    retailers: RETAILERS_PRO,
  },
  {
    slug:               "apple-iphone-18-pro-max",
    legacyId:           "apple-iphone-18-pro-max",
    brand:              "Apple",
    model:              "iPhone 18 Pro Max",
    pricePkr:           490000,
    lowestVerifiedPrice:490000,
    usdPrice:           1299,
    releaseDate:        "September 18, 2026",
    status:             "Available",
    isActive:           true,
    popular:            true,
    trendingRank:       2,
    ptaStatus:          "Non-PTA / JV",
    ptaTax:             PTA_TAX_PRO_MAX,
    warranty:           { duration_months: 12, provider: "Apple Authorized" },
    memory: {
      ram:      "12GB LPDDR5X",
      storage:  "256GB / 512GB / 1TB / 2TB",
      card_slot: "No",
    },
    battery: {
      capacity:   "5,567 mAh",
      charging:   "40W wired, 25W MagSafe",
      type:       "Li-Ion",
    },
    display: {
      size:       "6.9\"",
      type:       "Super Retina XDR OLED, 120Hz ProMotion",
      resolution: "2868 × 1320 px (~440 ppi)",
      protection: "Ceramic Shield 2",
    },
    platform: {
      os:       "iOS 27",
      chipset:  "Apple A20 Pro",
      cpu:       "Hexa-core",
      gpu:       "Apple GPU (6-core)",
    },
    camera: {
      main:    "48 MP (f/1.4-2.8 variable aperture, OIS, sensor-shift)",
      ultrawide:"12 MP (f/2.2, 120° FOV)",
      telephoto:"12 MP (f/2.8, 5× optical zoom, OIS)",
      selfie:  "12 MP (f/1.9, autofocus)",
      video:   "4K@120fps, ProRes, Log Video",
    },
    connectivity: {
      network:    "5G SA/NSA",
      wifi:       "Wi-Fi 7 (802.11be)",
      bluetooth:  "5.4",
      nfc:        true,
      usb:        "USB-C (USB 4, 40Gb/s)",
      sim:        "Nano-SIM + eSIM / Dual eSIM",
    },
    colorVariants: ["Black", "Silver", "Glacier", "Burgundy"],
    retailers: RETAILERS_PRO_MAX,
  },
];

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  for (const phone of phones) {
    const { retailers, colorVariants, ...rest } = phone;

    console.log(`\n📱 Upserting ${rest.brand} ${rest.model}...`);

    // Upsert the phone record
    const saved = await prisma.phone.upsert({
      where:  { slug: rest.slug },
      update: { ...rest, colorVariants },
      create: { ...rest, colorVariants },
    });

    console.log(`  ✅ Phone saved  id=${saved.id}`);

    // Delete existing retailer rows and re-insert fresh data
    await prisma.phoneRetailer.deleteMany({ where: { phoneId: saved.id } });

    for (const r of retailers) {
      await prisma.phoneRetailer.create({
        data: {
          phoneId:  saved.id,
          store:    r.store,
          price:    r.price,
          delivery: r.delivery,
          inStock:  r.inStock,
          condition:r.condition,
          url:      r.url,
        },
      });
    }

    console.log(`  ✅ ${retailers.length} retailer(s) seeded`);
    console.log(`  💰 Lowest price: Rs. ${Math.min(...retailers.map(r => r.price)).toLocaleString()}`);
  }

  console.log("\n🎉 Done! Both iPhone 18 Pro models are live on the site.");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
