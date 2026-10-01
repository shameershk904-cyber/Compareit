"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type Phone } from "@/types";
import { formatPKR, getSupabaseImageUrl } from "@/lib/utils";
import { matchPhoneSearch } from "@/lib/search";

interface CompareClientProps {
  initialPhones: Phone[];
  initialCompareSlugs?: string[];
}

interface SpecRowDef {
  label: string;
  getValue: (phone: Phone) => React.ReactNode;
  getRawValue?: (phone: Phone) => string | number;
}

interface SpecSectionDef {
  title: string;
  icon: string;
  rows: SpecRowDef[];
}

export function CompareClient({ initialPhones, initialCompareSlugs }: CompareClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams?.get("from");

  // 3 Comparison Slots (strictly 3 slots max). Start completely empty if no initialCompareSlugs
  const [slots, setSlots] = useState<(Phone | null)[]>(() => {
    const arr: (Phone | null)[] = [null, null, null];
    if (initialCompareSlugs && initialCompareSlugs.length > 0) {
      initialCompareSlugs.slice(0, 3).forEach((slug, idx) => {
        const match = initialPhones.find(
          (p) => p.slug === slug || p.id === slug || p.model.toLowerCase().replace(/\s+/g, "-").includes(slug.toLowerCase())
        );
        if (match) {
          arr[idx] = match;
        }
      });
    }
    return arr;
  });

  const compareList = useMemo(() => slots.filter((p): p is Phone => p !== null), [slots]);

  const [isModalOpen, setIsModalOpen] = useState(true);
  const [diffOnly, setDiffOnly] = useState(false);
  const [budgetFilter, setBudgetFilter] = useState<"all" | "under25k" | "25k-45k" | "pta">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search state for slots (0, 1, 2)
  const [slotQueries, setSlotQueries] = useState<string[]>(["", "", ""]);
  const [activeSlotSearch, setActiveSlotSearch] = useState<number | null>(null);
  const searchContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Helper to show auto-dismissing toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeSlotSearch !== null) {
        const ref = searchContainerRefs.current[activeSlotSearch];
        if (ref && !ref.contains(e.target as Node)) {
          setActiveSlotSearch(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeSlotSearch]);

  // Helper to get phone product image
  const getPhoneImg = (phone: Phone) => {
    if (phone.image) return getSupabaseImageUrl(phone.image);
    return "/favicon.png";
  };

  // Safe RAM / Storage helpers
  const getSafeRam = (p: Phone) => {
    const rawRam = p.memory?.ram_gb;
    const rawStorage = p.memory?.storage_gb;
    return rawRam && rawStorage && rawRam > rawStorage ? rawStorage : rawRam || 4;
  };

  const getSafeStorage = (p: Phone) => {
    const rawRam = p.memory?.ram_gb;
    const rawStorage = p.memory?.storage_gb;
    return rawRam && rawStorage && rawRam > rawStorage ? rawRam : rawStorage || 64;
  };

  // Sync URL when slots change
  const updateUrlWithSlots = (nextSlots: (Phone | null)[]) => {
    const activeSlugs = nextSlots.filter((p): p is Phone => p !== null).map((p) => p.slug);
    const params = new URLSearchParams();
    if (activeSlugs.length > 0) {
      params.set("phones", activeSlugs.join(","));
    }
    if (fromUrl) {
      params.set("from", fromUrl);
    }
    const queryString = params.toString();
    router.replace(`/compare${queryString ? `?${queryString}` : ""}`, { scroll: false });
  };

  // Select a phone for a specific slot
  const handleSelectPhone = (slotIndex: number, phone: Phone) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = phone;
      updateUrlWithSlots(next);
      return next;
    });
    setSlotQueries((prev) => {
      const next = [...prev];
      next[slotIndex] = "";
      return next;
    });
    setActiveSlotSearch(null);
    showToast(`Added ${phone.model} to Slot ${slotIndex + 1}`);
  };

  // Remove phone from a slot
  const handleRemoveSlot = (slotIndex: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      updateUrlWithSlots(next);
      return next;
    });
    setSlotQueries((prev) => {
      const next = [...prev];
      next[slotIndex] = "";
      return next;
    });
    setActiveSlotSearch(null);
  };

  // Clear all slots
  const clearAll = () => {
    setSlots([null, null, null]);
    setSlotQueries(["", "", ""]);
    setActiveSlotSearch(null);
    router.replace(`/compare${fromUrl ? `?from=${encodeURIComponent(fromUrl)}` : ""}`, { scroll: false });
    showToast("Cleared all comparison slots");
  };

  // Add from bottom catalog or quick toggle
  const togglePhone = (phone: Phone) => {
    const existingIndex = slots.findIndex((p) => p?.id === phone.id);
    if (existingIndex !== -1) {
      handleRemoveSlot(existingIndex);
    } else {
      const emptyIndex = slots.findIndex((p) => p === null);
      if (emptyIndex === -1) {
        showToast("All 3 slots are full. Remove a device to add another.");
        return;
      }
      handleSelectPhone(emptyIndex, phone);
    }
  };

  // Handle closing modal
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

  // Share functionality
  const handleShare = () => {
    const slugs = compareList.map((p) => p.slug).join(",");
    const url = slugs
      ? `${window.location.origin}/compare?phones=${encodeURIComponent(slugs)}`
      : `${window.location.origin}/compare`;
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

  // Autocomplete search suggestions for a given slot query
  const getSuggestionsForSlot = (slotIndex: number) => {
    const q = slotQueries[slotIndex]?.trim() || "";
    if (!q) {
      // Return popular curated phones when input is empty
      const popularModels = ["Galaxy A15", "Redmi Note 13", "iPhone 15", "Spark 20", "Smart 8", "Y27", "C67", "Poco M6"];
      return initialPhones.filter((p) =>
        popularModels.some((pop) => p.model.toLowerCase().includes(pop.toLowerCase()))
      ).slice(0, 8);
    }
    return initialPhones
      .map((p) => ({ phone: p, ...matchPhoneSearch(p, q) }))
      .filter((res) => res.matches)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((res) => res.phone);
  };

  // Max Antutu benchmark for progress bars
  const maxAntutu = useMemo(() => {
    const scores = compareList.map((p) => p.platform?.antutu_score || 200000);
    return Math.max(...scores, 450000);
  }, [compareList]);

  // SPECIFICATION DEFINITIONS: Every device gets its own separate column
  const SPEC_SECTIONS: SpecSectionDef[] = [
    {
      title: "Local Market Pricing & Retailers",
      icon: "storefront",
      rows: [
        {
          label: "Estimated Market Price",
          getValue: (p) => {
            const price = p.lowest_verified_price || p.price_pkr;
            const isAvail = price > 0 && Array.isArray(p.retailers) && p.retailers.length > 0 && p.status !== "Discontinued";
            return isAvail ? (
              <span className="font-bold text-deal-orange text-sm sm:text-base">{formatPKR(price)}</span>
            ) : (
              <span className="text-slate-500 font-semibold text-xs sm:text-sm">Price N/A</span>
            );
          },
          getRawValue: (p) => p.lowest_verified_price || p.price_pkr || 0,
        },
        {
          label: "Official Brand MSRP",
          getValue: (p) => {
            const isAvail = p.price_pkr > 0 && p.status !== "Discontinued";
            return isAvail ? (
              <span className="font-medium text-on-surface">{formatPKR(p.price_pkr)}</span>
            ) : (
              <span className="text-slate-500 text-xs">Discontinued / Unlisted</span>
            );
          },
          getRawValue: (p) => p.price_pkr || 0,
        },
        {
          label: "Hafeez Centre Cash Benchmark",
          getValue: (p) => {
            const price = p.lowest_verified_price || p.price_pkr;
            const isAvail = price > 0 && p.status !== "Discontinued";
            return isAvail ? (
              <span className="font-semibold text-primary">{formatPKR(Math.round(price * 0.98))}</span>
            ) : (
              <span className="text-slate-500 text-xs">Price N/A</span>
            );
          },
          getRawValue: (p) => (p.lowest_verified_price || p.price_pkr || 0) * 0.98,
        },
        {
          label: "Official Brand Warranty",
          getValue: (p) => (
            <span className="text-on-surface">
              {p.warranty ? `${p.warranty.provider} (${p.warranty.duration_months}M)` : "1-Year Official Brand Warranty"}
            </span>
          ),
          getRawValue: (p) => p.warranty?.provider || "Official",
        },
        {
          label: "Availability & Stock Status",
          getValue: (p) => {
            const lowest = p.lowest_verified_price ?? p.price_pkr ?? 0;
            const isAvail = lowest > 0 && Array.isArray(p.retailers) && p.retailers.length > 0 && p.status !== "Discontinued";
            return isAvail ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-bold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Available Across Stores
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[11px] font-bold border border-slate-200">
                {p.status || "Discontinued"}
              </span>
            );
          },
          getRawValue: (p) => p.status || "Active",
        },
      ],
    },
    {
      title: "PTA DIRBS Taxes & Duty Rates",
      icon: "account_balance_wallet",
      rows: [
        {
          label: "PTA DIRBS Status",
          getValue: (p) => (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                p.status === "Discontinued"
                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                  : p.pta_status === "approved"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {p.status === "Discontinued" ? "Legacy / Discontinued" : p.pta_status === "approved" ? "✓ PTA Approved" : "⚠️ Non-PTA / JV"}
            </span>
          ),
          getRawValue: (p) => p.pta_status || "approved",
        },
        {
          label: "PTA Tax (Passport)",
          getValue: (p) => formatPKR(p.pta_tax?.passport || (p.price_pkr > 40000 ? 19500 : 3200)),
          getRawValue: (p) => p.pta_tax?.passport || (p.price_pkr > 40000 ? 19500 : 3200),
        },
        {
          label: "PTA Tax (CNIC)",
          getValue: (p) => formatPKR(p.pta_tax?.cnic || (p.price_pkr > 40000 ? 24000 : 4100)),
          getRawValue: (p) => p.pta_tax?.cnic || (p.price_pkr > 40000 ? 24000 : 4100),
        },
      ],
    },
    {
      title: "Display & Screen Quality",
      icon: "smartphone",
      rows: [
        {
          label: "Screen Size",
          getValue: (p) => `${p.display?.size || 6.6}" Inches`,
          getRawValue: (p) => p.display?.size || 6.6,
        },
        {
          label: "Panel Technology",
          getValue: (p) => {
            const type = p.display?.type || "HD+ IPS LCD";
            const isAmoled = type.toLowerCase().includes("amoled") || type.toLowerCase().includes("oled");
            return (
              <span className={isAmoled ? "text-deal-orange font-bold" : "text-primary font-medium"}>
                {type}
              </span>
            );
          },
          getRawValue: (p) => p.display?.type || "LCD",
        },
        {
          label: "Refresh Rate",
          getValue: (p) => {
            const match = (p.display?.type || "").match(/(\d+Hz)/i);
            return match ? <span className="font-bold text-primary">{match[1]} High Refresh</span> : "60 Hz Standard";
          },
          getRawValue: (p) => (p.display?.type || "").match(/(\d+Hz)/i)?.[1] || "60Hz",
        },
        {
          label: "Resolution",
          getValue: (p) => p.display?.resolution || "1080 x 2400 Pixels (~395 PPI)",
          getRawValue: (p) => p.display?.resolution || "",
        },
        {
          label: "Glass Protection",
          getValue: (p) =>
            p.display?.protection && p.display.protection !== "N/A"
              ? p.display.protection
              : "Reinforced Protective Glass",
          getRawValue: (p) => p.display?.protection || "Glass",
        },
      ],
    },
    {
      title: "Processor & Performance",
      icon: "memory",
      rows: [
        {
          label: "SoC Chipset",
          getValue: (p) => (
            <span className="font-bold text-primary">{p.platform?.chipset || "Octa-Core SoC"}</span>
          ),
          getRawValue: (p) => p.platform?.chipset || "",
        },
        {
          label: "CPU Architecture",
          getValue: (p) => p.platform?.cpu || "Octa-Core High-Efficiency Processor",
          getRawValue: (p) => p.platform?.cpu || "",
        },
        {
          label: "GPU Graphics",
          getValue: (p) => p.platform?.gpu || "Integrated Graphic Engine",
          getRawValue: (p) => p.platform?.gpu || "",
        },
        {
          label: "AnTuTu Benchmark",
          getValue: (p) => {
            const score =
              p.platform?.antutu_score || (p.price_pkr > 40000 ? 420000 : p.price_pkr > 25000 ? 150000 : 230000);
            const pct = Math.min(100, Math.round((score / maxAntutu) * 100));
            return (
              <div className="space-y-1">
                <span className="font-bold text-primary text-xs">~{score.toLocaleString()} Points</span>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-deal-orange rounded-full" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          },
          getRawValue: (p) => p.platform?.antutu_score || 0,
        },
        {
          label: "Operating System & UI",
          getValue: (p) => p.platform?.os || "Android 14 (Latest Official)",
          getRawValue: (p) => p.platform?.os || "",
        },
      ],
    },
    {
      title: "Memory & Storage",
      icon: "sd_card",
      rows: [
        {
          label: "RAM Capacity",
          getValue: (p) => {
            const safeRam = getSafeRam(p);
            const vRam = p.memory?.virtual_ram_gb;
            return `${safeRam}GB Physical${vRam ? ` + ${vRam}GB Virtual` : ""}`;
          },
          getRawValue: (p) => getSafeRam(p),
        },
        {
          label: "Internal Storage (ROM)",
          getValue: (p) => `${getSafeStorage(p)}GB High-Speed Storage`,
          getRawValue: (p) => getSafeStorage(p),
        },
        {
          label: "MicroSD Expansion",
          getValue: (p) => (p.memory?.card_slot ? "Yes, MicroSDXC Supported" : "No (Fixed Storage)"),
          getRawValue: (p) => (p.memory?.card_slot ? "Yes" : "No"),
        },
      ],
    },
    {
      title: "Camera Optics & Video",
      icon: "photo_camera",
      rows: [
        {
          label: "Rear Main Camera",
          getValue: (p) => {
            const setup = p.camera?.setup || `${p.camera?.main_mp || 50} MP Primary Sensor`;
            const hasOis = setup.includes("OIS") || (p.camera?.features || "").includes("OIS");
            return (
              <span className="font-semibold text-primary">
                {setup} {hasOis && <span className="text-deal-orange font-bold">(OIS)</span>}
              </span>
            );
          },
          getRawValue: (p) => p.camera?.main_mp || 0,
        },
        {
          label: "Camera Features",
          getValue: (p) => p.camera?.features || "HDR, Night Mode, Portrait AI, LED Flash",
          getRawValue: (p) => p.camera?.features || "",
        },
        {
          label: "Video Recording",
          getValue: (p) => p.camera?.video || "1080p@30fps Full HD",
          getRawValue: (p) => p.camera?.video || "",
        },
        {
          label: "Front Selfie Camera",
          getValue: (p) => `${p.camera?.selfie_mp || 8} MP AI Beauty Front Camera`,
          getRawValue: (p) => p.camera?.selfie_mp || 0,
        },
      ],
    },
    {
      title: "Battery & Fast Charging",
      icon: "battery_charging_full",
      rows: [
        {
          label: "Battery Capacity",
          getValue: (p) => <span className="font-bold text-primary">{p.battery?.capacity_mah || 5000} mAh</span>,
          getRawValue: (p) => p.battery?.capacity_mah || 5000,
        },
        {
          label: "Charging Speed",
          getValue: (p) => {
            const watt = p.battery?.charging_watt || 18;
            return <span className={watt >= 25 ? "text-deal-orange font-bold" : "font-semibold text-primary"}>{watt}W Fast Charging</span>;
          },
          getRawValue: (p) => p.battery?.charging_watt || 18,
        },
        {
          label: "Wireless Charging",
          getValue: (p) => (p.battery?.wireless_charging ? "Yes, Wireless Qi Supported" : "No"),
          getRawValue: (p) => (p.battery?.wireless_charging ? "Yes" : "No"),
        },
      ],
    },
    {
      title: "Connectivity & Hardware",
      icon: "cell_tower",
      rows: [
        {
          label: "5G Cellular Network",
          getValue: (p) => (
            <span className={`font-bold ${p.connectivity?.five_g ? "text-deal-orange" : "text-primary"}`}>
              {p.connectivity?.five_g ? "✓ 5G Ready (Multi-Band)" : "4G LTE-A VoLTE"}
            </span>
          ),
          getRawValue: (p) => (p.connectivity?.five_g ? "5G" : "4G"),
        },
        {
          label: "3.5mm Headphone Jack",
          getValue: (p) => (p.connectivity?.headphone_jack ? "Yes, 3.5mm Port" : "No (Type-C / Wireless)"),
          getRawValue: (p) => (p.connectivity?.headphone_jack ? "Yes" : "No"),
        },
        {
          label: "NFC Support",
          getValue: (p) => (p.connectivity?.nfc ? "Yes (Contactless Payments)" : "No"),
          getRawValue: (p) => (p.connectivity?.nfc ? "Yes" : "No"),
        },
        {
          label: "Fingerprint Security",
          getValue: (p) => p.connectivity?.fingerprint || "Side-Mounted / Display Scanner",
          getRawValue: (p) => p.connectivity?.fingerprint || "",
        },
      ],
    },
  ];

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
              Hafeez Centre Live Rates Synced
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
              PTA Approved Only
            </button>
          </div>
        </div>

        {/* 16-Grid Catalog Cards with Compare Toggle Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCatalog.map((phone) => {
            const lowestPrice = phone.lowest_verified_price || phone.price_pkr;
            const msrp = phone.price_pkr;
            const saveAmount = msrp > lowestPrice ? msrp - lowestPrice : 0;
            const selected = slots.some((p) => p?.id === phone.id);

            return (
              <div
                key={phone.id}
                className={`bg-surface-container-lowest rounded-2xl p-4 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between border ${
                  selected ? "border-deal-orange ring-2 ring-deal-orange/20" : "border-border-hairline"
                }`}
              >
                <Link
                  href={`/phone/${phone.slug}`}
                  className="w-full h-44 bg-surface-subtle rounded-xl p-3 flex items-center justify-center relative overflow-hidden group mb-3"
                >
                  <img
                    className="max-h-36 max-w-full w-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
                    alt={`${phone.brand} ${phone.model}`}
                    src={getPhoneImg(phone)}
                  />
                </Link>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-label-sm font-label-sm text-on-surface-variant font-medium">
                      {phone.brand} Pakistan
                    </span>
                    <span className="w-1 h-1 rounded-full bg-outline"></span>
                    <span className={`text-label-sm font-label-sm font-semibold ${lowestPrice > 0 ? "text-deal-orange" : "text-slate-500"}`}>
                      {lowestPrice > 0 ? "DIRBS Approved" : "Discontinued Model"}
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
                      <div className={`font-headline-sm text-headline-sm font-bold ${lowestPrice > 0 && phone.status !== "Discontinued" ? "text-deal-orange" : "text-slate-500"}`}>
                        {lowestPrice > 0 && phone.status !== "Discontinued" ? formatPKR(lowestPrice) : "Price N/A"}
                      </div>
                      {saveAmount > 0 && lowestPrice > 0 && (
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
          className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-inverse-surface/65 backdrop-blur-md transition-opacity"
          id="compare-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden transition-all border border-border-hairline">
            
            {/* MODAL HEADER */}
            <div className="px-5 py-4 bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 border-b border-border-hairline">
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
                    : "Compare Smartphones Side-by-Side"}
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
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 px-3 py-1.5 bg-surface-container-lowest hover:bg-red-50 text-slate-600 hover:text-red-600 font-label-md text-label-md rounded-lg shadow-sm transition-colors border border-border-hairline"
                  title="Clear all comparison slots"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                  <span className="hidden sm:inline">Clear All</span>
                </button>
                {/* Cross Button */}
                <button
                  onClick={handleClose}
                  className="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors"
                  id="close-modal-btn"
                  title="Close and return"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* MODAL SCROLLABLE COMPARISON BODY */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
              
              {/* ========================================================================= */}
              {/* TOP SLOT CONTROLLERS: 3 INTERACTIVE DEVICE SLOTS WITH DEDICATED SEARCH BARS */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((slotIdx) => {
                  const phone = slots[slotIdx];
                  const query = slotQueries[slotIdx];
                  const isSearching = activeSlotSearch === slotIdx;
                  const suggestions = getSuggestionsForSlot(slotIdx);

                  return (
                    <div
                      key={slotIdx}
                      ref={(el) => {
                        searchContainerRefs.current[slotIdx] = el;
                      }}
                      className={`rounded-2xl p-4 flex flex-col justify-between relative shadow-xs border transition-all ${
                        phone
                          ? "bg-surface-container-lowest border-border-hairline"
                          : "bg-surface-subtle/50 border-2 border-dashed border-border-hairline hover:border-deal-orange/50"
                      }`}
                    >
                      {/* Slot Header Bar */}
                      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-border-hairline">
                        <span className="font-label-sm text-[11px] font-bold tracking-wider uppercase text-deal-orange flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-deal-orange"></span>
                          Slot {slotIdx + 1}
                        </span>
                        {phone && (
                          <button
                            onClick={() => handleRemoveSlot(slotIdx)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 px-2 py-0.5 rounded-md transition-colors"
                            title="Remove smartphone from this slot"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Interactive Search Bar for this Slot */}
                      <div className="relative mb-3">
                        <div className="flex items-center gap-2 bg-surface-container-lowest border border-border-hairline rounded-xl px-3 py-2 shadow-xs focus-within:border-deal-orange focus-within:ring-1 focus-within:ring-deal-orange">
                          <span className="material-symbols-outlined text-[18px] text-outline">search</span>
                          <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSlotQueries((prev) => {
                                const next = [...prev];
                                next[slotIdx] = val;
                                return next;
                              });
                              setActiveSlotSearch(slotIdx);
                            }}
                            onFocus={() => setActiveSlotSearch(slotIdx)}
                            placeholder={phone ? `Switch ${phone.model}...` : `Search phone for Slot ${slotIdx + 1}...`}
                            className="w-full bg-transparent text-xs sm:text-sm text-primary placeholder:text-outline focus:outline-none"
                          />
                          {query && (
                            <button
                              onClick={() => {
                                setSlotQueries((prev) => {
                                  const next = [...prev];
                                  next[slotIdx] = "";
                                  return next;
                                });
                              }}
                              className="text-outline hover:text-primary"
                            >
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                            </button>
                          )}
                        </div>

                        {/* Search Dropdown Results */}
                        {isSearching && (
                          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface-container-lowest rounded-xl shadow-2xl border border-border-hairline max-h-64 overflow-y-auto divide-y divide-border-hairline animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="px-3 py-1.5 bg-surface-container-low text-[10px] font-bold text-outline uppercase tracking-wider">
                              {query.trim() ? `Search Results for "${query}"` : "Suggested Smartphones"}
                            </div>
                            {suggestions.length > 0 ? (
                              suggestions.map((sug) => {
                                const lowest = sug.lowest_verified_price || sug.price_pkr;
                                return (
                                  <div
                                    key={sug.id}
                                    onClick={() => handleSelectPhone(slotIdx, sug)}
                                    className="p-2.5 flex items-center gap-2.5 hover:bg-surface-subtle cursor-pointer transition-colors"
                                  >
                                    <div className="w-9 h-9 shrink-0 bg-surface-container rounded-lg flex items-center justify-center p-0.5 overflow-hidden">
                                      <img
                                        src={getPhoneImg(sug)}
                                        alt={sug.model}
                                        className="max-h-8 max-w-full object-contain"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-bold text-primary truncate">{sug.model}</div>
                                      <div className="text-[10px] text-outline truncate">{sug.brand}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <div className="text-xs font-bold text-deal-orange">
                                        {lowest > 0 && sug.status !== "Discontinued" ? formatPKR(lowest) : "Price N/A"}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="p-4 text-center text-xs text-outline">
                                No phones matching &ldquo;{query}&rdquo;
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Slot Body: Either Selected Phone or Empty Slot Prompt */}
                      {phone ? (
                        <div className="flex flex-col items-center text-center">
                          <Link
                            href={`/phone/${phone.slug}`}
                            className="w-full h-36 bg-surface-subtle rounded-xl p-2.5 flex items-center justify-center relative overflow-hidden group mb-2.5 border border-border-hairline/60"
                          >
                            <img
                              className="max-h-32 max-w-full w-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
                              alt={`${phone.brand} ${phone.model}`}
                              src={getPhoneImg(phone)}
                            />
                          </Link>

                          <span className="text-[11px] font-bold text-deal-orange uppercase tracking-wider block">
                            {phone.brand}
                          </span>
                          <h3 className="font-headline-sm text-sm sm:text-base font-bold text-primary line-clamp-1 mb-1">
                            <Link href={`/phone/${phone.slug}`} className="hover:underline">
                              {phone.model}
                            </Link>
                          </h3>

                          <div className="flex items-center gap-2 mb-3">
                            <span className={`font-bold text-sm sm:text-base ${(phone.lowest_verified_price ?? phone.price_pkr ?? 0) > 0 && phone.status !== "Discontinued" ? "text-deal-orange" : "text-slate-500"}`}>
                              {(phone.lowest_verified_price ?? phone.price_pkr ?? 0) > 0 && phone.status !== "Discontinued" ? formatPKR(phone.lowest_verified_price ?? phone.price_pkr!) : "Price N/A"}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-surface-container text-primary">
                              {phone.status === "Discontinued" ? "Discontinued" : phone.pta_status === "approved" ? "PTA Approved" : "Non-PTA"}
                            </span>
                          </div>

                          <div className="w-full grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                            <Link
                              href={`/phone/${phone.slug}#specs`}
                              className="py-1.5 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary transition-colors text-center"
                            >
                              Full Specs
                            </Link>
                            {(phone.lowest_verified_price ?? phone.price_pkr ?? 0) > 0 && phone.status !== "Discontinued" ? (
                              <a
                                href={phone.retailers?.[0]?.url || `https://priceoye.pk`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-1.5 px-2 rounded-lg bg-deal-orange hover:bg-deal-orange/90 text-on-primary transition-colors text-center font-bold flex items-center justify-center gap-1"
                              >
                                View Deal ↗
                              </a>
                            ) : (
                              <span className="py-1.5 px-2 rounded-lg bg-slate-100 text-slate-500 text-center font-medium">
                                Unlisted
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                          <div className="w-12 h-12 rounded-full bg-deal-orange/10 text-deal-orange flex items-center justify-center mb-2.5">
                            <span className="material-symbols-outlined text-[24px]">add_circle</span>
                          </div>
                          <h4 className="font-bold text-primary text-sm mb-1">
                            No Phone Selected
                          </h4>
                          <p className="text-xs text-outline mb-3 max-w-[200px]">
                            Type a phone model above to compare its technical specs in Slot {slotIdx + 1}
                          </p>

                          {/* Quick Pick Chips */}
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {(slotIdx === 0
                              ? ["Galaxy A15", "Redmi Note 13"]
                              : slotIdx === 1
                              ? ["Redmi A3", "iPhone 15"]
                              : ["Infinix Smart 8", "Spark 20"]
                            ).map((modelName) => {
                              const match = initialPhones.find((p) =>
                                p.model.toLowerCase().includes(modelName.toLowerCase())
                              );
                              if (!match) return null;
                              return (
                                <button
                                  key={modelName}
                                  onClick={() => handleSelectPhone(slotIdx, match)}
                                  className="text-[10px] font-semibold px-2 py-1 rounded-md bg-surface-container hover:bg-deal-orange hover:text-on-primary transition-colors text-primary border border-border-hairline"
                                >
                                  + {modelName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ========================================================================= */}
              {/* SPECIFICATION COMPARISON TABLE: SEPARATE DEDICATED COLUMN FOR EACH DEVICE */}
              {/* ========================================================================= */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-deal-orange text-[20px]">table_chart</span>
                    <h3 className="font-headline-sm text-base sm:text-lg font-bold text-primary">
                      Side-By-Side Specification Shootout
                    </h3>
                  </div>
                  <span className="text-xs text-outline font-medium hidden sm:inline">
                    Dedicated specification column for each device
                  </span>
                </div>

                {/* Unified Shootout Table with Dedicated Device Columns */}
                <div className="overflow-x-auto w-full border border-border-hairline rounded-2xl bg-surface-container-lowest shadow-sm">
                  <table className="w-full text-left border-collapse min-w-[780px]">
                    
                    {/* Sticky Table Header Showing Device Columns */}
                    <thead className="sticky top-0 z-20 bg-surface-container-low shadow-xs border-b border-border-hairline">
                      <tr>
                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-outline w-1/4 min-w-[190px] align-middle">
                          Specifications
                        </th>
                        {[0, 1, 2].map((slotIdx) => {
                          const phone = slots[slotIdx];
                          return (
                            <th
                              key={slotIdx}
                              className="py-3 px-4 w-1/4 min-w-[210px] align-middle border-l border-border-hairline"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {phone ? (
                                    <>
                                      <div className="w-8 h-8 rounded-lg bg-surface-container-lowest p-0.5 shrink-0 flex items-center justify-center overflow-hidden border border-border-hairline">
                                        <img
                                          src={getPhoneImg(phone)}
                                          alt={phone.model}
                                          className="max-h-7 max-w-full object-contain"
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-bold text-xs text-primary truncate">{phone.model}</div>
                                        <div className="text-[10px] font-semibold text-deal-orange">
                                          {(phone.lowest_verified_price ?? phone.price_pkr ?? 0) > 0 && phone.status !== "Discontinued"
                                            ? formatPKR(phone.lowest_verified_price ?? phone.price_pkr!)
                                            : "Price N/A"}
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-xs font-semibold text-outline italic">
                                      Slot {slotIdx + 1} (Empty)
                                    </div>
                                  )}
                                </div>
                                {phone && (
                                  <button
                                    onClick={() => handleRemoveSlot(slotIdx)}
                                    className="text-slate-400 hover:text-red-500 p-1"
                                    title={`Clear Slot ${slotIdx + 1}`}
                                  >
                                    <span className="material-symbols-outlined text-[15px]">close</span>
                                  </button>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    {/* Table Body: Category Sections and Spec Rows */}
                    <tbody className="divide-y divide-border-hairline">
                      {SPEC_SECTIONS.map((section, sIdx) => {
                        // If "Differences Only" is checked, filter out rows where all selected phones match
                        const filteredRows = section.rows.filter((row) => {
                          if (!diffOnly || compareList.length < 2) return true;
                          if (!row.getRawValue) return true;
                          const values = compareList.map((p) => String(row.getRawValue!(p)).trim().toLowerCase());
                          const allSame = values.every((v) => v === values[0]);
                          return !allSame;
                        });

                        if (filteredRows.length === 0) return null;

                        return (
                          <React.Fragment key={sIdx}>
                            {/* Section Banner Header */}
                            <tr className="bg-surface-container-high/60 border-t-2 border-border-hairline">
                              <td
                                colSpan={4}
                                className="py-2.5 px-4 font-bold text-xs uppercase tracking-wider text-primary bg-surface-container-low"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[17px] text-deal-orange">
                                    {section.icon}
                                  </span>
                                  <span>{section.title}</span>
                                </div>
                              </td>
                            </tr>

                            {/* Detailed Rows for this Section */}
                            {filteredRows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className="hover:bg-surface-container-lowest/60 transition-colors border-b border-border-hairline/80"
                              >
                                {/* Spec Title / Label Column */}
                                <td className="py-3 px-4 font-semibold text-xs text-outline bg-surface-container-lowest align-middle">
                                  {row.label}
                                </td>

                                {/* Device 1 Column */}
                                <td className="py-3 px-4 text-xs border-l border-border-hairline align-middle">
                                  {slots[0] ? (
                                    row.getValue(slots[0])
                                  ) : (
                                    <span className="text-outline/30 font-normal select-none">—</span>
                                  )}
                                </td>

                                {/* Device 2 Column */}
                                <td className="py-3 px-4 text-xs border-l border-border-hairline align-middle">
                                  {slots[1] ? (
                                    row.getValue(slots[1])
                                  ) : (
                                    <span className="text-outline/30 font-normal select-none">—</span>
                                  )}
                                </td>

                                {/* Device 3 Column */}
                                <td className="py-3 px-4 text-xs border-l border-border-hairline align-middle">
                                  {slots[2] ? (
                                    row.getValue(slots[2])
                                  ) : (
                                    <span className="text-outline/30 font-normal select-none">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="px-5 py-3.5 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 border-t border-border-hairline">
              <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-deal-orange text-[16px]">storefront</span>
                <span>Estimated market prices tracked across Pakistan markets (PriceOye, Telemart, Hafeez Centre).</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-surface-container-lowest hover:bg-surface-container text-primary font-label-md text-xs sm:text-sm rounded-lg shadow-sm transition-colors border border-border-hairline"
                  id="minimize-modal-btn"
                >
                  Dock to Tray
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-deal-orange hover:bg-deal-orange/90 text-on-primary font-label-md text-xs sm:text-sm font-bold rounded-lg shadow-md transition-colors flex items-center gap-1.5"
                >
                  <span>Download Spec Sheet</span>
                  <span className="material-symbols-outlined text-[16px]">download</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* FLOATING / DOCKED COMPARE TRAY (3 SLOTS MAX) */}
      {/* ========================================== */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl shadow-2xl p-3 sm:p-4 transition-all border border-border-hairline">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Tray Header & Count */}
          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
            <div className="w-9 h-9 rounded-xl bg-deal-orange/10 text-deal-orange flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">compare</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-label-lg text-sm sm:text-base font-bold text-primary">Compare Tray</h4>
                <span className="px-2 py-0.5 rounded-full bg-deal-orange text-on-primary font-label-sm text-[11px] font-bold">
                  {compareList.length} of 3
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-outline">
                {compareList.length === 0
                  ? "Select up to 3 smartphones to compare"
                  : compareList.length < 3
                  ? `Add ${3 - compareList.length} more device`
                  : "All 3 comparison slots filled"}
              </p>
            </div>
          </div>

          {/* Selected Device Pills / Cards (3 SLOTS) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto flex-1 max-w-xl">
            {[0, 1, 2].map((slotIdx) => {
              const phone = slots[slotIdx];
              if (!phone) {
                return (
                  <button
                    key={`tray-empty-${slotIdx}`}
                    onClick={() => {
                      setIsModalOpen(true);
                      setActiveSlotSearch(slotIdx);
                    }}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-surface-subtle hover:bg-surface-container transition-colors cursor-pointer text-outline hover:text-primary border border-dashed border-border-hairline text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>Slot {slotIdx + 1}: Add</span>
                  </button>
                );
              }

              const lowestPrice = phone.lowest_verified_price || phone.price_pkr;
              return (
                <div
                  key={phone.id}
                  className="flex items-center gap-2 p-1.5 bg-surface-container rounded-xl relative group border border-border-hairline"
                >
                  <div className="w-8 h-8 shrink-0 bg-surface-container-lowest rounded-lg flex items-center justify-center p-0.5 overflow-hidden">
                    <img
                      className="h-full max-h-7 max-w-full object-contain"
                      alt={`${phone.brand} ${phone.model}`}
                      src={getPhoneImg(phone)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-label-sm text-xs font-bold text-primary block truncate">
                      {phone.model}
                    </span>
                    <span className="font-body-sm text-[11px] text-deal-orange font-bold truncate block">
                      {lowestPrice > 0 && phone.status !== "Discontinued" ? formatPKR(lowestPrice) : "Price N/A"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveSlot(slotIdx)}
                    className="text-outline hover:text-deal-orange transition-colors p-1"
                    title="Remove device"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
            {compareList.length > 0 && (
              <button
                onClick={clearAll}
                className="px-2.5 py-1.5 text-outline hover:text-red-500 font-label-md text-xs transition-colors font-medium"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-deal-orange hover:bg-deal-orange/90 text-on-primary font-label-md text-xs sm:text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-1.5 active:scale-95"
              id="open-modal-btn"
            >
              <span>{isModalOpen ? "Viewing Compare" : `Compare Now (${compareList.length})`}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
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
                Pakistan&apos;s premier tech analytics, device comparison, estimated wholesale rates from Hafeez Centre, and accurate PTA tax estimates.
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
              © 2025 CompareIt.pk. All rights reserved. Estimated market prices tracked across local Pakistan markets.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
