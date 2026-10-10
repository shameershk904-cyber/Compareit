"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { type Phone } from "@/types";
import { PhoneCard } from "@/components/home/PhoneCard";
import { getSupabaseImageUrl } from "@/lib/utils";
import { ScaleIcon } from "@/components/shared/ScaleIcon";
import { matchPhoneSearch } from "@/lib/search";

const BRAND_POPULARITY_RANK: Record<string, number> = {
  Samsung: 100,
  Apple: 98,
  Xiaomi: 95,
  Infinix: 92,
  Tecno: 90,
  Vivo: 88,
  Oppo: 86,
  Realme: 84,
  OnePlus: 80,
  Google: 78,
  Honor: 76,
  Motorola: 74,
  Huawei: 72,
  Nothing: 70,
  Itel: 68,
  Sparx: 66,
  Dcode: 64,
  QMobile: 62,
  Nokia: 60,
  ZTE: 58,
  Sony: 56,
  Asus: 54,
};

interface PhoneCatalogViewProps {
  phones: Phone[];
  badgeText?: string;
  badgeIcon?: string;
  title?: string;
  subtitle?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  defaultSort?: string;
}

export function PhoneCatalogView(props: PhoneCatalogViewProps) {
  return (
    <Suspense fallback={<div className="container py-8 text-center text-sm text-[#71717a]">Loading smartphones...</div>}>
      <PhoneCatalogViewInner {...props} />
    </Suspense>
  );
}

