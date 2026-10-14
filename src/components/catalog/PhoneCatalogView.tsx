"use client";

import { useState, useMemo, useEffect, Suspense, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type Phone } from "@/types";
import { PhoneCard } from "@/components/home/PhoneCard";
import { getSupabaseImageUrl } from "@/lib/utils";
import { ScaleIcon } from "@/components/shared/ScaleIcon";
import { matchPhoneSearch } from "@/lib/search";
import {
  PRICE_RANGES,
  DEFAULT_MAX_PRICE,
  type PriceRangeId,
} from "@/lib/priceRanges";

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
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] py-12 text-center">
          <div className="container text-sm text-gray-500">Loading catalog...</div>
        </div>
      }
    >
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
  emptySubtitle = "Try widening your budget range or clearing specific filters like RAM or Brand.",
  defaultSort = "default",
}: PhoneCatalogViewProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  // Listen to header search events
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

  // Filter states matching homepage HomeClient
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(DEFAULT_MAX_PRICE);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRangeId | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [ram, setRam] = useState<string>("all");
  const [battery, setBattery] = useState<string>("all");
  const [charging, setCharging] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>(defaultSort);
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  const hasPriceFilter = minPrice > 0 || maxPrice < DEFAULT_MAX_PRICE;

  // Active filter count
  const activeFilterCount =
    (hasPriceFilter ? 1 : 0) +
    selectedBrands.size +
    (ram !== "all" ? 1 : 0) +
    (battery !== "all" ? 1 : 0) +
    (charging !== "all" ? 1 : 0);

  const resetAllFilters = () => {
    setMinPrice(0);
    setMaxPrice(DEFAULT_MAX_PRICE);
    setSelectedPriceRange(null);
    setSelectedBrands(new Set());
    setRam("all");
    setBattery("all");
    setCharging("all");
    setVisibleCount(24);
  };

  const applyPriceCeiling = (ceiling: number) => {
    setMinPrice(0);
    setMaxPrice(ceiling);
    setSelectedPriceRange(null);
    setVisibleCount(24);
  };

  const applyPriceRange = (id: PriceRangeId) => {
    const range = PRICE_RANGES.find((r) => r.id === id);
    if (!range) return;
    if (selectedPriceRange === id) {
      setMinPrice(0);
      setMaxPrice(DEFAULT_MAX_PRICE);
      setSelectedPriceRange(null);
    } else {
      setMinPrice(range.min);
      setMaxPrice(range.max);
      setSelectedPriceRange(id);
    }
    setVisibleCount(24);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
    setVisibleCount(24);
  };

  // Unique brand options sorted by popularity & count
  const allBrands = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of phones) {
      if (p.brand) {
        counts[p.brand] = (counts[p.brand] || 0) + 1;
      }
    }

    const brandList = Object.keys(counts);
    brandList.sort((a, b) => {
      const rankA = BRAND_POPULARITY_RANK[a] || 0;
      const rankB = BRAND_POPULARITY_RANK[b] || 0;
      if (rankB !== rankA) return rankB - rankA;
      return (counts[b] || 0) - (counts[a] || 0);
    });

    return brandList.map((brand) => ({ brand, count: counts[brand] }));
  }, [phones]);

  // Filtering & Sorting
  const filteredPhones = useMemo(() => {
    const result: { phone: Phone; score: number }[] = [];

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

      // Budget / price-range filter
      if (hasPriceFilter && !query.trim() && price === 0) continue;
      if (price > maxPrice) continue;
      if (minPrice > 0 && (price === 0 || price < minPrice)) continue;

      // Brand filter
      if (selectedBrands.size > 0 && !selectedBrands.has(phone.brand)) continue;

      // Specs filters
      if (ram !== "all" && (phone.memory?.ram_gb ?? 0) < parseInt(ram, 10)) continue;
      if (battery !== "all" && (phone.battery?.capacity_mah ?? 0) < parseInt(battery, 10)) continue;
      if (charging !== "all" && (phone.battery?.charging_watt ?? 0) < parseInt(charging, 10)) continue;

      result.push({ phone, score });
    }

    result.sort((a, b) => {
      if (query.trim() && Math.abs(b.score - a.score) >= 20) {
        return b.score - a.score;
      }

      const aPrice =
        (a.phone.lowest_verified_price && a.phone.lowest_verified_price > 0)
          ? a.phone.lowest_verified_price
          : (a.phone.price_pkr && a.phone.price_pkr > 0 ? a.phone.price_pkr : 0);
      const bPrice =
        (b.phone.lowest_verified_price && b.phone.lowest_verified_price > 0)
          ? b.phone.lowest_verified_price
          : (b.phone.price_pkr && b.phone.price_pkr > 0 ? b.phone.price_pkr : 0);

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

      if (sortBy === "popularity") {
        const aTrending = a.phone.is_trending || a.phone.popular ? 1 : 0;
        const bTrending = b.phone.is_trending || b.phone.popular ? 1 : 0;
        if (bTrending !== aTrending) return bTrending - aTrending;
        return bPrice - aPrice;
      }

      // Default keeps current source array ordering (e.g. trending rank)
      return 0;
    });

    return result.map((item) => item.phone);
  }, [phones, query, minPrice, maxPrice, hasPriceFilter, selectedBrands, ram, battery, charging, sortBy]);

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
    <div className="min-h-screen bg-[#f8f9fa] pb-24 w-full max-w-[100vw] overflow-x-clip">
      {/* ─── HEADER / HERO BANNER ─── */}
      {(title || badgeText) && (
        <section className="bg-white border-b border-[#e4e4e7] py-6 sm:py-8 mb-6">
          <div className="container">
            {badgeText && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#f47820] border border-orange-200/60 mb-2.5">
                {badgeIcon && <span>{badgeIcon}</span>}
                <span>{badgeText}</span>
              </div>
            )}
            {title && (
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#09090b] tracking-tight mb-2">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#71717a] max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ─── QUICK BUDGET PRESETS BAR ─── */}
      <section className="quick-nav-bar mb-6">
        <div className="container quick-nav-inner">
          <div className="quick-title">Quick Budget:</div>
          <div className="quick-pills">
            <button
              className={`quick-pill ${!hasPriceFilter ? "active" : ""}`}
              onClick={() => applyPriceCeiling(DEFAULT_MAX_PRICE)}
            >
              All Phones
            </button>
            <button
              className={`quick-pill ${!selectedPriceRange && maxPrice === 30000 ? "active" : ""}`}
              onClick={() => applyPriceCeiling(30000)}
            >
              Under 30k
            </button>
            <button
              className={`quick-pill ${!selectedPriceRange && maxPrice === 60000 ? "active" : ""}`}
              onClick={() => applyPriceCeiling(60000)}
            >
              Under 60k
            </button>
            <button
              className={`quick-pill ${!selectedPriceRange && maxPrice === 120000 ? "active" : ""}`}
              onClick={() => applyPriceCeiling(120000)}
            >
              Under 120k
            </button>
          </div>
        </div>
      </section>

      {/* ─── MAIN 2-COLUMN CATALOG LAYOUT ─── */}
      <main className="container main-content min-w-0 max-w-full" id="phones-section">
        <div className="app-layout min-w-0 max-w-full">
          {/* MOBILE FILTER TOGGLE BAR (Visible on <1024px screens) */}
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
                  onClick={resetAllFilters}
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
          <aside
            className={`filters-sidebar ${isMobileFiltersOpen ? "mobile-open" : "mobile-collapsed"}`}
          >
            <div className="filters-header">
              <h3>Filters & Range</h3>
              <button className="btn-link" onClick={resetAllFilters}>
                Reset All
              </button>
            </div>

            {/* Budget Range Slider */}
            <div className="filter-group">
              <label className="filter-label">
                <span>Budget (PKR)</span>
                <span className="filter-val-badge">
                  {selectedPriceRange && minPrice > 0
                    ? `Rs. ${minPrice.toLocaleString()} – ${maxPrice.toLocaleString()}`
                    : `Max: Rs. ${maxPrice.toLocaleString()}`}
                </span>
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  className="budget-slider"
                  min="2000"
                  max="600000"
                  step="1000"
                  value={maxPrice}
                  style={
                    {
                      "--slider-progress": `${((maxPrice - 2000) / (600000 - 2000)) * 100}%`,
                    } as CSSProperties
                  }
                  onChange={(e) => {
                    setMinPrice(0);
                    setSelectedPriceRange(null);
                    setMaxPrice(Number(e.target.value));
                    setVisibleCount(24);
                  }}
                  aria-label="Maximum budget in PKR"
                />
                <div className="slider-ticks">
                  <span>Rs. 2k</span>
                  <span>Rs. 600k</span>
                </div>
              </div>
            </div>

            {/* Brand Checkboxes */}
            <div className="filter-group">
              <label className="filter-label">
                <span>Brand</span>
                {selectedBrands.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedBrands(new Set())}
                    className="border-0 bg-transparent p-0 text-[11px] text-[#f47820] hover:underline font-semibold cursor-pointer appearance-none"
                  >
                    Clear ({selectedBrands.size})
                  </button>
                )}
              </label>
              <div className="brand-checkbox-list">
                {allBrands.map(({ brand, count }) => (
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
                    <span className="text-[11px] text-gray-400 font-normal ml-auto">
                      ({count})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Search By Prices — discrete bands */}
            <div className="filter-group">
              <label className="filter-label">
                <span>Search By Prices</span>
                {selectedPriceRange && (
                  <button
                    type="button"
                    onClick={() => applyPriceCeiling(DEFAULT_MAX_PRICE)}
                    className="border-0 bg-transparent p-0 text-[11px] text-[#f47820] hover:underline font-semibold cursor-pointer appearance-none"
                  >
                    Clear
                  </button>
                )}
              </label>
              <div className="price-range-list">
                {PRICE_RANGES.map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    className={`price-range-btn ${selectedPriceRange === range.id ? "active" : ""}`}
                    onClick={() => applyPriceRange(range.id)}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* RAM (GB) */}
            <div className="filter-group">
              <label className="filter-label">RAM (GB)</label>
              <div className="spec-pills">
                <button
                  className={`spec-pill ${ram === "all" ? "active" : ""}`}
                  onClick={() => {
                    setRam("all");
                    setVisibleCount(24);
                  }}
                >
                  Any
                </button>
                <button
                  className={`spec-pill ${ram === "4" ? "active" : ""}`}
                  onClick={() => {
                    setRam("4");
                    setVisibleCount(24);
                  }}
                >
                  4GB
                </button>
                <button
                  className={`spec-pill ${ram === "8" ? "active" : ""}`}
                  onClick={() => {
                    setRam("8");
                    setVisibleCount(24);
                  }}
                >
                  8GB
                </button>
                <button
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
                  className={`spec-pill ${battery === "all" ? "active" : ""}`}
                  onClick={() => {
                    setBattery("all");
                    setVisibleCount(24);
                  }}
                >
                  Any
                </button>
                <button
                  className={`spec-pill ${battery === "4000" ? "active" : ""}`}
                  onClick={() => {
                    setBattery("4000");
                    setVisibleCount(24);
                  }}
                >
                  4,000+
                </button>
                <button
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
                  className={`spec-pill ${charging === "all" ? "active" : ""}`}
                  onClick={() => {
                    setCharging("all");
                    setVisibleCount(24);
                  }}
                >
                  Any
                </button>
                <button
                  className={`spec-pill ${charging === "33" ? "active" : ""}`}
                  onClick={() => {
                    setCharging("33");
                    setVisibleCount(24);
                  }}
                >
                  33W+
                </button>
                <button
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
          <section className="products-section min-w-0 max-w-full" id="products-section">
            {/* Quick Brand Carousel Pills */}
            <div className="catalog-brand-scroll">
              <button
                type="button"
                onClick={() => {
                  setSelectedBrands(new Set());
                  setVisibleCount(24);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedBrands.size === 0
                    ? "bg-black text-white shadow-xs"
                    : "bg-white border border-[#e4e4e7] text-gray-700 hover:bg-gray-100"
                }`}
              >
                All Brands ({phones.length})
              </button>
              {allBrands.slice(0, 10).map(({ brand, count }) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedBrands.has(brand)
                      ? "bg-black text-white shadow-xs"
                      : "bg-white border border-[#e4e4e7] text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {brand} ({count})
                </button>
              ))}
            </div>

            {/* Results Info Counter & Sort Controls */}
            <div className="products-toolbar">
              <div className="toolbar-info">
                <span className="text-xs text-[#71717a] font-medium">
                  Showing <strong className="text-[#18181b]">{visiblePhones.length}</strong> of{" "}
                  <strong className="text-[#18181b]">{filteredPhones.length}</strong> smartphones
                </span>
                {query.trim() && (
                  <span className="toolbar-result-pill">
                    {filteredPhones.length} found for &ldquo;{query}&rdquo;
                  </span>
                )}
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="text-xs text-[#f47820] hover:underline font-semibold ml-2"
                  >
                    Clear filters ✕
                  </button>
                )}
              </div>

              <div className="toolbar-sort">
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
                  <option value="default">Rank / Featured</option>
                  <option value="popularity">Popularity</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="brand">Brand (A-Z)</option>
                </select>
              </div>
            </div>

            {/* ─── PHONE CARDS GALLERY GRID ─── */}
            {visiblePhones.length > 0 ? (
              <>
                <div className="phones-grid grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 w-full min-w-0">
                  {visiblePhones.map((phone) => (
                    <PhoneCard
                      key={phone.id}
                      phone={phone}
                      isCompared={compareList.includes(phone.id)}
                      toggleCompare={toggleCompare}
                    />
                  ))}
                </div>

                {/* Load More Pagination */}
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
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>{emptyTitle}</h3>
                <p>{emptySubtitle}</p>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={resetAllFilters}
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
                href={`/compare?phones=${comparePhones.map((p) => p.slug).join(",")}&from=/trending`}
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
