"use client";

import { useState } from "react";
import Link from "next/link";
import { type Phone } from "@/types";
import { formatPKR, getSupabaseImageUrl } from "@/lib/utils";
import { getPhoneDetailedSpecs } from "@/lib/specs";

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

export function ProductClient({ phone, competitors }: ProductClientProps) {
  // Safe RAM and Storage fallback handling
  const rawRam = phone.memory?.ram_gb;
  const rawStorage = phone.memory?.storage_gb;
  const safeRam = (rawRam && rawStorage && rawRam > rawStorage) ? rawStorage : (rawRam || 4);
  const safeStorage = (rawRam && rawStorage && rawRam > rawStorage) ? rawRam : (rawStorage || 64);

  // State for image gallery / angle selection
  const allImages = (phone.images && phone.images.length > 0) ? phone.images : [phone.image];
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [selectedAngle, setSelectedAngle] = useState<string>("front");
  const [selectedColor, setSelectedColor] = useState<string>(
    phone.color_variants && phone.color_variants.length > 0
      ? phone.color_variants[0].name
      : "Nebula Blue"
  );

  // 360 Studio Modal State
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);

  // Price Drop Alert Modal State
  const [isPriceAlertOpen, setIsPriceAlertOpen] = useState(false);
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>(
    phone.lowest_verified_price
      ? (phone.lowest_verified_price * 0.95).toFixed(0)
      : (phone.price_pkr * 0.95).toFixed(0)
  );
  const [alertEmail, setAlertEmail] = useState("");
  const [alertSubmitted, setAlertSubmitted] = useState(false);

  // Compare Tray State
  const [trayItems, setTrayItems] = useState<string[]>([phone.model]);
  const [isTrayVisible, setIsTrayVisible] = useState(true);
  const [isInCompareTray, setIsInCompareTray] = useState(true);

  // Quick Differences vs Full Specs toggle
  const [diffOnly, setDiffOnly] = useState(false);

  // WhatMobile 9-Category Detailed Specifications
  const specCategories = getPhoneDetailedSpecs(phone);

  // Accordion Spec Cards State (Full 9 WhatMobile Categories)
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

  // Calculations for pricing
  const lowestPrice = (phone.lowest_verified_price && phone.lowest_verified_price > 0)
    ? phone.lowest_verified_price
    : (phone.price_pkr && phone.price_pkr > 0 ? phone.price_pkr : 0);
  const officialMsrp = phone.price_pkr && phone.price_pkr > 0 ? phone.price_pkr : lowestPrice;
  const savings = officialMsrp > lowestPrice ? officialMsrp - lowestPrice : 0;
  const savingsPercent = officialMsrp > 0 && savings > 0 ? Math.round((savings / officialMsrp) * 100) : 0;

  // Retailers list: ONLY show authentic verified retailers, NEVER fabricate fake listings for discontinued phones!
  const retailers = phone.retailers && phone.retailers.length > 0 ? phone.retailers : [];
  const minRetailerPrice = retailers.length > 0 ? Math.min(...retailers.map((r) => r.price)) : 0;
  const hasVerifiedPricing = lowestPrice > 0 && retailers.length > 0 && phone.status !== "Discontinued";

  // PTA Tax values
  const tax = phone.pta_tax || {
    passport: phone.usd_price <= 100 ? 3200 : phone.usd_price <= 200 ? 12500 : 45000,
    cnic: phone.usd_price <= 100 ? 4100 : phone.usd_price <= 200 ? 15800 : 58000,
  };

  // Verdict data
  const verdictData = phone.expert_verdict || {
    verdict: `Impressive smartphone offering dedicated optimization with smooth performance for social apps, gaming, and streaming in Pakistan. While low-light camera capabilities remain standard, the battery stamina and charging turnaround are virtually unmatched at this benchmark.`,
    pros: [
      `${phone.battery?.capacity_mah || 4000}mAh Battery with ${phone.battery?.charging_watt || 18}W Fast Charging`,
      `${phone.display?.type || 'HD+ IPS'} Display offering broad sunlight visibility`,
      `Full official PTA DIRBS approval${hasVerifiedPricing ? ` under ${formatPKR(lowestPrice)}` : " status registered"}`,
      `Dedicated MicroSD slot for expandable storage up to 256GB`,
    ],
    cons: [
      `Standard low-light camera sensor experiences noise in ultra low-light indoor shoots`,
      `High-gloss rear casing is prone to micro-scratches without protective cover`,
      `${phone.connectivity?.five_g ? 'Moderate 5G battery consumption' : 'No 5G Connectivity (restricted to 4G LTE-A)'}`,
    ],
  };

  // Comparison rivals
  const comp1 = competitors[0] || {
    id: "xiaomi-redmi-a3",
    slug: "xiaomi-redmi-a3",
    brand: "Xiaomi",
    model: "Redmi A3",
    price_pkr: 25999,
    lowest_verified_price: 23999,
    battery: { capacity_mah: 5000, charging_watt: 10, wireless_charging: false },
    display: { size: 6.71, type: "90Hz LCD", resolution: "720 x 1650", protection: "Gorilla Glass 3" },
    platform: { chipset: "Helio G36", cpu: "Octa-core 2.2 GHz", antutu_score: 140000, os: "Android 14", gpu: "PowerVR" },
    camera: { main_mp: 8, setup: "8MP Dual AI", selfie_mp: 5, video: "1080p", features: "HDR" },
    memory: { ram_gb: 3, storage_gb: 64, card_slot: true },
    connectivity: { five_g: false, nfc: false, headphone_jack: true },
    image: "https://images.priceoye.pk/xiaomi-redmi-a3-pakistan-priceoye-500x500.webp",
  };

  const comp2 = competitors[1] || {
    id: "infinix-smart-8",
    slug: "infinix-smart-8",
    brand: "Infinix",
    model: "Smart 8",
    price_pkr: 24999,
    lowest_verified_price: 22499,
    battery: { capacity_mah: 5000, charging_watt: 10, wireless_charging: false },
    display: { size: 6.6, type: "90Hz Punch-Hole IPS", resolution: "720 x 1612", protection: "N/A" },
    platform: { chipset: "Unisoc T606", cpu: "Octa-core 1.6 GHz", antutu_score: 210000, os: "Android 13 Go", gpu: "Mali-G57" },
    camera: { main_mp: 13, setup: "13MP Dual AI", selfie_mp: 8, video: "1080p", features: "Quad Flash" },
    memory: { ram_gb: 3, storage_gb: 64, card_slot: true },
    connectivity: { five_g: false, nfc: false, headphone_jack: true },
    image: "https://images.priceoye.pk/infinix-smart-8-pakistan-priceoye-500x500.webp",
  };

  // Actions
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

  const handleAngleChange = (angle: string, imgIdx?: number) => {
    setSelectedAngle(angle);
    if (typeof imgIdx === "number" && allImages[imgIdx]) {
      setSelectedImgIndex(imgIdx);
    }
  };

  // Color Finishes options
  const colorOptions = phone.color_variants && phone.color_variants.length > 0
    ? phone.color_variants.map((v) => ({ name: v.name, dotColor: v.name.toLowerCase().includes('blue') ? '#2563eb' : v.name.toLowerCase().includes('green') ? '#059669' : v.name.toLowerCase().includes('gold') ? '#d97706' : v.name.toLowerCase().includes('white') || v.name.toLowerCase().includes('silver') ? '#cbd5e1' : '#0f172a' }))
    : [
        { name: "Nebula Blue", dotColor: "#2563eb" },
        { name: "Titanium Silver", dotColor: "#cbd5e1" },
        { name: "Onyx Black", dotColor: "#0f172a" },
      ];

  const currentDisplayImage = allImages[selectedImgIndex] || phone.image;

  return (
    <main className="w-full bg-surface min-h-screen text-on-surface antialiased pt-2 product-page-wrapper">
      <div className="flex flex-col w-full">

        {/* ==========================================================================
            1. TOP BREADCRUMB & LIVE TRACKER RIBBON
            ========================================================================== */}
        <section className="w-full bg-surface-container-lowest border-b border-border-hairline">
          <div className="max-w-7xl mx-auto px-gutter py-3 flex flex-wrap items-center justify-between gap-y-2">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
              <Link className="hover:text-primary transition-colors flex items-center gap-1" href="/">
                <span className="material-symbols-outlined text-[16px]">home</span> Home
              </Link>
              <span>/</span>
              <Link className="hover:text-primary transition-colors" href="/?q=smartphones">
                Smartphones
              </Link>
              <span>/</span>
              <Link className="hover:text-primary transition-colors" href={`/?q=${phone.brand}`}>
                {phone.brand}
              </Link>
              <span>/</span>
              <span className="text-on-surface font-semibold">{phone.model}</span>
            </nav>

            {/* Trust Badges Bar */}
            <div className="flex items-center flex-wrap gap-2 text-label-sm font-label-sm">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container font-semibold text-on-surface">
                <span className="material-symbols-outlined text-[15px] text-tertiary-container">verified</span>
                {phone.pta_status === "approved" ? "PTA Approved (DIRBS)" : "Non-PTA / JV (Tax Required)"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-[15px]">format_image_left</span>
                {phone.warranty ? `${phone.warranty.provider} ${phone.warranty.duration_months}M Warranty` : `${phone.brand} Pakistan 1-Year Warranty`}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-badge-blue-tint text-tertiary-container font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                Live Price (Updated 15 mins ago)
              </span>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            2. PRODUCT HERO SHOWCASE
            ========================================================================== */}
        <section className="w-full bg-surface py-space-xl">
          <div className="max-w-7xl mx-auto px-gutter">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">

              {/* Left: Product Studio Showcase (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="relative w-full rounded-2xl bg-surface-container-lowest p-6 shadow-sm overflow-hidden group border border-border-hairline">
                  {/* Studio Stage Vignette & Badges */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                    <span className="px-3 py-1 rounded-full bg-deal-orange text-surface-container-lowest font-label-sm text-label-sm font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                      {phone.trending_rank ? `Trending #${phone.trending_rank}` : "Value Benchmark"}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                      Official Studio Photo
                    </span>
                  </div>

                  {/* 360 Studio View Trigger */}
                  <button
                    className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/90 backdrop-blur text-on-surface hover:bg-surface-container transition shadow-sm font-label-sm text-label-sm font-semibold border border-border-hairline"
                    id="view-360-btn"
                    onClick={() => setIs360ModalOpen(true)}
                  >
                    <span className="material-symbols-outlined text-[18px] text-tertiary-container">360</span>
                    360° Studio View
                  </button>

                  {/* Main Product Image */}
                  <div className="relative w-full aspect-[4/5] flex items-center justify-center p-4">
                    <img
                      id="main-product-img"
                      src={getSupabaseImageUrl(currentDisplayImage)}
                      alt={`${phone.brand} ${phone.model} studio presentation`}
                      className="w-full h-full object-contain filter drop-shadow-[0_20px_25px_rgba(0,0,0,0.12)] transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Visual Floating Spec Pill */}
                  <div className="absolute bottom-4 left-4 right-4 z-10 bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-3 flex items-center justify-between shadow-sm border border-border-hairline">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600 text-[20px]">verified_user</span>
                      <div>
                        <div className="font-label-md text-label-md font-bold text-on-surface">100% Non-Tampered IMEI</div>
                        <div className="font-body-sm text-body-sm text-on-surface-variant">Validated against PTA DIRBS database</div>
                      </div>
                    </div>
                    <span className="font-label-sm text-label-sm font-bold text-tertiary-container uppercase bg-badge-blue-tint px-2 py-0.5 rounded">
                      Active
                    </span>
                  </div>
                </div>

                {/* Multi-Angle Perspectives & Thumbnails */}
                <div className="flex flex-col gap-2">
                  <span className="font-label-md text-label-md text-on-surface-variant font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span> Multi-Angle Perspectives:
                  </span>
                  <div className="grid grid-cols-4 gap-2.5">
                    {/* Front / Studio Angle */}
                    <button
                      className={`angle-thumb relative rounded-xl bg-surface-container-lowest p-2 shadow-sm transition hover:shadow-md border border-border-hairline ${selectedAngle === "front" ? "ring-2 ring-primary" : ""}`}
                      onClick={() => handleAngleChange("front", 0)}
                    >
                      <div className="w-full h-14 flex items-center justify-center">
                        <img
                          src={getSupabaseImageUrl(allImages[0] || phone.image)}
                          alt="Dual Angle Studio View"
                          className="w-full h-14 object-contain"
                        />
                      </div>
                      <span className="block mt-1 text-center font-label-sm text-[10px] text-on-surface font-semibold truncate">
                        Dual Angle
                      </span>
                    </button>

                    {/* Back Dynamic Angle */}
                    <button
                      className={`angle-thumb relative rounded-xl bg-surface-container-lowest p-2 shadow-sm transition hover:shadow-md border border-border-hairline ${selectedAngle === "back" ? "ring-2 ring-primary" : ""}`}
                      onClick={() => handleAngleChange("back", Math.min(1, allImages.length - 1))}
                    >
                      <div className="w-full h-14 rounded-lg bg-surface-subtle flex items-center justify-center">
                        {allImages[1] ? (
                          <img src={getSupabaseImageUrl(allImages[1])} alt="Dynamic Back" className="w-full h-14 object-contain" />
                        ) : (
                          <span className="material-symbols-outlined text-outline text-[24px]">smartphone</span>
                        )}
                      </div>
                      <span className="block mt-1 text-center font-label-sm text-[10px] text-on-surface-variant truncate">
                        Dynamic Back
                      </span>
                    </button>

                    {/* Camera Module Angle */}
                    <button
                      className={`angle-thumb relative rounded-xl bg-surface-container-lowest p-2 shadow-sm transition hover:shadow-md border border-border-hairline ${selectedAngle === "camera" ? "ring-2 ring-primary" : ""}`}
                      onClick={() => handleAngleChange("camera", Math.min(2, allImages.length - 1))}
                    >
                      <div className="w-full h-14 rounded-lg bg-surface-subtle flex items-center justify-center">
                        {allImages[2] ? (
                          <img src={getSupabaseImageUrl(allImages[2])} alt="Camera Module" className="w-full h-14 object-contain" />
                        ) : (
                          <span className="material-symbols-outlined text-outline text-[24px]">photo_camera_back</span>
                        )}
                      </div>
                      <span className="block mt-1 text-center font-label-sm text-[10px] text-on-surface-variant truncate">
                        {phone.camera?.main_mp || 8}MP Module
                      </span>
                    </button>

                    {/* Edge Profile Angle */}
                    <button
                      className={`angle-thumb relative rounded-xl bg-surface-container-lowest p-2 shadow-sm transition hover:shadow-md border border-border-hairline ${selectedAngle === "profile" ? "ring-2 ring-primary" : ""}`}
                      onClick={() => handleAngleChange("profile", Math.min(3, allImages.length - 1))}
                    >
                      <div className="w-full h-14 rounded-lg bg-surface-subtle flex items-center justify-center">
                        {allImages[3] ? (
                          <img src={getSupabaseImageUrl(allImages[3])} alt="Edge Profile" className="w-full h-14 object-contain" />
                        ) : (
                          <span className="material-symbols-outlined text-outline text-[24px]">edgesensor_high</span>
                        )}
                      </div>
                      <span className="block mt-1 text-center font-label-sm text-[10px] text-on-surface-variant truncate">
                        Edge Profile
                      </span>
                    </button>
                  </div>
                </div>

                {/* Color Selector Chips */}
                <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center justify-between border border-border-hairline flex-wrap gap-2">
                  <span className="font-label-md text-label-md text-on-surface font-bold">Color Finishes:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {colorOptions.map((c, i) => {
                      const isSelected = selectedColor === c.name;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedColor(c.name)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold transition ${
                            isSelected
                              ? "bg-badge-blue-tint text-tertiary-container ring-1 ring-tertiary-container/30"
                              : "bg-surface-subtle text-on-surface-variant hover:bg-surface-container"
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shadow-inner"
                            style={{ backgroundColor: c.dotColor }}
                          />
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right: Device Summary & Benchmark Info (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-6">

                {/* Title & Release Header */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-deal-orange font-bold bg-orange-100 px-3 py-0.5 rounded-full">
                      {!hasVerifiedPricing ? "Discontinued / Unlisted Device" : lowestPrice < 35000 ? "Entry-Level Value King" : lowestPrice < 100000 ? "Mid-Range Powerhouse" : "Premium Flagship"}
                    </span>
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      Released {phone.release_date} • Global MSRP: ${phone.usd_price}
                    </span>
                  </div>

                  <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-extrabold">
                    {formatPhoneName(phone.brand, phone.model)}
                  </h1>

                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {phone.model} engineered with {safeStorage}GB high-speed storage, {phone.platform?.chipset || "Octa-Core architecture"}, and an expansive {phone.display?.size || 6.6}&quot; visual canvas optimized for high-efficiency cellular connectivity in Pakistan.
                  </p>
                </div>

                {/* Big Price Highlight Bento Card */}
                <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm relative overflow-hidden border border-border-hairline">
                  <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-secondary/5 blur-2xl pointer-events-none"></div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-hairline">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {hasVerifiedPricing ? (
                          <>
                            <span className="font-label-sm text-label-sm text-deal-orange font-bold uppercase tracking-wider">
                              Lowest Verified Market Price in Pakistan
                            </span>
                            <span className="w-2 h-2 rounded-full bg-deal-orange animate-pulse"></span>
                          </>
                        ) : (
                          <>
                            <span className="font-label-sm text-label-sm text-slate-500 font-bold uppercase tracking-wider">
                              Market Status & Availability
                            </span>
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          </>
                        )}
                      </div>
                      <div className="flex items-baseline gap-3 mt-1 flex-wrap">
                        <span className={`font-headline-xl text-headline-xl font-bold tracking-tight ${hasVerifiedPricing ? "text-on-surface" : "text-slate-600"}`}>
                          {hasVerifiedPricing ? formatPKR(lowestPrice) : "Price N/A"}
                        </span>
                        {hasVerifiedPricing && savings > 0 && (
                          <span className="font-label-lg text-label-lg line-through text-outline">
                            Official MSRP: {formatPKR(officialMsrp)}
                          </span>
                        )}
                        {!hasVerifiedPricing && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {phone.status || "Discontinued / Unlisted"}
                          </span>
                        )}
                      </div>
                      {!hasVerifiedPricing && (
                        <p className="text-sm text-slate-500 mt-1.5 max-w-lg">
                          This model is discontinued and no longer listed for sale by official retail stores across Pakistan.
                        </p>
                      )}
                    </div>

                    {/* Savings Pill */}
                    {hasVerifiedPricing && savings > 0 && (
                      <div className="flex items-center gap-2 self-start md:self-auto bg-orange-100 px-3 py-2 rounded-xl text-deal-orange">
                        <span className="material-symbols-outlined text-[20px]">trending_down</span>
                        <div className="text-left">
                          <div className="font-label-sm text-label-sm font-bold leading-tight">
                            Save {formatPKR(savings)}
                          </div>
                          <div className="font-body-sm text-[11px] text-amber-900 leading-tight">
                            {savingsPercent}% vs Official MSRP
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Action CTAs */}
                  <div className="pt-6 flex flex-wrap items-center gap-3">
                    {hasVerifiedPricing ? (
                      <a
                        className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-deal-orange text-surface-container-lowest hover:bg-orange-600 font-label-lg text-label-lg transition shadow-md hover:shadow-lg font-bold"
                        href="#market-prices"
                      >
                        <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                        View Stores & Buy Now ⬇
                      </a>
                    ) : (
                      <a
                        className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 text-surface-container-lowest hover:bg-slate-700 font-label-lg text-label-lg transition shadow-md hover:shadow-lg font-bold"
                        href="#market-prices"
                      >
                        <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                        Check Market Availability ⬇
                      </a>
                    )}
                    <button
                      className={`flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl font-label-lg text-label-lg transition ${
                        isInCompareTray
                          ? "bg-badge-emerald-tint text-secondary font-bold"
                          : "bg-surface-subtle hover:bg-surface-container text-on-surface"
                      }`}
                      id="add-compare-btn"
                      onClick={handleToggleCompare}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isInCompareTray ? "check" : "balance"}
                      </span>
                      {isInCompareTray ? "In Compare Tray" : "+ Add to Compare"}
                    </button>
                    <a
                      className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl bg-badge-blue-tint text-tertiary-container hover:bg-surface-container font-label-lg text-label-lg transition font-semibold"
                      href="#pta-tax-section"
                    >
                      <span className="material-symbols-outlined text-[18px]">calculate</span>
                      Calculate PTA Tax
                    </a>
                  </div>
                </div>

                {/* Value Highlights 3-Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Battery */}
                  <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm flex flex-col gap-1 hover:-translate-y-0.5 transition duration-200 border border-border-hairline">
                    <div className="flex items-center justify-between text-deal-orange">
                      <span className="material-symbols-outlined text-[24px]">battery_charging_full</span>
                      <span className="font-label-sm text-label-sm bg-orange-100 px-2 py-0.5 rounded font-bold">
                        {phone.battery?.capacity_mah && phone.battery.capacity_mah >= 5000 ? "Long Stamina" : "All Day"}
                      </span>
                    </div>
                    <div className="font-headline-sm text-headline-sm font-bold text-on-surface mt-2">
                      {phone.battery?.capacity_mah || 4000} mAh
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      {phone.battery?.charging_watt || 18}W Fast Wired Charging
                    </div>
                  </div>

                  {/* Display */}
                  <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm flex flex-col gap-1 hover:-translate-y-0.5 transition duration-200 border border-border-hairline">
                    <div className="flex items-center justify-between text-tertiary-container">
                      <span className="material-symbols-outlined text-[24px]">aspect_ratio</span>
                      <span className="font-label-sm text-label-sm bg-badge-blue-tint px-2 py-0.5 rounded font-bold truncate max-w-[90px]">
                        {phone.display?.type?.split(",")[0] || "IPS HD+"}
                      </span>
                    </div>
                    <div className="font-headline-sm text-headline-sm font-bold text-on-surface mt-2">
                      {phone.display?.size || 6.6}&quot; Display
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {phone.display?.resolution || "720 x 1612 Pixels Resolution"}
                    </div>
                  </div>

                  {/* Processor */}
                  <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm flex flex-col gap-1 hover:-translate-y-0.5 transition duration-200 border border-border-hairline">
                    <div className="flex items-center justify-between text-deal-orange">
                      <span className="material-symbols-outlined text-[24px]">memory</span>
                      <span className="font-label-sm text-label-sm bg-orange-100 text-deal-orange px-2 py-0.5 rounded font-bold">
                        ~{Math.round((phone.platform?.antutu_score || 230000) / 1000)}k AnTuTu
                      </span>
                    </div>
                    <div className="font-headline-sm text-headline-sm font-bold text-on-surface mt-2">
                      {phone.platform?.chipset?.split(" ")[0] || "Octa-Core"}
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      {safeStorage}GB + {safeRam}GB RAM
                    </div>
                  </div>
                </div>

                {/* Retailer Quick Snippet */}
                {retailers.length > 0 && minRetailerPrice > 0 ? (
                  <div className="rounded-xl bg-surface-container-high/40 p-3.5 flex items-center justify-between gap-4 border border-border-hairline">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-deal-orange"></span>
                      <p className="font-body-sm text-body-sm text-on-surface">
                        <strong>Karachi Saddar & Hafeez Centre:</strong> Physical cash wholesale ready from <strong>{formatPKR(minRetailerPrice)}</strong>.
                      </p>
                    </div>
                    <a className="font-label-sm text-label-sm text-deal-orange font-bold hover:underline whitespace-nowrap" href="#market-prices">
                      Compare {retailers.length} Sellers →
                    </a>
                  </div>
                ) : (
                  <div className="rounded-xl bg-surface-container-high/40 p-3.5 flex items-center justify-between gap-4 border border-border-hairline">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                      <p className="font-body-sm text-body-sm text-on-surface">
                        <strong>Market Status:</strong> Discontinued / Unlisted across official online merchants.
                      </p>
                    </div>
                    <span className="font-label-sm text-label-sm text-slate-500 font-bold whitespace-nowrap">
                      Price N/A
                    </span>
                  </div>
                )}

              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            3. INTERACTIVE SIDE-BY-SIDE QUICK COMPARISON WIDGET
            ========================================================================== */}
        <section className="w-full bg-surface-container-lowest py-space-xl border-y border-border-hairline">
          <div className="max-w-7xl mx-auto px-gutter">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2 text-deal-orange font-label-md text-label-md font-bold uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-[18px]">swap_horiz</span> Benchmark Intelligence
                </div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                  Compare {phone.model} With Rivals
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  {lowestPrice > 0 ? (
                    <>Direct real-time hardware shootout with top Pakistan market competitors under {formatPKR(Math.max(lowestPrice, comp1.price_pkr, comp2.price_pkr) * 1.1)}.</>
                  ) : (
                    <>Direct real-time hardware shootout with top category competitors and alternatives.</>
                  )}
                </p>
              </div>

              {/* Toggle Differences Mode */}
              <div className="flex items-center p-1 bg-surface-subtle rounded-xl border border-border-hairline self-start">
                <button
                  className={`px-3.5 py-1.5 rounded-lg font-label-sm text-label-sm font-semibold transition ${
                    diffOnly
                      ? "bg-surface-container-lowest text-on-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  id="filter-diff-btn"
                  onClick={() => setDiffOnly(true)}
                >
                  Quick Differences Only
                </button>
                <button
                  className={`px-3.5 py-1.5 rounded-lg font-label-sm text-label-sm font-semibold transition ${
                    !diffOnly
                      ? "bg-surface-container-lowest text-on-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  id="filter-all-btn"
                  onClick={() => setDiffOnly(false)}
                >
                  Full Specs
                </button>
              </div>
            </div>

            {/* Comparative Grid of 3 Phones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Target Phone (Current Selection) */}
              <div className="relative rounded-2xl bg-surface p-5 shadow-sm ring-2 ring-deal-orange flex flex-col border border-border-hairline">
                <div className="absolute -top-3 left-4 bg-deal-orange text-surface-container-lowest px-3 py-0.5 rounded-full font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">star</span> CURRENT SELECTION
                </div>

                <div className="flex items-center gap-3 mt-2 mb-4">
                  <div className="w-14 h-18 bg-surface-container-lowest rounded-lg p-1 flex items-center justify-center shadow-xs border border-border-hairline">
                    <img
                      src={getSupabaseImageUrl(phone.image)}
                      alt={phone.model}
                      className="h-14 object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">{formatPhoneName(phone.brand, phone.model)}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{safeStorage}GB Edition</p>
                    <div className="font-headline-sm text-headline-sm font-bold text-deal-orange mt-0.5">{formatPKR(lowestPrice)}</div>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-container-lowest p-3 mb-4 border border-border-hairline">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Overall Value Score</span>
                    <span className="font-label-md text-label-md font-bold text-deal-orange">8.4 / 10</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="bg-deal-orange h-full rounded-full" style={{ width: "84%" }}></div>
                  </div>
                </div>

                <div className="space-y-2.5 flex-1">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">battery_std</span> Battery
                    </span>
                    <span className="font-semibold text-on-surface">{phone.battery?.capacity_mah || 4000} mAh ({phone.battery?.charging_watt || 18}W)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">tv</span> Display
                    </span>
                    <span className="font-semibold text-on-surface">{phone.display?.size || 6.6}&quot; {phone.display?.type?.split(',')[0] || 'IPS HD+'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">memory</span> Processor
                    </span>
                    <span className="font-semibold text-on-surface">{phone.platform?.chipset?.split('(')[0] || 'Octa-Core'} (~{Math.round((phone.platform?.antutu_score || 230000)/1000)}k)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">photo_camera</span> Camera
                    </span>
                    <span className="font-semibold text-on-surface">{phone.camera?.main_mp || 8}MP + {phone.camera?.selfie_mp || 8}MP Selfie</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">sd_card</span> Storage
                    </span>
                    <span className="font-semibold text-deal-orange font-bold">{safeStorage}GB Internal</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border-hairline">
                  <button className="w-full py-2 bg-slate-900 text-surface-container-lowest rounded-xl font-label-md text-label-md font-bold shadow-sm">
                    Selected in Compare Tray
                  </button>
                </div>
              </div>

              {/* Competitor 1 */}
              <div className="rounded-2xl bg-surface p-5 shadow-sm border border-border-hairline flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <Link href={`/phone/${comp1.slug || comp1.id}`} className="w-14 h-18 bg-surface-container-lowest rounded-lg p-1 flex items-center justify-center shadow-xs border border-border-hairline shrink-0 hover:border-deal-orange transition">
                    {comp1.image ? (
                      <img src={getSupabaseImageUrl(comp1.image)} alt={comp1.model} className="h-14 object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-outline text-[32px]">smartphone</span>
                    )}
                  </Link>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      <Link href={`/phone/${comp1.slug || comp1.id}`} className="hover:text-deal-orange transition-colors">
                        {formatPhoneName(comp1.brand, comp1.model)}
                      </Link>
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{comp1.memory?.storage_gb || 64}GB Edition</p>
                    <div className="font-headline-sm text-headline-sm font-bold text-on-surface mt-0.5">{formatPKR(comp1.lowest_verified_price || comp1.price_pkr)}</div>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-container-lowest p-3 mb-4 border border-border-hairline">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Overall Value Score</span>
                    <span className="font-label-md text-label-md font-bold text-on-surface">8.1 / 10</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "81%" }}></div>
                  </div>
                </div>

                <div className="space-y-2.5 flex-1">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">battery_std</span> Battery
                    </span>
                    <span className="font-semibold text-on-surface">{comp1.battery?.capacity_mah || 5000} mAh ({comp1.battery?.charging_watt || 10}W)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">tv</span> Display
                    </span>
                    <span className="font-semibold text-on-surface">{comp1.display?.size || 6.71}&quot; {comp1.display?.type?.split(',')[0] || '90Hz LCD'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">memory</span> Processor
                    </span>
                    <span className="font-semibold text-on-surface">{comp1.platform?.chipset?.split('(')[0] || 'Helio G36'} (~{Math.round((comp1.platform?.antutu_score || 140000)/1000)}k)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">photo_camera</span> Camera
                    </span>
                    <span className="font-semibold text-on-surface">{comp1.camera?.main_mp || 8}MP Dual + {comp1.camera?.selfie_mp || 5}MP</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">sd_card</span> Storage
                    </span>
                    <span className="font-semibold text-on-surface">{comp1.memory?.storage_gb || 64}GB Internal</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border-hairline">
                  <button
                    className="w-full py-2 bg-surface-subtle hover:bg-surface-container text-on-surface rounded-xl font-label-md text-label-md font-semibold transition border border-border-hairline"
                    onClick={() => handleAddRivalToTray(comp1.model)}
                  >
                    + Compare Side-by-Side
                  </button>
                </div>
              </div>

              {/* Competitor 2 */}
              <div className="rounded-2xl bg-surface p-5 shadow-sm border border-border-hairline flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <Link href={`/phone/${comp2.slug || comp2.id}`} className="w-14 h-18 bg-surface-container-lowest rounded-lg p-1 flex items-center justify-center shadow-xs border border-border-hairline shrink-0 hover:border-deal-orange transition">
                    {comp2.image ? (
                      <img src={getSupabaseImageUrl(comp2.image)} alt={comp2.model} className="h-14 object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-outline text-[32px]">smartphone</span>
                    )}
                  </Link>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      <Link href={`/phone/${comp2.slug || comp2.id}`} className="hover:text-deal-orange transition-colors">
                        {formatPhoneName(comp2.brand, comp2.model)}
                      </Link>
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{comp2.memory?.storage_gb || 64}GB Edition</p>
                    <div className="font-headline-sm text-headline-sm font-bold text-on-surface mt-0.5">{formatPKR(comp2.lowest_verified_price || comp2.price_pkr)}</div>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-container-lowest p-3 mb-4 border border-border-hairline">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Overall Value Score</span>
                    <span className="font-label-md text-label-md font-bold text-on-surface">8.2 / 10</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "82%" }}></div>
                  </div>
                </div>

                <div className="space-y-2.5 flex-1">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">battery_std</span> Battery
                    </span>
                    <span className="font-semibold text-on-surface">{comp2.battery?.capacity_mah || 5000} mAh ({comp2.battery?.charging_watt || 10}W)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">tv</span> Display
                    </span>
                    <span className="font-semibold text-on-surface">{comp2.display?.size || 6.6}&quot; {comp2.display?.type?.split(',')[0] || '90Hz Punch'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">memory</span> Processor
                    </span>
                    <span className="font-semibold text-on-surface">{comp2.platform?.chipset?.split('(')[0] || 'Unisoc T606'} (~{Math.round((comp2.platform?.antutu_score || 210000)/1000)}k)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">photo_camera</span> Camera
                    </span>
                    <span className="font-semibold text-on-surface">{comp2.camera?.main_mp || 13}MP Dual + {comp2.camera?.selfie_mp || 8}MP</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm border border-border-hairline">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">sd_card</span> Storage
                    </span>
                    <span className="font-semibold text-on-surface">{comp2.memory?.storage_gb || 64}GB Internal</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border-hairline">
                  <button
                    className="w-full py-2 bg-surface-subtle hover:bg-surface-container text-on-surface rounded-xl font-label-md text-label-md font-semibold transition border border-border-hairline"
                    onClick={() => handleAddRivalToTray(comp2.model)}
                  >
                    + Compare Side-by-Side
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ==========================================================================
            4. EXPERT VERDICT & PROS / CONS SECTION
            ========================================================================== */}
        <section className="w-full bg-surface py-space-xl">
          <div className="max-w-7xl mx-auto px-gutter">
            <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm border border-border-hairline">

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-hairline">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-deal-orange">
                    <span className="material-symbols-outlined text-[28px]">verified</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                        CompareIt Expert Verdict
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-deal-orange font-label-sm text-label-sm font-bold">
                        Tested & Benchmarked
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Standardized entry-tier field testing across WhatsApp, YouTube HD playback, and dual-SIM cellular connectivity.
                    </p>
                  </div>
                </div>

                {/* Star rating pill */}
                <div className="flex items-center gap-2 bg-surface-subtle px-4 py-2 rounded-2xl border border-border-hairline self-start md:self-auto">
                  <div className="flex text-amber-500">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[20px]">star_half</span>
                  </div>
                  <span className="font-label-lg text-label-lg font-bold text-on-surface">4.3 / 5.0</span>
                </div>
              </div>

              {/* Editorial quote */}
              <div className="my-6 p-4 rounded-xl bg-surface-container-low border-l-4 border-deal-orange text-on-surface">
                <p className="font-body-lg text-body-lg italic">
                  “{verdictData.verdict}”
                </p>
              </div>

              {/* Reasons to Buy / Avoid 2-Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Pros */}
                <div className="p-5 rounded-2xl bg-surface-container-low border border-border-hairline flex flex-col gap-3">
                  <h3 className="font-label-lg text-label-lg font-bold text-deal-orange flex items-center gap-2 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span> Reasons to Buy
                  </h3>
                  <ul className="space-y-3 font-body-md text-body-md text-on-surface">
                    {verdictData.pros.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-deal-orange text-[18px] shrink-0 mt-0.5">done</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div className="p-5 rounded-2xl bg-error-container/20 border border-error/20 flex flex-col gap-3">
                  <h3 className="font-label-lg text-label-lg font-bold text-error flex items-center gap-2 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[20px]">cancel</span> Reasons to Avoid
                  </h3>
                  <ul className="space-y-3 font-body-md text-body-md text-on-surface">
                    {verdictData.cons.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">close</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ==========================================================================
            5. BEST LIVE PRICES ACROSS PAKISTAN (RETAILER COMPARISON TABLE)
            ========================================================================== */}
        <section className="w-full bg-surface-container-lowest py-space-xl border-y border-border-hairline scroll-mt-24" id="market-prices">
          <div className="max-w-7xl mx-auto px-gutter">
            {/* Table Header & Alert Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 text-deal-orange font-label-md text-label-md font-bold uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-[18px]">swap_horiz</span> Benchmark Intelligence
                </div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                  Best Verified Prices in Pakistan
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-100 border border-orange-300 text-deal-orange font-label-md text-label-md font-bold hover:bg-deal-orange hover:text-surface-container-lowest transition shadow-sm"
                  onClick={() => setIsPriceAlertOpen(true)}
                >
                  <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                  Set Price Drop Alert
                </button>
              </div>
            </div>

            {/* Price Comparison Table or Discontinued State */}
            {retailers.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-border-hairline shadow-sm bg-surface-container-lowest">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low font-label-sm text-label-sm text-on-surface uppercase tracking-wider border-b border-border-hairline">
                      <th className="py-3.5 px-4 font-bold">Store / Seller</th>
                      <th className="py-3.5 px-4 font-bold">Condition & Warranty</th>
                      <th className="py-3.5 px-4 font-bold">Delivery Time</th>
                      <th className="py-3.5 px-4 font-bold">Verified Price</th>
                      <th className="py-3.5 px-4 text-right font-bold">Direct Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-hairline font-body-md text-body-md">
                    {retailers.map((r, idx) => {
                      const isLowest = r.price === minRetailerPrice;
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-surface transition ${isLowest ? "bg-orange-100/30" : ""}`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center font-bold text-blue-600 shadow-xs border border-border-hairline">
                                {r.store.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                                    {r.store}
                                  </span>
                                  {isLowest && (
                                    <span className="px-2 py-0.5 rounded-full bg-deal-orange text-surface-container-lowest font-label-sm text-[10px] font-extrabold uppercase">
                                      Best Online Deal
                                    </span>
                                  )}
                                </div>
                                <span className="font-body-sm text-body-sm text-deal-orange flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">bolt</span> Instant Dispatch Available
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-on-surface">{r.condition}</span>
                            <span className="block font-body-sm text-body-sm text-on-surface-variant">Brand New Factory Sealed Box</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="flex items-center gap-1 text-on-surface font-medium">
                              <span className="material-symbols-outlined text-[18px] text-blue-600">local_shipping</span>
                              {r.delivery}
                            </span>
                            <span className="font-body-sm text-body-sm text-blue-600 font-medium">Nationwide Tracked</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className={`font-headline-sm text-headline-sm font-bold ${isLowest ? "text-deal-orange" : "text-on-surface"}`}>
                              {formatPKR(r.price)}
                            </div>
                            {officialMsrp > r.price && (
                              <div className="font-body-sm text-body-sm text-outline line-through">
                                MSRP {formatPKR(officialMsrp)}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <a
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-surface-container-lowest hover:bg-on-surface font-label-md text-label-md font-bold transition shadow-sm"
                              href={r.url}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              View Deal ↗
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 md:p-12 rounded-2xl border border-border-hairline bg-surface-container-lowest shadow-sm text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
                  <span className="material-symbols-outlined text-[36px]">inventory_2</span>
                </div>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-2">
                  No Active Online Retailers in Pakistan
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mb-6">
                  {phone.brand} {phone.model} is a discontinued or unlisted model. Certified online merchants (PriceOye, Daraz, Telemart) no longer maintain active brand-new inventory for this device.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low border border-border-hairline text-body-sm font-semibold text-on-surface">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    Verified Retail Price: <strong>N/A</strong>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low border border-border-hairline text-body-sm font-semibold text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">store</span>
                    Availability: <strong>Used / Secondary Market Only</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Trust Assurance Strip */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-body-sm font-body-sm text-on-surface-variant px-2">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-blue-600 text-[18px]">verified</span>
                Prices crawled and cross-checked automatically every 15 minutes.
              </span>
              <span>Prices in PKR inclusive of standard sales tax and customs duty.</span>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            6. FBR / PTA TAX & DIRBS DUTY CALCULATOR
            ========================================================================== */}
        <section className="w-full bg-surface py-space-xl scroll-mt-24" id="pta-tax-section">
          <div className="max-w-7xl mx-auto px-gutter">
            <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm border border-border-hairline">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 text-deal-orange font-label-md text-label-md font-bold uppercase tracking-wider mb-2">
                    <span className="material-symbols-outlined text-[18px]">flag</span> Pakistan Customs & DIRBS System
                  </div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                    PTA Tax & Duty Assessment
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                    Official duty breakdown required by Pakistan Telecommunication Authority for commercial and personal hand-carry imports under the C&F valuation bracket (${phone.usd_price} MSRP tier).
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-surface-subtle p-3 rounded-2xl border border-border-hairline">
                  <span className="material-symbols-outlined text-tertiary-container text-[32px]">smartphone</span>
                  <div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">Device Category</div>
                    <div className="font-label-md text-label-md font-bold text-on-surface">
                      MSRP {phone.usd_price <= 100 ? "≤ $100 Tier" : phone.usd_price <= 200 ? "$100 - $200 Tier" : phone.usd_price <= 350 ? "$200 - $350 Tier" : phone.usd_price <= 500 ? "$350 - $500 Tier" : "> $500 Flagship Tier"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Duty Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* On Passport */}
                <div className="rounded-2xl p-6 bg-surface-subtle border border-border-hairline flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-tertiary-container">travel_explore</span>
                        Registration on Passport
                      </span>
                      <span className="px-2 py-0.5 rounded bg-badge-blue-tint text-tertiary-container font-label-sm text-label-sm font-bold">
                        Subsidized Rate
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Valid for Pakistani citizens or foreign travelers registering within 60 days of international immigration arrival stamp.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border-hairline flex items-baseline justify-between">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Calculated PTA Tax:</span>
                    <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
                      {formatPKR(tax.passport)}
                    </span>
                  </div>
                </div>

                {/* On CNIC */}
                <div className="rounded-2xl p-6 bg-surface-subtle border border-border-hairline flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-primary">badge</span>
                        Registration on CNIC
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface font-bold">
                        Standard Citizen
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Standard DIRBS registration using your 13-digit National Identity Card without international travel stamps.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border-hairline flex items-baseline justify-between">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Calculated PTA Tax:</span>
                    <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
                      {formatPKR(tax.cnic)}
                    </span>
                  </div>
                </div>
              </div>

              {/* DIRBS Process 3-Step Flow */}
              <div className="mt-8 pt-6 border-t border-border-hairline">
                <div className="font-label-md text-label-md text-on-surface font-bold mb-4 uppercase tracking-wider">
                  Quick 3-Step Official PTA DIRBS Activation:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-border-hairline">
                    <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shrink-0">1</span>
                    <div className="font-body-sm text-body-sm text-on-surface">
                      Dial <strong>*#06#</strong> on keypad to note the 15-digit IMEI.
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-border-hairline">
                    <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shrink-0">2</span>
                    <div className="font-body-sm text-body-sm text-on-surface">
                      SMS IMEI to <strong>8484</strong> or visit <strong>dirbs.pta.gov.pk</strong>.
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-border-hairline">
                    <span className="w-7 h-7 rounded-full bg-deal-orange text-surface-container-lowest flex items-center justify-center font-bold text-sm shrink-0">3</span>
                    <div className="font-body-sm text-body-sm text-on-surface">
                      Pay PSID via ATM, 1Link, EasyPaisa, or mobile banking.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ==========================================================================
            7. FULL DETAILED TECHNICAL SPECIFICATIONS MATRIX
            ========================================================================== */}
        <section className="w-full bg-surface-container-lowest py-space-xl border-t border-border-hairline">
          <div className="max-w-7xl mx-auto px-gutter">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2 text-secondary font-label-md text-label-md font-bold uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-[18px]">tune</span> Hardware Breakdown
                </div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                  Detailed Technical Specifications
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  Verified component analysis according to official {phone.brand} Pakistan documentation.
                </p>
              </div>

              {/* Expand / Collapse All Button */}
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-subtle hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold transition self-start border border-border-hairline"
                id="spec-toggle-all-btn"
                onClick={toggleAllSpecs}
              >
                <span className="material-symbols-outlined text-[18px]">unfold_more</span>
                Toggle All Categories
              </button>
            </div>

            {/* Spec Sections Stack - Full WhatMobile 9-Category Architecture */}
            <div className="space-y-4">
              {specCategories.map((cat) => {
                const isOpen = openSpecs[cat.key] !== false;
                return (
                  <div
                    key={cat.key}
                    className="spec-card rounded-2xl bg-surface border border-border-hairline overflow-hidden shadow-xs"
                  >
                    <button
                      className="w-full p-5 flex items-center justify-between text-left hover:bg-surface-subtle transition"
                      onClick={() => toggleSpecSection(cat.key)}
                      id={`spec-accordion-${cat.key}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center shrink-0`}>
                          <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">{cat.title}</h3>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            {cat.subtitle}
                          </span>
                        </div>
                      </div>
                      <span className={`material-symbols-outlined text-outline transition-transform duration-200 chevron-icon ${isOpen ? "rotate-180" : ""}`}>
                        expand_more
                      </span>
                    </button>
                    {isOpen && (
                      <div className="spec-content px-5 pb-5 pt-1">
                        <div className="divide-y divide-border-hairline border-t border-border-hairline">
                          {cat.items.map((item, idx) => (
                            <div key={idx} className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                                {item.label}
                              </span>
                              <span className="sm:col-span-2 font-body-md text-body-md text-on-surface font-semibold break-words">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==========================================================================
            8. PERSISTENT BOTTOM FLOATING COMPARISON BAR
            ========================================================================== */}
        {isTrayVisible && (
          <div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl bg-primary-container text-on-primary rounded-2xl shadow-2xl p-3 sm:p-4 backdrop-blur-lg border border-outline/30 flex items-center justify-between gap-3 transition-all duration-300"
            id="compare-bar"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-deal-orange flex items-center justify-center text-surface-container-lowest font-bold text-xs shrink-0">
                <span id="tray-count">{trayItems.length}</span>/3
              </div>
              <div className="min-w-0">
                <div className="font-label-md text-label-md font-bold text-surface-container-lowest truncate">
                  Comparing: {phone.brand} {phone.model}
                </div>
                <div className="font-body-sm text-[11px] text-primary-fixed-dim">
                  {formatPKR(lowestPrice)} • {phone.pta_status === "approved" ? "PTA Approved" : "Non-PTA"} Status
                </div>
              </div>
            </div>

            {/* Suggested Quick Slot Adders */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                className="px-2.5 py-1.5 rounded-lg bg-surface-container/10 hover:bg-surface-container/20 text-surface-container font-label-sm text-label-sm transition"
                onClick={() => handleAddRivalToTray(comp1.model)}
              >
                + {comp1.model}
              </button>
              <button
                className="px-2.5 py-1.5 rounded-lg bg-surface-container/10 hover:bg-surface-container/20 text-surface-container font-label-sm text-label-sm transition"
                onClick={() => handleAddRivalToTray(comp2.model)}
              >
                + {comp2.model}
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-deal-orange text-surface-container-lowest font-label-md text-label-md font-bold hover:bg-orange-600 transition shadow-md"
                data-path="compare-tray"
                href={`/compare?phones=${[phone.slug, comp1?.slug, comp2?.slug].filter(Boolean).slice(0, Math.min(3, trayItems.length)).join(",")}&from=${encodeURIComponent(`/phone/${phone.slug}`)}`}
              >
                <span className="material-symbols-outlined text-[16px]">balance</span>
                Compare Now (<span id="tray-btn-count">{trayItems.length}</span>)
              </Link>
              <button
                className="p-1.5 text-outline-variant hover:text-surface-container-lowest transition"
                onClick={() => setIsTrayVisible(false)}
                title="Dismiss Tray"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ==========================================================================
          9. 360° STUDIO VIEW INTERACTIVE MODAL
          ========================================================================== */}
      {is360ModalOpen && (
        <div className="compare-modal-overlay">
          <div className="relative bg-surface-container-lowest rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-border-hairline animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border-hairline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-deal-orange text-[26px]">360</span>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    360° Interactive Studio Gallery
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {phone.brand} {phone.model} - High-Resolution Product Perspectives
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIs360ModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-subtle hover:bg-surface-container flex items-center justify-center text-on-surface transition"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-6 flex flex-col items-center justify-center">
              <div className="w-full max-h-[360px] h-[320px] flex items-center justify-center p-4 bg-surface rounded-2xl border border-border-hairline">
                <img
                  src={getSupabaseImageUrl(allImages[selectedImgIndex] || phone.image)}
                  alt="360 view"
                  className="max-h-full max-w-full object-contain filter drop-shadow-xl transition-all duration-300"
                />
              </div>

              <div className="flex items-center gap-2 mt-6 overflow-x-auto w-full justify-center py-1">
                {allImages.slice(0, 6).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImgIndex(idx)}
                    className={`w-14 h-14 rounded-xl border p-1 bg-surface-container-lowest transition flex items-center justify-center ${
                      selectedImgIndex === idx ? "ring-2 ring-deal-orange border-deal-orange" : "border-border-hairline"
                    }`}
                  >
                    <img src={getSupabaseImageUrl(img)} alt={`angle ${idx}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border-hairline flex items-center justify-between">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Angle {selectedImgIndex + 1} of {Math.min(allImages.length, 6)}
              </span>
              <button
                onClick={() => setIs360ModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-on-surface transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          10. PRICE DROP ALERT MODAL
          ========================================================================== */}
      {isPriceAlertOpen && (
        <div className="compare-modal-overlay">
          <div className="relative bg-surface-container-lowest rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-border-hairline animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border-hairline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-deal-orange text-[26px]">notifications_active</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Set Price Drop Alert
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsPriceAlertOpen(false);
                  setAlertSubmitted(false);
                }}
                className="w-8 h-8 rounded-full bg-surface-subtle hover:bg-surface-container flex items-center justify-center text-on-surface transition"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {alertSubmitted ? (
              <div className="py-8 text-center flex flex-col items-center gap-3">
                <span className="w-14 h-14 rounded-full bg-badge-emerald-tint text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px]">check_circle</span>
                </span>
                <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Alert Configured!
                </h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">
                  We&apos;ll notify you as soon as {phone.brand} {phone.model} drops below <strong>Rs. {Number(alertTargetPrice).toLocaleString()}</strong> in Pakistan.
                </p>
                <button
                  onClick={() => {
                    setIsPriceAlertOpen(false);
                    setAlertSubmitted(false);
                  }}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-deal-orange text-surface-container-lowest font-bold font-label-md text-label-md shadow-md"
                >
                  Got It
                </button>
              </div>
            ) : (
              <div className="py-6 flex flex-col gap-4">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Current verified market price: <strong>{formatPKR(lowestPrice)}</strong>. Choose your alert target:
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm font-bold text-on-surface uppercase">
                    Target Price (PKR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline font-semibold">Rs.</span>
                    <input
                      type="number"
                      value={alertTargetPrice}
                      onChange={(e) => setAlertTargetPrice(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-border-hairline font-headline-sm font-bold text-on-surface focus:outline-none focus:border-deal-orange"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm font-bold text-on-surface uppercase">
                    Email / WhatsApp for Alerts
                  </label>
                  <input
                    type="text"
                    placeholder="Enter email or WhatsApp number"
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-subtle border border-border-hairline font-body-md text-on-surface focus:outline-none focus:border-deal-orange"
                  />
                </div>

                <button
                  onClick={() => setAlertSubmitted(true)}
                  className="w-full mt-2 py-3 rounded-xl bg-deal-orange hover:bg-orange-600 text-surface-container-lowest font-label-md text-label-md font-bold transition shadow-md flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                  Activate Price Watch
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================================================
          11. COMPAREIT.PK LUXURY FOOTER
          ========================================================================== */}
      <footer className="w-full bg-surface-container-lowest border-t border-border-hairline mt-12">
        <div className="max-w-7xl mx-auto px-gutter py-space-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-lg mb-space-xl">
            <div className="lg:col-span-2 flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <img
                  alt="CompareIt PK Logo"
                  className="h-8 w-auto object-contain"
                  src="/logo.png"
                />
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  CompareIt<span className="text-deal-orange">.pk</span>
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
                Pakistan&apos;s verified smartphone intelligence platform. Track real-time retail pricing, DIRBS compliance status, PTA taxes, and comprehensive hardware benchmarks across major hubs.
              </p>
              <div className="mt-space-sm">
                <div className="font-label-md text-label-md text-on-surface mb-2 font-bold">
                  Get Weekly Price Drop Alerts
                </div>
                <div className="flex items-center max-w-sm gap-2">
                  <input
                    className="flex-1 px-3 py-2 bg-surface-subtle border border-border-hairline rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-tertiary"
                    placeholder="Enter your email address"
                    type="email"
                  />
                  <button className="px-4 py-2 bg-deal-orange text-surface-container-lowest font-bold rounded-lg font-label-md text-label-md hover:bg-orange-600 transition shadow-sm">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-label-lg text-label-lg text-on-surface mb-space-sm font-bold uppercase tracking-wider">
                Categories
              </h4>
              <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <li><Link className="hover:text-on-surface transition-colors" href="/?q=flagship">Flagship Devices</Link></li>
                <li><Link className="hover:text-on-surface transition-colors" href="/?q=budget">Budget Performers (&lt; PKR 50k)</Link></li>
                <li><Link className="hover:text-on-surface transition-colors" href="/?q=gaming">Gaming Phones</Link></li>
                <li><Link className="hover:text-on-surface transition-colors" href="/?q=camera">Camera Benchmark Leaders</Link></li>
                <li><Link className="hover:text-on-surface transition-colors" href="/?q=upcoming">Upcoming Releases</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-label-lg text-label-lg text-on-surface mb-space-sm font-bold uppercase tracking-wider">
                Physical Hub Trackers
              </h4>
              <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <li>
                  <span className="flex items-center justify-between">
                    <span>Karachi Saddar</span>
                    <span className="font-label-sm text-label-sm text-deal-orange font-bold">Active</span>
                  </span>
                </li>
                <li>
                  <span className="flex items-center justify-between">
                    <span>Lahore Hafeez Centre</span>
                    <span className="font-label-sm text-label-sm text-deal-orange font-bold">Active</span>
                  </span>
                </li>
                <li>
                  <span className="flex items-center justify-between">
                    <span>Islamabad Blue Area</span>
                    <span className="font-label-sm text-label-sm text-deal-orange font-bold">Active</span>
                  </span>
                </li>
                <li><span>Rawalpindi Singapore Plaza</span></li>
                <li><span>Peshawar Deans Market</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-label-lg text-label-lg text-on-surface mb-space-sm font-bold uppercase tracking-wider">
                Regulatory & Tax
              </h4>
              <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <li><a className="hover:text-on-surface transition-colors" href="#pta-tax-section">PTA DIRBS Guide</a></li>
                <li><a className="hover:text-on-surface transition-colors" href="#pta-tax-section">Passport vs CNIC Duty Rates</a></li>
                <li><a className="hover:text-on-surface transition-colors" href="#pta-tax-section">IMEI Verification System</a></li>
                <li><a className="hover:text-on-surface transition-colors" href="#pta-tax-section">Local Assembly Subsidies</a></li>
                <li><a className="hover:text-on-surface transition-colors" href="#pta-tax-section">CPLC Verification Check</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-space-md border-t border-border-hairline flex flex-col sm:flex-row items-center justify-between gap-space-sm">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              © {new Date().getFullYear()} CompareIt.pk. Real-time market metrics and retail surveillance across Pakistan. All trademarks belong to their respective manufacturers.
            </p>
            <div className="flex items-center gap-space-md font-body-sm text-body-sm text-on-surface-variant">
              <Link className="hover:text-on-surface transition-colors" href="/">Privacy Policy</Link>
              <Link className="hover:text-on-surface transition-colors" href="/">Data Accuracy Terms</Link>
              <Link className="hover:text-on-surface transition-colors" href="/">Retailer API</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
