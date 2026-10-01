"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ZoomIn } from "lucide-react";
import { type Phone } from "@/types";
import { formatPKR, getSupabaseImageUrl } from "@/lib/utils";
import { getPhoneDetailedSpecs, type SpecCategory } from "@/lib/specs";

function getVariantDotColor(colorName: string): string {
  const c = colorName.toLowerCase();
  if (c.includes("natural") || c.includes("desert") || c.includes("sand")) return "#a8a29e";
  if (c.includes("white") || c.includes("silver") || c.includes("starlight") || c.includes("pearl")) return "#e2e8f0";
  if (c.includes("black") || c.includes("onyx") || c.includes("midnight") || c.includes("dark") || c.includes("phantom")) return "#0f172a";
  if (c.includes("gray") || c.includes("grey") || c.includes("graphite") || c.includes("space")) return "#64748b";
  if (c.includes("blue") || c.includes("navy") || c.includes("sky") || c.includes("cyan")) return "#2563eb";
  if (c.includes("green") || c.includes("mint") || c.includes("olive") || c.includes("emerald")) return "#059669";
  if (c.includes("gold") || c.includes("champagne")) return "#d97706";
  if (c.includes("yellow") || c.includes("lemon") || c.includes("amber")) return "#eab308";
  if (c.includes("violet") || c.includes("purple") || c.includes("lilac") || c.includes("lavender")) return "#8b5cf6";
  if (c.includes("pink") || c.includes("rose") || c.includes("coral") || c.includes("peach")) return "#ec4899";
  if (c.includes("red") || c.includes("crimson") || c.includes("burgundy")) return "#ef4444";
  if (c.includes("orange") || c.includes("copper") || c.includes("bronze")) return "#f97316";
  if (c.includes("brown") || c.includes("tan")) return "#78350f";
  return "#475569";
}

interface ProductClientProps {
  phone: Phone;
  competitors: Phone[];
}

function formatPhoneName(brand?: string, model?: string): string {
  if (!model) return brand || "";
  if (!brand) return model;
  if (model.toLowerCase().startsWith(brand.toLowerCase())) {
    return model;
  }
  return `${brand} ${model}`;
}

// ─── Shared UI Components ──────────────────────────────────────────────────────

function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-gray-200 gap-2">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 font-normal mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="self-start sm:self-auto">{action}</div>}
    </div>
  );
}

function SpecRow({ label, value, isZebra }: { label: string; value: string; isZebra?: boolean }) {
  return (
    <div
      className={`grid grid-cols-12 px-4 py-2 text-sm border-b border-gray-100 last:border-b-0 min-h-[38px] items-center ${
        isZebra ? "bg-gray-50/50" : "bg-white"
      }`}
    >
      <span className="col-span-12 sm:col-span-4 text-[13px] text-gray-500 font-normal">
        {label}
      </span>
      <span className="col-span-12 sm:col-span-8 text-sm text-gray-900 font-normal break-words leading-relaxed">
        {value}
      </span>
    </div>
  );
}

