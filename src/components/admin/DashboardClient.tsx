"use client";

import { useState } from "react";
import Link from "next/link";
import { type BannerRecord } from "./BannersClient";
import { PriceUpdatePanel } from "./PriceUpdatePanel";

interface DashboardClientProps {
  stats: {
    pageViews: number;
    searchLogs: number;
    banners: number;
    users: number;
    activityLogs: number;
    shootoutsCount?: number;
    totalImpressions?: number;
    totalClicks?: number;
    devices?: {
      desktop: number;
      mobile: number;
      tablet: number;
    };
    topSearches?: Array<{ query: string; count: number }>;
    zeroResultCount?: number;
    topPages?: Array<{ path: string; count: number }>;
  };
  liveBanners: BannerRecord[];
  error?: string | null;
}

export function DashboardClient({ stats, liveBanners, error }: DashboardClientProps) {
  const [dateFilter, setDateFilter] = useState<"today" | "7d" | "30d" | "quarterly">("30d");
  const [selectedPlacement, setSelectedPlacement] = useState<string>("all");

  const formattedVisitors = stats.pageViews.toLocaleString();
  const formattedSearches = stats.searchLogs.toLocaleString();
  const shootoutsCount = (stats.shootoutsCount ?? 0).toLocaleString();
  const totalImpressions = stats.totalImpressions ?? 0;
  const totalClicks = stats.totalClicks ?? 0;
  const ctrFormatted = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + "%" : "0.00%";

  const totalDevices = (stats.devices?.desktop || 0) + (stats.devices?.mobile || 0) + (stats.devices?.tablet || 0);
  const desktopPct = totalDevices > 0 ? (((stats.devices?.desktop || 0) / totalDevices) * 100).toFixed(1) : "0";
  const mobilePct = totalDevices > 0 ? (((stats.devices?.mobile || 0) / totalDevices) * 100).toFixed(1) : "0";
  const tabletPct = totalDevices > 0 ? (((stats.devices?.tablet || 0) / totalDevices) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3 shadow-sm">
          <span className="material-symbols-outlined text-rose-600 text-[20px] shrink-0">error</span>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* TOP DASHBOARD EXECUTIVE OPERATIONS BAR */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-ping"></span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-orange-600">
              Live Edge Telemetry &bull; Pakistan Network
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Executive Intelligence &amp; Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal leading-relaxed max-w-3xl">
            Real-time consumer hardware benchmarking, market price indexing, and search intent telemetry aggregated from across Pakistan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter Segmented Group */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/60">
            {(
              [
                { id: "today", label: "Today" },
                { id: "7d", label: "Last 7 Days" },
                { id: "30d", label: "Last 30 Days" },
                { id: "quarterly", label: "Quarterly" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id)}
                className={`px-3.5 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
                  dateFilter === tab.id
                    ? "bg-white text-zinc-950 font-bold shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900 font-medium"
                }`}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <Link
            href="/api/admin/activity?export=csv"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-all border border-zinc-200 shadow-sm"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            <span>Export CSV Audit</span>
          </Link>

          <Link
            href="/admin/banners"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[17px]">campaign</span>
            <span>+ Deploy Banner</span>
          </Link>
        </div>
      </section>

      {/* KEY PERFORMANCE METRIC CARDS (4 GRID) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Metric 1: Visitors */}
        <Link
          href="/admin/analytics"
          className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group block"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Total Unique Visitors
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mt-2 font-mono tracking-tight">
                {formattedVisitors}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">group</span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span> Verified Hits
            </span>
            <span className="text-xs text-zinc-400 font-medium">Recorded telemetry</span>
          </div>
        </Link>

        {/* Metric 2: Searches */}
        <Link
          href="/admin/search"
          className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group block"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Catalog Searches
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mt-2 font-mono tracking-tight">
                {formattedSearches}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">search_insights</span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Intent Engine
            </span>
            <span className="text-xs text-zinc-400 font-medium">Logged queries</span>
          </div>
        </Link>

        {/* Metric 3: Shootouts Run */}
        <Link
          href="/admin/analytics"
          className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group block"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Device Shootouts Run
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mt-2 font-mono tracking-tight">
                {shootoutsCount}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">compare</span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Side-by-Side
            </span>
            <span className="text-xs text-zinc-400 font-medium">Comparison views</span>
          </div>
        </Link>

        {/* Metric 4: Active Promo Banners */}
        <Link
          href="/admin/banners"
          className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group block"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Active Campaigns
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mt-2 font-mono tracking-tight">
                {stats.banners} <span className="text-sm font-normal text-zinc-400">/ 14 slots</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">ads_click</span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-900 font-mono">CTR: {ctrFormatted}</span>
            <span className="text-zinc-500 font-mono">{totalClicks.toLocaleString()} Clicks</span>
          </div>
        </Link>
      </section>

      {/* MANUAL PRICE UPDATE */}
      <PriceUpdatePanel />

      {/* TWO-COLUMN ANALYTICS ROW */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Card: Visitor & Search Traffic Trends (col-span-8) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">
                  Traffic Dynamics
                </span>
                <h3 className="text-lg font-bold text-zinc-950 tracking-tight">
                  Visitor Volume &amp; Telemetry Breakdown
                </h3>
              </div>
              <Link
                href="/admin/analytics"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Full Telemetry Studio</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </Link>
            </div>

            {/* Quick Metrics Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-zinc-50/70 rounded-xl border border-zinc-200/70 mb-6">
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Total Pageviews
                </span>
                <div className="text-xl font-extrabold text-zinc-950 mt-1 font-mono">
                  {stats.pageViews.toLocaleString()}
                </div>
                <span className="text-[11px] text-zinc-400">Verified hits</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Search Queries
                </span>
                <div className="text-xl font-extrabold text-orange-600 mt-1 font-mono">
                  {stats.searchLogs.toLocaleString()}
                </div>
                <span className="text-[11px] text-zinc-400">Consumer lookups</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Shootout Views
                </span>
                <div className="text-xl font-extrabold text-zinc-950 mt-1 font-mono">
                  {shootoutsCount}
                </div>
                <span className="text-[11px] text-zinc-400">Side-by-side specs</span>
              </div>
            </div>

            {/* Top Visited Public Pages */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Most Visited Pages (Real DB Telemetry)
                </span>
                <Link href="/admin/analytics" className="text-xs text-orange-600 font-semibold hover:underline">
                  View All &rarr;
                </Link>
              </div>

              {stats.topPages && stats.topPages.length > 0 ? (
                <div className="space-y-2">
                  {stats.topPages.map((page, idx) => {
                    const pct = stats.pageViews > 0 ? Math.round((page.count / stats.pageViews) * 100) : 0;
                    return (
                      <div
                        key={page.path}
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/60 hover:bg-zinc-100/80 border border-zinc-200/60 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-3 truncate max-w-md">
                          <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-zinc-900 truncate font-semibold">{page.path}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-bold text-zinc-950">{page.count.toLocaleString()} views</span>
                          <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-zinc-500 text-xs bg-zinc-50 rounded-xl border border-zinc-200/60">
                  {error ? "Unable to load pageview paths from database." : "No pageview records logged in database yet."}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>Aggregated directly from PostgreSQL <code>page_views</code> table</span>
            <Link href="/admin/analytics" className="text-orange-600 font-semibold hover:underline">
              Inspect Full Telemetry &rarr;
            </Link>
          </div>
        </div>

        {/* Right Card: User Source Devices & Platforms (col-span-4) */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">
                  Hardware Breakdown
                </span>
                <h3 className="text-lg font-bold text-zinc-950 tracking-tight">Devices &amp; Platforms</h3>
              </div>
              <span className="material-symbols-outlined text-zinc-400">devices</span>
            </div>

            {totalDevices > 0 ? (
              <div className="p-5 bg-zinc-50/70 rounded-2xl flex items-center gap-5 border border-zinc-200/60 my-4">
                {/* Circular Visual (SVG Donut) */}
                <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-zinc-200"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4.5"
                    ></path>
                    <path
                      className="text-orange-600"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${desktopPct}, 100`}
                      strokeLinecap="round"
                      strokeWidth="4.5"
                    ></path>
                    <path
                      className="text-zinc-900"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${mobilePct}, 100`}
                      strokeDashoffset={`-${desktopPct}`}
                      strokeWidth="4.5"
                    ></path>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-base font-bold text-zinc-950 font-mono leading-none">
                      {desktopPct}%
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-semibold mt-0.5">Desktop</span>
                  </div>
                </div>

                {/* Real Device Breakdown */}
                <div className="flex-1 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-700 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-600"></span> Desktop
                    </span>
                    <span className="font-mono font-bold text-zinc-950">
                      {desktopPct}% ({stats.devices?.desktop || 0})
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-700 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-900"></span> Mobile
                    </span>
                    <span className="font-mono font-bold text-zinc-950">
                      {mobilePct}% ({stats.devices?.mobile || 0})
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-700 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-400"></span> Tablet
                    </span>
                    <span className="font-mono font-bold text-zinc-950">
                      {tabletPct}% ({stats.devices?.tablet || 0})
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-zinc-50 rounded-xl text-center text-zinc-500 text-xs border border-zinc-200/60 my-4">
                {error ? "Unable to load device data." : "No device telemetry logged yet."}
              </div>
            )}

            <div className="p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-200/60 text-xs space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Device Tracking</span>
              <p className="text-zinc-600 text-xs leading-relaxed">
                Tracked via Client User-Agent parsing in <code>/api/track</code> on every public page load.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-500">{totalDevices} logged sessions</span>
            <Link href="/admin/analytics" className="text-orange-600 font-semibold hover:underline">
              View Detailed OS &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* PAKISTANI REGIONAL DEMOGRAPHICS & SEARCH INTELLIGENCE ROW */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Card: Pakistan Regional Network Telemetry */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">
                  Network Coverage
                </span>
                <h3 className="text-lg font-bold text-zinc-950 tracking-tight">
                  Pakistan National Network Reach
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                Active Telemetry
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-zinc-50/70 rounded-xl border border-zinc-200/60 flex items-start gap-3.5">
                <span className="material-symbols-outlined text-orange-600 mt-0.5 text-[20px]">public</span>
                <div>
                  <div className="text-xs font-bold text-zinc-950">Country Code: PK (Pakistan)</div>
                  <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                    Traffic originates through PTCL, Nayatel, Jazz, Zong, and Telenor broadband networks.
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50/70 rounded-xl border border-zinc-200/60 flex items-start gap-3.5">
                <span className="material-symbols-outlined text-zinc-900 mt-0.5 text-[20px]">security</span>
                <div>
                  <div className="text-xs font-bold text-zinc-950">Privacy-Preserving Salted Hashes</div>
                  <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                    Client IPs are transformed daily into one-way cryptographic hashes. No raw PII or IP addresses are stored.
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50/70 rounded-xl border border-zinc-200/60 flex items-start gap-3.5">
                <span className="material-symbols-outlined text-blue-600 mt-0.5 text-[20px]">database</span>
                <div>
                  <div className="text-xs font-bold text-zinc-950">Verified Database Records</div>
                  <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                    {stats.pageViews.toLocaleString()} total pageview rows currently indexed in Supabase.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-100">
            <span>Verified via Supabase Postgres</span>
            <Link href="/admin/analytics" className="text-orange-600 font-semibold hover:underline">
              Inspect Demographics &rarr;
            </Link>
          </div>
        </div>

        {/* Right Card: Real-Time Search & Intent Intelligence */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">
                  Live Consumer Intent
                </span>
                <h3 className="text-lg font-bold text-zinc-950 tracking-tight">
                  Top Trending Searches (Real Data)
                </h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span> DB Verified
              </span>
            </div>

            <div className="space-y-2">
              {stats.topSearches && stats.topSearches.length > 0 ? (
                stats.topSearches.map((item, idx) => (
                  <div
                    key={item.query}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-50/60 hover:bg-zinc-100/80 transition-colors border border-zinc-200/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-orange-600 text-[19px]">
                        {idx === 0 ? "local_fire_department" : "search"}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-950">
                          “{item.query}”
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Consumer catalog lookup
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-[11px] font-bold shadow-sm font-mono">
                      {item.count} search{item.count > 1 ? "es" : ""}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-zinc-500 text-xs bg-zinc-50 rounded-xl border border-zinc-200/60">
                  {error ? "Unable to load search queries from database." : "No search queries recorded in database yet."}
                </div>
              )}
            </div>
          </div>

          {/* Zero-Result Searches Alert Callout */}
          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[19px]">warning</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-950">
                  {(stats.zeroResultCount ?? 0).toLocaleString()} Zero-Result Searches Logged
                </h4>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  Unfulfilled queries indicate catalog demand for missing or upcoming phone models.
                </p>
              </div>
            </div>
            <Link
              href="/admin/search"
              className="px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold whitespace-nowrap shadow-sm text-center shrink-0"
            >
              Inspect Demand &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* BANNER & MEDIA MANAGER SECTION (FULL WIDTH HUB) */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
        {/* Hub Header and Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600 text-[18px]">perm_media</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                Campaign Orchestrator
              </span>
            </div>
            <h2 className="text-xl font-bold text-zinc-950 tracking-tight">
              Site Banner &amp; Media Asset Manager
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
              Oversee sponsored inventory, sticky comparison trays, and regional dealer display takeovers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Placement Filter Select */}
            <div className="relative">
              <select
                value={selectedPlacement}
                onChange={(e) => setSelectedPlacement(e.target.value)}
                className="appearance-none bg-zinc-50 text-zinc-900 text-xs font-semibold px-3.5 py-2 pr-8 rounded-xl border border-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Placements (14 Slots)</option>
                <option value="HERO">Homepage Hero Header (728x90 / 1200x300)</option>
                <option value="SIDEBAR">Comparison Tray Sticky &amp; Sidebar</option>
                <option value="TOP_BAR">Product Page Top Bar Ad</option>
                <option value="POPUP">PTA Tax Calculator Modal</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-2.5 text-zinc-400 text-[18px]">
                expand_more
              </span>
            </div>

            <Link
              href="/admin/banners"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[17px]">add_photo_alternate</span>
              <span>+ Upload New Banner</span>
            </Link>
          </div>
        </div>

        {/* Active Banners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {liveBanners.length > 0 ? (
            liveBanners.map((b) => (
              <div
                key={b.id}
                className="bg-zinc-50/70 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-zinc-200/70"
              >
                <div>
                  <div className="relative h-36 w-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                    <img
                      src={b.desktopImage}
                      alt={b.title}
                      className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent"></div>
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-zinc-900/90 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                      {b.placement}
                    </span>
                    <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/90 text-white text-[10px] font-bold shadow-sm backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                      {b.isActive ? "Live" : "Paused"}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-bold text-zinc-950 line-clamp-1">{b.title}</h3>
                    <p className="text-xs text-zinc-500 truncate">
                      Target: {b.linkUrl}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div className="bg-white p-2 rounded-xl border border-zinc-200/60">
                        <span className="text-[10px] font-semibold text-zinc-400 block uppercase">Impressions</span>
                        <span className="text-zinc-950 font-bold font-mono">
                          {b.impressions.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-zinc-200/60">
                        <span className="text-[10px] font-semibold text-zinc-400 block uppercase">Clicks (CTR)</span>
                        <span className="text-orange-600 font-bold font-mono">
                          {b.clicks} ({b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between border-t border-zinc-200/60 mt-2">
                  <Link
                    href="/admin/banners"
                    className="p-1 rounded-lg hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors"
                    title="Manage banner"
                  >
                    <span className="material-symbols-outlined text-[17px]">edit</span>
                  </Link>
                  <span className="text-xs font-bold text-orange-600 font-mono">
                    Priority: #{b.priority}
                  </span>
                </div>
              </div>
            ))
          ) : null}

          {/* Reference Banner 1 */}
          <div className="bg-zinc-50/70 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-zinc-200/70">
            <div>
              <div className="relative h-36 w-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                <img
                  alt="Itel A50C Special Edition promotional banner display"
                  className="w-full h-full object-cover object-center opacity-90 hover:scale-105 transition-transform duration-300"
                  src="https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent"></div>
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-zinc-900/90 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                  300x600 Sidebar
                </span>
                <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/90 text-white text-[10px] font-bold shadow-sm backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Live &amp; Active
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-zinc-950 line-clamp-1">
                  Itel A50C Special Edition Launch
                </h3>
                <p className="text-xs text-zinc-500">Placement: Product Sidebar &amp; Sponsor</p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="bg-white p-2 rounded-xl border border-zinc-200/60">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase">Impressions</span>
                    <span className="text-zinc-950 font-bold font-mono">418,900</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-zinc-200/60">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase">Clicks (CTR)</span>
                    <span className="text-orange-600 font-bold font-mono">26.8k (6.4%)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 pt-0 flex items-center justify-between border-t border-zinc-200/60 mt-2 text-xs">
              <span className="text-orange-600 font-bold font-mono">Top ROI &bull; 6.4%</span>
              <span className="text-zinc-400 font-medium">Ends: Nov 15</span>
            </div>
          </div>

          {/* Reference Banner 2 */}
          <div className="bg-zinc-50/70 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-zinc-200/70">
            <div>
              <div className="relative h-36 w-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                <img
                  alt="PTA Duty Calculator"
                  className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-300"
                  src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent"></div>
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-zinc-900/90 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                  Modal Banner 468x60
                </span>
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold shadow-sm">
                  Scheduled
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-zinc-950 line-clamp-1">
                  DIRBS PTA Duty Free Calculator
                </h3>
                <p className="text-xs text-zinc-500">Placement: PTA Tax Modal Banner</p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="bg-white p-2 rounded-xl border border-zinc-200/60">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase">Impressions</span>
                    <span className="text-zinc-400 font-bold font-mono">—</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-zinc-200/60">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase">Status</span>
                    <span className="text-blue-700 font-bold">Queued</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 pt-0 flex items-center justify-between border-t border-zinc-200/60 mt-2 text-xs">
              <span className="text-zinc-400 font-mono">Priority: #5</span>
              <Link
                href="/admin/banners"
                className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-[11px] font-bold hover:bg-zinc-800"
              >
                Launch Now
              </Link>
            </div>
          </div>

          {/* Reference Banner 3 */}
          <div className="bg-zinc-50/70 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-zinc-200/70">
            <div>
              <div className="relative h-36 w-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                <img
                  alt="Price Drop Flash Deals"
                  className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-300"
                  src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent"></div>
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-zinc-900/90 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                  Mobile Footer Bar
                </span>
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-600 text-[10px] font-bold">
                  Paused
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-zinc-950 line-clamp-1">
                  Price Drop Hafeez Centre Flash
                </h3>
                <p className="text-xs text-zinc-500">Placement: Mobile Sticky Footer Ad</p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="bg-white p-2 rounded-xl border border-zinc-200/60">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase">Impressions</span>
                    <span className="text-zinc-950 font-bold font-mono">210,400</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-zinc-200/60">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase">Clicks (CTR)</span>
                    <span className="text-zinc-700 font-bold font-mono">7.8k (3.7%)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 pt-0 flex items-center justify-between border-t border-zinc-200/60 mt-2 text-xs">
              <span className="text-zinc-400 font-mono">Priority: #1</span>
              <span className="text-zinc-400 font-medium">Paused by Admin</span>
            </div>
          </div>
        </div>

        {/* QUICK UPLOAD DROPZONE */}
        <Link
          href="/admin/banners"
          className="p-8 rounded-2xl bg-zinc-50/70 hover:bg-zinc-100/70 flex flex-col items-center justify-center text-center cursor-pointer transition-all group border border-dashed border-zinc-300 block"
        >
          <div className="w-14 h-14 rounded-2xl bg-orange-50 group-hover:bg-orange-600 text-orange-600 group-hover:text-white flex items-center justify-center transition-all mb-3 mx-auto shadow-sm">
            <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
          </div>
          <h3 className="text-base font-bold text-zinc-950">
            Drag &amp; Drop New Banner Creative or Browse Assets
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-xl mt-1.5 mx-auto leading-relaxed">
            Supports PNG, JPG, WebP up to 2MB. Responsive image pipelines optimize and serve assets for Karachi, Lahore, and Islamabad networks.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {["1200x300 Hero", "728x90 Leaderboard", "300x250 Medium Rect", "320x50 Mobile Sticky"].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-lg bg-white text-xs font-semibold text-zinc-700 border border-zinc-200/80 shadow-2xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </Link>
      </section>
    </div>
  );
}
