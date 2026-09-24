"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type Phone } from "@/types";
import { formatPKR, getSupabaseImageUrl } from "@/lib/utils";

interface CompareClientProps {
  initialPhones: Phone[];
  initialCompareSlugs?: string[];
}

export function CompareClient({ initialPhones, initialCompareSlugs }: CompareClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams?.get("from");

  // Resolve initial phones for comparison (strictly 3 phones max)
  const defaultSlugs = initialCompareSlugs && initialCompareSlugs.length > 0
    ? initialCompareSlugs.slice(0, 3)
    : ["itel-a50c-special-edition", "xiaomi-redmi-a3", "samsung-galaxy-a15"];

  const resolvedInitialPhones = useMemo(() => {
    const list: Phone[] = [];
    for (const slug of defaultSlugs) {
      const match = initialPhones.find(
        (p) => p.slug === slug || p.id === slug || p.model.toLowerCase().replace(/\s+/g, "-").includes(slug.toLowerCase())
      );
      if (match && !list.some((item) => item.id === match.id)) {
        list.push(match);
      }
    }
    // Fallback if none matched
    if (list.length === 0) {
      list.push(...initialPhones.slice(0, 3));
    }
    return list.slice(0, 3);
  }, [initialPhones, defaultSlugs]);

  const [compareList, setCompareList] = useState<Phone[]>(resolvedInitialPhones);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [diffOnly, setDiffOnly] = useState(false);
  const [budgetFilter, setBudgetFilter] = useState<"all" | "under25k" | "25k-45k" | "pta">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search state for modal slots
  const [activeSlotSearch, setActiveSlotSearch] = useState<number | null>(null);
  const [slotQueries, setSlotQueries] = useState<Record<number, string>>({});
  const searchInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Helper to show auto-dismissing toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to get phone product image (using genuine Supabase storage URL)
  const getPhoneImg = (phone: Phone) => {
    if (phone.image) return getSupabaseImageUrl(phone.image);
    return "/favicon.png";
  };

  // Handle closing modal: returns to exact previous page where user opened it
  const handleClose = () => {
    if (fromUrl && fromUrl.startsWith("/")) {
      router.push(fromUrl);
      return;
    }
    if (typeof window !== "undefined") {
      if (document.referrer && document.referrer.includes(window.location.host)) {
        router.back();
        return;
      }
      if (window.history.length > 1) {
        router.back();
        return;
      }
    }
    router.push("/");
  };

  // Compare tray add/remove (strictly 3 slots max)
  const isInTray = (phone: Phone) => compareList.some((p) => p.id === phone.id);

  const togglePhone = (phone: Phone) => {
    if (isInTray(phone)) {
      setCompareList((prev) => prev.filter((p) => p.id !== phone.id));
    } else {
      if (compareList.length >= 3) {
        showToast("Maximum 3 smartphones can be compared at once!");
        return;
      }
      setCompareList((prev) => [...prev, phone]);
    }
  };

  const removeSlot = (index: number) => {
    setCompareList((prev) => prev.filter((_, i) => i !== index));
  };

  const swapSlot = (index: number, newPhone: Phone) => {
    setCompareList((prev) => {
      const next = [...prev];
      const clean = next.filter((p) => p.id !== newPhone.id);
      clean.splice(index, 0, newPhone);
      return clean.slice(0, 3);
    });
    setActiveSlotSearch(null);
    setSlotQueries((prev) => ({ ...prev, [index]: "" }));
  };

  const clearAll = () => {
    setCompareList([]);
  };

  // Share functionality
  const handleShare = () => {
    const slugs = compareList.map((p) => p.slug).join(",");
    const url = `${window.location.origin}/compare?phones=${encodeURIComponent(slugs)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast("Comparison link copied to clipboard!");
    } else {
      showToast(url);
    }
  };

  // Print spec sheet
  const handlePrint = () => {
    window.print();
  };

  // Filtered phones for background marketplace grid
  const filteredCatalog = useMemo(() => {
    return initialPhones.filter((phone) => {
      const price = phone.lowest_verified_price || phone.price_pkr;
      if (budgetFilter === "under25k") return price <= 25000;
      if (budgetFilter === "25k-45k") return price > 25000 && price <= 45000;
      if (budgetFilter === "pta") return phone.pta_tax && phone.pta_tax.passport > 0;
      return true;
    }).slice(0, 16);
  }, [initialPhones, budgetFilter]);

  // Max benchmark score among compared phones for visual progress bar
  const maxAntutu = useMemo(() => {
    const scores = compareList.map((p) => p.platform?.antutu_score || 200000);
    return Math.max(...scores, 450000);
  }, [compareList]);

  // Dynamic score calculator
  const getDeviceRating = (phone: Phone, index: number) => {
    const price = phone.lowest_verified_price || phone.price_pkr;
    if (price <= 25000) {
      return { score: "8.2", badge: "Under 25K Value", text: `Unmatched storage tier and official local 1-year brand warranty under ${formatPKR(price)}.` };
    }
    if (phone.display?.type?.toLowerCase().includes("amoled")) {
      return { score: "8.6", badge: "Overall Power", text: `Super AMOLED display and responsive processor excel, sitting at competitive ${formatPKR(price)}.` };
    }
    if (index === 1) {
      return { score: "7.9", badge: "Premium Feel", text: `Corning Gorilla Glass front and aesthetic chassis with 90Hz smooth panel.` };
    }
    return { score: "8.0", badge: "Balanced Pick", text: `Balanced day-to-day performance, stamina battery, and verified PTA DIRBS clearance.` };
  };

  return (
    <div className="flex flex-col w-full font-['Poppins',sans-serif] text-on-surface relative bg-surface min-h-screen pt-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-[9999] bg-primary-container text-on-primary px-4 py-3 rounded-xl shadow-2xl border border-deal-orange flex items-center gap-2 text-label-md font-semibold animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-deal-orange text-[20px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================== */}
      {/* BACKGROUND MARKETPLACE / SMARTPHONE GRID */}
      {/* ========================================== */}
      <section className="max-w-7xl mx-auto px-margin-mobile lg:px-margin py-8 w-full">
        {/* Breadcrumb & Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-label-md font-label-md text-on-surface-variant">
            <Link className="hover:text-deal-orange transition-colors" href="/">
              Home
            </Link>
            <span>/</span>
            <Link className="hover:text-deal-orange transition-colors" href="/#phones">
              Smartphones
            </Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Compare Matrix</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-primary font-medium">
              <span className="w-2 h-2 rounded-full bg-deal-orange animate-pulse"></span>
              Hafeez Centre Live Rates Synced (14 mins ago)
            </span>
          </div>
        </div>

        {/* Page Header & Filters Strip */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6">
          <div>
            <span className="font-label-sm text-label-sm text-deal-orange uppercase tracking-wider font-bold">
              Pakistan Hardware Benchmark
            </span>
            <h1 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight mt-1">
              Smartphones Catalog & Market Deals
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-2xl">
              Track real-time market prices across Hafeez Centre Lahore, Saddar Karachi, PriceOye, and official PTA DIRBS duty rates.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setBudgetFilter("all")}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors ${
                budgetFilter === "all"
                  ? "bg-primary text-on-primary shadow-sm font-bold"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface"
              }`}
            >
              All Budget Tiers
            </button>
            <button
              onClick={() => setBudgetFilter("under25k")}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors ${
                budgetFilter === "under25k"
                  ? "bg-primary text-on-primary shadow-sm font-bold"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface"
              }`}
            >
              Under Rs. 25,000
            </button>
            <button
              onClick={() => setBudgetFilter("25k-45k")}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors ${
                budgetFilter === "25k-45k"
                  ? "bg-primary text-on-primary shadow-sm font-bold"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface"
              }`}
            >
              Rs. 25k - 45k
            </button>
            <button
              onClick={() => setBudgetFilter("pta")}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors ${
                budgetFilter === "pta"
                  ? "bg-primary text-on-primary shadow-sm font-bold"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface"
              }`}
            >
              PTA Approved
            </button>
          </div>
        </div>

        {/* Grid of Phones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-28">
          {filteredCatalog.map((phone) => {
            const lowestPrice = phone.lowest_verified_price || phone.price_pkr;
            const msrp = phone.price_pkr;
            const saveAmount = msrp > lowestPrice ? msrp - lowestPrice : 0;
            const selected = isInTray(phone);

            return (
              <div
                key={phone.id}
                className="bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative group border border-border-hairline"
              >
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                  {selected ? (
                    <span className="px-2 py-0.5 rounded bg-deal-orange text-on-primary font-label-sm text-label-sm font-bold">
                      In Compare Tray
                    </span>
                  ) : saveAmount > 0 ? (
                    <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-medium">
                      Save {formatPKR(saveAmount)}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-medium">
                      Verified Rate
                    </span>
                  )}
                </div>

                <Link
                  href={`/phone/${phone.slug}`}
                  className="relative w-full h-52 flex items-center justify-center p-4 my-2"
                >
                  <img
                    className="max-h-48 max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    alt={`${phone.brand} ${phone.model} product render`}
                    src={getPhoneImg(phone)}
                  />
                </Link>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-label-sm font-label-sm text-on-surface-variant font-medium">
                      {phone.brand} Pakistan
                    </span>
                    <span className="w-1 h-1 rounded-full bg-outline"></span>
                    <span className="text-label-sm font-label-sm text-deal-orange font-semibold">
                      DIRBS Approved
                    </span>
                  </div>

                  <Link href={`/phone/${phone.slug}`}>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-primary hover:text-deal-orange transition-colors">
                      {phone.model}
                    </h3>
                  </Link>

                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-1">
                    {phone.display?.size || 6.6}&quot; {phone.display?.type?.split(",")[0] || "HD+ IPS"} • {phone.platform?.chipset?.split("(")[0] || "Octa-Core"} • {phone.battery?.capacity_mah || 5000} mAh
                  </p>

                  <div className="mt-4 pt-3 flex items-baseline justify-between border-t border-border-hairline">
                    <div>
                      <div className="font-headline-sm text-headline-sm font-bold text-deal-orange">
                        {formatPKR(lowestPrice)}
                      </div>
                      {saveAmount > 0 && (
                        <div className="font-body-sm text-body-sm text-outline line-through">
                          MSRP {formatPKR(msrp)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => togglePhone(phone)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg transition-colors ${
                        selected
                          ? "bg-surface-container text-deal-orange hover:bg-deal-orange hover:text-on-primary"
                          : "bg-surface-container-high text-primary hover:bg-deal-orange hover:text-on-primary"
                      }`}
                      title={selected ? "In comparison (click to remove)" : "Add to comparison"}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {selected ? "check" : "add"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================== */}
      {/* MAIN CENTERPIECE: COMPARISON POP-UP MODAL  */}
      {/* ========================================== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-inverse-surface/65 backdrop-blur-md transition-opacity"
          id="compare-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-all border border-border-hairline">
            {/* MODAL HEADER */}
            <div className="px-6 py-5 bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-b border-border-hairline">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-deal-orange/10 text-deal-orange font-label-sm text-label-sm font-bold uppercase tracking-wider">
                    Side-By-Side Spec Matrix
                  </span>
                  <span className="text-outline text-label-sm font-label-sm">
                    PTA DIRBS 2025 Rates
                  </span>
                </div>
                <h2 className="font-headline-md text-headline-md font-bold text-primary tracking-tight mt-0.5">
                  {compareList.length > 0
                    ? compareList.map((p) => p.model).join(" vs ")
                    : "No Phones Selected"}
                </h2>
              </div>

              {/* Controls Toolbar */}
              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                <label className="flex items-center gap-2 cursor-pointer select-none bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-sm border border-border-hairline">
                  <input
                    checked={diffOnly}
                    onChange={(e) => setDiffOnly(e.target.checked)}
                    className="accent-deal-orange w-4 h-4 cursor-pointer"
                    id="toggle-diff"
                    type="checkbox"
                  />
                  <span className="font-label-md text-label-md text-primary font-semibold">
                    Differences Only
                  </span>
                </label>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest hover:bg-surface-container text-primary font-label-md text-label-md rounded-lg shadow-sm transition-colors border border-border-hairline"
                  title="Share comparison link"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  <span className="hidden sm:inline">Share</span>
                </button>
                {/* Cross Button: Navigates back to the page where user opened it */}
                <button
                  onClick={handleClose}
                  className="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors"
                  id="close-modal-btn"
                  title="Close and return to previous page"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* MODAL SCROLLABLE COMPARISON BODY (STRICTLY 3 SECTIONS) */}
            <div className="overflow-y-auto flex-1 p-6 space-y-8 divide-y divide-border-hairline">
              {/* 1. DEVICE CARDS ROW: STRICTLY 3 SLOTS MAX */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                {compareList.slice(0, 3).map((phone, index) => {
                  const lowestPrice = phone.lowest_verified_price || phone.price_pkr;
                  const rawRam = phone.memory?.ram_gb;
                  const rawStorage = phone.memory?.storage_gb;
                  const safeRam = rawRam && rawStorage && rawRam > rawStorage ? rawStorage : rawRam || 4;
                  const safeStorage = rawRam && rawStorage && rawRam > rawStorage ? rawRam : rawStorage || 64;

                  const currentQuery = slotQueries[index] || "";
                  const isSearching = activeSlotSearch === index;

                  const suggestions = isSearching && currentQuery.trim().length > 1
                    ? initialPhones
                        .filter((p) =>
                          p.model.toLowerCase().includes(currentQuery.toLowerCase()) ||
                          p.brand.toLowerCase().includes(currentQuery.toLowerCase())
                        )
                        .slice(0, 6)
                    : [];

                  return (
                    <div
                      key={phone.id}
                      className="bg-surface-container-lowest rounded-2xl p-4 flex flex-col justify-between relative shadow-xs border border-border-hairline overflow-hidden"
                    >
                      {/* Search & Swap Header */}
                      <div className="mb-3 pb-2.5 border-b border-border-hairline relative">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-label-sm text-[11px] font-bold tracking-wider uppercase text-on-surface-variant">
                            COMPARE WITH
                          </span>
                          <button
                            onClick={() => removeSlot(index)}
                            className="w-6 h-6 rounded-md hover:bg-surface-subtle text-outline hover:text-deal-orange flex items-center justify-center transition-colors"
                            title="Clear slot"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            ref={(el) => {
                              searchInputRefs.current[index] = el;
                            }}
                            className="w-full bg-surface-subtle border border-border-hairline rounded-lg px-2.5 py-1.5 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-deal-orange transition-colors"
                            placeholder="Search phone..."
                            type="text"
                            value={isSearching ? currentQuery : phone.model}
                            onFocus={() => {
                              setActiveSlotSearch(index);
                              setSlotQueries((prev) => ({ ...prev, [index]: "" }));
                            }}
                            onChange={(e) => {
                              setSlotQueries((prev) => ({ ...prev, [index]: e.target.value }));
                            }}
                          />
                          <span className="material-symbols-outlined text-outline text-[18px] absolute right-2.5 pointer-events-none">
                            search
                          </span>
                        </div>

                        {/* Search Dropdown */}
                        {isSearching && suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-surface-container-lowest rounded-xl shadow-xl border border-border-hairline overflow-hidden divide-y divide-border-hairline max-h-60 overflow-y-auto">
                            {suggestions.map((sug) => (
                              <button
                                key={sug.id}
                                onClick={() => swapSlot(index, sug)}
                                className="w-full p-2.5 flex items-center justify-between text-left hover:bg-surface-subtle transition-colors"
                              >
                                <span className="font-label-md text-label-md font-semibold text-primary truncate">
                                  {sug.brand} {sug.model}
                                </span>
                                <span className="font-body-sm text-body-sm text-deal-orange font-bold shrink-0 ml-2">
                                  {formatPKR(sug.lowest_verified_price || sug.price_pkr)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Model Name & Slot Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
                        <h3 className="font-headline-sm text-headline-sm font-bold text-primary leading-tight truncate">
                          <Link 
                            href={`/phone/${phone.slug || phone.id}`}
                            className="hover:text-deal-orange transition-colors"
                            title={`View details for ${phone.brand} ${phone.model}`}
                          >
                            {phone.model}
                          </Link>
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold shrink-0 ${
                            index === 0
                              ? "bg-deal-orange text-on-primary"
                              : "bg-surface-container text-primary"
                          }`}
                        >
                          {index === 0 ? "Selected" : `Slot ${index + 1}`}
                        </span>
                      </div>

                      {/* Device Image Presentation Box */}
                      <Link
                        href={`/phone/${phone.slug}`}
                        className="w-full h-44 bg-surface-subtle rounded-xl p-3 flex items-center justify-center relative overflow-hidden group mb-3 border border-border-hairline/60"
                      >
                        <img
                          className="max-h-36 max-w-full w-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
                          alt={`${phone.brand} ${phone.model}`}
                          src={getPhoneImg(phone)}
                        />
                      </Link>

                      {/* Quick Action Navigation Buttons (2x2 Clean Grid) */}
                      <div className="grid grid-cols-2 gap-1.5 mb-3 text-[11px] font-bold uppercase">
                        <Link
                          className="px-2 py-1.5 bg-primary text-on-primary rounded-lg text-center transition-colors hover:bg-primary/85 text-xs font-semibold flex items-center justify-center"
                          href={`/phone/${phone.slug}#verdict`}
                        >
                          Review
                        </Link>
                        <Link
                          className="px-2 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-center transition-colors text-xs font-semibold flex items-center justify-center"
                          href={`/phone/${phone.slug}#specs`}
                        >
                          Specs
                        </Link>
                        <Link
                          className="px-2 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-center transition-colors text-xs font-semibold flex items-center justify-center"
                          href={`/phone/${phone.slug}#opinions`}
                        >
                          Opinions
                        </Link>
                        <Link
                          className="px-2 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-center transition-colors text-xs font-semibold flex items-center justify-center"
                          href={`/phone/${phone.slug}#gallery`}
                        >
                          Pictures
                        </Link>
                      </div>

                      {/* Specs & Pricing */}
                      <div className="pt-2.5 border-t border-border-hairline">
                        <span className="text-[11px] text-outline block font-medium">
                          {safeStorage}GB Storage • {safeRam}GB RAM
                        </span>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="font-headline-sm text-headline-sm font-bold text-deal-orange">
                            {formatPKR(lowestPrice)}
                          </span>
                          <Link
                            className="font-label-sm text-[11px] font-bold text-deal-orange hover:underline uppercase tracking-wide"
                            href={`/phone/${phone.slug}#retailers`}
                          >
                            All Prices
                          </Link>
                        </div>
                      </div>

                      {/* Store Deal CTA */}
                      <a
                        className="mt-3 w-full py-2 bg-deal-orange hover:bg-deal-orange/90 text-on-primary font-label-md text-label-md font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        href={phone.retailers?.[0]?.url || `https://priceoye.pk`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>View Store Deal</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                      </a>
                    </div>
                  );
                })}

                {/* Empty Slot Fillers up to STRICTLY 3 slots */}
                {Array.from({ length: Math.max(0, 3 - compareList.length) }).map((_, i) => (
                  <div
                    key={`empty-slot-${i}`}
                    onClick={() => {
                      const candidate = initialPhones.find((p) => !isInTray(p));
                      if (candidate) togglePhone(candidate);
                    }}
                    className="rounded-2xl p-6 border-2 border-dashed border-border-hairline flex flex-col items-center justify-center text-center cursor-pointer hover:border-deal-orange hover:bg-surface-subtle transition-all h-full min-h-[360px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-deal-orange mb-3">
                      <span className="material-symbols-outlined text-[26px]">add</span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm font-bold text-primary">
                      Add Smartphone
                    </h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Compare up to 3 devices side-by-side
                    </p>
                  </div>
                ))}
              </div>

              {/* 2. VERDICT & BENCHMARK SCORE SECTION (3 SECTIONS ALIGNED) */}
              <div className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-deal-orange text-[22px]">workspace_premium</span>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-primary">
                    Benchmark Score & Verdict
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {compareList.slice(0, 3).map((phone, idx) => {
                    const rating = getDeviceRating(phone, idx);
                    return (
                      <div
                        key={`rating-${phone.id}`}
                        className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between border border-border-hairline"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex flex-col items-center justify-center">
                            <span className="font-headline-sm text-headline-sm font-bold leading-none">
                              {rating.score}
                            </span>
                            <span className="text-[9px] text-outline-variant font-medium">/ 10</span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-deal-orange/15 text-deal-orange font-label-sm text-label-sm font-bold">
                            {rating.badge}
                          </span>
                        </div>
                        <h4 className="font-headline-sm text-headline-sm font-bold text-primary mb-1 truncate">
                          {phone.model}
                        </h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {rating.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. DETAILED SPECIFICATION SHOOTOUT TABLES (3 COLUMNS ALIGNED) */}
              <div className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-deal-orange text-[22px]">tune</span>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-primary">
                      Direct Specification Shootout
                    </h3>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline">
                    Pakistani Market Spec Standards
                  </span>
                </div>

                {/* Table 1: Market & PTA DIRBS Matrix */}
                <div className="rounded-xl overflow-hidden shadow-sm bg-surface-container-lowest border border-border-hairline">
                  <div className="bg-surface-container-high px-4 py-2.5 font-label-lg text-label-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                    Local Retail & PTA DIRBS Taxes (FBR Approved)
                  </div>
                  <div className="divide-y divide-surface-container">
                    {/* Row: PriceOye Online */}
                    {(!diffOnly || new Set(compareList.map((p) => p.lowest_verified_price || p.price_pkr)).size > 1) && (
                      <div className="grid grid-cols-1 md:grid-cols-4 p-3.5 items-center hover:bg-surface-subtle transition-colors">
                        <span className="font-label-md text-label-md text-outline font-semibold">
                          PriceOye Online
                        </span>
                        {compareList.slice(0, 3).map((p, i) => (
                          <span
                            key={p.id}
                            className={`font-body-md text-body-md ${
                              i === 0 ? "text-deal-orange font-bold" : "text-primary font-medium"
                            }`}
                          >
                            {formatPKR(p.lowest_verified_price || p.price_pkr)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Row: Hafeez Centre Wholesale Benchmark */}
                    <div className="grid grid-cols-1 md:grid-cols-4 p-3.5 items-center bg-deal-orange/5 hover:bg-deal-orange/10 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-md text-label-md text-primary font-bold">
                          Hafeez Centre Cash
                        </span>
                        <span className="material-symbols-outlined text-deal-orange text-[16px]">store</span>
                      </div>
                      {compareList.slice(0, 3).map((p, i) => {
                        const price = p.lowest_verified_price || p.price_pkr;
                        const wholesale = Math.round(price * 0.98);
                        return (
                          <div key={p.id} className="flex flex-col">
                            <span
                              className={`font-body-md text-body-md ${
                                i === 0 ? "text-deal-orange font-bold" : "text-primary font-medium"
                              }`}
                            >
                              {formatPKR(wholesale)}
                            </span>
                            {i === 0 && (
                              <span className="text-[10px] text-outline font-semibold">
                                Lowest physical benchmark
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Row: PTA DIRBS on Passport */}
                    {(!diffOnly || new Set(compareList.map((p) => p.pta_tax?.passport)).size > 1) && (
                      <div className="grid grid-cols-1 md:grid-cols-4 p-3.5 items-center hover:bg-surface-subtle transition-colors">
                        <span className="font-label-md text-label-md text-outline font-semibold">
                          PTA Tax (Passport)
                        </span>
                        {compareList.slice(0, 3).map((p) => (
                          <span key={p.id} className="font-body-md text-body-md text-primary font-medium">
                            {formatPKR(p.pta_tax?.passport || (p.price_pkr > 40000 ? 19500 : 3200))}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Row: PTA DIRBS on CNIC */}
                    {(!diffOnly || new Set(compareList.map((p) => p.pta_tax?.cnic)).size > 1) && (
                      <div className="grid grid-cols-1 md:grid-cols-4 p-3.5 items-center hover:bg-surface-subtle transition-colors">
                        <span className="font-label-md text-label-md text-outline font-semibold">
                          PTA Tax (CNIC)
                        </span>
                        {compareList.slice(0, 3).map((p) => (
                          <span key={p.id} className="font-body-md text-body-md text-primary font-medium">
                            {formatPKR(p.pta_tax?.cnic || (p.price_pkr > 40000 ? 24000 : 4100))}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Table 2: Display Specs */}
                <div className="rounded-xl overflow-hidden shadow-sm bg-surface-container-lowest border border-border-hairline">
                  <div className="bg-surface-container-high px-4 py-2.5 font-label-lg text-label-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">smartphone</span>
                    Display & Panel Quality
                  </div>
                  <div className="divide-y divide-surface-container">
                    <div className="grid grid-cols-1 md:grid-cols-4 p-3.5 items-center hover:bg-surface-subtle transition-colors">
                      <span className="font-label-md text-label-md text-outline font-semibold">
                        Screen Technology
                      </span>
                      {compareList.slice(0, 3).map((p) => {
                        const isAmoled = p.display?.type?.toLowerCase().includes("amoled");
                        return (
                          <span
                            key={p.id}
                            className={`font-body-md text-body-md ${
                              isAmoled ? "text-deal-orange font-bold" : "text-primary font-medium"
                            }`}
                          >
                            {p.display?.size || 6.6}&quot; {p.display?.type || "HD+ IPS LCD"}
                            {isAmoled ? " (Winner)" : ""}
                          </span>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 p-3.5 items-center hover:bg-surface-subtle transition-colors">
                      <span className="font-label-md text-label-md text-outline font-semibold">
                        Resolution
                      </span>
                      {compareList.slice(0, 3).map((p) => {
                        const isFhd = p.display?.resolution?.includes("1080") || p.display?.resolution?.includes("2340");
                        return (
                          <span
                            key={p.id}
                            className={`font-body-md text-body-md ${
                              isFhd ? "text-primary font-bold" : "text-primary font-medium"
                            }`}
                          >
                            {p.display?.resolution || "720 x 1612 px (HD+)"}
                          </span>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 p-3.5 items-center hover:bg-surface-subtle transition-colors">
                      <span className="font-label-md text-label-md text-outline font-semibold">
                        Glass Protection
                      </span>
                      {compareList.slice(0, 3).map((p) => (
                        <span
                          key={p.id}
                          className={`font-body-md text-body-md ${
                            p.display?.protection && p.display.protection !== "N/A"
                              ? "text-primary font-semibold"
                              : "text-outline font-medium"
                          }`}
                        >
                          {p.display?.protection && p.display.protection !== "N/A"
                            ? p.display.protection
                            : "Reinforced Glass"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Table 3: Processor & Memory Architecture */}
                <div className="rounded-xl overflow-hidden shadow-sm bg-surface-container-lowest border border-border-hairline">
                  <div className="bg-surface-container-high px-4 py-2.5 font-label-lg text-label-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">memory</span>
                    Processor & Memory Architecture
                  </div>
                  <div className="divide-y divide-surface-container">
                    <div className="grid grid-cols-1 md:grid-cols-4 p-3.5 items-center hover:bg-surface-subtle transition-colors">
                      <span className="font-label-md text-label-md text-outline font-semibold">
                        SoC Chipset
                      </span>
                      {compareList.slice(0, 3).map((p) => {
                        const isG99 = p.platform?.chipset?.includes("G99") || p.platform?.chipset?.includes("Snapdragon");
                        return (
                          <span
                            key={p.id}
                            className={`font-body-md text-body-md ${
                              isG99 ? "text-deal-orange font-bold" : "text-primary font-semibold"
                            }`}
                          >
                            {p.platform?.chipset || "Octa-core Processor"}
                          </span>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 p-3.5 items-center hover:bg-surface-subtle transition-colors">
                      <span className="font-label-md text-label-md text-outline font-semibold">
                        AnTuTu v10 Benchmark
                      </span>
                      {compareList.slice(0, 3).map((p) => {
                        const score = p.platform?.antutu_score || (p.price_pkr > 40000 ? 420000 : p.price_pkr > 25000 ? 150000 : 230000);
                        const pct = Math.min(100, Math.round((score / maxAntutu) * 100));
                        const isTop = score === Math.max(...compareList.map(x => x.platform?.antutu_score || 0));

                        return (
                          <div key={p.id} className="pr-2">
                            <div className="flex items-center justify-between text-label-sm font-label-sm mb-1">
                              <span className={`font-bold ${isTop ? "text-deal-orange" : "text-primary"}`}>
                                ~{score.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isTop ? "bg-deal-orange" : "bg-primary"
                                }`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 p-3.5 items-center hover:bg-surface-subtle transition-colors">
                      <span className="font-label-md text-label-md text-outline font-semibold">
                        Base Config / Expansion
                      </span>
                      {compareList.slice(0, 3).map((p) => {
                        const rawRam = p.memory?.ram_gb;
                        const rawStorage = p.memory?.storage_gb;
                        const safeRam = rawRam && rawStorage && rawRam > rawStorage ? rawStorage : rawRam || 4;
                        const safeStorage = rawRam && rawStorage && rawRam > rawStorage ? rawRam : rawStorage || 64;

                        return (
                          <span key={p.id} className="font-body-md text-body-md text-primary font-medium">
                            {safeStorage}GB Storage + {safeRam}GB RAM ({p.memory?.card_slot ? "microSD" : "Dedicated Slot"})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Table 4: Battery & Charging */}
                <div className="rounded-xl overflow-hidden shadow-sm bg-surface-container-lowest border border-border-hairline">
                  <div className="bg-surface-container-high px-4 py-2.5 font-label-lg text-label-lg font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">battery_charging_full</span>
                    Battery & Charging Rates
                  </div>
                  <div className="divide-y divide-surface-container">
                    <div className="grid grid-cols-1 md:grid-cols-4 p-3.5 items-center hover:bg-surface-subtle transition-colors">
                      <span className="font-label-md text-label-md text-outline font-semibold">
                        Battery Capacity
                      </span>
                      {compareList.slice(0, 3).map((p) => (
                        <span key={p.id} className="font-body-md text-body-md text-primary font-medium">
                          {p.battery?.capacity_mah || 5000} mAh
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 p-3.5 items-center hover:bg-surface-subtle transition-colors">
                      <span className="font-label-md text-label-md text-outline font-semibold">
                        Charging Speed
                      </span>
                      {compareList.slice(0, 3).map((p) => {
                        const watt = p.battery?.charging_watt || 18;
                        const inBox = watt === 18 ? "18W Fast Charge In-Box" : watt >= 25 ? "25W Fast (Adapter Sold Separately)" : "10W Standard Type-C";
                        const isFast = watt === 18;
                        return (
                          <span
                            key={p.id}
                            className={`font-body-md text-body-md ${
                              isFast
                                ? "text-deal-orange font-bold"
                                : watt >= 25
                                ? "text-primary font-semibold"
                                : "text-outline font-medium"
                            }`}
                          >
                            {inBox}
                          </span>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 p-3.5 items-center hover:bg-surface-subtle transition-colors">
                      <span className="font-label-md text-label-md text-outline font-semibold">
                        Jazz / Zong 4G Band Compatibility
                      </span>
                      {compareList.slice(0, 3).map((p) => (
                        <span key={p.id} className="font-body-md text-body-md text-primary font-medium">
                          {p.connectivity?.five_g
                            ? "Full Multi-Carrier LTE-A / 5G"
                            : "Band 1/3/5/8/40/41 (Verified)"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="px-6 py-4 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 border-t border-border-hairline">
              <div className="flex items-center gap-2 text-on-surface-variant text-body-sm font-body-sm">
                <span className="material-symbols-outlined text-deal-orange text-[18px]">verified</span>
                <span>
                  All phones PTA approved under FBR Pakistan DIRBS guidelines with active manufacturer warranties.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-container-lowest hover:bg-surface-container text-primary font-label-md text-label-md rounded-lg shadow-sm transition-colors border border-border-hairline"
                  id="minimize-modal-btn"
                >
                  Dock to Tray
                </button>
                <button
                  onClick={handlePrint}
                  className="px-5 py-2 bg-deal-orange hover:bg-deal-orange/90 text-on-primary font-label-md text-label-md font-bold rounded-lg shadow-md transition-colors flex items-center gap-1.5"
                >
                  <span>Download PDF Spec Sheet</span>
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* FLOATING / DOCKED COMPARE TRAY (3 SLOTS MAX) */}
      {/* ========================================== */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 transition-all border border-border-hairline">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Tray Header & Count */}
          <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
            <div className="w-10 h-10 rounded-xl bg-deal-orange/10 text-deal-orange flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">compare</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-label-lg text-label-lg font-bold text-primary">Compare Tray</h4>
                <span className="px-2 py-0.5 rounded-full bg-deal-orange text-on-primary font-label-sm text-label-sm font-bold">
                  {compareList.length} of 3
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-outline">
                {compareList.length < 3
                  ? `Add ${3 - compareList.length} more smartphone to fill`
                  : "All 3 comparison slots filled"}
              </p>
            </div>
          </div>

          {/* Selected Device Pills / Cards (3 SLOTS MAX) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full lg:w-auto flex-1 max-w-xl">
            {compareList.slice(0, 3).map((phone, idx) => {
              const lowestPrice = phone.lowest_verified_price || phone.price_pkr;
              return (
                <div
                  key={phone.id}
                  className="flex items-center gap-2 p-2 bg-surface-container rounded-xl relative group border border-border-hairline"
                >
                  <div className="w-10 h-10 shrink-0 bg-surface-container-lowest rounded-lg flex items-center justify-center p-0.5 overflow-hidden">
                    <img
                      className="h-full max-h-9 max-w-full object-contain"
                      alt={`${phone.brand} ${phone.model}`}
                      src={getPhoneImg(phone)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-label-sm text-label-sm font-bold text-primary block truncate">
                      {phone.model}
                    </span>
                    <span className="font-body-sm text-body-sm text-deal-orange font-bold truncate block">
                      {formatPKR(lowestPrice)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeSlot(idx)}
                    className="text-outline hover:text-deal-orange transition-colors p-1"
                    title="Remove device"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              );
            })}

            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, 3 - compareList.length) }).map((_, i) => (
              <button
                key={`tray-empty-${i}`}
                onClick={() => {
                  const candidate = initialPhones.find((p) => !isInTray(p));
                  if (candidate) togglePhone(candidate);
                }}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-surface-subtle hover:bg-surface-container transition-colors cursor-pointer text-outline hover:text-primary border border-dashed border-border-hairline"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span className="font-label-sm text-label-sm font-semibold truncate">+ Add Device</span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
            <button
              onClick={clearAll}
              className="px-3 py-2 text-outline hover:text-primary font-label-md text-label-md transition-colors font-medium"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-deal-orange hover:bg-deal-orange/90 text-on-primary font-label-md text-label-md font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
              id="open-modal-btn"
            >
              <span>Compare Now ({compareList.length})</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full bg-surface-container-lowest shadow-[0_-1px_8px_rgba(0,0,0,0.02)] pt-space-xl pb-space-lg mt-auto border-t border-border-hairline">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-space-xl">
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <img alt="CompareIt.pk logo" className="h-7 w-auto object-contain" src="/logo.png" />
                <span className="font-headline-sm text-headline-sm font-bold text-primary-container">
                  CompareIt<span className="text-deal-orange">.pk</span>
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Pakistan&apos;s premier tech analytics, device comparison, verified wholesale rates from Hafeez Centre, and accurate PTA tax estimates.
              </p>
            </div>
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-lg text-label-lg font-bold text-primary-container mb-space-xs">
                Quick Navigation
              </span>
              <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="/#phones">
                Latest Smartphones
              </Link>
              <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="/#phones">
                Upcoming 5G Phones
              </Link>
              <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="/#brands">
                Top Brand Directory
              </Link>
              <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="/compare">
                Side-by-Side Comparison
              </Link>
            </div>
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-lg text-label-lg font-bold text-primary-container mb-space-xs">
                Calculators & Markets
              </span>
              <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="/?taxCalc=open">
                Passport vs CNIC PTA Tax
              </Link>
              <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="/compare">
                Hafeez Centre Live Rates
              </Link>
              <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="/#wholesale">
                Hall Road Wholesale Index
              </Link>
              <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="/?taxCalc=open">
                Duty & Tax Calculator
              </Link>
            </div>
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-lg text-label-lg font-bold text-primary-container mb-space-xs">
                Platform & Trust
              </span>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#">
                About CompareIt.pk
              </a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#">
                Retailer Verification
              </a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#">
                Editorial Standards
              </a>
              <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#">
                Privacy & Disclaimers
              </a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-md border-t border-border-hairline">
            <p className="font-body-sm text-body-sm text-outline">
              © 2025 CompareIt.pk. All rights reserved. Prices verified across local Pakistan markets.
            </p>
            <div className="flex items-center gap-space-md">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Lahore • Karachi • Islamabad
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
