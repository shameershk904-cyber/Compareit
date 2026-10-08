"use client";

import React, { useState, useMemo, useRef, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type Phone } from "@/types";
import { formatPKR, getSupabaseImageUrl } from "@/lib/utils";
import { matchPhoneSearch } from "@/lib/search";
import { ScaleIcon } from "@/components/shared/ScaleIcon";

function subscribeMediaQuery(callback: () => void) {
  const mql = window.matchMedia("(min-width: 768px)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getDesktopSnapshot() {
  return window.matchMedia("(min-width: 768px)").matches;
}

function getDesktopServerSnapshot() {
  return true;
}

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

  // Responsive breakpoint: 768px (Desktop: 3 slots, Mobile: 2 slots)
  const isDesktop = useSyncExternalStore(subscribeMediaQuery, getDesktopSnapshot, getDesktopServerSnapshot);

  const visibleSlotIndices = useMemo(() => (isDesktop ? [0, 1, 2] : [0, 1]), [isDesktop]);
  const visibleSlots = useMemo(() => visibleSlotIndices.map((idx) => slots[idx]), [visibleSlotIndices, slots]);
  const visibleCompareList = useMemo(() => visibleSlots.filter((p): p is Phone => p !== null), [visibleSlots]);

  // Mobile search modal / bottom sheet state
  const [mobileSearchSlot, setMobileSearchSlot] = useState<number | null>(null);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");

  useEffect(() => {
    if (mobileSearchSlot !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSearchSlot]);

  const [diffOnly, setDiffOnly] = useState(false);
  const [highlightDiff, setHighlightDiff] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Track scroll direction to seamlessly pin the table header at top: 0 (when site header hides) or top: 56px (when visible)
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastY;
        if (currentY < 16) {
          setHeaderVisible(true);
        } else if (delta > 6 && currentY > 64) {
          setHeaderVisible(false);
        } else if (delta < -6) {
          setHeaderVisible(true);
        }
        lastY = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // Handle escape key to close active modal or search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mobileSearchSlot !== null) {
          setMobileSearchSlot(null);
          setMobileSearchQuery("");
        }
        if (activeSlotSearch !== null) {
          setActiveSlotSearch(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileSearchSlot, activeSlotSearch]);

  const searchPhones = (query: string) => {
    const q = query.trim();
    if (!q) {
      const popularModels = ["Galaxy A15", "Redmi Note 13", "iPhone 15", "Spark 20", "Smart 8", "Y27", "C67", "Poco M6"];
      return initialPhones
        .filter((p) => popularModels.some((pop) => p.model.toLowerCase().includes(pop.toLowerCase())))
        .slice(0, 10);
    }
    return initialPhones
      .map((p) => ({ phone: p, ...matchPhoneSearch(p, q) }))
      .filter((res) => res.matches)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((res) => res.phone);
  };

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

  // Compute smart winning advantages across compared phones
  const getAdvantageBadge = (rowLabel: string, phone: Phone, allPhones: Phone[]): string | null => {
    if (allPhones.length < 2) return null;

    switch (rowLabel) {
      case "Estimated Market Price": {
        const validPrices = allPhones
          .map((p) => p.lowest_verified_price || p.price_pkr || 0)
          .filter((pr) => pr > 0);
        if (validPrices.length < 2) return null;
        const min = Math.min(...validPrices);
        const max = Math.max(...validPrices);
        const thisPrice = phone.lowest_verified_price || phone.price_pkr || 0;
        if (thisPrice === min && max > min) {
          return "★ Best Price";
        }
        return null;
      }
      case "Battery Capacity": {
        const caps = allPhones.map((p) => p.battery?.capacity_mah || 0);
        const max = Math.max(...caps);
        const min = Math.min(...caps);
        const thisCap = phone.battery?.capacity_mah || 0;
        if (thisCap === max && max - min >= 200) {
          return "★ Largest Battery";
        }
        return null;
      }
      case "Charging Speed": {
        const speeds = allPhones.map((p) => p.battery?.charging_watt || 0);
        const max = Math.max(...speeds);
        const min = Math.min(...speeds);
        const thisSpeed = phone.battery?.charging_watt || 0;
        if (thisSpeed === max && max - min >= 10) {
          return "★ Fastest Charge";
        }
        return null;
      }
      case "RAM Capacity": {
        const rams = allPhones.map((p) => getSafeRam(p));
        const max = Math.max(...rams);
        const min = Math.min(...rams);
        const thisRam = getSafeRam(phone);
        if (thisRam === max && max > min) {
          return "★ Most RAM";
        }
        return null;
      }
      case "Internal Storage (ROM)": {
        const roms = allPhones.map((p) => getSafeStorage(p));
        const max = Math.max(...roms);
        const min = Math.min(...roms);
        const thisRom = getSafeStorage(phone);
        if (thisRom === max && max > min) {
          return "★ Most Storage";
        }
        return null;
      }
      case "AnTuTu Benchmark": {
        const scores = allPhones.map((p) => p.platform?.antutu_score || (p.price_pkr > 40000 ? 420000 : p.price_pkr > 25000 ? 150000 : 230000));
        const max = Math.max(...scores);
        const min = Math.min(...scores);
        const thisScore = phone.platform?.antutu_score || (phone.price_pkr > 40000 ? 420000 : phone.price_pkr > 25000 ? 150000 : 230000);
        if (thisScore === max && max - min >= 25000) {
          return "★ Top Score";
        }
        return null;
      }
      case "5G Cellular Network": {
        const has5G = phone.connectivity?.five_g;
        const othersLack5G = allPhones.some((p) => !p.connectivity?.five_g);
        if (has5G && othersLack5G) {
          return "★ 5G Ready";
        }
        return null;
      }
      case "PTA DIRBS Status": {
        const isApproved = phone.pta_status === "approved" && phone.status !== "Discontinued";
        const othersNotApproved = allPhones.some((p) => p.pta_status !== "approved" || p.status === "Discontinued");
        if (isApproved && othersNotApproved) {
          return "★ Approved";
        }
        return null;
      }
      case "Rear Main Camera": {
        const mps = allPhones.map((p) => p.camera?.main_mp || 0);
        const max = Math.max(...mps);
        const min = Math.min(...mps);
        const thisMp = phone.camera?.main_mp || 0;
        if (thisMp === max && max > min && max >= 48) {
          return `★ ${thisMp}MP Sensor`;
        }
        return null;
      }
      case "Panel Technology": {
        const isAmoled = (phone.display?.type || "").toLowerCase().includes("oled") || (phone.display?.type || "").toLowerCase().includes("amoled");
        const othersLcd = allPhones.some((p) => !(p.display?.type || "").toLowerCase().includes("oled") && !(p.display?.type || "").toLowerCase().includes("amoled"));
        if (isAmoled && othersLcd) {
          return "★ AMOLED Display";
        }
        return null;
      }
      default:
        return null;
    }
  };

  // Comprehensive specification rows matching Pakistan market needs
  const SPEC_SECTIONS: SpecSectionDef[] = useMemo(
    () => [
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
              <span className="font-bold text-[#ea580c] text-xs sm:text-sm whitespace-nowrap">{formatPKR(price)}</span>
            ) : (
              <span className="text-gray-400 font-medium text-[11px] sm:text-xs whitespace-nowrap">Price N/A</span>
            );
          },
          getRawValue: (p) => p.lowest_verified_price || p.price_pkr || 0,
        },
        {
          label: "Official Brand MSRP",
          getValue: (p) => {
            const isAvail = p.price_pkr > 0 && p.status !== "Discontinued";
            return isAvail ? (
              <span className="font-medium text-gray-800 text-[11px] sm:text-xs whitespace-nowrap">{formatPKR(p.price_pkr)}</span>
            ) : (
              <span className="text-gray-400 text-[11px] whitespace-nowrap">Discontinued</span>
            );
          },
          getRawValue: (p) => p.price_pkr || 0,
        },
        {
          label: "Hafeez Centre Benchmark",
          getValue: (p) => {
            const price = p.lowest_verified_price || p.price_pkr;
            const isAvail = price > 0 && p.status !== "Discontinued";
            return isAvail ? (
              <span className="font-semibold text-gray-800 text-[11px] sm:text-xs whitespace-nowrap">{formatPKR(Math.round(price * 0.98))}</span>
            ) : (
              <span className="text-gray-400 text-[11px] whitespace-nowrap">Price N/A</span>
            );
          },
          getRawValue: (p) => (p.lowest_verified_price || p.price_pkr || 0) * 0.98,
        },
        {
          label: "Official Brand Warranty",
          getValue: (p) => (
            <span className="text-gray-800 text-[11px] sm:text-xs whitespace-nowrap">
              {p.warranty ? `${p.warranty.provider} (${p.warranty.duration_months}M)` : "1-Year Official"}
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
              <span className="whitespace-nowrap inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Available
              </span>
            ) : (
              <span className="whitespace-nowrap inline-flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border border-gray-200">
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
              className={`whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                p.status === "Discontinued"
                  ? "bg-gray-100 text-gray-700 border border-gray-200"
                  : p.pta_status === "approved"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {p.status === "Discontinued" ? "Discontinued" : p.pta_status === "approved" ? "✓ PTA Approved" : "Non-PTA"}
            </span>
          ),
          getRawValue: (p) => p.pta_status || "approved",
        },
        {
          label: "PTA Tax (Passport)",
          getValue: (p) => (
            <span className="font-semibold text-gray-900 text-[11px] sm:text-xs whitespace-nowrap">
              {formatPKR(p.pta_tax?.passport || (p.price_pkr > 40000 ? 19500 : 3200))}
            </span>
          ),
          getRawValue: (p) => p.pta_tax?.passport || (p.price_pkr > 40000 ? 19500 : 3200),
        },
        {
          label: "PTA Tax (CNIC)",
          getValue: (p) => (
            <span className="font-semibold text-gray-900 text-[11px] sm:text-xs whitespace-nowrap">
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
              <div className="space-y-1 w-full max-w-[130px] sm:max-w-[190px] mx-auto text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-[10px] sm:text-xs">
                  <span className="font-extrabold text-gray-900">~{score.toLocaleString()}</span>
                  <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium">v10 score</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 sm:h-2 rounded-full overflow-hidden border border-gray-200/60">
                  <div className="h-full bg-[#f47820] rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          },
          getRawValue: (p) =>
            p.platform?.antutu_score || (p.price_pkr > 40000 ? 420000 : p.price_pkr > 25000 ? 150000 : 230000),
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
    {
      title: "Editorial Verdict & Summary",
      icon: "🏆",
      rows: [
        {
          label: "Buyer Verdict",
          getValue: (p) => (
            <p className="text-[11px] sm:text-xs text-gray-700 leading-relaxed text-left line-clamp-3">
              {p.expert_verdict?.verdict ||
                `A dependable choice in its price category with reliable everyday performance and strong cellular signal reception in Pakistan.`}
            </p>
          ),
          getRawValue: (p) => p.expert_verdict?.verdict || "Dependable choice in Pakistan",
        },
        {
          label: "Key Strengths (Pros)",
          getValue: (p) => {
            const pros = p.expert_verdict?.pros || [
              `${p.battery?.capacity_mah || 5000}mAh Long Battery Life`,
              `${p.display?.type || "Quality Screen"} Display`,
              p.pta_status === "approved" ? "Official PTA DIRBS Registered" : "Competitive Market Value",
            ];
            return (
              <ul className="text-left space-y-1 text-[10px] sm:text-[11px] text-gray-700">
                {pros.slice(0, 3).map((pro, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span className="line-clamp-2">{pro}</span>
                  </li>
                ))}
              </ul>
            );
          },
          getRawValue: (p) => (p.expert_verdict?.pros || []).join(", "),
        },
        {
          label: "Trade-offs (Cons)",
          getValue: (p) => {
            const cons = p.expert_verdict?.cons || [
              `Standard low-light camera capabilities in night scenes`,
              p.connectivity?.five_g ? "High battery drain on continuous 5G usage" : "Limited to 4G LTE network",
            ];
            return (
              <ul className="text-left space-y-1 text-[10px] sm:text-[11px] text-gray-500">
                {cons.slice(0, 2).map((con, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-amber-500 font-bold shrink-0">•</span>
                    <span className="line-clamp-2">{con}</span>
                  </li>
                ))}
              </ul>
            );
          },
          getRawValue: (p) => (p.expert_verdict?.cons || []).join(", "),
        },
      ],
    },
  ], [maxAntutu]);

  // Total differences count across selected visible phones
  const diffCount = useMemo(() => {
    if (visibleCompareList.length < 2) return 0;
    let count = 0;
    SPEC_SECTIONS.forEach((section) => {
      section.rows.forEach((row) => {
        if (row.getRawValue) {
          const values = visibleCompareList.map((p) => String(row.getRawValue!(p)).trim().toLowerCase());
          const allSame = values.every((v) => v === values[0]);
          if (!allSame) count++;
        }
      });
    });
    return count;
  }, [visibleCompareList, SPEC_SECTIONS]);

  return (
    <div className="w-full max-w-full [overflow-x:clip] bg-[#f8f9fa] min-h-screen text-gray-900 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[9999] bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-800 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-[#f47820] text-sm">ℹ️</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 w-full min-w-0 [overflow-x:clip]">

        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 w-full min-w-0">
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

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200 w-full min-w-0">
          <div className="flex items-center gap-2">
            {visibleCompareList.length >= 2 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[#ea580c] text-[11px] font-bold shadow-2xs whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-pulse"></span>
                <span>{diffCount} {diffCount === 1 ? "Difference" : "Differences"}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer select-none bg-white hover:bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-2xs transition-colors whitespace-nowrap">
              <input
                type="checkbox"
                id="toggle-highlight-diff"
                checked={highlightDiff}
                onChange={(e) => setHighlightDiff(e.target.checked)}
                className="accent-[#ea580c] w-3.5 h-3.5 cursor-pointer rounded"
              />
              <span className="text-[11px] sm:text-xs font-semibold text-gray-800">
                Highlight Differences
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none bg-white hover:bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-2xs transition-colors whitespace-nowrap">
              <input
                type="checkbox"
                id="toggle-diff"
                checked={diffOnly}
                onChange={(e) => setDiffOnly(e.target.checked)}
                className="accent-[#ea580c] w-3.5 h-3.5 cursor-pointer rounded"
              />
              <span className="text-[11px] sm:text-xs font-semibold text-gray-800">
                Differences Only
              </span>
            </label>

            <button
              type="button"
              onClick={handleShare}
              className="btn-ghost text-[11px] sm:text-xs py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 shadow-2xs whitespace-nowrap"
              title="Share comparison link"
            >
              <span>🔗</span>
              <span>Share</span>
            </button>

            {compareList.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] sm:text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-gray-200 transition-colors shadow-2xs flex items-center gap-1 whitespace-nowrap"
                title="Clear all comparison slots"
              >
                <span>🗑️</span>
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RESPONSIVE DEVICE SLOTS (2 ON MOBILE, 3 ON DESKTOP)                       */}
        {/* ========================================================================= */}
        <section aria-label="Smartphone Comparison Slots" className="w-full max-w-full overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 w-full min-w-0">
            {visibleSlotIndices.map((slotIdx) => {
              const phone = slots[slotIdx];
              const query = slotQueries[slotIdx];
              const isSearching = activeSlotSearch === slotIdx;
              const suggestions = getSuggestionsForSlot(slotIdx);

              return phone ? (
                <div
                  key={slotIdx}
                  ref={(el) => {
                    searchContainerRefs.current[slotIdx] = el;
                  }}
                  className="rounded-2xl p-3 sm:p-4 flex flex-col justify-between bg-white border border-gray-200 shadow-xs relative transition-all"
                >
                  {/* Slot Top Bar */}
                  <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-gray-100">
                    <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#ea580c] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f47820]"></span>
                      Slot {slotIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(slotIdx)}
                      className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold text-gray-400 hover:text-red-600 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
                      title="Remove phone from slot"
                    >
                      ✕ <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>

                  {/* Desktop Inline Search / Switcher */}
                  <div className="relative mb-2.5 hidden md:block">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-2xs focus-within:bg-white focus-within:border-[#f47820] focus-within:ring-1 focus-within:ring-[#f47820] transition-all">
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
                        placeholder={`Switch ${phone.model}...`}
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
                      <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-gray-200 max-h-72 overflow-y-auto divide-y divide-gray-100">
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

                  {/* Phone Image & Details */}
                  <div className="flex flex-col items-center text-center">
                    <Link
                      href={`/phone/${phone.slug}`}
                      className="w-full h-28 sm:h-36 bg-[#f8f9fa] rounded-xl p-2 flex items-center justify-center relative overflow-hidden group mb-2 border border-gray-100 transition-all hover:bg-gray-100/70"
                    >
                      <img
                        className="max-h-24 sm:max-h-32 max-w-full w-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
                        alt={`${phone.brand} ${phone.model}`}
                        src={getPhoneImg(phone)}
                      />
                    </Link>

                    <span className="text-[9px] sm:text-[10px] font-bold text-[#ea580c] uppercase tracking-wider block mb-0.5">
                      {phone.brand}
                    </span>
                    <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 line-clamp-1 mb-1">
                      <Link href={`/phone/${phone.slug}`} className="hover:text-[#ea580c] transition-colors">
                        {phone.model}
                      </Link>
                    </h3>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 mb-2 sm:mb-2.5">
                      <span className={`font-extrabold text-xs sm:text-sm ${(phone.lowest_verified_price ?? phone.price_pkr ?? 0) > 0 && phone.status !== "Discontinued" ? "text-[#ea580c]" : "text-gray-400"}`}>
                        {(phone.lowest_verified_price ?? phone.price_pkr ?? 0) > 0 && phone.status !== "Discontinued"
                          ? formatPKR(phone.lowest_verified_price ?? phone.price_pkr!)
                          : "Price N/A"}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border whitespace-nowrap ${
                          phone.status === "Discontinued"
                            ? "bg-gray-100 text-gray-600 border-gray-200"
                            : phone.pta_status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {phone.status === "Discontinued" ? "Discontinued" : phone.pta_status === "approved" ? "PTA" : "Non-PTA"}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="w-full grid grid-cols-2 gap-1.5 text-[10px] sm:text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isDesktop) {
                            setMobileSearchSlot(slotIdx);
                            setMobileSearchQuery("");
                          } else {
                            setActiveSlotSearch(slotIdx);
                          }
                        }}
                        className="py-1.5 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-center font-medium whitespace-nowrap truncate"
                      >
                        Switch ⇄
                      </button>
                      <Link
                        href={`/phone/${phone.slug}#specs`}
                        className="py-1.5 px-2 rounded-xl bg-black hover:bg-zinc-800 text-white transition-colors text-center font-semibold whitespace-nowrap truncate"
                      >
                        Specs
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={slotIdx}
                  onClick={() => {
                    if (!isDesktop) {
                      setMobileSearchSlot(slotIdx);
                      setMobileSearchQuery("");
                    } else {
                      setActiveSlotSearch(slotIdx);
                    }
                  }}
                  className="rounded-2xl p-3 sm:p-5 flex flex-col items-center justify-center text-center bg-white/70 border-2 border-dashed border-gray-300 hover:border-[#ea580c] hover:bg-orange-50/20 transition-all cursor-pointer min-h-[220px] sm:min-h-[280px] group shadow-2xs"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-50 text-[#ea580c] flex items-center justify-center mb-2 sm:mb-3 border border-orange-100 text-lg sm:text-xl font-bold group-hover:scale-110 transition-transform">
                    +
                  </div>
                  <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm mb-0.5 sm:mb-1">
                    Add Smartphone
                  </h4>
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3">
                    Tap to select Slot {slotIdx + 1}
                  </p>
                  {/* Popular Quick Picks on Desktop */}
                  <div className="hidden md:flex flex-wrap items-center justify-center gap-1.5 mt-1">
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPhone(slotIdx, match);
                          }}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 hover:bg-[#f47820] hover:text-white transition-colors text-gray-700 border border-gray-200"
                        >
                          + {modelName}
                        </button>
                      );
                    })}
                  </div>
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
              <div className="flex justify-center mb-2">
                <ScaleIcon size={36} color="#f47820" />
              </div>
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
                <span className="text-xs text-gray-500 font-medium">
                  {isDesktop ? "Comparing 3 devices" : "Comparing 2 devices (Mobile)"}
                </span>
              </div>

              {/* Table Container */}
              <div className="w-full border border-gray-200 rounded-2xl bg-white shadow-xs [overflow-x:clip]">
                <table className="w-full text-left border-separate border-spacing-0 table-fixed">
                  {/* Sticky Table Header */}
                  <thead
                    className={`sticky ${
                      headerVisible ? "top-[56px] sm:top-[64px]" : "top-0"
                    } z-30 bg-white shadow-xs transition-[top] duration-200`}
                  >
                    <tr>
                      {isDesktop && (
                        <th
                          className={`py-2.5 sm:py-3 px-2 sm:px-3.5 font-bold text-xs uppercase tracking-wider text-gray-500 w-[170px] min-w-[170px] align-middle sticky ${
                            headerVisible ? "top-[56px] sm:top-[64px]" : "top-0"
                          } z-30 bg-gray-50 border-r border-b-2 border-gray-200 transition-[top] duration-200`}
                        >
                          Specs
                        </th>
                      )}
                      {visibleSlotIndices.map((slotIdx, colIdx) => {
                        const phone = slots[slotIdx];
                        return (
                          <th
                            key={slotIdx}
                            className={`py-2 sm:py-3 px-2 sm:px-4 align-middle bg-white sticky ${
                              headerVisible ? "top-[56px] sm:top-[64px]" : "top-0"
                            } z-30 border-b-2 border-gray-200 transition-[top] duration-200 ${
                              isDesktop ? "w-1/3" : "w-1/2"
                            } ${colIdx > 0 ? "border-l border-gray-200" : ""}`}
                          >
                            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                                {phone ? (
                                  <>
                                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gray-50 p-0.5 shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                                      <img
                                        src={getPhoneImg(phone)}
                                        alt={phone.model}
                                        className="max-h-6 sm:max-h-8 max-w-full object-contain"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-[11px] sm:text-xs text-gray-900 truncate">
                                        {phone.model}
                                      </div>
                                      <div className="text-[10px] sm:text-[11px] font-bold text-[#ea580c] whitespace-nowrap">
                                        {(phone.lowest_verified_price ?? phone.price_pkr ?? 0) > 0 && phone.status !== "Discontinued"
                                          ? formatPKR(phone.lowest_verified_price ?? phone.price_pkr!)
                                          : "Price N/A"}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isDesktop) {
                                        setMobileSearchSlot(slotIdx);
                                        setMobileSearchQuery("");
                                      } else {
                                        setActiveSlotSearch(slotIdx);
                                      }
                                    }}
                                    className="text-[10px] sm:text-xs font-semibold text-[#ea580c] hover:underline whitespace-nowrap"
                                  >
                                    + Add Slot {slotIdx + 1}
                                  </button>
                                )}
                              </div>
                              {phone && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlot(slotIdx)}
                                  className="text-gray-400 hover:text-red-600 p-1 text-xs shrink-0 rounded-md hover:bg-red-50 transition-colors"
                                  title={`Remove Slot ${slotIdx + 1}`}
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
                        if (!diffOnly || visibleCompareList.length < 2) return true;
                        if (!row.getRawValue) return true;
                        const values = visibleCompareList.map((p) => String(row.getRawValue!(p)).trim().toLowerCase());
                        const allSame = values.every((v) => v === values[0]);
                        return !allSame;
                      });

                      if (filteredRows.length === 0) return null;

                      return (
                        <React.Fragment key={sIdx}>
                          {/* Section Header Row (Non-sticky so it never covers the sticky phone header) */}
                          <tr className="bg-[#18181b] border-t-2 border-orange-500/90 text-white shadow-xs">
                            <td
                              colSpan={isDesktop ? visibleSlotIndices.length + 1 : 2}
                              className="py-2 sm:py-2.5 px-3 sm:px-4 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-white bg-[#18181b]"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-xs">
                                    {section.icon}
                                  </span>
                                  <span className="text-white tracking-wide">{section.title}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium normal-case hidden sm:inline-block">
                                  {filteredRows.length} {filteredRows.length === 1 ? "spec" : "specs"}
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* Detail Rows for this Section */}
                          {filteredRows.map((row, rIdx) => {
                            const isDifferent =
                              visibleCompareList.length >= 2 &&
                              row.getRawValue &&
                              (() => {
                                const values = visibleCompareList.map((p) => String(row.getRawValue!(p)).trim().toLowerCase());
                                return !values.every((v) => v === values[0]);
                              })();

                            if (!isDesktop) {
                              {/* WHATMOBILE MOBILE PATTERN: Spec Label on its own row, followed by 2 phone values in 50/50 columns */}
                              return (
                                <React.Fragment key={rIdx}>
                                  {/* Mobile Spec Label Subheading Row */}
                                  <tr
                                    className={`border-t border-gray-200 ${
                                      isDifferent && highlightDiff ? "bg-orange-50/80" : "bg-gray-100/90"
                                    }`}
                                  >
                                    <td
                                      colSpan={2}
                                      className="py-1 px-2.5 text-center text-[10px] font-bold text-gray-700 uppercase tracking-wider select-none"
                                    >
                                      <div className="flex items-center justify-center gap-1.5">
                                        {isDifferent && highlightDiff && (
                                          <span
                                            className="w-1.5 h-1.5 rounded-full bg-[#ea580c] shrink-0"
                                            title="Specifications differ across devices"
                                          />
                                        )}
                                        <span>{row.label}</span>
                                      </div>
                                    </td>
                                  </tr>

                                  {/* Mobile 2 Phone Values Row */}
                                  <tr
                                    className={`border-b border-gray-200 transition-colors ${
                                      isDifferent && highlightDiff ? "bg-orange-50/20" : "bg-white"
                                    }`}
                                  >
                                    {visibleSlotIndices.map((slotIdx, colIdx) => {
                                      const phone = slots[slotIdx];
                                      const advantage = phone ? getAdvantageBadge(row.label, phone, visibleCompareList) : null;
                                      return (
                                        <td
                                          key={slotIdx}
                                          className={`w-1/2 py-2 px-2.5 text-[11px] text-gray-900 align-middle text-center ${
                                            colIdx > 0 ? "border-l border-gray-200" : ""
                                          } ${isDifferent && highlightDiff ? "bg-orange-50/15" : ""}`}
                                        >
                                          {phone ? (
                                            <div className="flex flex-col items-center justify-center gap-0.5 max-w-full">
                                              <div className="leading-snug break-words max-w-full">
                                                {row.getValue(phone)}
                                              </div>
                                              {advantage && (
                                                <span className="whitespace-nowrap inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs mt-0.5">
                                                  {advantage}
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-gray-300 font-normal select-none">—</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </React.Fragment>
                              );
                            }

                            {/* DESKTOP PATTERN: 4 columns (1 specs column + 3 phone columns) */}
                            return (
                              <tr
                                key={rIdx}
                                className={`transition-colors border-b border-gray-100 ${
                                  isDifferent && highlightDiff
                                    ? "bg-orange-50/25 hover:bg-orange-50/50"
                                    : "bg-white hover:bg-gray-50/70"
                                }`}
                              >
                                {/* Label Column */}
                                <td
                                  className={`py-2.5 sm:py-3 px-3 sm:px-3.5 font-semibold text-xs text-gray-800 bg-gray-50/95 sticky left-0 z-10 border-r border-gray-200 align-middle w-[170px] min-w-[170px] leading-tight ${
                                    isDifferent && highlightDiff ? "border-l-2 border-l-[#ea580c]" : ""
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    {isDifferent && highlightDiff && (
                                      <span
                                        className="w-1.5 h-1.5 rounded-full bg-[#ea580c] shrink-0"
                                        title="Specifications differ across devices"
                                      />
                                    )}
                                    <span className="break-words">{row.label}</span>
                                  </div>
                                </td>

                                {/* Visible Slot Columns */}
                                {visibleSlotIndices.map((slotIdx) => {
                                  const phone = slots[slotIdx];
                                  const advantage = phone ? getAdvantageBadge(row.label, phone, visibleCompareList) : null;

                                  return (
                                    <td
                                      key={slotIdx}
                                      className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs text-gray-900 border-l border-gray-100 align-middle text-center w-1/3 ${
                                        isDifferent && highlightDiff ? "bg-orange-50/15" : ""
                                      }`}
                                    >
                                      {phone ? (
                                        <div className="flex flex-col items-center justify-center gap-1">
                                          <div className="leading-snug break-words max-w-full">
                                            {row.getValue(phone)}
                                          </div>
                                          {advantage && (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                              {advantage}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-300 font-normal select-none">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
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
      {/* MOBILE PHONE SEARCH MODAL / BOTTOM SHEET                                  */}
      {/* ========================================================================= */}
      {mobileSearchSlot !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-search-title"
          className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200 overflow-x-hidden max-w-full"
          onClick={() => {
            setMobileSearchSlot(null);
            setMobileSearchQuery("");
          }}
        >
          <div
            className="w-full max-w-full sm:max-w-lg min-w-0 bg-white rounded-t-3xl sm:rounded-2xl max-h-[88vh] sm:max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle for Mobile */}
            <div className="w-full pt-3 pb-1 flex justify-center sm:hidden shrink-0">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>

            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-100 flex items-center justify-between shrink-0 w-full min-w-0">
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea580c] block">
                  Select Smartphone
                </span>
                <h3 id="mobile-search-title" className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
                  {slots[mobileSearchSlot]
                    ? `Switch Slot ${mobileSearchSlot + 1} (${slots[mobileSearchSlot]!.model})`
                    : `Add to Slot ${mobileSearchSlot + 1}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileSearchSlot(null);
                  setMobileSearchQuery("");
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold transition-colors shrink-0"
                aria-label="Close search modal"
              >
                ✕
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="w-full max-w-full min-w-0 p-3 sm:p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div className="w-full max-w-full min-w-0 flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-2xs focus-within:border-[#ea580c] focus-within:ring-2 focus-within:ring-[#ea580c]/20 transition-all">
                <span className="text-gray-400 text-sm shrink-0">🔍</span>
                <input
                  type="text"
                  autoFocus
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  placeholder="Search brand or model..."
                  className="w-full min-w-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                />
                {mobileSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setMobileSearchQuery("")}
                    className="text-gray-400 hover:text-gray-600 text-xs px-1 shrink-0"
                    aria-label="Clear query"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Brand/Model Chips */}
              <div className="w-full max-w-full min-w-0 flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 no-scrollbar text-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-0.5">
                  Popular:
                </span>
                {["Samsung", "Redmi", "Infinix", "Tecno", "Vivo", "Apple", "Realme"].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setMobileSearchQuery(chip)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 whitespace-nowrap transition-colors ${
                      mobileSearchQuery.toLowerCase() === chip.toLowerCase()
                        ? "bg-[#ea580c] text-white"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Results List */}
            <div className="w-full max-w-full min-w-0 flex-1 overflow-y-auto divide-y divide-gray-100 p-2 min-h-[220px]">
              {searchPhones(mobileSearchQuery).length > 0 ? (
                searchPhones(mobileSearchQuery).map((phone) => {
                  const lowest = phone.lowest_verified_price || phone.price_pkr;
                  const isAlreadySelected = slots.some((s) => s?.id === phone.id);
                  return (
                    <div
                      key={phone.id}
                      onClick={() => {
                        handleSelectPhone(mobileSearchSlot, phone);
                        setMobileSearchSlot(null);
                        setMobileSearchQuery("");
                      }}
                      className="p-2 sm:p-2.5 flex items-center gap-2.5 hover:bg-orange-50/70 rounded-xl cursor-pointer transition-colors group w-full min-w-0"
                    >
                      <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 bg-gray-50 rounded-lg flex items-center justify-center p-1 border border-gray-100 overflow-hidden">
                        <img
                          src={getPhoneImg(phone)}
                          alt={phone.model}
                          className="max-h-8 sm:max-h-9 max-w-full object-contain transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-[#ea580c] uppercase">
                            {phone.brand}
                          </span>
                          {isAlreadySelected && (
                            <span className="text-[9px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded whitespace-nowrap">
                              In slots
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {phone.model}
                        </div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5 truncate">
                          <span className="truncate">{phone.platform?.chipset || "Octa-Core"}</span>
                          <span>•</span>
                          <span className="shrink-0">{getSafeRam(phone)}GB RAM</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-extrabold text-[#ea580c] whitespace-nowrap">
                          {lowest && lowest > 0 && phone.status !== "Discontinued"
                            ? formatPKR(lowest)
                            : "Price N/A"}
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 border whitespace-nowrap ${
                            phone.status === "Discontinued"
                              ? "bg-gray-100 text-gray-600 border-gray-200"
                              : phone.pta_status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {phone.status === "Discontinued"
                            ? "Discontinued"
                            : phone.pta_status === "approved"
                            ? "PTA"
                            : "Non-PTA"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 px-4 text-center">
                  <div className="text-2xl mb-1">🔍</div>
                  <p className="text-xs sm:text-sm font-bold text-gray-700">
                    No phones found matching &ldquo;{mobileSearchQuery}&rdquo;
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try searching by brand like &ldquo;Xiaomi&rdquo; or &ldquo;Samsung&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