function SpecTable({
  category,
  isOpen,
  onToggle,
}: {
  category: SpecCategory;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-xs">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 bg-gray-50/75 hover:bg-gray-100/75 flex items-center justify-between transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-gray-900">{category.title}</span>
          <span className="text-xs text-gray-500 font-normal hidden sm:inline">• {category.subtitle}</span>
        </div>
        <span
          className={`material-symbols-outlined text-gray-400 text-lg transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>
      {isOpen && (
        <div className="divide-y divide-gray-100 border-t border-gray-200">
          {category.items.map((item, idx) => (
            <SpecRow key={idx} label={item.label} value={item.value} isZebra={idx % 2 === 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Product Client ───────────────────────────────────────────────────────

export function ProductClient({ phone, competitors }: ProductClientProps) {
  // Safe RAM and Storage fallback handling
  const rawRam = phone.memory?.ram_gb;
  const rawStorage = phone.memory?.storage_gb;
  const safeRam = rawRam && rawStorage && rawRam > rawStorage ? rawStorage : rawRam || 4;
  const safeStorage = rawRam && rawStorage && rawRam > rawStorage ? rawRam : rawStorage || 64;

  // Image gallery / color variant selection
  const initialColorVariant = useMemo(() => {
    if (!phone.color_variants || phone.color_variants.length === 0) return null;
    if (phone.image) {
      const match = phone.color_variants.find(
        (v) =>
          v.images?.some((img) => img === phone.image || img.includes(phone.image)) ||
          phone.image.toLowerCase().includes(v.name.toLowerCase().replace(/\s+/g, "-")) ||
          (v.name.toLowerCase().includes("natural") && phone.image.toLowerCase().includes("studio"))
      );
      if (match) return match;
    }
    return phone.color_variants[0];
  }, [phone.color_variants, phone.image]);

  const [selectedColor, setSelectedColor] = useState<string>(
    initialColorVariant?.name || "Standard"
  );
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

  // Modal states
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [isPriceAlertOpen, setIsPriceAlertOpen] = useState(false);
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>(
    phone.lowest_verified_price
      ? (phone.lowest_verified_price * 0.95).toFixed(0)
      : (phone.price_pkr * 0.95).toFixed(0)
  );
  const [alertEmail, setAlertEmail] = useState("");
  const [alertSubmitted, setAlertSubmitted] = useState(false);

  // Compare tray state
  const [trayItems, setTrayItems] = useState<string[]>([phone.model]);
  const [isTrayVisible, setIsTrayVisible] = useState(true);
  const [isInCompareTray, setIsInCompareTray] = useState(false);

  // Quick differences vs Full Specs toggle
  const [diffOnly, setDiffOnly] = useState(false);

  // WhatMobile 9-Category Detailed Specifications
  const specCategories = getPhoneDetailedSpecs(phone);

  // Accordion Spec State
  const [openSpecs, setOpenSpecs] = useState<Record<string, boolean>>({
    build: true,
    frequency: true,
    processor: true,
    display: true,
    memory: true,
    camera: true,
    connectivity: true,
    features: true,
    battery: true,
  });

  const toggleAllSpecs = () => {
    const allOpen = Object.values(openSpecs).every(Boolean);
    const nextState: Record<string, boolean> = {};
    specCategories.forEach((cat) => {
      nextState[cat.key] = !allOpen;
    });
    setOpenSpecs(nextState);
  };

  const toggleSpecSection = (key: string) => {
    setOpenSpecs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Pricing calculations: sort retailers strictly lowest-to-highest so the best deal is always on top
  const sortedRetailers = useMemo(() => {
    if (!phone.retailers || phone.retailers.length === 0) return [];
    return [...phone.retailers].sort((a, b) => {
      const priceA = a.price && a.price > 0 ? a.price : Infinity;
      const priceB = b.price && b.price > 0 ? b.price : Infinity;
      return priceA - priceB;
    });
  }, [phone.retailers]);

  const minRetailerPrice =
    sortedRetailers.length > 0 && sortedRetailers[0].price > 0
      ? sortedRetailers[0].price
      : 0;

  const lowestPrice =
    minRetailerPrice > 0
      ? minRetailerPrice
      : phone.lowest_verified_price && phone.lowest_verified_price > 0
      ? phone.lowest_verified_price
      : phone.price_pkr && phone.price_pkr > 0
      ? phone.price_pkr
      : 0;

  const officialMsrp = phone.price_pkr && phone.price_pkr > 0 ? phone.price_pkr : lowestPrice;
  const savings = officialMsrp > lowestPrice ? officialMsrp - lowestPrice : 0;
  const savingsPercent = officialMsrp > 0 && savings > 0 ? Math.round((savings / officialMsrp) * 100) : 0;
  const hasVerifiedPricing = lowestPrice > 0 && phone.status !== "Discontinued";

  // PTA Tax values
  const tax = phone.pta_tax || {
    passport: phone.usd_price <= 100 ? 3200 : phone.usd_price <= 200 ? 12500 : 45000,
    cnic: phone.usd_price <= 100 ? 4100 : phone.usd_price <= 200 ? 15800 : 58000,
  };

  // Verdict data
  const verdictData = phone.expert_verdict || {
    verdict: `A dependable smartphone offering balanced performance for social apps, streaming, and daily cellular connectivity in Pakistan.`,
    pros: [
      `${phone.battery?.capacity_mah || 4000}mAh Battery with ${phone.battery?.charging_watt || 18}W Charging`,
      `${phone.display?.type || "HD+ IPS"} Display offering clear visibility`,
      `PTA DIRBS approved registered status`,
      `MicroSD expansion slot supported`,
    ],
    cons: [
      `Standard low-light camera capabilities in indoor environments`,
      `Glossy back casing is prone to micro-scratches`,
      `${phone.connectivity?.five_g ? "5G active consumption" : "4G LTE connectivity"}`,
    ],
  };

  // Comparison rivals fallback
  const comp1 = competitors[0] || {
    id: "rival-1",
    slug: "rival-1",
    brand: "Xiaomi",
    model: "Redmi Note",
    price_pkr: 35000,
    lowest_verified_price: 33000,
    battery: { capacity_mah: 5000, charging_watt: 18, wireless_charging: false },
    display: { size: 6.67, type: "AMOLED", resolution: "1080 x 2400", protection: "Gorilla Glass" },
    platform: { chipset: "Snapdragon 685", cpu: "Octa-core", antutu_score: 280000, os: "Android", gpu: "Adreno" },
    camera: { main_mp: 50, setup: "50MP Dual", selfie_mp: 13, video: "1080p", features: "HDR" },
    memory: { ram_gb: 4, storage_gb: 128, card_slot: true },
    connectivity: { five_g: false, nfc: false, headphone_jack: true },
    image: "",
  };

  const comp2 = competitors[1] || {
    id: "rival-2",
    slug: "rival-2",
    brand: "Infinix",
    model: "Hot Series",
    price_pkr: 34000,
    lowest_verified_price: 32000,
    battery: { capacity_mah: 5000, charging_watt: 18, wireless_charging: false },
    display: { size: 6.78, type: "IPS LCD", resolution: "1080 x 2460", protection: "N/A" },
    platform: { chipset: "Helio G88", cpu: "Octa-core", antutu_score: 240000, os: "Android", gpu: "Mali" },
    camera: { main_mp: 50, setup: "50MP Dual", selfie_mp: 8, video: "1080p", features: "HDR" },
    memory: { ram_gb: 4, storage_gb: 128, card_slot: true },
    connectivity: { five_g: false, nfc: false, headphone_jack: true },
    image: "",
  };

  const handleToggleCompare = () => {
    setIsInCompareTray(true);
    setIsTrayVisible(true);
    if (!trayItems.includes(phone.model)) {
      setTrayItems((prev) => [...prev, phone.model]);
    }
  };

  const handleAddRivalToTray = (rivalName: string) => {
    if (trayItems.length < 3) {
      if (!trayItems.includes(rivalName)) {
        setTrayItems((prev) => [...prev, rivalName]);
      }
      setIsTrayVisible(true);
    } else {
      alert("Comparison tray is full (Maximum 3 devices).");
    }
  };

  const activeVariant = useMemo(() => {
    if (!phone.color_variants || phone.color_variants.length === 0) return null;
    return (
      phone.color_variants.find(
        (v) => v.name.toLowerCase() === selectedColor.toLowerCase()
      ) || phone.color_variants[0]
    );
  }, [phone.color_variants, selectedColor]);

  const activeImages = useMemo(() => {
    if (activeVariant?.images && activeVariant.images.length > 0) {
      return activeVariant.images;
    }
    if (phone.images && phone.images.length > 0) {
      return phone.images;
    }
    return phone.image ? [phone.image] : [];
  }, [activeVariant, phone.images, phone.image]);

  const colorOptions = useMemo(() => {
    if (!phone.color_variants || phone.color_variants.length === 0) return [];
    return phone.color_variants.map((v) => ({
      name: v.name,
      dotColor: getVariantDotColor(v.name),
    }));
  }, [phone.color_variants]);

  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
    setSelectedImgIndex(0);
  };

  const handleAngleChange = (_angle: string, imgIdx?: number) => {
    if (typeof imgIdx === "number" && activeImages[imgIdx]) {
      setSelectedImgIndex(imgIdx);
    }
  };

  const currentDisplayImage = activeImages[selectedImgIndex] || activeImages[0] || phone.image;

  return (
    <main className="w-full bg-[#f8f9fa] min-h-screen text-gray-900 antialiased py-4">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 space-y-4">

        {/* ─── 1. BREADCRUMBS & TOP META ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-gray-500">
          <nav className="flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/?q=smartphones" className="hover:text-gray-900 transition-colors">
              Smartphones
            </Link>
            <span>/</span>
            <Link href={`/?q=${phone.brand}`} className="hover:text-gray-900 transition-colors">
              {phone.brand}
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">{phone.model}</span>
          </nav>

          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium ${
                phone.pta_status === "approved"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {phone.pta_status === "approved" ? "verified" : "help_outline"}
              </span>
              {phone.pta_status === "approved" ? "PTA Approved (DIRBS)" : "Non-PTA"}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-normal">
              1-Year Warranty
            </span>
          </div>
        </div>

        {/* ─── 2. TOP HERO SECTION ──────────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

            {/* Left: Product Image & Angles (4 cols) */}
            <div className="md:col-span-4 lg:col-span-4 flex flex-col items-center">
              <div className="relative w-full max-w-[260px] aspect-[4/5] max-h-[280px] bg-white rounded-xl border border-gray-100 flex items-center justify-center p-3 group shadow-2xs">
                {/* Status badge */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-white/95 text-gray-700 border border-gray-200 shadow-2xs">
                    {phone.trending_rank ? `#${phone.trending_rank} Trending` : phone.brand}
                  </span>
                </div>

                {/* Zoom / Fullscreen Trigger */}
                <button
                  type="button"
                  onClick={() => setIs360ModalOpen(true)}
                  title="Zoom & Fullscreen view"
                  aria-label="Zoom & Fullscreen view"
                  className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/95 text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition shadow-2xs"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-orange-600" />
                  Zoom
                </button>

                {/* Main Product Image */}
                <img
                  src={getSupabaseImageUrl(currentDisplayImage)}
                  alt={`${phone.brand} ${phone.model} - ${selectedColor}`}
                  className="max-h-[220px] w-auto object-contain transition-transform duration-200 group-hover:scale-102"
                />
              </div>

              {/* Thumbnails row */}
              {activeImages.length > 1 && (
                <div className="flex items-center gap-2 mt-3 overflow-x-auto max-w-full pb-1 no-scrollbar justify-center">
                  {activeImages.slice(0, 6).map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAngleChange(`angle-${idx}`, idx)}
                      className={`w-11 h-11 rounded-md border p-1 bg-white transition flex items-center justify-center ${
                        selectedImgIndex === idx
                          ? "border-orange-500 ring-1 ring-orange-500"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={getSupabaseImageUrl(img)}
                        alt={`Angle ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Color finishes chips */}
              {colorOptions.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3 flex-wrap justify-center">
                  {colorOptions.map((c, idx) => {
                    const isSelected = selectedColor.toLowerCase() === c.name.toLowerCase();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleColorSelect(c.name)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal transition ${
                          isSelected
                            ? "bg-gray-100 text-gray-900 border border-gray-400 font-medium shadow-2xs"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-gray-300 shadow-2xs shrink-0"
                          style={{ backgroundColor: c.dotColor }}
                        />
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Specs Strip & Price CTA (8 cols) */}
            <div className="md:col-span-8 lg:col-span-8 flex flex-col gap-3">
              {/* Title & Metadata */}
              <div>
                <div className="text-xs text-gray-500 font-normal">
                  {phone.brand} • Released {phone.release_date || "2024"} • Global MSRP: ${phone.usd_price}
                </div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight mt-0.5">
                  {formatPhoneName(phone.brand, phone.model)}
                </h1>
                <p className="text-sm text-gray-600 font-normal mt-1 leading-relaxed">
                  Equipped with {safeStorage}GB storage, {safeRam}GB RAM, {phone.platform?.chipset || "Octa-Core processor"}, and a {phone.display?.size || 6.6}&quot; {phone.display?.type?.split(",")[0] || "display"}.
                </p>
              </div>

              {/* Compact Key Highlights Strip (5 core items) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-1">
                <div className="bg-gray-50 rounded-lg border border-gray-200/80 p-2 text-center">
                  <div className="text-[11px] text-gray-500 font-normal">Display</div>
                  <div className="text-xs font-medium text-gray-900 truncate mt-0.5">
                    {phone.display?.size || 6.6}&quot; {phone.display?.type?.split(",")[0] || "HD+"}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg border border-gray-200/80 p-2 text-center">
                  <div className="text-[11px] text-gray-500 font-normal">Camera</div>
                  <div className="text-xs font-medium text-gray-900 truncate mt-0.5">
                    {phone.camera?.main_mp || 50}MP + {phone.camera?.selfie_mp || 8}MP
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg border border-gray-200/80 p-2 text-center">
                  <div className="text-[11px] text-gray-500 font-normal">Battery</div>
                  <div className="text-xs font-medium text-gray-900 truncate mt-0.5">
                    {phone.battery?.capacity_mah || 5000} mAh
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg border border-gray-200/80 p-2 text-center">
                  <div className="text-[11px] text-gray-500 font-normal">Storage / RAM</div>
                  <div className="text-xs font-medium text-gray-900 truncate mt-0.5">
                    {safeStorage}GB / {safeRam}GB
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-gray-50 rounded-lg border border-gray-200/80 p-2 text-center">
                  <div className="text-[11px] text-gray-500 font-normal">Chipset</div>
                  <div className="text-xs font-medium text-gray-900 truncate mt-0.5">
                    {phone.platform?.chipset?.split(" ")[0] || "Octa-Core"}
                  </div>
                </div>
              </div>

              {/* Price & Primary Action Box */}
              <div className="rounded-xl bg-gray-50/75 border border-gray-200 p-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] text-gray-500 font-normal uppercase tracking-wider">
                      {hasVerifiedPricing ? "Estimated Market Price in Pakistan" : "Market Status"}
                    </div>
                    <div className="flex items-baseline gap-2.5 mt-0.5 flex-wrap">
                      <span className="text-2xl font-semibold text-orange-600">
                        {hasVerifiedPricing ? formatPKR(lowestPrice) : "Price N/A"}
                      </span>
                      {hasVerifiedPricing && savings > 0 && (
                        <span className="text-xs text-gray-400 line-through">
                          MSRP {formatPKR(officialMsrp)}
                        </span>
                      )}
                      {!hasVerifiedPricing && (
                        <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                          {phone.status || "Discontinued"}
                        </span>
                      )}
                    </div>
                  </div>

                  {hasVerifiedPricing && savings > 0 && (
                    <div className="self-start sm:self-auto bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded text-xs font-medium">
                      Save {formatPKR(savings)} ({savingsPercent}%)
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {hasVerifiedPricing ? (
                    <a
                      href="#prices"
                      className="h-9 px-4 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
                      View Store Prices ({sortedRetailers.length}) ↓
                    </a>
                  ) : (
                    <a
                      href="#prices"
                      className="h-9 px-4 text-xs font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                      Check Market Status ↓
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleCompare}
                    className={`h-9 px-3.5 text-xs font-medium rounded-lg border transition-colors inline-flex items-center justify-center gap-1.5 ${
                      isInCompareTray
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isInCompareTray ? "check" : "balance"}
                    </span>
                    {isInCompareTray ? "In Compare Tray" : "+ Add to Compare"}
                  </button>

                  <a
                    href="#pta-tax"
                    className="h-9 px-3.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">calculate</span>
                    PTA Tax
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── 3. STICKY QUICK-NAV BAR ─────────────────────────────────────────── */}
        <div className="sticky top-2 z-20 bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2 overflow-x-auto text-xs font-medium text-gray-600 shadow-xs no-scrollbar">
          <a href="#specs" className="px-2.5 py-1 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors whitespace-nowrap">
            Specifications
          </a>
          <span className="text-gray-300">•</span>
          <a href="#prices" className="px-2.5 py-1 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors whitespace-nowrap">
            Prices ({sortedRetailers.length})
          </a>
          <span className="text-gray-300">•</span>
          <a href="#pta-tax" className="px-2.5 py-1 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors whitespace-nowrap">
            PTA Tax & Duty
          </a>
          <span className="text-gray-300">•</span>
          <a href="#compare-rivals" className="px-2.5 py-1 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors whitespace-nowrap">
            Compare Rivals
          </a>
          <span className="text-gray-300">•</span>
          <a href="#verdict" className="px-2.5 py-1 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors whitespace-nowrap">
            Expert Verdict
          </a>
        </div>

        {/* ─── 4. DETAILED SPECIFICATIONS TABLE ─────────────────────────────────── */}
        <section id="specs" className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-xs scroll-mt-14">
          <SectionHeading
            title="Technical Specifications"
            subtitle={`Verified hardware components and architecture for ${phone.brand} ${phone.model}`}
            action={
              <button
                type="button"
                onClick={toggleAllSpecs}
                className="h-8 px-3 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">unfold_more</span>
                Toggle All
              </button>
            }
          />

          <div className="space-y-3">
            {specCategories.map((cat) => (
              <SpecTable
                key={cat.key}
                category={cat}
                isOpen={openSpecs[cat.key] !== false}
                onToggle={() => toggleSpecSection(cat.key)}
              />
            ))}
          </div>
        </section>

        {/* ─── 5. ESTIMATED RETAILERS & PRICES ───────────────────────────────────── */}
        <section id="prices" className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-xs scroll-mt-14">
          <SectionHeading
            title="Estimated Market Prices in Pakistan"
            subtitle="Real-time approximate market prices gathered across local stores and dealers"
            action={
              <button
                type="button"
                onClick={() => setIsPriceAlertOpen(true)}
                className="h-8 px-3 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-lg transition-colors inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                Price Drop Alert
              </button>
            }
          />

          {sortedRetailers.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-normal text-gray-500">
                      <th className="py-2.5 px-4 font-normal">Store / Seller</th>
                      <th className="py-2.5 px-4 font-normal">Condition</th>
                      <th className="py-2.5 px-4 font-normal">Delivery</th>
                      <th className="py-2.5 px-4 font-normal">Estimated Price</th>
                      <th className="py-2.5 px-4 text-right font-normal">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedRetailers.map((r, idx) => {
                      const isLowest = idx === 0 || (r.price === minRetailerPrice && minRetailerPrice > 0);
                      return (
                        <tr key={idx} className={`hover:bg-gray-50/75 transition-colors ${isLowest ? "bg-orange-50/30" : ""}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{r.store}</span>
                              {isLowest && (
                                <span className="text-[11px] font-medium text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                                  Lowest Price
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 font-normal text-[13px]">
                            {r.condition || "Box Pack Sealed"}
                          </td>
                          <td className="py-3 px-4 text-gray-600 font-normal text-[13px]">
                            {r.delivery || "Standard Dispatch"}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-sm font-semibold ${isLowest ? "text-orange-600" : "text-gray-900"}`}>
                              {formatPKR(r.price)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 px-3 text-xs font-medium text-white bg-gray-900 hover:bg-black rounded-lg transition-colors inline-flex items-center justify-center gap-1 shadow-2xs"
                            >
                              Open Store ↗
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View (Fluid CSS Flexbox) */}
              <div className="sm:hidden flex flex-col gap-2.5">
                {sortedRetailers.map((r, idx) => {
                  const isLowest = idx === 0 || (r.price === minRetailerPrice && minRetailerPrice > 0);
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2 ${
                        isLowest ? "bg-orange-50/40 border-orange-200" : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{r.store}</span>
                          {isLowest && (
                            <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Lowest Price
                            </span>
                          )}
                        </div>
                        <span className={`text-base font-bold ${isLowest ? "text-orange-600" : "text-gray-900"}`}>
                          {formatPKR(r.price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-1.5 border-t border-gray-100">
                        <span className="truncate max-w-[170px]">{r.condition || "Box Pack Sealed"} • {r.delivery || "Standard Dispatch"}</span>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 hover:bg-black rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs shrink-0"
                        >
                          Open Store ↗
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-8 px-4 rounded-lg bg-gray-50 border border-gray-200 text-center flex flex-col items-center">
              <span className="material-symbols-outlined text-gray-400 text-3xl mb-2">inventory_2</span>
              <h3 className="text-sm font-semibold text-gray-900">No Active Online Store Listings</h3>
              <p className="text-xs text-gray-500 max-w-md mt-1">
                {phone.brand} {phone.model} is unlisted or discontinued. Certified merchants no longer carry brand-new inventory.
              </p>
            </div>
          )}
        </section>

        {/* ─── 6. PTA TAX & DIRBS DUTY ─────────────────────────────────────────── */}
        <section id="pta-tax" className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-xs scroll-mt-14">
          <SectionHeading
            title="PTA Tax & DIRBS Duty Assessment"
            subtitle={`Official Pakistan Telecommunication Authority customs duty for ${phone.brand} ${phone.model} ($${phone.usd_price} tier)`}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900">Passport Registration</span>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Traveler Subsidized
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-normal mt-1">
                  Valid for international travelers registering within 60 days of entry arrival stamp.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200 flex items-baseline justify-between">
                <span className="text-xs text-gray-500 font-normal">Calculated Duty:</span>
                <span className="text-lg font-semibold text-gray-900">{formatPKR(tax.passport)}</span>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900">CNIC Registration</span>
                  <span className="text-[11px] font-medium text-gray-700 bg-gray-200 px-2 py-0.5 rounded">
                    Citizen Standard
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-normal mt-1">
                  Standard DIRBS device activation via 13-digit National Identity Card.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200 flex items-baseline justify-between">
                <span className="text-xs text-gray-500 font-normal">Calculated Duty:</span>
                <span className="text-lg font-semibold text-gray-900">{formatPKR(tax.cnic)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 7. COMPARE WITH RIVALS ──────────────────────────────────────────── */}
        <section id="compare-rivals" className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-xs scroll-mt-14">
          <SectionHeading
            title={`Compare ${phone.model} With Rivals`}
            subtitle="Side-by-side hardware evaluation against popular alternatives in Pakistan"
            action={
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setDiffOnly(false)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    !diffOnly ? "bg-white text-gray-900 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Full Specs
                </button>
                <button
                  type="button"
                  onClick={() => setDiffOnly(true)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    diffOnly ? "bg-white text-gray-900 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Differences Only
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Phone */}
            <div className="rounded-lg border-2 border-orange-500 p-4 bg-white flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 inline-block mb-2">
                  Current Selection
                </span>
                <h3 className="text-sm font-semibold text-gray-900">{formatPhoneName(phone.brand, phone.model)}</h3>
                <div className="text-base font-semibold text-orange-600 mt-0.5">{formatPKR(lowestPrice)}</div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-normal">Battery</span>
                    <span className="text-gray-900 font-normal">{phone.battery?.capacity_mah || 5000} mAh</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-normal">Display</span>
                    <span className="text-gray-900 font-normal">{phone.display?.size || 6.6}&quot;</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-normal">Chipset</span>
                    <span className="text-gray-900 font-normal truncate max-w-[130px]">{phone.platform?.chipset?.split(" ")[0] || "Octa-Core"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-normal">Camera</span>
                    <span className="text-gray-900 font-normal">{phone.camera?.main_mp || 50}MP</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-normal block text-center">Selected in Comparison</span>
              </div>
            </div>

            {/* Rival 1 */}
            <div className="rounded-lg border border-gray-200 p-4 bg-white flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded inline-block mb-2">
                  Alternative 1
                </span>
                <h3 className="text-sm font-semibold text-gray-900">{formatPhoneName(comp1.brand, comp1.model)}</h3>
                <div className="text-base font-semibold text-gray-900 mt-0.5">{formatPKR(comp1.lowest_verified_price || comp1.price_pkr)}</div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-normal">Battery</span>
                    <span className="text-gray-900 font-normal">{comp1.battery?.capacity_mah || 5000} mAh</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-normal">Display</span>
                    <span className="text-gray-900 font-normal">{comp1.display?.size || 6.67}&quot;</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-normal">Chipset</span>
                    <span className="text-gray-900 font-normal truncate max-w-[130px]">{comp1.platform?.chipset?.split(" ")[0] || "SoC"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-normal">Camera</span>
                    <span className="text-gray-900 font-normal">{comp1.camera?.main_mp || 50}MP</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleAddRivalToTray(comp1.model)}
                  className="w-full h-8 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                >
                  + Add to Compare
                </button>
              </div>
            </div>

            {/* Rival 2 */}
            <div className="rounded-lg border border-gray-200 p-4 bg-white flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded inline-block mb-2">
                  Alternative 2
                </span>
                <h3 className="text-sm font-semibold text-gray-900">{formatPhoneName(comp2.brand, comp2.model)}</h3>
                <div className="text-base font-semibold text-gray-900 mt-0.5">{formatPKR(comp2.lowest_verified_price || comp2.price_pkr)}</div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-normal">Battery</span>
                    <span className="text-gray-900 font-normal">{comp2.battery?.capacity_mah || 5000} mAh</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-normal">Display</span>
                    <span className="text-gray-900 font-normal">{comp2.display?.size || 6.78}&quot;</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-normal">Chipset</span>
                    <span className="text-gray-900 font-normal truncate max-w-[130px]">{comp2.platform?.chipset?.split(" ")[0] || "SoC"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500 font-normal">Camera</span>
                    <span className="text-gray-900 font-normal">{comp2.camera?.main_mp || 50}MP</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleAddRivalToTray(comp2.model)}
                  className="w-full h-8 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                >
                  + Add to Compare
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 8. EXPERT VERDICT ───────────────────────────────────────────────── */}
        <section id="verdict" className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-xs scroll-mt-14">
          <SectionHeading
            title="Expert Assessment"
            subtitle={`Overall appraisal and field performance test notes for ${phone.brand} ${phone.model}`}
          />

          <p className="text-sm text-gray-700 font-normal leading-relaxed mb-4">
            {verdictData.verdict}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200/60">
              <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Strengths
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-700">
                {verdictData.pros.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 font-normal">
                    <span className="text-emerald-600 font-semibold">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200/60">
              <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Considerations
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-700">
                {verdictData.cons.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 font-normal">
                    <span className="text-amber-600 font-semibold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

      </div>

      {/* ─── 9. FLOATING BOTTOM COMPARISON TRAY ─────────────────────────────────── */}
      {isTrayVisible && (
        <div
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-3xl bg-gray-900 text-white rounded-xl shadow-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
          id="compare-bar"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white font-medium text-[11px]">
              {trayItems.length}/3
            </span>
            <span className="font-normal text-gray-200 truncate">
              Comparing: <strong className="font-medium text-white">{phone.brand} {phone.model}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/compare?phones=${[phone.slug, comp1?.slug, comp2?.slug]
                .filter(Boolean)
                .slice(0, Math.min(3, trayItems.length))
                .join(",")}&from=${encodeURIComponent(`/phone/${phone.slug}`)}`}
              className="h-8 px-3.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors inline-flex items-center gap-1"
            >
              Compare ({trayItems.length})
            </Link>
            <button
              type="button"
              onClick={() => setIsTrayVisible(false)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Dismiss Tray"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── 10. ZOOM / GALLERY MODAL ────────────────────────────────────────── */}
      {is360ModalOpen && (
        <div className="compare-modal-overlay">
          <div className="relative bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center">
                  <ZoomIn className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  {phone.brand} {phone.model} Gallery & Zoom
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIs360ModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="py-4 flex flex-col items-center">
              <div className="w-full h-[260px] flex items-center justify-center p-3 bg-white rounded-xl border border-gray-100">
                <img
                  src={getSupabaseImageUrl(currentDisplayImage)}
                  alt="Product view"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {activeImages.length > 1 && (
                <div className="flex items-center gap-2 mt-4 overflow-x-auto w-full justify-center">
                  {activeImages.slice(0, 6).map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImgIndex(idx)}
                      className={`w-12 h-12 rounded-lg border p-1 bg-white transition flex items-center justify-center ${
                        selectedImgIndex === idx ? "border-orange-600 ring-1 ring-orange-600" : "border-gray-200"
                      }`}
                    >
                      <img
                        src={getSupabaseImageUrl(img)}
                        alt={`Angle ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <span>Photo {selectedImgIndex + 1} of {Math.min(activeImages.length, 6)}</span>
              <button
                type="button"
                onClick={() => setIs360ModalOpen(false)}
                className="px-4 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-black font-medium transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 11. PRICE DROP ALERT MODAL ────────────────────────────────────────── */}
      {isPriceAlertOpen && (
        <div className="compare-modal-overlay">
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-orange-600 text-[20px]">notifications_active</span>
                <h3 className="text-base font-semibold text-gray-900">Set Price Alert</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPriceAlertOpen(false);
                  setAlertSubmitted(false);
                }}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {alertSubmitted ? (
              <div className="py-6 text-center flex flex-col items-center gap-2">
                <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">check</span>
                </span>
                <h4 className="text-sm font-semibold text-gray-900">Alert Registered</h4>
                <p className="text-xs text-gray-500 max-w-xs font-normal">
                  We&apos;ll notify you when the price drops below Rs. {Number(alertTargetPrice).toLocaleString()}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsPriceAlertOpen(false);
                    setAlertSubmitted(false);
                  }}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-orange-600 text-white font-medium text-xs shadow-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="py-4 flex flex-col gap-3">
                <p className="text-xs text-gray-500 font-normal">
                  Current estimated price: <span className="font-semibold text-gray-900">{formatPKR(lowestPrice)}</span>
                </p>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-700">Target Price (PKR)</label>
                  <input
                    type="number"
                    value={alertTargetPrice}
                    onChange={(e) => setAlertTargetPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-normal text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-700">Email or WhatsApp</label>
                  <input
                    type="text"
                    placeholder="name@example.com"
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-normal text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setAlertSubmitted(true)}
                  className="w-full mt-2 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium transition shadow-xs"
                >
                  Activate Alert
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
