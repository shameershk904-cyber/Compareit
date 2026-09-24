import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { TaxCalculatorModal } from "@/components/shared/TaxCalculatorModal";
import { Tracker } from "@/components/analytics/Tracker";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <Tracker />
      </Suspense>
      <Suspense fallback={<header className="site-header" />}>
        <Header />
      </Suspense>
      {children}
      <Suspense fallback={null}>
        <TaxCalculatorModal />
      </Suspense>
    </>
  );
}

