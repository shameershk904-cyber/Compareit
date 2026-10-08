"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  searchPhonesForPriceAction,
  updatePhonePriceAction,
} from "@/app/(admin)/admin/phones/actions";
import { formatPKR, getSupabaseImageUrl } from "@/lib/utils";

type PricePhone = {
  id: string;
  slug: string;
  brand: string;
  model: string;
  image: string;
  pricePkr: number;
  lowestVerifiedPrice: number;
  status: string;
  isActive: boolean;
  updatedAt: string;
};

export function PriceUpdatePanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PricePhone[]>([]);
  const [selected, setSelected] = useState<PricePhone | null>(null);
  const [pricePkr, setPricePkr] = useState("");
  const [lowestPrice, setLowestPrice] = useState("");
  const [isSearching, startSearch] = useTransition();
  const [isSaving, startSave] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        const res = await searchPhonesForPriceAction(trimmed);
        if (res.success) {
          setResults(res.phones as PricePhone[]);
        } else {
          setResults([]);
          setMessage({ type: "error", text: res.error || "Search failed" });
        }
      });
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const selectPhone = (phone: PricePhone) => {
    setSelected(phone);
    setPricePkr(String(phone.pricePkr || 0));
    setLowestPrice(String(phone.lowestVerifiedPrice || 0));
    setQuery(`${phone.brand} ${phone.model}`);
    setResults([]);
    setMessage(null);
  };

  const clearSelection = () => {
    setSelected(null);
    setQuery("");
    setPricePkr("");
    setLowestPrice("");
    setResults([]);
    setMessage(null);
  };

  const handleSave = () => {
    if (!selected) return;

    const nextPrice = Math.max(0, Math.round(Number(pricePkr) || 0));
    const nextLowest = Math.max(0, Math.round(Number(lowestPrice) || 0));

    startSave(async () => {
      const res = await updatePhonePriceAction({
        phoneId: selected.id,
        pricePkr: nextPrice,
        lowestVerifiedPrice: nextLowest,
      });

      if (!res.success || !res.phone) {
        setMessage({ type: "error", text: res.error || "Failed to save price" });
        return;
      }

      const updated = res.phone as PricePhone;
      setSelected(updated);
      setPricePkr(String(updated.pricePkr || 0));
      setLowestPrice(String(updated.lowestVerifiedPrice || 0));
      setMessage({
        type: "success",
        text: `Updated ${updated.brand} ${updated.model} — List ${formatPKR(updated.pricePkr)}, Lowest ${formatPKR(updated.lowestVerifiedPrice)}`,
      });
    });
  };

  return (
    <section className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-600"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Live Catalog Operations
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-950 tracking-tight">
            Manual Device Price Adjuster
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl leading-relaxed">
            Search any smartphone in Pakistan&apos;s catalog to instantly update list price or lowest verified street price. Changes propagate live immediately.
          </p>
        </div>
        <Link
          href="/admin/phones"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-950 border border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 transition-colors shrink-0 shadow-sm"
        >
          <span className="material-symbols-outlined text-[17px]">smartphone</span>
          Full Catalog Management
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Search column */}
        <div className="lg:col-span-5 space-y-3">
          <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            Search Device
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] text-zinc-400 pointer-events-none">
              search
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selected) setSelected(null);
                setMessage(null);
              }}
              placeholder="e.g. iPhone 16 Pro, Galaxy S25, Redmi Note 13…"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-zinc-900 text-sm focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
              autoComplete="off"
            />
            {(query || selected) && (
              <button
                type="button"
                onClick={clearSelection}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {isSearching && (
            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] animate-spin text-orange-600">progress_activity</span>
              Searching database catalog…
            </p>
          )}

          {results.length > 0 && (
            <ul className="border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-100 max-h-80 overflow-y-auto bg-white shadow-lg">
              {results.map((phone) => (
                <li key={phone.id}>
                  <button
                    type="button"
                    onClick={() => selectPhone(phone)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-zinc-50 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-lg bg-zinc-100 border border-zinc-200/60 flex items-center justify-center overflow-hidden shrink-0">
                      {phone.image ? (
                        <Image
                          src={getSupabaseImageUrl(phone.image)}
                          alt={phone.model}
                          width={44}
                          height={44}
                          className="object-contain max-h-10"
                          unoptimized
                        />
                      ) : (
                        <span className="material-symbols-outlined text-zinc-400 text-[20px]">smartphone</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider truncate">
                        {phone.brand}
                      </div>
                      <div className="text-sm font-semibold text-zinc-900 truncate">{phone.model}</div>
                      <div className="text-xs text-zinc-500 font-mono truncate">
                        List {formatPKR(phone.pricePkr)} · Lowest {formatPKR(phone.lowestVerifiedPrice)}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-zinc-300 text-[18px] shrink-0">chevron_right</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!isSearching && query.trim().length >= 2 && results.length === 0 && !selected && (
            <p className="text-xs text-zinc-500 px-1">No devices matched “{query.trim()}”.</p>
          )}
        </div>

        {/* Editor column */}
        <div className="lg:col-span-7">
          {!selected ? (
            <div className="h-full min-h-[220px] rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 flex flex-col items-center justify-center text-center px-6 py-10">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3 shadow-sm">
                <span className="material-symbols-outlined text-[24px]">sell</span>
              </div>
              <p className="text-sm font-semibold text-zinc-900">Select a device to edit prices</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm leading-relaxed">
                Type a brand or model name in the search box, pick a result, and adjust official list price or street lowest price in PKR.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {selected.image ? (
                    <Image
                      src={getSupabaseImageUrl(selected.image)}
                      alt={selected.model}
                      width={64}
                      height={64}
                      className="object-contain max-h-14"
                      unoptimized
                    />
                  ) : (
                    <span className="material-symbols-outlined text-zinc-400 text-[28px]">smartphone</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">{selected.brand}</div>
                  <h4 className="text-base font-bold text-zinc-950 truncate">{selected.model}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selected.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-zinc-100 text-zinc-600 border-zinc-200"
                    }`}>
                      {selected.isActive ? "Active in Catalog" : "Inactive"}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-500">{selected.status}</span>
                    <Link
                      href={`/phone/${selected.slug}`}
                      target="_blank"
                      className="text-[10px] font-semibold text-orange-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      View Live Page
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Official List Price (PKR)
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 transition-all shadow-sm">
                    <span className="text-xs font-bold text-zinc-400 shrink-0">Rs.</span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={pricePkr}
                      onChange={(e) => setPricePkr(e.target.value)}
                      className="w-full bg-transparent text-sm font-bold text-zinc-900 outline-none font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Manufacturer MSRP or distributor price</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Lowest Verified Price (PKR)
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 transition-all shadow-sm">
                    <span className="text-xs font-bold text-zinc-400 shrink-0">Rs.</span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={lowestPrice}
                      onChange={(e) => setLowestPrice(e.target.value)}
                      className="w-full bg-transparent text-sm font-bold text-zinc-900 outline-none font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Best deal displayed on cards across site</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm disabled:opacity-60 transition-all cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <span className="material-symbols-outlined text-[17px] animate-spin">progress_activity</span>
                      Saving to Database…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[17px]">save</span>
                      Update Prices
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-xs font-semibold border flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {message.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{message.text}</span>
        </div>
      )}
    </section>
  );
}
