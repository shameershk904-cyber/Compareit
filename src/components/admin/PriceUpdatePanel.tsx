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
    <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline space-y-space-md">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-sm">
        <div>
          <span className="text-label-sm font-label-sm uppercase tracking-wider text-deal-orange font-bold">
            Catalog Operations
          </span>
          <h3 className="text-headline-sm font-headline-sm text-on-surface tracking-tight">
            Manual Device Price Update
          </h3>
          <p className="text-body-sm font-body-sm text-outline mt-1 max-w-2xl">
            Search any phone and update its list price or lowest verified market price. Changes go live on the public site immediately.
          </p>
        </div>
        <Link
          href="/admin/phones"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md font-label-md text-on-surface-variant hover:text-on-surface border border-border-hairline bg-surface-subtle transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">smartphone</span>
          Full Catalog
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Search column */}
        <div className="lg:col-span-5 space-y-3">
          <label className="block text-label-sm font-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">
            Search Device
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline pointer-events-none">
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
              placeholder="e.g. iPhone 16, Galaxy S25, Redmi Note…"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border-hairline bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-deal-orange focus:ring-1 focus:ring-deal-orange/40"
              autoComplete="off"
            />
            {(query || selected) && (
              <button
                type="button"
                onClick={clearSelection}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {isSearching && (
            <p className="text-xs text-outline flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              Searching catalog…
            </p>
          )}

          {results.length > 0 && (
            <ul className="border border-border-hairline rounded-xl overflow-hidden divide-y divide-border-hairline max-h-80 overflow-y-auto bg-surface-container-lowest shadow-sm">
              {results.map((phone) => (
                <li key={phone.id}>
                  <button
                    type="button"
                    onClick={() => selectPhone(phone)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-subtle transition-colors"
                  >
                    <div className="w-11 h-11 rounded-lg bg-surface-subtle border border-border-hairline flex items-center justify-center overflow-hidden shrink-0">
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
                        <span className="material-symbols-outlined text-outline text-[20px]">smartphone</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-deal-orange uppercase tracking-wider truncate">
                        {phone.brand}
                      </div>
                      <div className="text-sm font-semibold text-on-surface truncate">{phone.model}</div>
                      <div className="text-[11px] text-outline truncate">
                        List {formatPKR(phone.pricePkr)} · Lowest {formatPKR(phone.lowestVerifiedPrice)}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[18px] shrink-0">chevron_right</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!isSearching && query.trim().length >= 2 && results.length === 0 && !selected && (
            <p className="text-xs text-outline px-1">No devices matched “{query.trim()}”.</p>
          )}
        </div>

        {/* Editor column */}
        <div className="lg:col-span-7">
          {!selected ? (
            <div className="h-full min-h-[220px] rounded-xl border border-dashed border-border-hairline bg-surface-subtle/60 flex flex-col items-center justify-center text-center px-6 py-10">
              <div className="w-12 h-12 rounded-full bg-deal-orange/10 text-deal-orange flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">sell</span>
              </div>
              <p className="text-sm font-semibold text-on-surface">Select a device to edit prices</p>
              <p className="text-xs text-outline mt-1 max-w-sm">
                Type a brand or model name on the left, then pick a result to update list price and lowest verified price in PKR.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border-hairline bg-surface-subtle/40 p-4 sm:p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-xl bg-white border border-border-hairline flex items-center justify-center overflow-hidden shrink-0">
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
                    <span className="material-symbols-outlined text-outline text-[28px]">smartphone</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-deal-orange uppercase tracking-wider">{selected.brand}</div>
                  <h4 className="text-base font-bold text-on-surface truncate">{selected.model}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selected.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {selected.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="text-[10px] font-medium text-outline">{selected.status}</span>
                    <Link
                      href={`/phone/${selected.slug}`}
                      target="_blank"
                      className="text-[10px] font-semibold text-deal-orange hover:underline inline-flex items-center gap-0.5"
                    >
                      View public page
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    List Price (PKR)
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-border-hairline bg-white px-3 py-2 focus-within:border-deal-orange focus-within:ring-1 focus-within:ring-deal-orange/40">
                    <span className="text-xs font-bold text-outline shrink-0">Rs.</span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={pricePkr}
                      onChange={(e) => setPricePkr(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-on-surface outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-outline mt-1">Official / listed market price</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Lowest Verified (PKR)
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-border-hairline bg-white px-3 py-2 focus-within:border-deal-orange focus-within:ring-1 focus-within:ring-deal-orange/40">
                    <span className="text-xs font-bold text-outline shrink-0">Rs.</span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={lowestPrice}
                      onChange={(e) => setLowestPrice(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-on-surface outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-outline mt-1">Best price shown on product cards</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-deal-orange hover:bg-deal-orange/90 text-white text-sm font-semibold shadow-sm disabled:opacity-60 transition-colors"
                >
                  {isSaving ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      Saving…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      Save Price Update
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border-hairline bg-white text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
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
          className={`rounded-xl px-4 py-3 text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}
    </section>
  );
}
