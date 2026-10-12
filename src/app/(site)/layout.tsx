import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TaxCalculatorModal } from "@/components/shared/TaxCalculatorModal";
import { Tracker } from "@/components/analytics/Tracker";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { SitePreloader } from "@/components/shared/SitePreloader";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SitePreloader />
      <Suspense fallback={null}>
        <Tracker />
      </Suspense>
      <Suspense fallback={<header className="site-header" />}>
        <Header />
      </Suspense>
      {children}
      <Footer />
      <ScrollToTop />
      <Suspense fallback={null}>
        <TaxCalculatorModal />
      </Suspense>
    </>
  );
}

