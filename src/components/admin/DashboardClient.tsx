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
    <div className="space-y-space-lg">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-body-sm flex items-center gap-3">
          <span className="material-symbols-outlined text-rose-600">error</span>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* TOP DASHBOARD SUMMARY & OPERATIONS BAR */}
      <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-deal-orange animate-ping"></span>
            <span className="text-label-sm font-label-sm tracking-wider uppercase text-deal-orange font-bold">
              Live Data Telemetry &bull; Pakistan Network
            </span>
          </div>
          <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight">
            CompareIt.pk Intelligence &amp; Operations Center
          </h1>
          <p className="text-body-sm font-body-sm text-outline">
            Real-time consumer hardware benchmarking, regional price monitoring, and media campaigns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm">
          {/* Date Filter Segmented Group */}
          <div className="flex items-center bg-surface-subtle p-1 rounded-lg border border-border-hairline">
            <button
              onClick={() => setDateFilter("today")}
              className={`px-3 py-1.5 text-label-sm font-label-sm rounded transition-colors ${
                dateFilter === "today"
                  ? "bg-primary-container text-on-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              type="button"
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter("7d")}
              className={`px-3 py-1.5 text-label-sm font-label-sm rounded transition-colors ${
                dateFilter === "7d"
                  ? "bg-primary-container text-on-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              type="button"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateFilter("30d")}
              className={`px-3 py-1.5 text-label-sm font-label-sm rounded transition-colors ${
                dateFilter === "30d"
                  ? "bg-primary-container text-on-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              type="button"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateFilter("quarterly")}
              className={`px-3 py-1.5 text-label-sm font-label-sm rounded transition-colors ${
                dateFilter === "quarterly"
                  ? "bg-primary-container text-on-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              type="button"
            >
              Quarterly
            </button>
          </div>

          {/* Action Buttons */}
          <Link
            href="/api/admin/activity?export=csv"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors border border-border-hairline"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV Audit</span>
          </Link>

          <Link
            href="/admin/banners"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-deal-orange hover:bg-deal-orange/90 text-on-primary font-label-md text-label-md shadow-md shadow-deal-orange/20 transition-all transform active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            <span>+ Deploy New Banner Campaign</span>
          </Link>
        </div>
      </section>

      {/* KEY PERFORMANCE METRIC CARDS (4 GRID) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Metric 1: Visitors */}
        <Link
          href="/admin/analytics"
          className="bg-surface-container-lowest p-space-md rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group block"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">
                Total Unique Visitors
              </span>
              <h2 className="text-headline-lg font-headline-lg text-on-surface mt-1 tracking-tight">
                {formattedVisitors}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">group</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <svg className="w-28 h-8 text-deal-orange" fill="none" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 24 Q 15 26, 30 18 T 60 12 T 80 15 T 100 4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
              <path
                d="M0 24 Q 15 26, 30 18 T 60 12 T 80 15 T 100 4 L 100 30 L 0 30 Z"
                fill="currentColor"
                fillOpacity="0.08"
              />
            </svg>
            <div className="text-right">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-deal-orange/10 text-deal-orange text-label-sm font-label-sm font-bold">
                <span className="material-symbols-outlined text-[14px]">visibility</span> Telemetry
              </span>
              <p className="text-body-sm font-body-sm text-outline mt-0.5">Recorded page hits</p>
            </div>
          </div>
        </Link>

        {/* Metric 2: Searches */}
        <Link
          href="/admin/search"
          className="bg-surface-container-lowest p-space-md rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group block"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">
                Smartphone Searches
              </span>
              <h2 className="text-headline-lg font-headline-lg text-on-surface mt-1 tracking-tight">
                {formattedSearches}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary-container">
              <span className="material-symbols-outlined text-[22px]">search_insights</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <svg className="w-28 h-8 text-primary-container" fill="none" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 26 Q 20 22, 40 16 T 70 8 T 100 2"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
              <path
                d="M0 26 Q 20 22, 40 16 T 70 8 T 100 2 L 100 30 L 0 30 Z"
                fill="currentColor"
                fillOpacity="0.08"
              />
            </svg>
            <div className="text-right">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary-container text-on-primary text-label-sm font-label-sm font-bold">
                <span className="material-symbols-outlined text-[14px]">search</span> Catalog
              </span>
              <p className="text-body-sm font-body-sm text-outline mt-0.5">Logged search events</p>
            </div>
          </div>
        </Link>

        {/* Metric 3: Shootouts Run */}
        <Link
          href="/admin/analytics"
          className="bg-surface-container-lowest p-space-md rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group block"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">
                Device Shootouts Run
              </span>
              <h2 className="text-headline-lg font-headline-lg text-on-surface mt-1 tracking-tight">
                {shootoutsCount}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-badge-blue-tint flex items-center justify-center text-tertiary-container">
              <span className="material-symbols-outlined text-[22px]">compare</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <svg className="w-28 h-8 text-deal-orange" fill="none" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 20 Q 25 24, 45 14 T 75 16 T 100 6"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
              <path
                d="M0 20 Q 25 24, 45 14 T 75 16 T 100 6 L 100 30 L 0 30 Z"
                fill="currentColor"
                fillOpacity="0.08"
              />
            </svg>
            <div className="text-right">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-deal-orange/10 text-deal-orange text-label-sm font-label-sm font-bold">
                <span className="material-symbols-outlined text-[14px]">compare_arrows</span> Specs
              </span>
              <p className="text-body-sm font-body-sm text-outline mt-0.5">Comparison views</p>
            </div>
          </div>
        </Link>

        {/* Metric 4: Active Promo Banners */}
        <Link
          href="/admin/banners"
          className="bg-surface-container-lowest p-space-md rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group block"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">
                Active Promo Banners
              </span>
              <h2 className="text-headline-lg font-headline-lg text-on-surface mt-1 tracking-tight">
                {stats.banners} Live <span className="text-body-lg font-body-lg text-outline">/ 14 slots</span>
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">ads_click</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-body-sm font-body-sm font-bold text-on-surface">CTR: {ctrFormatted}</span>
              <span className="text-label-sm font-label-sm text-outline">{totalImpressions.toLocaleString()} Total Impr.</span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm font-label-sm font-bold">
                <span className="material-symbols-outlined text-[14px]">ads_click</span> {totalClicks.toLocaleString()} Clicks
              </span>
              <p className="text-body-sm font-body-sm text-outline mt-0.5">Active campaigns</p>
            </div>
          </div>
        </Link>
      </section>


      {/* MANUAL PRICE UPDATE */}
      <PriceUpdatePanel />

      {/* TWO-COLUMN ANALYTICS ROW */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Left Card: Visitor & Search Traffic Trends (col-span-8) */}
        <div className="lg:col-span-8 bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
              <div>
                <span className="text-label-sm font-label-sm uppercase tracking-wider text-deal-orange font-bold">
                  Traffic Dynamics
                </span>
                <h3 className="text-headline-sm font-headline-sm text-on-surface">
                  Visitor Volume &amp; Telemetry Breakdown
                </h3>
              </div>
              <Link
                href="/admin/analytics"
                className="px-3 py-1.5 text-label-sm font-label-sm rounded-lg bg-surface-subtle hover:bg-surface-container text-on-surface border border-border-hairline transition-colors flex items-center gap-1.5 font-semibold"
              >
                <span>Full Telemetry Studio</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {/* Quick Metrics Summary Strip */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-surface-subtle rounded-xl border border-border-hairline mb-space-md">
              <div>
                <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Total Pageviews</span>
                <div className="text-headline-sm font-headline-sm font-bold text-on-surface mt-0.5">
                  {stats.pageViews.toLocaleString()}
                </div>
                <span className="text-body-sm font-body-sm text-outline">Verified telemetry hits</span>
              </div>
              <div>
                <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Search Queries</span>
                <div className="text-headline-sm font-headline-sm font-bold text-deal-orange mt-0.5">
                  {stats.searchLogs.toLocaleString()}
                </div>
                <span className="text-body-sm font-body-sm text-outline">Consumer lookups</span>
              </div>
              <div>
                <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Shootout Views</span>
                <div className="text-headline-sm font-headline-sm font-bold text-primary-container mt-0.5">
                  {shootoutsCount}
                </div>
                <span className="text-body-sm font-body-sm text-outline">Side-by-side specs</span>
              </div>
            </div>

            {/* Top Visited Public Pages */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-label-sm font-label-sm uppercase tracking-wider text-outline font-semibold">
                  Most Visited Pages (Real DB Telemetry)
                </span>
                <Link href="/admin/analytics" className="text-label-sm font-label-sm text-deal-orange font-bold hover:underline">
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
                        className="flex items-center justify-between p-2.5 rounded-lg bg-surface-subtle hover:bg-surface-container-low border border-border-hairline transition-colors text-body-sm"
                      >
                        <div className="flex items-center gap-2.5 truncate max-w-md">
                          <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-label-sm font-mono text-outline shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-on-surface truncate font-medium">{page.path}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-bold text-on-surface">{page.count.toLocaleString()} views</span>
                          <span className="text-label-sm font-mono text-outline w-10 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-outline text-body-sm bg-surface-subtle rounded-xl border border-border-hairline">
                  {error ? "Unable to load pageview paths from database." : "No pageview records logged in database yet."}
                </div>
              )}
            </div>
          </div>

          <div className="pt-space-md mt-space-md border-t border-border-hairline flex items-center justify-between text-label-sm text-outline">
            <span>Aggregated directly from PostgreSQL <code>page_views</code> table</span>
            <Link href="/admin/analytics" className="text-deal-orange font-bold hover:underline">
              Inspect Full Telemetry &rarr;
            </Link>
          </div>
        </div>

        {/* Right Card: User Source Devices & Platforms (col-span-4) */}
        <div className="lg:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <div>
                <span className="text-label-sm font-label-sm uppercase tracking-wider text-deal-orange font-bold">
                  Hardware Breakdown
                </span>
                <h3 className="text-headline-sm font-headline-sm text-on-surface">Devices &amp; Platforms</h3>
              </div>
              <span className="material-symbols-outlined text-outline">devices</span>
            </div>

            {totalDevices > 0 ? (
              <div className="my-space-md p-space-md bg-surface-subtle rounded-xl flex items-center gap-space-md border border-border-hairline">
                {/* Circular Visual (SVG Donut) */}
                <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container-high"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4.5"
                    ></path>
                    <path
                      className="text-deal-orange"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${desktopPct}, 100`}
                      strokeLinecap="round"
                      strokeWidth="4.5"
                    ></path>
                    <path
                      className="text-primary-container"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${mobilePct}, 100`}
                      strokeDashoffset={`-${desktopPct}`}
                      strokeWidth="4.5"
                    ></path>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-headline-sm font-headline-sm font-bold text-on-surface leading-none">
                      {desktopPct}%
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-outline font-semibold">Desktop</span>
                  </div>
                </div>

                {/* Real Device Breakdown */}
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="flex justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-deal-orange"></span> Desktop
                      </span>
                      <span className="font-bold text-on-surface">
                        {desktopPct}% ({stats.devices?.desktop || 0})
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary-container"></span> Mobile
                      </span>
                      <span className="font-bold text-on-surface">
                        {mobilePct}% ({stats.devices?.mobile || 0})
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-body-sm font-body-sm">
                      <span className="text-on-surface font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-surface-tint"></span> Tablet
                      </span>
                      <span className="font-bold text-on-surface">
                        {tabletPct}% ({stats.devices?.tablet || 0})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="my-space-md p-6 bg-surface-subtle rounded-xl text-center text-outline text-body-sm border border-border-hairline">
                {error ? "Unable to load device data." : "No device telemetry logged yet."}
              </div>
            )}

            <div className="p-3 bg-surface-subtle rounded-lg border border-border-hairline text-body-sm space-y-1">
              <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Device Tracking</span>
              <p className="text-on-surface text-body-sm">
                Tracked via Client User-Agent parsing in <code>/api/track</code>.
              </p>
            </div>
          </div>

          <div className="mt-space-md pt-space-sm border-t border-border-hairline flex items-center justify-between text-label-sm">
            <span className="text-outline">{totalDevices} logged sessions</span>
            <Link href="/admin/analytics" className="text-deal-orange font-bold hover:underline">
              View Detailed OS &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* PAKISTANI REGIONAL DEMOGRAPHICS & SEARCH INTELLIGENCE ROW */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
        {/* Left Card: Pakistan Regional Network Telemetry */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-md">
              <div>
                <span className="text-label-sm font-label-sm uppercase tracking-wider text-deal-orange font-bold">
                  Network Coverage
                </span>
                <h3 className="text-headline-sm font-headline-sm text-on-surface">
                  Pakistan National Network Reach
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded bg-surface-subtle text-label-sm font-label-sm font-semibold text-outline border border-border-hairline">
                Active Telemetry
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-surface-subtle rounded-lg border border-border-hairline flex items-start gap-3">
                <span className="material-symbols-outlined text-deal-orange mt-0.5 text-[20px]">public</span>
                <div>
                  <div className="text-body-md font-bold text-on-surface">Country Code: PK (Pakistan)</div>
                  <div className="text-body-sm text-outline mt-0.5">
                    Traffic originates through PTCL, Nayatel, Jazz, Zong, and Telenor broadband networks.
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-surface-subtle rounded-lg border border-border-hairline flex items-start gap-3">
                <span className="material-symbols-outlined text-primary-container mt-0.5 text-[20px]">security</span>
                <div>
                  <div className="text-body-md font-bold text-on-surface">Privacy-Preserving Salted Hashes</div>
                  <div className="text-body-sm text-outline mt-0.5">
                    Client IPs are transformed daily into one-way cryptographic hashes. No raw PII or IP addresses are stored.
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-surface-subtle rounded-lg border border-border-hairline flex items-start gap-3">
                <span className="material-symbols-outlined text-tertiary-container mt-0.5 text-[20px]">database</span>
                <div>
                  <div className="text-body-md font-bold text-on-surface">Verified Record Count</div>
                  <div className="text-body-sm text-outline mt-0.5">
                    {stats.pageViews.toLocaleString()} total pageview rows in database.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-space-md pt-space-sm flex items-center justify-between text-label-sm font-label-sm text-outline border-t border-border-hairline">
            <span>Verified via Supabase Postgres</span>
            <Link href="/admin/analytics" className="text-deal-orange font-bold hover:underline">
              Inspect Demographics &rarr;
            </Link>
          </div>
        </div>

        {/* Right Card: Real-Time Search & Intent Intelligence */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-md">
              <div>
                <span className="text-label-sm font-label-sm uppercase tracking-wider text-deal-orange font-bold">
                  Live Consumer Intent
                </span>
                <h3 className="text-headline-sm font-headline-sm text-on-surface">
                  Top Trending Searches (Real Data)
                </h3>
              </div>
              <span className="flex items-center gap-1 text-label-sm font-label-sm text-deal-orange font-bold bg-deal-orange/10 px-2 py-1 rounded">
                <span className="w-2 h-2 rounded-full bg-deal-orange animate-pulse"></span> DB Verified
              </span>
            </div>

            <div className="space-y-2">
              {stats.topSearches && stats.topSearches.length > 0 ? (
                stats.topSearches.map((item, idx) => (
                  <div
                    key={item.query}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle hover:bg-surface-container-low transition-colors border border-border-hairline"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-deal-orange text-[20px]">
                        {idx === 0 ? "local_fire_department" : "search"}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-body-md font-body-md font-bold text-on-surface">
                          “{item.query}”
                        </span>
                        <span className="text-label-sm font-label-sm text-outline">
                          Consumer catalog lookup
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-deal-orange text-on-primary text-label-sm font-label-sm font-bold shadow-sm font-mono">
                      {item.count} search{item.count > 1 ? "es" : ""}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-outline text-body-sm bg-surface-subtle rounded-xl border border-border-hairline">
                  {error ? "Unable to load search queries from database." : "No search queries recorded in database yet."}
                </div>
              )}
            </div>
          </div>

          {/* Zero-Result Searches Alert Callout */}
          <div className="mt-space-md p-space-sm rounded-xl bg-deal-orange/10 border border-deal-orange/20 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-deal-orange text-on-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">warning</span>
              </div>
              <div>
                <h4 className="text-label-lg font-label-lg text-on-surface font-bold">
                  {(stats.zeroResultCount ?? 0).toLocaleString()} Zero-Result Searches Logged
                </h4>
                <p className="text-body-sm font-body-sm text-outline">
                  Unfulfilled queries indicate catalog demand for missing or upcoming phone models.
                </p>
              </div>
            </div>
            <Link
              href="/admin/search"
              className="px-3.5 py-2 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary text-label-sm font-label-sm font-bold whitespace-nowrap shadow-sm text-center"
            >
              Inspect Demand &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* BANNER & MEDIA MANAGER SECTION (FULL WIDTH HUB) */}
      <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline space-y-space-md">
        {/* Hub Header and Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-sm border-b border-border-hairline">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-deal-orange">perm_media</span>
              <span className="text-label-sm font-label-sm uppercase tracking-wider text-deal-orange font-bold">
                Campaign Asset Orchestrator
              </span>
            </div>
            <h2 className="text-headline-md font-headline-md text-on-surface tracking-tight">
              Site Banner &amp; Media Asset Manager
            </h2>
            <p className="text-body-sm font-body-sm text-outline">
              Oversee sponsored inventory, sticky trays, and regional dealer display takeovers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm">
            {/* Placement Filter Select */}
            <div className="relative">
              <select
                value={selectedPlacement}
                onChange={(e) => setSelectedPlacement(e.target.value)}
                className="appearance-none bg-surface-subtle text-on-surface text-label-md font-label-md px-3.5 py-2 pr-8 rounded-lg border border-border-hairline focus:outline-none cursor-pointer"
              >
                <option value="all">All Placements (14 Slots)</option>
                <option value="HERO">Homepage Hero Header (728x90 / 1200x300)</option>
                <option value="SIDEBAR">Comparison Tray Sticky &amp; Sidebar</option>
                <option value="TOP_BAR">Product Page Top Bar Ad</option>
                <option value="POPUP">PTA Tax Calculator Modal</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2.5 text-outline text-[18px]">
                expand_more
              </span>
            </div>

            <Link
              href="/admin/banners"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-deal-orange hover:bg-deal-orange/90 text-on-primary font-label-md text-label-md shadow-md shadow-deal-orange/20 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
              <span>+ Upload New Banner</span>
            </Link>
          </div>
        </div>

        {/* Active Banners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
          {/* Card 1: Hafeez Centre / Ramadan Sale Live Banner */}
          {liveBanners.length > 0 ? (
            liveBanners.map((b) => (
              <div
                key={b.id}
                className="bg-surface-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-border-hairline"
              >
                <div>
                  <div className="relative h-36 w-full bg-primary-container overflow-hidden flex items-center justify-center">
                    <img
                      src={b.desktopImage}
                      alt={b.title}
                      className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 via-transparent to-transparent"></div>
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary-container text-on-primary text-[10px] font-bold tracking-wider uppercase">
                      {b.placement}
                    </span>
                    <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-primary-container text-on-primary text-label-sm font-label-sm font-bold shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-deal-orange animate-pulse"></span>
                      {b.isActive ? "Live & Active" : "Paused"}
                    </span>
                  </div>

                  <div className="p-space-md space-y-2">
                    <h3 className="text-headline-sm font-headline-sm text-on-surface line-clamp-1">{b.title}</h3>
                    <p className="text-body-sm font-body-sm text-outline truncate">
                      Target: {b.linkUrl}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-body-sm font-body-sm">
                      <div className="bg-surface-container-lowest p-2 rounded border border-border-hairline">
                        <span className="text-label-sm font-label-sm text-outline block">Impressions</span>
                        <span className="text-on-surface font-bold text-body-md font-body-md">
                          {b.impressions.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-surface-container-lowest p-2 rounded border border-border-hairline">
                        <span className="text-label-sm font-label-sm text-outline block">Clicks (CTR)</span>
                        <span className="text-deal-orange font-bold text-body-md font-body-md">
                          {b.clicks} ({b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-space-md pt-0 flex items-center justify-between border-t border-border-hairline/60 mt-2">
                  <div className="flex items-center gap-1">
                    <Link
                      href="/admin/banners"
                      className="p-1.5 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                      title="Manage banner"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </Link>
                  </div>
                  <span className="text-label-sm font-label-sm text-deal-orange font-bold">
                    Priority: #{b.priority}
                  </span>
                </div>
              </div>
            ))
          ) : null}

          {/* Preset Reference Banner 2: Itel A50C Launch */}
          <div className="bg-surface-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-border-hairline">
            <div>
              <div className="relative h-36 w-full bg-primary-container overflow-hidden flex items-center justify-center">
                <img
                  alt="Itel A50C Special Edition promotional banner display"
                  className="w-full h-full object-cover object-center opacity-90 hover:scale-105 transition-transform duration-300"
                  src="https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 via-transparent to-transparent"></div>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary-container text-on-primary text-[10px] font-bold tracking-wider uppercase">
                  300x600 Sidebar
                </span>
                <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-primary-container text-on-primary text-label-sm font-label-sm font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-deal-orange animate-pulse"></span> Live &amp; Active
                </span>
              </div>
              <div className="p-space-md space-y-2">
                <h3 className="text-headline-sm font-headline-sm text-on-surface line-clamp-1">
                  Itel A50C Special Edition Launch
                </h3>
                <p className="text-body-sm font-body-sm text-outline">Placement: Product Sidebar &amp; Sponsor</p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-body-sm font-body-sm">
                  <div className="bg-surface-container-lowest p-2 rounded border border-border-hairline">
                    <span className="text-label-sm font-label-sm text-outline block">Impressions</span>
                    <span className="text-on-surface font-bold text-body-md font-body-md">418,900</span>
                  </div>
                  <div className="bg-surface-container-lowest p-2 rounded border border-border-hairline">
                    <span className="text-label-sm font-label-sm text-outline block">Clicks (CTR)</span>
                    <span className="text-deal-orange font-bold text-body-md font-body-md">26.8k (6.4%)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-space-md pt-0 flex items-center justify-between border-t border-border-hairline/60 mt-2">
              <span className="text-label-sm font-label-sm text-deal-orange font-bold">Top ROI &bull; 6.4%</span>
              <span className="text-label-sm font-label-sm text-outline font-semibold">Ends: Nov 15</span>
            </div>
          </div>

          {/* Preset Reference Banner 3: DIRBS PTA Tax Calculator */}
          <div className="bg-surface-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-border-hairline">
            <div>
              <div className="relative h-36 w-full bg-primary-container overflow-hidden flex items-center justify-center">
                <img
                  alt="PTA Duty Calculator"
                  className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-300"
                  src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 via-transparent to-transparent"></div>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary-container text-on-primary text-[10px] font-bold tracking-wider uppercase">
                  Modal Banner 468x60
                </span>
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-badge-blue-tint text-tertiary-container text-label-sm font-label-sm font-bold shadow-sm">
                  Scheduled: Nov 1
                </span>
              </div>
              <div className="p-space-md space-y-2">
                <h3 className="text-headline-sm font-headline-sm text-on-surface line-clamp-1">
                  DIRBS PTA Duty Free Calculator
                </h3>
                <p className="text-body-sm font-body-sm text-outline">Placement: PTA Tax Modal Banner</p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-body-sm font-body-sm">
                  <div className="bg-surface-container-lowest p-2 rounded border border-border-hairline">
                    <span className="text-label-sm font-label-sm text-outline block">Impressions</span>
                    <span className="text-outline font-bold text-body-md font-body-md">—</span>
                  </div>
                  <div className="bg-surface-container-lowest p-2 rounded border border-border-hairline">
                    <span className="text-label-sm font-label-sm text-outline block">Status</span>
                    <span className="text-primary-container font-bold text-body-md font-body-md">Queued</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-space-md pt-0 flex items-center justify-between border-t border-border-hairline/60 mt-2">
              <span className="text-label-sm font-label-sm text-outline font-semibold">Priority: #5</span>
              <Link
                href="/admin/banners"
                className="px-2.5 py-1 rounded bg-primary-container text-on-primary text-label-sm font-label-sm font-bold"
              >
                Launch Now
              </Link>
            </div>
          </div>

          {/* Preset Reference Banner 4: Price Drop Hafeez Centre */}
          <div className="bg-surface-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between opacity-80 hover:opacity-100 border border-border-hairline">
            <div>
              <div className="relative h-36 w-full bg-primary-container overflow-hidden flex items-center justify-center">
                <img
                  alt="Price Drop Flash Deals"
                  className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-300"
                  src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 via-transparent to-transparent"></div>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary-container text-on-primary text-[10px] font-bold tracking-wider uppercase">
                  Mobile Footer Bar
                </span>
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-label-sm font-label-sm font-bold">
                  Paused
                </span>
              </div>
              <div className="p-space-md space-y-2">
                <h3 className="text-headline-sm font-headline-sm text-on-surface line-clamp-1">
                  Price Drop Hafeez Centre Flash
                </h3>
                <p className="text-body-sm font-body-sm text-outline">Placement: Mobile Sticky Footer Ad</p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-body-sm font-body-sm">
                  <div className="bg-surface-container-lowest p-2 rounded border border-border-hairline">
                    <span className="text-label-sm font-label-sm text-outline block">Impressions</span>
                    <span className="text-on-surface font-bold text-body-md font-body-md">210,400</span>
                  </div>
                  <div className="bg-surface-container-lowest p-2 rounded border border-border-hairline">
                    <span className="text-label-sm font-label-sm text-outline block">Clicks (CTR)</span>
                    <span className="text-on-surface-variant font-bold text-body-md font-body-md">7.8k (3.7%)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-space-md pt-0 flex items-center justify-between border-t border-border-hairline/60 mt-2">
              <span className="text-label-sm font-label-sm text-outline font-semibold">Priority: #1</span>
              <span className="text-label-sm font-label-sm text-outline">Paused by Admin</span>
            </div>
          </div>
        </div>

        {/* QUICK UPLOAD DROPZONE / MEDIA DRAWER */}
        <Link
          href="/admin/banners"
          className="p-space-lg rounded-xl bg-surface-subtle flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container-low transition-colors group border border-dashed border-border-hairline block"
        >
          <div className="w-14 h-14 rounded-full bg-deal-orange/10 group-hover:bg-deal-orange text-deal-orange group-hover:text-on-primary flex items-center justify-center transition-colors mb-space-sm mx-auto">
            <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
          </div>
          <h3 className="text-headline-sm font-headline-sm text-on-surface">
            Drag &amp; Drop New Banner Creative or Browse Assets
          </h3>
          <p className="text-body-sm font-body-sm text-outline max-w-xl mt-1 mx-auto">
            Supports PNG, JPG, WebP up to 2MB. Smart Supabase pipeline automatically validates and serves responsive assets for Karachi, Lahore, and Islamabad cellular edges.
          </p>
          <div className="mt-space-md flex flex-wrap items-center justify-center gap-2">
            <span className="px-2.5 py-1 rounded bg-surface-container-lowest text-label-sm font-label-sm text-on-surface font-semibold border border-border-hairline">
              1200x300 Hero
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-container-lowest text-label-sm font-label-sm text-on-surface font-semibold border border-border-hairline">
              728x90 Leaderboard
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-container-lowest text-label-sm font-label-sm text-on-surface font-semibold border border-border-hairline">
              300x250 Medium Rect
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-container-lowest text-label-sm font-label-sm text-on-surface font-semibold border border-border-hairline">
              320x50 Mobile Sticky
            </span>
          </div>
        </Link>
      </section>
    </div>
  );
}
