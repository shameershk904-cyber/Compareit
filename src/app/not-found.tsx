import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | CompareIt.pk",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-orange-50/80 to-white">
      <div className="max-w-lg w-full text-center">
        <p className="text-sm font-semibold tracking-wide text-[#f47820] uppercase mb-3">
          CompareIt.pk
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-3">
          404
        </h1>
        <p className="text-gray-600 mb-8">
          This page is missing or the phone listing was removed. Head back to browse live Pakistan prices and specs.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-[#f47820] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e06a14] transition-colors"
          >
            Go to homepage
          </Link>
          <Link
            href="/trending"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Browse trending
          </Link>
        </div>
      </div>
    </main>
  );
}
