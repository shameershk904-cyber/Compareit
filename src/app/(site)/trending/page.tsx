import { Metadata } from "next";
import { getTrendingPhones } from "@/lib/phones";
import { PhoneCatalogView } from "@/components/catalog/PhoneCatalogView";

export const metadata: Metadata = {
  title: "Trending Smartphones in Pakistan (2025) - Most Popular Mobile Rates | CompareIt.pk",
  description:
    "Explore the top trending smartphones in Pakistan. Compare estimated market prices, official PTA tax status, full hardware specs, and best local deals across Apple, Samsung, Xiaomi, and more.",
  alternates: {
    canonical: "/trending",
  },
};

export const revalidate = 60; // 60s cache revalidation

export default async function TrendingPage() {
  const phones = await getTrendingPhones();

  return (
    <PhoneCatalogView
      phones={phones}
      badgeText="Trending in Pakistan"
      badgeIcon="🔥"
      title="Trending & Most Popular Smartphones"
      subtitle="Real-time popularity index benchmarked against consumer search volume, retailer demand, and top mobile inquiries across Pakistan."
      emptyTitle="No trending phones match your search"
      emptySubtitle="Try selecting a different brand or clearing your search term to see more devices."
    />
  );
}
