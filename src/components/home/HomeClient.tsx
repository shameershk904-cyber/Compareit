"use client";

import { useState, useEffect, useMemo, Suspense, type CSSProperties } from "react";
import Link from "next/link";
import { type Phone } from "@/types";
import { PhoneCard } from "./PhoneCard";
import { getSupabaseImageUrl } from "@/lib/utils";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AdvisorResults } from "./AdvisorResults";
import { matchPhoneSearch } from "@/lib/search";
import { ScaleIcon } from "@/components/shared/ScaleIcon";
import { Banner } from "@/components/shared/Banner";
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

interface HomeClientProps {
  initialPhones: Phone[];
}

export function HomeClient({ initialPhones }: HomeClientProps) {
  return (
    <Suspense fallback={<div className="view-container">Loading...</div>}>
      <HomeClientInner initialPhones={initialPhones} />
    </Suspense>
  );
}

function HomeClientInner({ initialPhones }: HomeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

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

  useEffect(() => {
    const scrollParam = searchParams.get("scroll");
    if (scrollParam === "phones") {
      const timer = setTimeout(() => {
        const target = document.getElementById("products-section") || document.getElementById("phones-section") || document.querySelector(".products-section");
        if (target) {
          const headerOffset = 85;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: "smooth"
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(DEFAULT_MAX_PRICE);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRangeId | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [compareList, setCompareList] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(24);
  const [ram, setRam] = useState("all");
  const [battery, setBattery] = useState("all");
  const [charging, setCharging] = useState("all");
  const [sortBy, setSortBy] = useState("popularity");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const hasPriceFilter = minPrice > 0 || maxPrice < DEFAULT_MAX_PRICE;

  const activeFilterCount = (hasPriceFilter ? 1 : 0) +
    selectedBrands.size +
    (ram !== "all" ? 1 : 0) +
    (battery !== "all" ? 1 : 0) +
    (charging !== "all" ? 1 : 0);

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

  const [advisorMinBudget, setAdvisorMinBudget] = useState(35000);
  const [advisorMaxBudget, setAdvisorMaxBudget] = useState(75000);
  const [advisorPriority, setAdvisorPriority] = useState("balanced");
  const [advisorCollapsed, setAdvisorCollapsed] = useState(false);
  const [advisorResults, setAdvisorResults] = useState<{
    winner: Phone;
    rivals: Phone[];
    rationale: string;
    minBudget: number;
    maxBudget: number;
    budgetLabel: string;
  } | null>(null);

  // Minimize Smart Recommendation Advisor by default on mobile screens
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      if (window.location.hash !== "#advisor-section" && window.location.hash !== "#smart-advisor-section") {
        setAdvisorCollapsed(true);
      }
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#advisor-section" || window.location.hash === "#smart-advisor-section") {
        setAdvisorCollapsed(false);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const runSmartAdvisor = () => {
    let candidates = initialPhones.filter(p => {
      // Must have a confirmed price — never include Price N/A phones in budget searches
      const price = (p.lowest_verified_price && p.lowest_verified_price > 0)
        ? p.lowest_verified_price
        : (p.price_pkr && p.price_pkr > 0 ? p.price_pkr : 0);
      if (price === 0) return false; // Exclude unknown-price phones entirely
      return price >= advisorMinBudget * 0.9 && price <= advisorMaxBudget * 1.1;
    });

    if (candidates.length === 0) {
      candidates = initialPhones.slice(0, 4);
    }

    const scored = candidates.map(p => {
      let score = 0;
      // Use match to extract refresh rate from type string if possible, default to 60
      const refreshMatch = p.display?.type?.match(/(\d+)Hz/);
      const refreshRate = refreshMatch ? parseInt(refreshMatch[1], 10) : 60;

      if (advisorPriority === 'gaming') {
        score = ((p.platform?.antutu_score ?? 300000) / 10000) + ((p.memory?.ram_gb ?? 8) * 8) + refreshRate;
      } else if (advisorPriority === 'camera') {
        score = ((p.camera?.main_mp ?? 50) * 1.5) + ((p.camera?.setup?.includes('OIS') ? 80 : 0)) + ((p.camera?.selfie_mp ?? 16) * 1.2);
      } else if (advisorPriority === 'battery') {
        score = ((p.battery?.capacity_mah ?? 5000) / 50) + ((p.battery?.charging_watt ?? 33) * 2) + (p.battery?.wireless_charging ? 30 : 0);
      } else {
        score = (((p.platform?.antutu_score ?? 300000) / 20000) +
                ((p.camera?.main_mp ?? 50) * 0.8) +
                ((p.battery?.charging_watt ?? 33) * 0.8) +
                (p.pta_status === 'approved' ? 50 : 0) +
                ((p.memory?.ram_gb ?? 8) * 5));
      }
      return { phone: p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const winner = scored[0].phone;
    const rivals = scored.slice(1).map(s => s.phone);

    let rationale = "";
    if (advisorPriority === 'gaming') {
      rationale = `Delivers the highest benchmark score (~${(winner.platform?.antutu_score ?? 300000).toLocaleString()} AnTuTu) with ${winner.platform?.chipset?.split('(')[0] ?? 'a fast chipset'} for butter-smooth 60fps/90fps PUBG and thermal stability.`;
    } else if (advisorPriority === 'camera') {
      rationale = `Dominates mobile photography in this bracket with its ${winner.camera?.main_mp ?? 50}MP sensor${winner.camera?.setup?.includes('OIS') ? ' and Optical Image Stabilization (OIS)' : ''}, producing crisp portraits and night shots.`;
    } else if (advisorPriority === 'battery') {
      rationale = `Equipped with ${winner.battery?.capacity_mah ?? 5000} mAh battery and blistering ${winner.battery?.charging_watt ?? 33}W fast charging, ensuring minimal downtime during Pakistani load-shedding.`;
    } else {
      const budgetText = advisorMinBudget === 0
        ? `under Rs. 35,000`
        : advisorMaxBudget >= 600000
        ? `in the Rs. 130,000 to 600,000+ range`
        : `in the Rs. ${advisorMinBudget.toLocaleString('en-PK')} to ${advisorMaxBudget.toLocaleString('en-PK')} range`;
      rationale = `The most complete all-rounder in Pakistan ${budgetText}. Combines solid performance, ${winner.pta_status === 'approved' ? 'official PTA approval' : 'high specs'}, and reliable local warranty.`;
    }

    const budgetLabel = advisorMinBudget === 0
      ? "Under Rs. 35,000"
      : advisorMaxBudget >= 600000
      ? "Rs. 130,000 to 600,000+"
      : `Rs. ${advisorMinBudget.toLocaleString('en-PK')} to ${advisorMaxBudget.toLocaleString('en-PK')}`;

    setAdvisorResults({
      winner,
      rivals,
      rationale,
      minBudget: advisorMinBudget,
      maxBudget: advisorMaxBudget,
      budgetLabel
    });
    
    setTimeout(() => {
      document.getElementById('advisor-results-box')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const compareTwo = (id1: string, id2: string) => {
    const slugs = [id1, id2]
      .map((id) => initialPhones.find((p) => p.id === id)?.slug)
      .filter((slug): slug is string => Boolean(slug));

    if (slugs.length >= 2) {
      router.push(`/compare?phones=${slugs.join(",")}&from=/`);
    }
  };

  const toggleCompare = (id: string) => {
    setCompareList(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      } else {
        if (prev.length >= 3) {
          alert('You can compare a maximum of 3 smartphones at a time.');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  };

  const matchedPhonesWithScore: { phone: Phone; score: number }[] = [];

  for (const phone of initialPhones) {
    let score = 0;
    if (query.trim()) {
      const matchResult = matchPhoneSearch(phone, query);
      if (!matchResult.matches) continue;
      score = matchResult.score;
    }

    const price = (phone.lowest_verified_price && phone.lowest_verified_price > 0)
      ? phone.lowest_verified_price
      : (phone.price_pkr && phone.price_pkr > 0 ? phone.price_pkr : 0);

    // If user filtered by budget / price range and hasn't searched, exclude unpriced phones
    if (hasPriceFilter && !query.trim() && price === 0) continue;
    if (price > maxPrice) continue;
    if (minPrice > 0 && (price === 0 || price < minPrice)) continue;
    if (selectedBrands.size > 0 && !selectedBrands.has(phone.brand)) continue;
    if (ram !== "all" && phone.memory.ram_gb < parseInt(ram, 10)) continue;
    if (battery !== "all" && phone.battery.capacity_mah < parseInt(battery, 10)) continue;
    if (charging !== "all" && phone.battery.charging_watt < parseInt(charging, 10)) continue;

    matchedPhonesWithScore.push({ phone, score });
  }

  const sortedPhones = [...matchedPhonesWithScore].sort((a, b) => {
    // When a search query is active and relevance score difference is significant, prioritize higher score
    if (query.trim() && Math.abs(b.score - a.score) >= 20) {
      return b.score - a.score;
    }

    const aPrice = (a.phone.lowest_verified_price && a.phone.lowest_verified_price > 0)
      ? a.phone.lowest_verified_price
      : (a.phone.price_pkr && a.phone.price_pkr > 0 ? a.phone.price_pkr : 0);
    const bPrice = (b.phone.lowest_verified_price && b.phone.lowest_verified_price > 0)
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

    // Popularity sort
    if (query.trim() && b.score !== a.score) {
      return b.score - a.score;
    }

    const aTrending = a.phone.is_trending || a.phone.popular ? 1 : 0;
    const bTrending = b.phone.is_trending || b.phone.popular ? 1 : 0;
    if (bTrending !== aTrending) return bTrending - aTrending;

    // Devices with active verified prices should appear ahead of discontinued unpriced models
    const aHasPrice = aPrice > 0 ? 1 : 0;
    const bHasPrice = bPrice > 0 ? 1 : 0;
    if (aHasPrice !== bHasPrice) return bHasPrice - aHasPrice;

    return bPrice - aPrice;
  }).map(item => item.phone);

  const filteredPhones = sortedPhones;

  const visiblePhones = sortedPhones.slice(0, visibleCount);
  
  const allBrands = useMemo(() => {
    const brandStats = new Map<string, number>();
    for (const phone of initialPhones) {
      const current = brandStats.get(phone.brand) || 0;
      const weight = phone.popular || phone.is_trending ? 3 : 1;
      brandStats.set(phone.brand, current + weight);
    }

    const brands = Array.from(brandStats.keys());
    brands.sort((a, b) => {
      const rankA = BRAND_POPULARITY_RANK[a] || 0;
      const rankB = BRAND_POPULARITY_RANK[b] || 0;
      if (rankB !== rankA) return rankB - rankA;

      const countA = brandStats.get(a) || 0;
      const countB = brandStats.get(b) || 0;
      if (countB !== countA) return countB - countA;

      return a.localeCompare(b);
    });

    return brands;
  }, [initialPhones]);

  const comparePhones = compareList.map(id => initialPhones.find(p => p.id === id)).filter(Boolean) as Phone[];

  return (
    <div id="catalog-view" className="w-full max-w-[100vw] overflow-x-clip">
      {/* SMART RECOMMENDATION ADVISOR WIDGET */}
      <section id="smart-advisor-section" className="advisor-section">
        <div className="container advisor-layout-grid">
          <div className="advisor-card-compact">
            {/* Compact Header Bar */}
            <div className="advisor-top-bar">
              <div className="advisor-headline">
                <span className="advisor-badge-pill" onClick={runSmartAdvisor} title="Click to run AI Match">
                  <span className="ai-pill-icon">⚡</span> AI Match
                </span>
                <h2 className="advisor-title-compact">Find Your Ideal Phone</h2>
                <span className="advisor-desc-inline">Select budget & focus to discover Pakistan&apos;s verified best value buy.</span>
              </div>
              <div className="advisor-top-actions">
                <span className={`step-tag ${!advisorCollapsed ? 'hidden' : ''}`} id="selected-budget-tag">
                  {advisorMinBudget === 0 ? 'Under 35k' : advisorMinBudget === 35000 ? '35k - 75k' : advisorMinBudget === 75000 ? '75k - 130k' : '130k+'} PKR
                </span>
                <span className={`step-tag ${!advisorCollapsed ? 'hidden' : ''}`} id="selected-priority-tag">
                  {advisorPriority === 'balanced' ? 'Best All-Rounder' : advisorPriority === 'camera' ? 'Camera & Video' : advisorPriority === 'gaming' ? 'Gaming 90fps' : 'Battery & Fast Charge'}
                </span>
                <button 
                  id="toggle-advisor-btn" 
                  className="advisor-toggle-btn" 
                  type="button" 
                  title="Minimize / Expand Finder"
                  onClick={() => setAdvisorCollapsed(!advisorCollapsed)}
                >
                  <span id="toggle-advisor-text">{advisorCollapsed ? 'Expand' : 'Minimize'}</span>
                  <span id="toggle-advisor-icon">{advisorCollapsed ? '↓' : '↑'}</span>
                </button>
              </div>
            </div>

            {/* Compact Segmented Pill Form */}
            <div id="advisor-form-container" className={`advisor-form-compact ${advisorCollapsed ? 'collapsed' : ''}`}>
              {/* Row 1: Budget Pills */}
              <div className="adv-compact-row">
                <span className="adv-row-label">Budget:</span>
                <div className="advisor-pill-group" id="advisor-budget-cards">
                  <button type="button" className={`adv-card-tile ${advisorMinBudget === 0 ? 'active' : ''}`} onClick={() => { setAdvisorMinBudget(0); setAdvisorMaxBudget(35000); }}>
                    <span className="adv-tile-icon">💰</span>
                    <span className="adv-tile-name">Under 35k</span>
                  </button>
                  <button type="button" className={`adv-card-tile ${advisorMinBudget === 35000 ? 'active' : ''}`} onClick={() => { setAdvisorMinBudget(35000); setAdvisorMaxBudget(75000); }}>
                    <span className="adv-tile-icon">🔥</span>
                    <span className="adv-tile-name">35k - 75k</span>
                    <span className="adv-tile-badge-inline">Sweet Spot</span>
                  </button>
                  <button type="button" className={`adv-card-tile ${advisorMinBudget === 75000 ? 'active' : ''}`} onClick={() => { setAdvisorMinBudget(75000); setAdvisorMaxBudget(130000); }}>
                    <span className="adv-tile-icon">💼</span>
                    <span className="adv-tile-name">75k - 130k</span>
                  </button>
                  <button type="button" className={`adv-card-tile ${advisorMinBudget === 130000 ? 'active' : ''}`} onClick={() => { setAdvisorMinBudget(130000); setAdvisorMaxBudget(600000); }}>
                    <span className="adv-tile-icon">🚀</span>
                    <span className="adv-tile-name">130k+ Flagship</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Priority Pills */}
              <div className="adv-compact-row">
                <span className="adv-row-label">Focus:</span>
                <div className="advisor-pill-group" id="advisor-priority-cards">
                  <button type="button" className={`adv-card-tile ${advisorPriority === 'balanced' ? 'active' : ''}`} onClick={() => setAdvisorPriority('balanced')}>
                    <span className="adv-tile-icon"><ScaleIcon size={22} color="#f47820" /></span>
                    <span className="adv-tile-name">All-Rounder</span>
                  </button>
                  <button type="button" className={`adv-card-tile ${advisorPriority === 'camera' ? 'active' : ''}`} onClick={() => setAdvisorPriority('camera')}>
                    <span className="adv-tile-icon">📸</span>
                    <span className="adv-tile-name">Camera & Video</span>
                  </button>
                  <button type="button" className={`adv-card-tile ${advisorPriority === 'gaming' ? 'active' : ''}`} onClick={() => setAdvisorPriority('gaming')}>
                    <span className="adv-tile-icon">🎮</span>
                    <span className="adv-tile-name">Gaming 90fps</span>
                  </button>
                  <button type="button" className={`adv-card-tile ${advisorPriority === 'battery' ? 'active' : ''}`} onClick={() => setAdvisorPriority('battery')}>
                    <span className="adv-tile-icon">🔋</span>
                    <span className="adv-tile-name">Battery & Fast Charge</span>
                  </button>
                </div>
              </div>

              {/* Row 3: Action Strip */}
              <div className="advisor-action-strip">
                <div className="advisor-summary-badge">
                  <span className="summary-icon">✨</span>
                  <span id="advisor-summary-text">Ready to Compare: <strong>{advisorMinBudget === 0 ? 'Under 35k' : advisorMinBudget === 35000 ? '35k - 75k' : advisorMinBudget === 75000 ? '75k - 130k' : '130k+'} PKR</strong> • <strong>{advisorPriority === 'balanced' ? 'Best All-Rounder' : advisorPriority === 'camera' ? 'Camera & Content' : advisorPriority === 'gaming' ? 'Gaming & PUBG 90fps' : 'Battery & Fast Charge'}</strong></span>
                </div>
                <button id="run-advisor-btn" className="advisor-cta-btn" type="button" onClick={runSmartAdvisor}>
                  <span>Find My Best Phone & Rivals</span>
                  <span className="cta-arrow">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE BANNER — managed via Admin → Banner Manager (SIDEBAR placement) */}
          <div className="advisor-banner-ad">
            <div className="banner-placeholder">
              <Banner
                placement="SIDEBAR"
                className="banner-image"
                fallbackSrc={getSupabaseImageUrl("banner.jpg")}
                fallbackAlt="Advertisement Banner"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Advisor Results Box */}
      {advisorResults && (
        <section className="container" style={{ marginTop: '1rem' }}>
          <AdvisorResults 
            winner={advisorResults.winner} 
            rivals={advisorResults.rivals} 
            rationale={advisorResults.rationale} 
            minBudget={advisorResults.minBudget}
            maxBudget={advisorResults.maxBudget} 
            budgetLabel={advisorResults.budgetLabel}
            onClose={() => setAdvisorResults(null)} 
            onToggleCompare={toggleCompare} 
            onCompareTwo={compareTwo} 
          />
        </section>
      )}

      {/* QUICK PRESETS BAR */}
      <section className="quick-nav-bar">
        <div className="container quick-nav-inner">
          <div className="quick-title">Quick Budget:</div>
          <div className="quick-pills">
            <button className={`quick-pill ${!hasPriceFilter ? 'active' : ''}`} onClick={() => applyPriceCeiling(DEFAULT_MAX_PRICE)}>All Phones</button>
            <button className={`quick-pill ${!selectedPriceRange && maxPrice === 30000 ? 'active' : ''}`} onClick={() => applyPriceCeiling(30000)}>Under 30k</button>
            <button className={`quick-pill ${!selectedPriceRange && maxPrice === 60000 ? 'active' : ''}`} onClick={() => applyPriceCeiling(60000)}>Under 60k</button>
            <button className={`quick-pill ${!selectedPriceRange && maxPrice === 120000 ? 'active' : ''}`} onClick={() => applyPriceCeiling(120000)}>Under 120k</button>
          </div>
        </div>
      </section>

      {/* MAIN 2-COLUMN CATALOG */}
      <main className="container main-content" id="phones-section">
        <div className="app-layout">
          
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
          <aside className={`filters-sidebar ${isMobileFiltersOpen ? 'mobile-open' : 'mobile-collapsed'}`}>
            <div className="filters-header">
              <h3>Filters & Range</h3>
              <button className="btn-link" onClick={resetAllFilters}>Reset All</button>
            </div>

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
                  }}
                  aria-label="Maximum budget in PKR"
                />
                <div className="slider-ticks">
                  <span>Rs. 2k</span>
                  <span>Rs. 600k</span>
                </div>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Brand</label>
              <div className="brand-checkbox-list">
                {allBrands.map(brand => (
                  <label key={brand} className={`brand-check-item ${selectedBrands.has(brand) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={selectedBrands.has(brand)} onChange={() => toggleBrand(brand)} />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>

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

            <div className="filter-group">
              <label className="filter-label">RAM (GB)</label>
              <div className="spec-pills">
                <button className={`spec-pill ${ram === 'all' ? 'active' : ''}`} onClick={() => setRam('all')}>Any</button>
                <button className={`spec-pill ${ram === '4' ? 'active' : ''}`} onClick={() => setRam('4')}>4GB</button>
                <button className={`spec-pill ${ram === '8' ? 'active' : ''}`} onClick={() => setRam('8')}>8GB</button>
                <button className={`spec-pill ${ram === '12' ? 'active' : ''}`} onClick={() => setRam('12')}>12GB+</button>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Battery Capacity</label>
              <div className="spec-pills">
                <button className={`spec-pill ${battery === 'all' ? 'active' : ''}`} onClick={() => setBattery('all')}>Any</button>
                <button className={`spec-pill ${battery === '4000' ? 'active' : ''}`} onClick={() => setBattery('4000')}>4,000+</button>
                <button className={`spec-pill ${battery === '5000' ? 'active' : ''}`} onClick={() => setBattery('5000')}>5,000+</button>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Fast Charging Speed</label>
              <div className="spec-pills">
                <button className={`spec-pill ${charging === 'all' ? 'active' : ''}`} onClick={() => setCharging('all')}>Any</button>
                <button className={`spec-pill ${charging === '33' ? 'active' : ''}`} onClick={() => setCharging('33')}>33W+</button>
                <button className={`spec-pill ${charging === '65' ? 'active' : ''}`} onClick={() => setCharging('65')}>65W+</button>
              </div>
            </div>
          </aside>

          {/* RIGHT PRODUCTS SECTION */}
          <section className="products-section" id="products-section">
            <div className="products-toolbar">
              <div className="toolbar-info">
                <h2>Tracking Smartphones Across Pakistan</h2>
                {query.trim() && (
                  <span className="toolbar-result-pill">
                    {filteredPhones.length} {filteredPhones.length === 1 ? 'phone' : 'phones'} found for &ldquo;{query}&rdquo;
                  </span>
                )}
              </div>
              <div className="toolbar-sort">
                <span>Sort by</span>
                <select
                  id="sort-dropdown"
                  className="sort-dropdown"
                  value={sortBy}
                  onChange={e => { setSortBy(e.target.value); setVisibleCount(24); }}
                >
                  <option value="popularity">Popularity</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                </select>
              </div>
            </div>

            <div className="phones-grid grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 w-full min-w-0">
              {visiblePhones.map(phone => (
                <PhoneCard 
                  key={phone.id} 
                  phone={phone} 
                  isCompared={compareList.includes(phone.id)} 
                  toggleCompare={toggleCompare} 
                />
              ))}
            </div>

            {filteredPhones.length > visibleCount && (
              <div className="pagination-container">
                <div className="pagination-info">Showing {visibleCount} of {filteredPhones.length} Smartphones</div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="primary-btn load-more-btn" onClick={() => setVisibleCount(v => v + 24)}>Load More Phones ⬇</button>
                </div>
              </div>
            )}

            {filteredPhones.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No smartphones match your exact filters</h3>
                <p>Try widening your budget range or clearing specific filters like RAM or PTA status.</p>
                <button className="primary-btn" onClick={resetAllFilters}>Reset All Filters</button>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* BOTTOM COMPARISON DOCK */}
      {compareList.length > 0 && (
        <div id="compare-dock" className="compare-dock">
          <div className="container compare-dock-inner">
            <div className="dock-info">
              <span className="dock-title">
                <ScaleIcon size={18} color="#f47820" className="mr-1.5" /> Compare Smartphones
              </span>
              <span className="dock-hint">Selected <strong id="dock-count">{compareList.length}</strong> of 3</span>
            </div>
            <div className="dock-slots" id="dock-slots-container">
              {comparePhones.map(p => (
                <div className="dock-slot-item" key={p.id}>
                  <Image src={getSupabaseImageUrl(p.image || (p.images && p.images[0]) || '')} alt={p.model} width={50} height={50} unoptimized />
                  <span>{p.model}</span>
                  <span className="dock-remove-item" onClick={() => toggleCompare(p.id)}>✕</span>
                </div>
              ))}
            </div>
            <div className="dock-actions">
              <button id="clear-dock-btn" className="btn-ghost" onClick={() => setCompareList([])}>Clear</button>
              <Link
                href={`/compare?phones=${comparePhones.map((p) => p.slug).join(",")}&from=/`}
                id="trigger-compare-modal-btn"
                className="primary-btn dock-compare-cta"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              >
                <span className="dock-cta-full flex items-center gap-1.5">
                  Compare Specifications <ScaleIcon size={16} color="#ffffff" />
                </span>
                <span className="dock-cta-short flex items-center gap-1.5">
                  Compare <ScaleIcon size={16} color="#ffffff" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
