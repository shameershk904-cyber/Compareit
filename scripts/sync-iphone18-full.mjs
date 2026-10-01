import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocalPath = join(__dirname, "../.env.local");
const envPath = join(__dirname, "../.env");
if (existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
else if (existsSync(envPath)) dotenv.config({ path: envPath });

const prisma = new PrismaClient();

const iphone18Pro = {
  slug: "apple-iphone-18-pro",
  legacyId: "apple-iphone-18-pro",
  brand: "Apple",
  model: "iPhone 18 Pro",
  pricePkr: 435000,
  lowestVerifiedPrice: 435000,
  usdPrice: 1199,
  image: "images/phones/apple-iphone-18-pro.jpg",
  releaseDate: "September 18, 2026",
  status: "Available",
  isActive: true,
  popular: true,
  trendingRank: 1,
  ptaStatus: "non_pta",
  ptaTax: { passport: 85000, cnic: 105000 },
  warranty: { provider: "Apple Authorized / Merc Store", duration_months: 12 },
  memory: {
    ram_gb: 12,
    storage_gb: 256,
    card_slot: false,
    virtual_ram_gb: 0,
  },
  battery: {
    capacity_mah: 3960,
    charging_watt: 40,
    wireless_charging: true,
  },
  display: {
    size: 6.3,
    type: "Super Retina XDR OLED, 120Hz ProMotion",
    resolution: "2622 × 1206 px",
    protection: "Ceramic Shield 2",
  },
  platform: {
    chipset: "Apple A20 Pro",
    cpu: "Hexa-core (2x Performance + 4x Efficiency)",
    gpu: "Apple GPU (6-core)",
    os: "iOS 27",
    antutu_score: 2450000,
  },
  camera: {
    main_mp: 48,
    selfie_mp: 12,
    setup: "48MP Main + 12MP Telephoto + 12MP Ultrawide (OIS)",
    video: "4K@120fps, ProRes, Log, Dolby Vision",
    features: "Variable aperture f/1.4-f/2.8, 5x Optical Zoom, Sensor-shift OIS, LiDAR",
  },
  connectivity: {
    five_g: true,
    nfc: true,
    headphone_jack: false,
    fingerprint: "Face ID",
  },
  colorVariants: [
    { name: "Deep Space Black", images: ["images/phones/apple-iphone-18-pro.jpg"] },
    { name: "Silver Titanium", images: ["images/phones/apple-iphone-18-pro.jpg"] },
    { name: "Glacier Blue", images: ["images/phones/apple-iphone-18-pro.jpg"] },
    { name: "Burgundy Sand", images: ["images/phones/apple-iphone-18-pro.jpg"] },
  ],
  retailers: [
    {
      store: "PriceOye",
      price: 435000,
      delivery: "1-2 Days Express",
      inStock: true,
      condition: "Box Pack Sealed (Brand New)",
      url: "https://priceoye.pk",
    },
    {
      store: "Phone Bazaar",
      price: 440000,
      delivery: "2-3 Days Standard",
      inStock: true,
      condition: "Brand New Box Pack",
      url: "https://priceoye.pk",
    },
    {
      store: "Zmobiles",
      price: 442000,
      delivery: "3-4 Days",
      inStock: true,
      condition: "Brand New Factory Sealed",
      url: "https://priceoye.pk",
    },
  ],
};

const iphone18ProMax = {
  slug: "apple-iphone-18-pro-max",
  legacyId: "apple-iphone-18-pro-max",
  brand: "Apple",
  model: "iPhone 18 Pro Max",
  pricePkr: 490000,
  lowestVerifiedPrice: 490000,
  usdPrice: 1399,
  image: "images/phones/apple-iphone-18-pro-max.jpg",
  releaseDate: "September 18, 2026",
  status: "Available",
  isActive: true,
  popular: true,
  trendingRank: 2,
  ptaStatus: "non_pta",
  ptaTax: { passport: 92000, cnic: 115000 },
  warranty: { provider: "Apple Authorized / Merc Store", duration_months: 12 },
  memory: {
    ram_gb: 12,
    storage_gb: 256,
    card_slot: false,
    virtual_ram_gb: 0,
  },
  battery: {
    capacity_mah: 4850,
    charging_watt: 45,
    wireless_charging: true,
  },
  display: {
    size: 6.9,
    type: "Super Retina XDR OLED, 120Hz ProMotion",
    resolution: "2868 × 1320 px",
    protection: "Ceramic Shield 2",
  },
  platform: {
    chipset: "Apple A20 Pro",
    cpu: "Hexa-core (2x Performance + 4x Efficiency)",
    gpu: "Apple GPU (6-core)",
    os: "iOS 27",
    antutu_score: 2580000,
  },
  camera: {
    main_mp: 48,
    selfie_mp: 12,
    setup: "48MP Main + 12MP Telephoto + 12MP Ultrawide (OIS)",
    video: "4K@120fps, ProRes, Log, Dolby Vision",
    features: "Variable aperture f/1.4-f/2.8, 5x Optical Zoom, Sensor-shift OIS, LiDAR",
  },
  connectivity: {
    five_g: true,
    nfc: true,
    headphone_jack: false,
    fingerprint: "Face ID",
  },
  colorVariants: [
    { name: "Deep Space Black", images: ["images/phones/apple-iphone-18-pro-max.jpg"] },
    { name: "Silver Titanium", images: ["images/phones/apple-iphone-18-pro-max.jpg"] },
    { name: "Glacier Blue", images: ["images/phones/apple-iphone-18-pro-max.jpg"] },
    { name: "Burgundy Sand", images: ["images/phones/apple-iphone-18-pro-max.jpg"] },
  ],
  retailers: [
    {
      store: "PriceOye",
      price: 490000,
      delivery: "1-2 Days Express",
      inStock: true,
      condition: "Box Pack Sealed (Brand New)",
      url: "https://priceoye.pk",
    },
    {
      store: "Zmobiles",
      price: 495000,
      delivery: "2-3 Days",
      inStock: true,
      condition: "Brand New Factory Sealed",
      url: "https://priceoye.pk",
    },
    {
      store: "Phone Bazaar",
      price: 498000,
      delivery: "3-4 Days Standard",
      inStock: true,
      condition: "Brand New Box Pack",
      url: "https://priceoye.pk",
    },
  ],
};

async function syncPhoneToDb(phoneData) {
  const { retailers, ...fields } = phoneData;

  const phone = await prisma.phone.upsert({
    where: { slug: fields.slug },
    update: {
      ...fields,
      updatedAt: new Date(),
    },
    create: {
      ...fields,
    },
  });

  // Re-create retailers
  await prisma.phoneRetailer.deleteMany({
    where: { phoneId: phone.id },
  });

  for (const r of retailers) {
    await prisma.phoneRetailer.create({
      data: {
        phoneId: phone.id,
        store: r.store,
        price: r.price,
        delivery: r.delivery,
        inStock: r.inStock,
        condition: r.condition,
        url: r.url,
      },
    });
  }

  console.log(`✓ Synced DB: ${phone.brand} ${phone.model} (Rs. ${phone.pricePkr.toLocaleString()})`);
  return phone;
}

function syncPhonesToJson(phonesList) {
  const jsonPath = join(__dirname, "../public/data/phones.json");
  const phones = JSON.parse(readFileSync(jsonPath, "utf8"));

  for (const p of phonesList) {
    const idx = phones.findIndex((x) => x.slug === p.slug || x.id === p.slug);
    const jsonRecord = {
      id: p.slug,
      slug: p.slug,
      brand: p.brand,
      model: p.model,
      release_date: p.releaseDate,
      price_pkr: p.pricePkr,
      lowest_verified_price: p.lowestVerifiedPrice,
      usd_price: p.usdPrice,
      image: p.image,
      popular: p.popular,
      trending_rank: p.trendingRank,
      status: p.status,
      pta_status: p.ptaStatus,
      pta_tax: p.ptaTax,
      warranty: p.warranty,
      memory: p.memory,
      battery: p.battery,
      display: p.display,
      platform: p.platform,
      camera: p.camera,
      connectivity: p.connectivity,
      color_variants: p.colorVariants,
      retailers: p.retailers.map((r) => ({
        store: r.store,
        price: r.price,
        delivery: r.delivery,
        in_stock: r.inStock,
        condition: r.condition,
        url: r.url,
      })),
    };

    if (idx >= 0) {
      phones[idx] = { ...phones[idx], ...jsonRecord };
    } else {
      phones.unshift(jsonRecord);
    }
  }

  writeFileSync(jsonPath, JSON.stringify(phones, null, 2), "utf8");
  console.log(`✓ Updated public/data/phones.json with iPhone 18 Pro & Pro Max`);
}

async function main() {
  await syncPhoneToDb(iphone18Pro);
  await syncPhoneToDb(iphone18ProMax);
  syncPhonesToJson([iphone18Pro, iphone18ProMax]);
  console.log("All updates completed successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
