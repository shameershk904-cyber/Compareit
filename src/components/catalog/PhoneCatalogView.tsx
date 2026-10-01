"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { type Phone } from "@/types";
import { PhoneCard } from "@/components/home/PhoneCard";
import { getSupabaseImageUrl, formatPKR } from "@/lib/utils";

interface PhoneCatalogViewProps {
  phones: Phone[];
  badgeText: string;
  badgeIcon: string;
  title: string;
  subtitle: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  defaultSort?: string;
}

export function PhoneCatalogView({
  phones,
  badgeText,
  badgeIcon,
  title,
  subtitle,
  emptyTitle = "No smartphones found",
  emptySubtitle = "Try selecting a different brand or clearing your search term.",
  defaultSort = "default",
}: PhoneCatalogViewProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>(defaultSort);
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const [compareList, setCompareList] = useState<string[]>([]);

  // Calculate unique brands present with counts
  const brandOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    phones.forEach((p) => {
      if (p.brand) {
        counts[p.brand] = (counts[p.brand] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([brand, count]) => ({ brand, count }));
  }, [phones]);

  // Filter & sort
  const filteredPhones = useMemo(() => {
    let result = [...phones];

    if (selectedBrand !== "all") {
      result = result.filter(
        (p) => p.brand.toLowerCase() === selectedBrand.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.model.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => {
        const pA = a.lowest_verified_price || a.price_pkr || 999999999;
        const pB = b.lowest_verified_price || b.price_pkr || 999999999;
        return pA - pB;
      });
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => {
        const pA = a.lowest_verified_price || a.price_pkr || 0;
        const pB = b.lowest_verified_price || b.price_pkr || 0;
        return pB - pA;
      });
    } else if (sortBy === "brand") {
      result.sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
    }

    return result;
  }, [phones, selectedBrand, searchQuery, sortBy]);

  const visiblePhones = useMemo(() => {
    return filteredPhones.slice(0, visibleCount);
  }, [filteredPhones, visibleCount]);

  const toggleCompare = (id: string) => {
    setCompareList((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const comparePhones = useMemo(() => {
    return compareList
      .map((id) => phones.find((p) => p.id === id))
      .filter((p): p is Phone => !!p);
  }, [compareList, phones]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* ─── HERO HEADER SECTION ─── */}
      <div className="bg-white border-b border-[#e4e4e7] pt-8 pb-7">
        <div className="container">
          <div className="max-w-3xl">
            {/* Category Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/60 mb-3">
              <span>{badgeIcon}</span>
              <span>{badgeText}</span>
              <span className="w-1 h-1 rounded-full bg-orange-400 mx-1" />
              <span>{phones.length} Models Tracked</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181b] tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-[#71717a] mt-2 leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* ─── CONTROLS & FILTER BAR ─── */}
      <div className="container mt-6">
        <div className="bg-white rounded-2xl border border-[#e4e4e7] p-4 sm:p-5 shadow-xs mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Quick Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Filter by device name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(24);
                }}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Brand Filter & Sort Dropdown */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#71717a] font-medium hidden sm:inline">Brand:</span>
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    setVisibleCount(24);
                  }}
                  className="px-3 py-2 text-xs sm:text-sm bg-white border border-[#d4d4d8] rounded-xl text-[#18181b] focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="all">All Brands ({phones.length})</option>
                  {brandOptions.map(({ brand, count }) => (
                    <option key={brand} value={brand}>
                      {brand} ({count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#71717a] font-medium hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm bg-white border border-[#d4d4d8] rounded-xl text-[#18181b] focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="default">Rank / Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="brand">Brand (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Brand Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3.5 mt-3.5 border-t border-gray-100 no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setSelectedBrand("all");
                setVisibleCount(24);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedBrand === "all"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({phones.length})
            </button>
            {brandOptions.slice(0, 8).map(({ brand, count }) => (
              <button
                key={brand}
                type="button"
                onClick={() => {
                  setSelectedBrand(brand);
                  setVisibleCount(24);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedBrand.toLowerCase() === brand.toLowerCase()
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {brand} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Results Info Counter */}
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-xs text-[#71717a] font-medium">
            Showing <strong className="text-[#18181b]">{visiblePhones.length}</strong> of{" "}
            <strong className="text-[#18181b]">{filteredPhones.length}</strong> smartphones
          </span>
          {(selectedBrand !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedBrand("all");
                setSearchQuery("");
                setVisibleCount(24);
              }}
              className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
            >
              Clear filters ✕
            </button>
          )}
        </div>

        {/* ─── PHONE CARDS GALLERY GRID ─── */}
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
          <div className="empty-state bg-white border border-[#e4e4e7] rounded-2xl p-12 text-center my-8">
            <div className="empty-icon text-3xl mb-3">🔍</div>
            <h3 className="text-base font-bold text-[#18181b]">{emptyTitle}</h3>
            <p className="text-xs sm:text-sm text-[#71717a] max-w-md mx-auto mt-1 mb-4">
              {emptySubtitle}
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                setSelectedBrand("all");
                setSearchQuery("");
                setVisibleCount(24);
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ─── BOTTOM COMPARISON DOCK ─── */}
      {compareList.length > 0 && (
        <div id="compare-dock" className="compare-dock">
          <div className="container compare-dock-inner">
            <div className="dock-info">
              <span className="dock-title">⚖️ Compare Smartphones</span>
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
                className="primary-btn"
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Compare Specifications ⚖️
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
