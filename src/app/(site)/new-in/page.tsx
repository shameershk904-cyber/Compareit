import { Metadata } from "next";
import { getNewInPhones } from "@/lib/phones";
import { PhoneCatalogView } from "@/components/catalog/PhoneCatalogView";

export const metadata: Metadata = {
  title: "New Smartphones in Pakistan (2025) - Latest Mobile Launches | CompareIt.pk",
  description:
    "Discover the newest smartphones launched in Pakistan. Compare estimated market prices, full hardware specs, PTA tax status, and best retailer deals for the latest mobiles from Apple, Samsung, Xiaomi, and more.",
  alternates: {
    canonical: "/new-in",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewInPage() {
  const phones = await getNewInPhones();

  return (
    <PhoneCatalogView
      phones={phones}
      badgeText="Just Launched"
      badgeIcon="✨"
      title="New Arrivals & Latest Launches"
      subtitle="The freshest smartphones to hit the Pakistan market — sorted by launch date with verified retailer prices, PTA DIRBS tax status, and full spec breakdowns."
      emptyTitle="No new phones match your search"
      emptySubtitle="Try selecting a different brand or clearing your search term to see more devices."
      defaultSort="price-desc"
    />
  );
}
