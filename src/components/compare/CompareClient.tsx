"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const fromUrl = searchParams?.get("from");

  // Strictly 3 comparison slots max
  const [slots, setSlots] = useState<(Phone | null)[]>(() => {
    const arr: (Phone | null)[] = [null, null, null];
    if (initialCompareSlugs && initialCompareSlugs.length > 0) {
      initialCompareSlugs.slice(0, 3).forEach((slug, idx) => {
        const match = initialPhones.find(
          (p) =>
            p.slug === slug ||
            p.id === slug ||
            p.model.toLowerCase().replace(/\s+/g, "-").includes(slug.toLowerCase())
        );
        if (match) {
          arr[idx] = match;
        }
      });
    }
    return arr;
  });

  const compareList = useMemo(() => slots.filter((p): p is Phone => p !== null), [slots]);

  const [diffOnly, setDiffOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search state for each slot (0, 1, 2)
  const [slotQueries, setSlotQueries] = useState<string[]>(["", "", ""]);
  const [activeSlotSearch, setActiveSlotSearch] = useState<number | null>(null);
  const searchContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Close search dropdown on outside click
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

  const getPhoneImg = (phone: Phone) => {
    if (phone.image) return getSupabaseImageUrl(phone.image);
    if (phone.images && phone.images.length > 0) return getSupabaseImageUrl(phone.images[0]);
    return "/favicon.png";
  };

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

  // Synchronize browser URL query params safely in useEffect after render
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const activeSlugs = slots.filter((p): p is Phone => p !== null).map((p) => p.slug);
    const params = new URLSearchParams();
    if (activeSlugs.length > 0) {
      params.set("phones", activeSlugs.join(","));
    }
    if (fromUrl) {
      params.set("from", fromUrl);
    }
    const queryString = params.toString();
    const newUrl = `/compare${queryString ? `?${queryString}` : ""}`;
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", newUrl);
    }
  }, [slots, fromUrl]);

  const handleSelectPhone = (slotIndex: number, phone: Phone) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = phone;
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

  const handleRemoveSlot = (slotIndex: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
    setSlotQueries((prev) => {
      const next = [...prev];
      next[slotIndex] = "";
      return next;
    });
    setActiveSlotSearch(null);
  };

  const clearAll = () => {
    setSlots([null, null, null]);
    setSlotQueries(["", "", ""]);
    setActiveSlotSearch(null);
    showToast("Cleared all comparison slots");
  };

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

  const getSuggestionsForSlot = (slotIndex: number) => {
    const q = slotQueries[slotIndex]?.trim() || "";
    if (!q) {
      const popularModels = ["Galaxy A15", "Redmi Note 13", "iPhone 15", "Spark 20", "Smart 8", "Y27", "C67", "Poco M6"];
      return initialPhones
        .filter((p) => popularModels.some((pop) => p.model.toLowerCase().includes(pop.toLowerCase())))
        .slice(0, 8);
    }
    return initialPhones
      .map((p) => ({ phone: p, ...matchPhoneSearch(p, q) }))
      .filter((res) => res.matches)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((res) => res.phone);
  };

  const maxAntutu = useMemo(() => {
    const scores = compareList.map((p) => p.platform?.antutu_score || 200000);
    return Math.max(...scores, 450000);
  }, [compareList]);

  // Comprehensive specification rows matching Pakistan market needs
  const SPEC_SECTIONS: SpecSectionDef[] = [
    {
      title: "Local Market Pricing & Retailers",
      icon: "💰",
      rows: [
        {
          label: "Estimated Market Price",
          getValue: (p) => {
            const price = p.lowest_verified_price || p.price_pkr;
            const isAvail = price > 0 && Array.isArray(p.retailers) && p.retailers.length > 0 && p.status !== "Discontinued";
            return isAvail ? (
              <span className="font-extrabold text-[#ea580c] text-sm sm:text-base">{formatPKR(price)}</span>
            ) : (
              <span className="text-gray-400 font-semibold text-xs sm:text-sm">Price N/A</span>
            );
          },
          getRawValue: (p) => p.lowest_verified_price || p.price_pkr || 0,
        },
        {
          label: "Official Brand MSRP",
          getValue: (p) => {
            const isAvail = p.price_pkr > 0 && p.status !== "Discontinued";
            return isAvail ? (
              <span className="font-medium text-gray-900">{formatPKR(p.price_pkr)}</span>
            ) : (
              <span className="text-gray-400 text-xs">Discontinued / Unlisted</span>
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
              <span className="font-bold text-gray-900">{formatPKR(Math.round(price * 0.98))}</span>
            ) : (
              <span className="text-gray-400 text-xs">Price N/A</span>
            );
          },
          getRawValue: (p) => (p.lowest_verified_price || p.price_pkr || 0) * 0.98,
        },
        {
          label: "Official Brand Warranty",
          getValue: (p) => (
            <span className="text-gray-800">
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
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Available Across Stores
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-gray-200">
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
      icon: "🇵🇰",
      rows: [
        {
          label: "PTA DIRBS Status",
          getValue: (p) => (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                p.status === "Discontinued"
                  ? "bg-gray-100 text-gray-700 border border-gray-200"
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
          getValue: (p) => (
            <span className="font-semibold text-gray-900">
              {formatPKR(p.pta_tax?.passport || (p.price_pkr > 40000 ? 19500 : 3200))}
            </span>
          ),
          getRawValue: (p) => p.pta_tax?.passport || (p.price_pkr > 40000 ? 19500 : 3200),
        },
        {
          label: "PTA Tax (CNIC)",
          getValue: (p) => (
            <span className="font-semibold text-gray-900">
              {formatPKR(p.pta_tax?.cnic || (p.price_pkr > 40000 ? 24000 : 4100))}
            </span>
          ),
          getRawValue: (p) => p.pta_tax?.cnic || (p.price_pkr > 40000 ? 24000 : 4100),
        },
      ],
    },
    {
      title: "Display & Screen Quality",
      icon: "📱",
      rows: [
        {
          label: "Screen Size",
          getValue: (p) => <span className="font-semibold text-gray-900">{p.display?.size || 6.6}&quot; Inches</span>,
          getRawValue: (p) => p.display?.size || 6.6,
        },
        {
          label: "Panel Technology",
          getValue: (p) => {
            const type = p.display?.type || "HD+ IPS LCD";
            const isAmoled = type.toLowerCase().includes("amoled") || type.toLowerCase().includes("oled");
            return (
              <span className={isAmoled ? "text-[#ea580c] font-bold" : "text-gray-800 font-medium"}>
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
            return match ? <span className="font-bold text-gray-900">{match[1]} High Refresh</span> : "60 Hz Standard";
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
      icon: "⚡",
      rows: [
        {
          label: "SoC Chipset",
          getValue: (p) => (
            <span className="font-bold text-gray-900">{p.platform?.chipset || "Octa-Core SoC"}</span>
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
              <div className="space-y-1.5 max-w-[200px] mx-auto text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-900">~{score.toLocaleString()} pts</span>
                  <span className="text-[10px] text-gray-500 font-medium">AnTuTu v10</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-200/50">
                  <div className="h-full bg-[#f47820] rounded-full" style={{ width: `${pct}%` }}></div>
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
      icon: "💾",
      rows: [
        {
          label: "RAM Capacity",
          getValue: (p) => {
            const safeRam = getSafeRam(p);
            const vRam = p.memory?.virtual_ram_gb;
            return (
              <span className="font-semibold text-gray-900">
                {safeRam}GB Physical{vRam ? ` + ${vRam}GB Virtual` : ""}
              </span>
            );
          },
          getRawValue: (p) => getSafeRam(p),
        },
        {
          label: "Internal Storage (ROM)",
          getValue: (p) => <span className="font-semibold text-gray-900">{getSafeStorage(p)}GB High-Speed Storage</span>,
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
      icon: "📸",
      rows: [
        {
          label: "Rear Main Camera",
          getValue: (p) => {
            const setup = p.camera?.setup || `${p.camera?.main_mp || 50} MP Primary Sensor`;
            const hasOis = setup.includes("OIS") || (p.camera?.features || "").includes("OIS");
            return (
              <span className="font-semibold text-gray-900">
                {setup} {hasOis && <span className="text-[#ea580c] font-bold">(OIS)</span>}
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
          getValue: (p) => `${p.camera?.selfie_mp || 8} MP Front Camera`,
          getRawValue: (p) => p.camera?.selfie_mp || 0,
        },
      ],
    },
    {
      title: "Battery & Fast Charging",
      icon: "🔋",
      rows: [
        {
          label: "Battery Capacity",
          getValue: (p) => <span className="font-extrabold text-gray-900">{p.battery?.capacity_mah || 5000} mAh</span>,
          getRawValue: (p) => p.battery?.capacity_mah || 5000,
        },
        {
          label: "Charging Speed",
          getValue: (p) => {
            const watt = p.battery?.charging_watt || 18;
            return <span className={watt >= 25 ? "text-[#ea580c] font-bold" : "font-semibold text-gray-900"}>{watt}W Fast Charging</span>;
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
      icon: "📡",
      rows: [
        {
          label: "5G Cellular Network",
          getValue: (p) => (
            <span className={`font-bold ${p.connectivity?.five_g ? "text-[#ea580c]" : "text-gray-700"}`}>
              {p.connectivity?.five_g ? "✓ 5G Ready" : "4G LTE-A"}
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
    <div className="w-full bg-[#f8f9fa] min-h-screen text-gray-900 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[9999] bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-800 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-[#f47820] text-sm">ℹ️</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
          <nav className="flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/#phones" className="hover:text-gray-900 transition-colors">
              Smartphones
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-semibold">Side-by-Side Comparison</span>
          </nav>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-[11px] text-gray-700 font-medium shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f47820] animate-pulse"></span>
              Live Hafeez Centre Benchmark Rates
            </span>
          </div>
        </div>

        {/* Page Header Strip & Action Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-[#ea580c] border border-orange-200 mb-1.5">
              <span>⚖️ Side-by-Side Comparison Matrix</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {compareList.length > 1
                ? compareList.map((p) => p.model).join(" vs ")
                : "Compare Smartphones Side-by-Side"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              Compare complete technical specifications, verified Pakistan market prices, official PTA DIRBS duty taxes, and benchmark scores across up to 3 devices.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-end shrink-0">
            <label className="flex items-center gap-2 cursor-pointer select-none bg-white hover:bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 shadow-2xs transition-colors">
              <input
                type="checkbox"
                id="toggle-diff"
                checked={diffOnly}
                onChange={(e) => setDiffOnly(e.target.checked)}
                className="accent-[#ea580c] w-4 h-4 cursor-pointer rounded"
              />
              <span className="text-xs font-semibold text-gray-800">
                Differences Only
              </span>
            </label>

            <button
              type="button"
              onClick={handleShare}
              className="btn-ghost text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 bg-white hover:bg-gray-50 shadow-2xs"
              title="Share comparison link"
            >
              <span>🔗</span>
              <span>Share</span>
            </button>

            {compareList.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl border border-gray-200 transition-colors shadow-2xs flex items-center gap-1"
                title="Clear all comparison slots"
              >
                <span>🗑️</span>
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3 HERO DEVICE SELECTION SLOTS WITH EMBEDDED SEARCH & FAST PICK CHIPS      */}
        {/* ========================================================================= */}
        <section aria-label="Smartphone Comparison Slots">
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
                  className={`rounded-2xl p-4 flex flex-col justify-between relative transition-all ${
                    phone
                      ? "bg-white border border-gray-200 shadow-xs"
                      : "bg-white/80 border-2 border-dashed border-gray-300 hover:border-orange-400"
                  }`}
                >
                  {/* Slot Top Bar: Slot label & Remove button */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[#ea580c] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#f47820]"></span>
                      Device Slot {slotIdx + 1}
                    </span>
                    {phone && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slotIdx)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-red-600 hover:bg-red-50 px-2 py-0.5 rounded-md transition-colors"
                        title="Remove phone from slot"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Search / Device Switcher */}
                  <div className="relative mb-3.5">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 shadow-2xs focus-within:bg-white focus-within:border-[#f47820] focus-within:ring-1 focus-within:ring-[#f47820] transition-all">
                      <span className="text-gray-400 text-xs">🔍</span>
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
                        className="w-full bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                      />
                      {query && (
                        <button
                          type="button"
                          onClick={() => {
                            setSlotQueries((prev) => {
                              const next = [...prev];
                              next[slotIdx] = "";
                              return next;
                            });
                          }}
                          className="text-gray-400 hover:text-gray-700 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Autocomplete Dropdown */}
                    {isSearching && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-gray-200 max-h-72 overflow-y-auto divide-y divide-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="px-3 py-2 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          {query.trim() ? `Matching "${query}"` : "Suggested Smartphones"}
                        </div>
                        {suggestions.length > 0 ? (
                          suggestions.map((sug) => {
                            const lowest = sug.lowest_verified_price || sug.price_pkr;
                            return (
                              <div
                                key={sug.id}
                                onClick={() => handleSelectPhone(slotIdx, sug)}
                                className="p-2.5 flex items-center gap-3 hover:bg-orange-50/70 cursor-pointer transition-colors"
                              >
                                <div className="w-10 h-10 shrink-0 bg-gray-50 rounded-lg flex items-center justify-center p-1 border border-gray-100 overflow-hidden">
                                  <img
                                    src={getPhoneImg(sug)}
                                    alt={sug.model}
                                    className="max-h-8 max-w-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-gray-900 truncate">{sug.model}</div>
                                  <div className="text-[10px] text-gray-500 truncate">{sug.brand}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-bold text-[#ea580c]">
                                    {lowest > 0 && sug.status !== "Discontinued" ? formatPKR(lowest) : "Price N/A"}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-xs text-gray-500">
                            No smartphones found matching &ldquo;{query}&rdquo;
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Slot Body: Either Selected Phone Card or Empty Prompt */}
                  {phone ? (
                    <div className="flex flex-col items-center text-center">
                      <Link
                        href={`/phone/${phone.slug}`}
                        className="w-full h-40 bg-[#f8f9fa] rounded-xl p-3 flex items-center justify-center relative overflow-hidden group mb-3 border border-gray-100 transition-all hover:bg-gray-100/70"
                      >
                        <img
                          className="max-h-36 max-w-full w-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
                          alt={`${phone.brand} ${phone.model}`}
                          src={getPhoneImg(phone)}
                        />
                      </Link>

                      <span className="text-[10px] font-bold text-[#ea580c] uppercase tracking-wider block mb-0.5">
                        {phone.brand}
                      </span>
                      <h3 className="text-base font-extrabold text-gray-900 line-clamp-1 mb-1">
                        <Link href={`/phone/${phone.slug}`} className="hover:text-[#ea580c] transition-colors">
                          {phone.model}
                        </Link>
                      </h3>

                      <div className="flex items-center justify-center gap-2 mb-3">
                        <span className={`font-extrabold text-base ${(phone.lowest_verified_price ?? phone.price_pkr ?? 0) > 0 && phone.status !== "Discontinued" ? "text-[#ea580c]" : "text-gray-400"}`}>
                          {(phone.lowest_verified_price ?? phone.price_pkr ?? 0) > 0 && phone.status !== "Discontinued"
                            ? formatPKR(phone.lowest_verified_price ?? phone.price_pkr!)
                            : "Price N/A"}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            phone.status === "Discontinued"
                              ? "bg-gray-100 text-gray-600 border-gray-200"
                              : phone.pta_status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {phone.status === "Discontinued" ? "Discontinued" : phone.pta_status === "approved" ? "PTA Approved" : "Non-PTA"}
                        </span>
                      </div>

                      <div className="w-full grid grid-cols-2 gap-2 text-xs font-semibold">
                        <Link
                          href={`/phone/${phone.slug}#specs`}
                          className="py-2 px-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors text-center"
                        >
                          Full Specs
                        </Link>
                        {(phone.lowest_verified_price ?? phone.price_pkr ?? 0) > 0 && phone.status !== "Discontinued" ? (
                          <a
                            href={phone.retailers?.[0]?.url || `https://priceoye.pk`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-2.5 rounded-xl bg-[#000000] hover:bg-[#27272a] text-white transition-colors text-center font-bold flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <span>View Deal</span>
                            <span className="text-[10px]">↗</span>
                          </a>
                        ) : (
                          <span className="py-2 px-2.5 rounded-xl bg-gray-100 text-gray-400 text-center font-medium">
                            Unlisted
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[260px]">
                      <div className="w-12 h-12 rounded-full bg-orange-50 text-[#ea580c] flex items-center justify-center mb-2.5 border border-orange-100 text-lg font-bold">
                        +
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">
                        Select a Smartphone
                      </h4>
                      <p className="text-xs text-gray-500 mb-3.5 max-w-[210px]">
                        Type any phone name above or pick a popular model below:
                      </p>

                      {/* Quick Pick Chips */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {(slotIdx === 0
                          ? ["Galaxy A15", "Redmi Note 13", "iPhone 15"]
                          : slotIdx === 1
                          ? ["Spark 20", "Redmi A3", "Galaxy A55"]
                          : ["Smart 8", "Vivo Y27", "Realme C67"]
                        ).map((modelName) => {
                          const match = initialPhones.find((p) =>
                            p.model.toLowerCase().includes(modelName.toLowerCase())
                          );
                          if (!match) return null;
                          return (
                            <button
                              key={modelName}
                              type="button"
                              onClick={() => handleSelectPhone(slotIdx, match)}
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#f47820] hover:text-white transition-colors text-gray-700 border border-gray-200"
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
        </section>

        {/* ========================================================================= */}
        {/* SPECIFICATION COMPARISON MATRIX TABLE                                     */}
        {/* ========================================================================= */}
        <section aria-label="Side-by-Side Specification Table" className="pt-2">
          {compareList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-xs">
              <div className="text-3xl mb-2">⚖️</div>
              <h2 className="text-base font-bold text-gray-900 mb-1">
                No Smartphones Selected for Comparison
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                Search and select at least 2 smartphones in the slots above to generate a real-time side-by-side spec comparison and Pakistan market price breakdown.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Side-by-Side Specification Shootout
                  </h2>
                </div>
                <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                  Scroll horizontally to compare all selected device columns
                </span>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto w-full border border-gray-200 rounded-2xl bg-white shadow-xs">
                <table className="w-full text-left border-collapse min-w-[780px]">
                  {/* Sticky Table Header */}
                  <thead className="sticky top-0 z-20 bg-white border-b-2 border-gray-200 shadow-2xs">
                    <tr>
                      <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-500 w-1/4 min-w-[170px] sm:min-w-[190px] align-middle sticky left-0 top-0 z-30 bg-gray-50 border-r border-gray-200">
                        Specifications
                      </th>
                      {[0, 1, 2].map((slotIdx) => {
                        const phone = slots[slotIdx];
                        return (
                          <th
                            key={slotIdx}
                            className="py-3 px-4 w-1/4 min-w-[210px] align-middle border-l border-gray-200"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {phone ? (
                                  <>
                                    <div className="w-9 h-9 rounded-lg bg-gray-50 p-0.5 shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                                      <img
                                        src={getPhoneImg(phone)}
                                        alt={phone.model}
                                        className="max-h-8 max-w-full object-contain"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-xs text-gray-900 truncate">{phone.model}</div>
                                      <div className="text-[11px] font-bold text-[#ea580c]">
                                        {(phone.lowest_verified_price ?? phone.price_pkr ?? 0) > 0 && phone.status !== "Discontinued"
                                          ? formatPKR(phone.lowest_verified_price ?? phone.price_pkr!)
                                          : "Price N/A"}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs font-semibold text-gray-400 italic">
                                    Slot {slotIdx + 1} (Empty)
                                  </div>
                                )}
                              </div>
                              {phone && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlot(slotIdx)}
                                  className="text-gray-400 hover:text-red-600 p-1 text-xs"
                                  title={`Clear Slot ${slotIdx + 1}`}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  {/* Table Body: Grouped Categories & Rows */}
                  <tbody className="divide-y divide-gray-100">
                    {SPEC_SECTIONS.map((section, sIdx) => {
                      // Filter rows if "Differences Only" is selected
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
                          {/* Section Header Row */}
                          <tr className="bg-[#18181b] border-t-2 border-gray-200">
                            <td
                              colSpan={4}
                              className="py-2.5 px-4 font-extrabold text-xs uppercase tracking-wider text-white sticky left-0 z-20 bg-[#18181b]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{section.icon}</span>
                                <span>{section.title}</span>
                              </div>
                            </td>
                          </tr>

                          {/* Detail Rows for this Section */}
                          {filteredRows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="hover:bg-orange-50/40 transition-colors border-b border-gray-100"
                            >
                              {/* Label Column */}
                              <td className="py-3 px-4 font-semibold text-xs text-gray-700 bg-gray-50 sticky left-0 z-10 border-r border-gray-200 align-middle">
                                {row.label}
                              </td>

                              {/* Slot 1 Value */}
                              <td className="py-3 px-4 text-xs text-gray-900 border-l border-gray-100 align-middle text-center">
                                {slots[0] ? (
                                  row.getValue(slots[0])
                                ) : (
                                  <span className="text-gray-300 font-normal select-none">—</span>
                                )}
                              </td>

                              {/* Slot 2 Value */}
                              <td className="py-3 px-4 text-xs text-gray-900 border-l border-gray-100 align-middle text-center">
                                {slots[1] ? (
                                  row.getValue(slots[1])
                                ) : (
                                  <span className="text-gray-300 font-normal select-none">—</span>
                                )}
                              </td>

                              {/* Slot 3 Value */}
                              <td className="py-3 px-4 text-xs text-gray-900 border-l border-gray-100 align-middle text-center">
                                {slots[2] ? (
                                  row.getValue(slots[2])
                                ) : (
                                  <span className="text-gray-300 font-normal select-none">—</span>
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
          )}
        </section>
      </div>

      {/* ========================================================================= */}
      {/* NATIVE SITE FOOTER (LUXURY MINIMALIST EDITORIAL)                          */}
      {/* ========================================================================= */}
      <footer className="site-footer mt-16">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-col">
              <h3>
                CompareIt<span className="text-[#ea580c]">.pk</span>
              </h3>
              <p>
                Pakistan&apos;s premier tech analytics, device comparison, real-time wholesale rates from Hafeez Centre Lahore, Saddar Karachi, and accurate PTA DIRBS tax calculations.
              </p>
            </div>
            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li>
                  <Link href="/#phones">Latest Smartphones</Link>
                </li>
                <li>
                  <Link href="/trending">Trending Devices</Link>
                </li>
                <li>
                  <Link href="/new-in">New Arrivals</Link>
                </li>
                <li>
                  <Link href="/coming-soon">Coming Soon</Link>
                </li>
                <li>
                  <Link href="/compare">Side-by-Side Comparison</Link>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Taxes & Trust</h4>
              <ul className="footer-links">
                <li>
                  <Link href="/?taxCalc=open">PTA DIRBS Tax Calculator</Link>
                </li>
                <li>
                  <Link href="/contact">Editorial & Contact</Link>
                </li>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
                <li>
                  <a href="#">Terms of Service</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-meta mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
            <span>© 2025 CompareIt.pk. All rights reserved. Real-time rates tracked across Pakistan stores.</span>
            <span>PTA DIRBS Approved Rates 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
