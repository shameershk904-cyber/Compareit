import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { type Phone } from "@/types";
import { ProductClient } from "@/components/product/ProductClient";
import type { Metadata } from "next";

async function getPhones(): Promise<Phone[]> {
  const filePath = path.join(process.cwd(), "public", "data", "phones.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContents);
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const phones = await getPhones();
  const phone = phones.find((p) => p.slug === params.slug || p.id === params.slug);

  if (!phone) {
    return {
      title: "Phone Not Found - CompareIt.pk",
    };
  }

  const lowest = (phone.lowest_verified_price && phone.lowest_verified_price > 0)
    ? phone.lowest_verified_price
    : (phone.price_pkr && phone.price_pkr > 0 ? phone.price_pkr : 0);
  const isAvailable = lowest > 0 && Array.isArray(phone.retailers) && phone.retailers.length > 0 && phone.status !== "Discontinued";

  return {
    title: `${phone.brand} ${phone.model} ${isAvailable ? `Price in Pakistan (Rs. ${lowest.toLocaleString()})` : "Price in Pakistan (Price N/A - Discontinued)"} & Specs | CompareIt.pk`,
    description: isAvailable
      ? `Check latest verified price of ${phone.brand} ${phone.model} in Pakistan (Rs. ${lowest.toLocaleString()}). Verified store prices, full specs, PTA DIRBS tax, and expert verdict.`
      : `${phone.brand} ${phone.model} price in Pakistan is unlisted/discontinued (Price N/A). View historical specs, release details, PTA DIRBS tax status, and comparisons on CompareIt.pk.`,
  };
}

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const phones = await getPhones();
  const phone = phones.find((p) => p.slug === params.slug || p.id === params.slug);

  if (!phone) {
    notFound();
  }

  // Resolve top 2 competitor rivals for shootout section
  const competitors: Phone[] = [];

  // 1. Try defined competitor_ids
  if (phone.competitor_ids && phone.competitor_ids.length > 0) {
    for (const cid of phone.competitor_ids) {
      const match = phones.find((p) => p.id === cid || p.slug === cid);
      if (match && !competitors.some((c) => c.id === match.id)) {
        competitors.push(match);
      }
      if (competitors.length >= 2) break;
    }
  }

  // 2. Exact match for Itel A50C to pair with Redmi A3 and Infinix Smart 8 as shown in design
  if (competitors.length < 2 && (phone.slug.includes("a50c") || phone.model.toLowerCase().includes("a50c"))) {
    const redmi = phones.find((p) => p.slug === "xiaomi-redmi-a3");
    const infinix = phones.find((p) => p.slug === "infinix-smart-8");
    if (redmi && !competitors.some((c) => c.id === redmi.id)) competitors.push(redmi);
    if (infinix && !competitors.some((c) => c.id === infinix.id)) competitors.push(infinix);
  }

  // 3. Fallback: match 2 phones in the same price range (+/- 35%) from rival brands
  if (competitors.length < 2) {
    const targetPrice = phone.lowest_verified_price || phone.price_pkr;
    const candidates = phones.filter(
      (p) =>
        p.id !== phone.id &&
        p.slug !== phone.slug &&
        !competitors.some((c) => c.id === p.id) &&
        p.brand !== phone.brand &&
        Math.abs((p.lowest_verified_price || p.price_pkr) - targetPrice) <= targetPrice * 0.45
    );
    candidates.sort(
      (a, b) =>
        Math.abs((a.lowest_verified_price || a.price_pkr) - targetPrice) -
        Math.abs((b.lowest_verified_price || b.price_pkr) - targetPrice)
    );

    for (const c of candidates) {
      competitors.push(c);
      if (competitors.length >= 2) break;
    }
  }

  return <ProductClient phone={phone} competitors={competitors} />;
}
