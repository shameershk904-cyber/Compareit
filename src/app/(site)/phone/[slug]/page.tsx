import { notFound } from "next/navigation";
import { ProductClient } from "@/components/product/ProductClient";
import { getPhoneBySlug, getCompetitors } from "@/lib/phones";
import type { Metadata } from "next";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const phone = await getPhoneBySlug(params.slug);

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
  const phone = await getPhoneBySlug(params.slug);

  if (!phone) {
    notFound();
  }

  const competitors = await getCompetitors(phone, 2);

  return <ProductClient phone={phone} competitors={competitors} />;
}
