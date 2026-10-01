import { Metadata } from "next";
import { getComingSoonPhones } from "@/lib/phones";
import { PhoneCatalogView } from "@/components/catalog/PhoneCatalogView";

export const metadata: Metadata = {
  title: "Coming Soon Smartphones in Pakistan (2025) - Upcoming Mobile Launches | CompareIt.pk",
  description:
    "Get a sneak peek at upcoming smartphones launching soon in Pakistan. Browse expected prices, leaked specs, and official announcements for the most anticipated mobiles from Apple, Samsung, Xiaomi, and more.",
  alternates: {
    canonical: "/coming-soon",
  },
};

export const revalidate = 60;

export default async function ComingSoonPage() {
  const phones = await getComingSoonPhones();

  return (
    <PhoneCatalogView
      phones={phones}
      badgeText="Coming Soon"
      badgeIcon="🕐"
      title="Upcoming & Coming Soon Smartphones"
      subtitle="Anticipated launches, leaked specs, and expected Pakistan market prices — stay ahead of the curve with the most wanted devices coming to market."
      emptyTitle="No upcoming phones match your search"
      emptySubtitle="Try selecting a different brand or clearing your search term to see more devices."
    />
  );
}
