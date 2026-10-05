import { Suspense } from "react";
import { type Phone } from "@/types";
import { CompareClient } from "@/components/compare/CompareClient";
import { getPhones } from "@/lib/phones";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Smartphones in Pakistan - Side-by-Side Specs Matrix | CompareIt.pk",
  description:
    "Compare latest smartphones side-by-side in Pakistan. Real-time Hafeez Centre rates, PriceOye deals, PTA DIRBS tax calculations, benchmark scores, and comprehensive spec shootout.",
};

export default async function ComparePage(props: {
  searchParams?: Promise<{ phones?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const phones = await getPhones();

  const requestedSlugs = searchParams?.phones
    ? searchParams.phones.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Strip massive detailed_specs from the inlined payload to keep HTML super light and performant
  // but allow searching across the full smartphones database
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const leanPhones: Phone[] = phones.map(({ detailed_specs, ...rest }) => rest as Phone);

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-['Poppins',sans-serif] text-gray-500">Loading Comparison Matrix...</div>}>
        <CompareClient initialPhones={leanPhones} initialCompareSlugs={requestedSlugs} />
      </Suspense>
    </main>
  );
}
