import type { Metadata } from "next";
import { ContactClient } from "@/components/contact/ContactClient";

export const metadata: Metadata = {
  title: "Contact Us - CompareIt.pk | Pakistan's #1 Smartphone Price Comparison",
  description:
    "Get in touch with the CompareIt.pk team. Report incorrect prices, suggest a phone listing, request a partnership, or just say hello. We usually respond within 24 hours.",
  alternates: {
    canonical: "/contact",
  },
};

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return <ContactClient />;
}