function PhoneCatalogViewInner({
  phones,
  badgeText,
  badgeIcon,
  title,
  subtitle,
  emptyTitle = "No smartphones match your exact filters",
  emptySubtitle = "Try widening your budget range or clearing specific filters like brand or RAM.",
  defaultSort = "popularity",
}: PhoneCatalogViewProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  // Sync with global header search events & query param
  useEffect(() => {
    const handlePhoneSearch = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setQuery(customEvent.detail ?? "");
    };
    window.addEventListener("phone-search", handlePhoneSearch);
    return () => {
      window.removeEventListener("phone-search", handlePhoneSearch);
    };
  }, []);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const timer = setTimeout(() => setQuery(q), 0);
    return () => clearTimeout(timer);
  }, [searchParams]);

  // Filter & Control States
  const [maxPrice, setMaxPrice] = useState<number>(600000);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [ram, setRam] = useState<string>("all");
  const [battery, setBattery] = useState<string>("all");
  const [charging, setCharging] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>(defaultSort === "default" ? "popularity" : defaultSort);
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  // Active filter count for badge indicator
  const activeFilterCount =
    (maxPrice < 600000 ? 1 : 0) +
    selectedBrands.size +
    (ram !== "all" ? 1 : 0) +
    (battery !== "all" ? 1 : 0) +
    (charging !== "all" ? 1 : 0);

  const resetAll = () => {
    setMaxPrice(600000);
    setSelectedBrands(new Set());
    setRam("all");
    setBattery("all");
    setCharging("all");
    setVisibleCount(24);
  };

  // Unique brand options with counts and weighted ranking
  const brandOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    phones.forEach((p) => {
      if (p.brand) {
        counts[p.brand] = (counts[p.brand] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => {
        const rankA = BRAND_POPULARITY_RANK[a[0]] || 0;
        const rankB = BRAND_POPULARITY_RANK[b[0]] || 0;
        if (rankB !== rankA) return rankB - rankA;
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      })
      .map(([brand, count]) => ({ brand, count }));
  }, [phones]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
    setVisibleCount(24);
  };

  const selectOnlyBrand = (brand: string) => {
    if (brand === "all") {
      setSelectedBrands(new Set());
    } else {
      if (selectedBrands.size === 1 && selectedBrands.has(brand)) {
        setSelectedBrands(new Set());
      } else {
        setSelectedBrands(new Set([brand]));
      }
    }
    setVisibleCount(24);
  };

  // Filter & Sort calculation
  const filteredPhones = useMemo(() => {
    const matched: { phone: Phone; score: number }[] = [];

    for (const phone of phones) {
      let score = 0;
      if (query.trim()) {
        const matchResult = matchPhoneSearch(phone, query);
        if (!matchResult.matches) continue;
        score = matchResult.score;
      }

      const price =
        phone.lowest_verified_price && phone.lowest_verified_price > 0
          ? phone.lowest_verified_price
          : phone.price_pkr && phone.price_pkr > 0
          ? phone.price_pkr
          : 0;

      // If budget filter is active and no explicit search, exclude discontinued unpriced models
      if (maxPrice < 500000 && !query.trim() && price === 0) continue;
      if (price > maxPrice) continue;
      if (selectedBrands.size > 0 && !selectedBrands.has(phone.brand)) continue;
      if (ram !== "all" && (phone.memory?.ram_gb ?? 0) < parseInt(ram, 10)) continue;
      if (battery !== "all" && (phone.battery?.capacity_mah ?? 0) < parseInt(battery, 10)) continue;
      if (charging !== "all" && (phone.battery?.charging_watt ?? 0) < parseInt(charging, 10)) continue;

      matched.push({ phone, score });
    }

    return matched
      .sort((a, b) => {
        // Query relevance priority
        if (query.trim() && Math.abs(b.score - a.score) >= 20) {
          return b.score - a.score;
        }

        const aPrice =
          a.phone.lowest_verified_price && a.phone.lowest_verified_price > 0
            ? a.phone.lowest_verified_price
            : a.phone.price_pkr && a.phone.price_pkr > 0
            ? a.phone.price_pkr
            : 0;
        const bPrice =
          b.phone.lowest_verified_price && b.phone.lowest_verified_price > 0
            ? b.phone.lowest_verified_price
            : b.phone.price_pkr && b.phone.price_pkr > 0
            ? b.phone.price_pkr
            : 0;

        if (sortBy === "price-asc") {
          if (aPrice === 0 && bPrice > 0) return 1;
          if (bPrice === 0 && aPrice > 0) return -1;
          if (aPrice === 0 && bPrice === 0) return 0;
          return aPrice - bPrice;
        }
        if (sortBy === "price-desc") {
          if (aPrice === 0 && bPrice > 0) return 1;
          if (bPrice === 0 && aPrice > 0) return -1;
          if (aPrice === 0 && bPrice === 0) return 0;
          return bPrice - aPrice;
        }
        if (sortBy === "brand") {
          return `${a.phone.brand} ${a.phone.model}`.localeCompare(`${b.phone.brand} ${b.phone.model}`);
        }

        // Popularity / Default sort
        if (query.trim() && b.score !== a.score) {
          return b.score - a.score;
        }

        const aTrending = a.phone.is_trending || a.phone.popular ? 1 : 0;
        const bTrending = b.phone.is_trending || b.phone.popular ? 1 : 0;
        if (bTrending !== aTrending) return bTrending - aTrending;

        const aHasPrice = aPrice > 0 ? 1 : 0;
        const bHasPrice = bPrice > 0 ? 1 : 0;
        if (aHasPrice !== bHasPrice) return bHasPrice - aHasPrice;

        return bPrice - aPrice;
      })
      .map((item) => item.phone);
  }, [phones, query, maxPrice, selectedBrands, ram, battery, charging, sortBy]);

  const visiblePhones = useMemo(() => {
    return filteredPhones.slice(0, visibleCount);
  }, [filteredPhones, visibleCount]);

  const toggleCompare = (id: string) => {
    setCompareList((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        alert("You can compare a maximum of 3 smartphones at a time.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const comparePhones = useMemo(() => {
    return compareList
      .map((id) => phones.find((p) => p.id === id))
      .filter((p): p is Phone => !!p);
  }, [compareList, phones]);

  return (
    <div id="catalog-view" className="view-container pb-24">
      {/* ─── HEADER BANNER (Title / Badge / Description) ─── */}
      <div className="container pt-4 pb-2 sm:pt-6 sm:pb-3">
        {badgeText && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200">
              {badgeIcon && <span>{badgeIcon}</span>}
              <span>{badgeText}</span>
            </span>
          </div>
        )}
        {title && (
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181b] tracking-tight">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#71717a] mt-1 max-w-2xl font-normal leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* ─── QUICK PRESETS BUDGET BAR (Identical to Homepage) ─── */}
      <section className="quick-nav-bar my-3">
        <div className="container quick-nav-inner">
          <div className="quick-title">Quick Budget:</div>
          <div className="quick-pills">
            <button
              type="button"
              className={`quick-pill ${maxPrice === 600000 ? "active" : ""}`}
              onClick={() => {
                setMaxPrice(600000);
                setVisibleCount(24);
              }}
            >
              All Phones
            </button>
            <button
              type="button"
              className={`quick-pill ${maxPrice === 30000 ? "active" : ""}`}
              onClick={() => {
                setMaxPrice(30000);
                setVisibleCount(24);
              }}
            >
              Under 30k
            </button>
            <button
              type="button"
              className={`quick-pill ${maxPrice === 60000 ? "active" : ""}`}
              onClick={() => {
                setMaxPrice(60000);
                setVisibleCount(24);
              }}
            >
              Under 60k
            </button>
            <button
              type="button"
              className={`quick-pill ${maxPrice === 120000 ? "active" : ""}`}
              onClick={() => {
                setMaxPrice(120000);
                setVisibleCount(24);
              }}
            >
              Under 120k
            </button>
          </div>
        </div>
      </section>

      {/* ─── MAIN 2-COLUMN CATALOG WITH SIDEBAR FILTERS ─── */}
      <main className="container main-content" id="phones-section">
        <div className="app-layout">
          {/* MOBILE FILTER TOGGLE BAR (<1024px screens) */}
          <div className="mobile-filters-bar">
            <div className="mobile-filters-meta">
              <span aria-hidden="true">⚡</span>
              <span className="mobile-filters-label">Filters</span>
              {activeFilterCount > 0 && (
                <span className="mobile-filters-count">{activeFilterCount}</span>
              )}
            </div>
            <div className="mobile-filters-actions">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetAll}
                  className="mobile-filters-reset"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                className="mobile-filters-toggle"
                aria-expanded={isMobileFiltersOpen}
              >
                {isMobileFiltersOpen ? "Hide ▲" : "Filter ▼"}
              </button>
            </div>
          </div>

          {/* LEFT SIDEBAR: FILTERS */}
          <aside className={`filters-sidebar ${isMobileFiltersOpen ? "mobile-open" : "mobile-collapsed"}`}>
            <div className="filters-header">
              <h3>Filters & Range</h3>
              <button type="button" className="btn-link" onClick={resetAll}>
                Reset All
              </button>
            </div>

            {/* Budget Slider */}
            <div className="filter-group">
              <label className="filter-label">
                <span>Budget (PKR)</span>
                <span className="filter-val-badge">Max: Rs. {maxPrice.toLocaleString()}</span>
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  min="2000"
                  max="600000"
                  step="1000"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(Number(e.target.value));
                    setVisibleCount(24);
                  }}
                />
              </div>
            </div>

            {/* Brand Multi-select Checkboxes */}
            <div className="filter-group">
              <label className="filter-label">Brand</label>
              <div className="brand-checkbox-list">
                {brandOptions.map(({ brand, count }) => (
                  <label
                    key={brand}
                    className={`brand-check-item ${selectedBrands.has(brand) ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.has(brand)}
                      onChange={() => toggleBrand(brand)}
                    />
                    <span>{brand}</span>
                    <span className="text-xs text-[#a1a1aa] ml-auto font-normal">({count})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* RAM Filter */}
            <div className="filter-group">
              <label className="filter-label">RAM (GB)</label>
              <div className="spec-pills">
                <button
                  type="button"
                  className={`spec-pill ${ram === "all" ? "active" : ""}`}
                  onClick={() => {
                    setRam("all");
                    setVisibleCount(24);
                  }}
                >
                  Any
                </button>
                <button
                  type="button"
                  className={`spec-pill ${ram === "4" ? "active" : ""}`}
                  onClick={() => {
                    setRam("4");
                    setVisibleCount(24);
                  }}
                >
                  4GB
                </button>
                <button
                  type="button"
                  className={`spec-pill ${ram === "8" ? "active" : ""}`}
                  onClick={() => {
                    setRam("8");
                    setVisibleCount(24);
                  }}
                >
                  8GB
                </button>
                <button
                  type="button"
                  className={`spec-pill ${ram === "12" ? "active" : ""}`}
                  onClick={() => {
                    setRam("12");
                    setVisibleCount(24);
                  }}
                >
                  12GB+
                </button>
              </div>
            </div>

            {/* Battery Capacity */}
            <div className="filter-group">
              <label className="filter-label">Battery Capacity</label>
              <div className="spec-pills">
                <button
                  type="button"
                  className={`spec-pill ${battery === "all" ? "active" : ""}`}
                  onClick={() => {
                    setBattery("all");
                    setVisibleCount(24);
                  }}
                >
                  Any
                </button>
                <button
                  type="button"
                  className={`spec-pill ${battery === "4000" ? "active" : ""}`}
                  onClick={() => {
                    setBattery("4000");
                    setVisibleCount(24);
                  }}
                >
                  4,000+
                </button>
                <button
                  type="button"
                  className={`spec-pill ${battery === "5000" ? "active" : ""}`}
                  onClick={() => {
                    setBattery("5000");
                    setVisibleCount(24);
                  }}
                >
                  5,000+
                </button>
              </div>
            </div>

            {/* Fast Charging Speed */}
            <div className="filter-group">
              <label className="filter-label">Fast Charging Speed</label>
              <div className="spec-pills">
                <button
                  type="button"
                  className={`spec-pill ${charging === "all" ? "active" : ""}`}
                  onClick={() => {
                    setCharging("all");
                    setVisibleCount(24);
                  }}
                >
                  Any
                </button>
                <button
                  type="button"
                  className={`spec-pill ${charging === "33" ? "active" : ""}`}
                  onClick={() => {
                    setCharging("33");
                    setVisibleCount(24);
                  }}
                >
                  33W+
                </button>
                <button
                  type="button"
                  className={`spec-pill ${charging === "65" ? "active" : ""}`}
                  onClick={() => {
                    setCharging("65");
                    setVisibleCount(24);
                  }}
                >
                  65W+
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT PRODUCTS SECTION */}
          <section className="products-section" id="products-section">
            {/* Quick Brand Pills Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 no-scrollbar touch-pan-x">
              <button
                type="button"
                onClick={() => selectOnlyBrand("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedBrands.size === 0
                    ? "bg-black text-white shadow-xs"
                    : "bg-white border border-[#e4e4e7] text-gray-700 hover:bg-gray-100"
                }`}
              >
                All ({phones.length})
              </button>
              {brandOptions.map(({ brand, count }) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => selectOnlyBrand(brand)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedBrands.size === 1 && selectedBrands.has(brand)
                      ? "bg-black text-white shadow-xs"
                      : "bg-white border border-[#e4e4e7] text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {brand} ({count})
                </button>
              ))}
            </div>

            {/* Products Toolbar */}
            <div className="products-toolbar">
              <div className="toolbar-info">
                <span className="text-xs text-[#71717a] font-medium">
                  Showing <strong className="text-[#18181b]">{visiblePhones.length}</strong> of{" "}
                  <strong className="text-[#18181b]">{filteredPhones.length}</strong> smartphones
                </span>
                {query.trim() && (
                  <span className="toolbar-result-pill ml-2">
                    {filteredPhones.length} found for &ldquo;{query}&rdquo;
                  </span>
                )}
              </div>

              <div className="toolbar-sort flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetAll}
                    className="text-xs text-orange-600 hover:text-orange-700 font-semibold mr-1"
                  >
                    Clear filters ✕
                  </button>
                )}
                <span>Sort by</span>
                <select
                  id="sort-dropdown"
                  className="sort-dropdown"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setVisibleCount(24);
                  }}
                >
                  <option value="popularity">Rank / Popularity</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="brand">Brand (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Phones Grid */}
            {visiblePhones.length > 0 ? (
              <>
                <div className="phones-grid">
                  {visiblePhones.map((phone) => (
                    <PhoneCard
                      key={phone.id}
                      phone={phone}
                      isCompared={compareList.includes(phone.id)}
                      toggleCompare={toggleCompare}
                    />
                  ))}
                </div>

                {/* Pagination / Load More */}
                {filteredPhones.length > visibleCount && (
                  <div className="pagination-container mt-10">
                    <div className="pagination-info">
                      Showing {visibleCount} of {filteredPhones.length} Smartphones
                    </div>
                    <button
                      type="button"
                      className="primary-btn load-more-btn"
                      onClick={() => setVisibleCount((prev) => prev + 24)}
                    >
                      Load More Phones ⬇
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state bg-white border border-[#e4e4e7] rounded-2xl p-12 text-center my-8">
                <div className="empty-icon text-3xl mb-3">🔍</div>
                <h3 className="text-base font-bold text-[#18181b]">{emptyTitle}</h3>
                <p className="text-xs sm:text-sm text-[#71717a] max-w-md mx-auto mt-1 mb-4">
                  {emptySubtitle}
                </p>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={resetAll}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ─── BOTTOM COMPARISON DOCK ─── */}
      {compareList.length > 0 && (
        <div id="compare-dock" className="compare-dock">
          <div className="container compare-dock-inner">
            <div className="dock-info">
              <span className="dock-title">
                <ScaleIcon size={18} color="#f47820" className="mr-1.5" /> Compare Smartphones
              </span>
              <span className="dock-hint">
                Selected <strong id="dock-count">{compareList.length}</strong> of 3
              </span>
            </div>
            <div className="dock-slots" id="dock-slots-container">
              {comparePhones.map((p) => (
                <div className="dock-slot-item" key={p.id}>
                  <Image
                    src={getSupabaseImageUrl(p.image || (p.images && p.images[0]) || "")}
                    alt={p.model}
                    width={50}
                    height={50}
                    unoptimized
                  />
                  <span>{p.model}</span>
                  <span
                    className="dock-remove-item cursor-pointer"
                    onClick={() => toggleCompare(p.id)}
                    title="Remove device"
                  >
                    ✕
                  </span>
                </div>
              ))}
            </div>
            <div className="dock-actions">
              <button
                id="clear-dock-btn"
                className="btn-ghost"
                onClick={() => setCompareList([])}
              >
                Clear
              </button>
              <Link
                href={`/compare?phones=${comparePhones.map((p) => p.slug).join(",")}&from=${encodeURIComponent(pathname || "/trending")}`}
                id="trigger-compare-modal-btn"
                className="primary-btn flex items-center gap-1.5"
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Compare Specifications <ScaleIcon size={16} color="#ffffff" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
