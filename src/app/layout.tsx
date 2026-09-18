import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Header } from "@/components/layout/Header";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Compare It - Find, Compare, Get the Best Phone",
  description: "Find, Compare, Get the Best Phone in Pakistan",
};

import { TaxCalculatorModal } from "@/components/shared/TaxCalculatorModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        <Suspense fallback={<header className="site-header" />}>
          <Header />
        </Suspense>
        {children}
        <Suspense fallback={null}>
          <TaxCalculatorModal />
        </Suspense>
      </body>
    </html>
  );
}
