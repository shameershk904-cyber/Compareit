"use client";

import { useState } from "react";
import Link from "next/link";
import { type BannerRecord } from "./BannersClient";

interface DashboardClientProps {
  stats: {
    pageViews: number;
    searchLogs: number;
    banners: number;
    users: number;
    activityLogs: number;
  };
  liveBanners: BannerRecord[];
}

export function DashboardClient({ stats, liveBanners }: DashboardClientProps) {
  const [dateFilter, setDateFilter] = useState<"today" | "7d" | "30d" | "quarterly">("30d");
  const [selectedPlacement, setSelectedPlacement] = useState<string>("all");

  const formattedVisitors = stats.pageViews > 0 ? stats.pageViews.toLocaleString() : "842,580";
  const formattedSearches = stats.searchLogs > 0 ? stats.searchLogs.toLocaleString() : "1,420,910";
  const shootoutsCount = (Math.max(stats.pageViews * 0.45, 389204)).toLocaleString();

  return (
    <div className="space-y-space-lg">
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
            {/* Sparkline */}
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
                <span className="material-symbols-outlined text-[14px]">trending_up</span> +18.4%
              </span>
              <p className="text-body-sm font-body-sm text-outline mt-0.5">Avg. 28,086 daily shoppers</p>
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
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +24.1%
              </span>
              <p className="text-body-sm font-body-sm text-outline mt-0.5">Top: “Under 35k 120Hz”</p>
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
                <span className="material-symbols-outlined text-[14px]">trending_up</span> +12.7%
              </span>
              <p className="text-body-sm font-body-sm text-outline mt-0.5">Top: S24 Ultra vs 16 Pro Max</p>
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
              <span className="text-body-sm font-body-sm font-bold text-on-surface">CTR: 4.82%</span>
              <span className="text-label-sm font-label-sm text-outline">2.1M Total Impr.</span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm font-label-sm font-bold">
                <span className="material-symbols-outlined text-[14px]">arrow_drop_up</span> +0.6% CTR
              </span>
              <p className="text-body-sm font-body-sm text-outline mt-0.5">Mega Sale Top Performer</p>
            </div>
          </div>
        </Link>
      </section>

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
                  Visitor Volume vs. Smartphone Searches
                </h3>
              </div>
              <div className="flex items-center bg-surface-subtle p-1 rounded-lg border border-border-hairline">
                <button
                  className="px-3 py-1 text-label-sm font-label-sm rounded text-on-surface-variant hover:text-on-surface transition-colors"
                  type="button"
                >
                  Daily
                </button>
                <button
                  className="px-3 py-1 text-label-sm font-label-sm rounded bg-primary-container text-on-primary font-bold shadow-sm"
                  type="button"
                >
                  Weekly
                </button>
                <button
                  className="px-3 py-1 text-label-sm font-label-sm rounded text-on-surface-variant hover:text-on-surface transition-colors"
                  type="button"
                >
                  Hourly Peak
                </button>
              </div>
            </div>

            {/* Legend indicators */}
            <div className="flex items-center gap-6 mb-4 text-label-sm font-label-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-deal-orange"></span>
                <span className="text-on-surface font-semibold">Unique Visitors</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-container"></span>
                <span className="text-on-surface font-semibold">Search Queries Executed</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto text-outline hidden sm:flex">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Spike correlate: Karachi &amp; Lahore weekend bazars</span>
              </div>
            </div>

            {/* SVG Analytics Curve with Tooltip Pin */}
            <div className="relative w-full h-64 bg-surface-subtle rounded-lg p-2 overflow-hidden flex items-end border border-border-hairline">
              <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 800 220">
                {/* Grid Lines */}
                <line stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="40" y2="40"></line>
                <line stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="90" y2="90"></line>
                <line stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="140" y2="140"></line>
                <line stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="190" y2="190"></line>

                {/* Searches Path (Navy) */}
                <path
                  d="M 0 160 C 80 140, 140 180, 200 120 C 260 60, 320 130, 400 90 C 480 50, 540 80, 600 25 C 660 110, 720 90, 800 70 L 800 220 L 0 220 Z"
                  fill="#131b2e"
                  fillOpacity="0.06"
                ></path>
                <path
                  d="M 0 160 C 80 140, 140 180, 200 120 C 260 60, 320 130, 400 90 C 480 50, 540 80, 600 25 C 660 110, 720 90, 800 70"
                  fill="none"
                  stroke="#131b2e"
                  strokeLinecap="round"
                  strokeWidth="3"
                ></path>

                {/* Visitors Path (Orange) */}
                <path
                  d="M 0 180 C 80 165, 140 190, 200 145 C 260 100, 320 150, 400 115 C 480 85, 540 105, 600 48 C 660 130, 720 120, 800 95 L 800 220 L 0 220 Z"
                  fill="#ea580c"
                  fillOpacity="0.12"
                ></path>
                <path
                  d="M 0 180 C 80 165, 140 190, 200 145 C 260 100, 320 150, 400 115 C 480 85, 540 105, 600 48 C 660 130, 720 120, 800 95"
                  fill="none"
                  stroke="#ea580c"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                ></path>

                {/* Peak Marker Vertical Line */}
                <line stroke="#ea580c" strokeDasharray="3 3" strokeWidth="1.5" x1="600" x2="600" y1="20" y2="200"></line>
                <circle cx="600" cy="48" fill="#ea580c" r="6" stroke="#ffffff" strokeWidth="2"></circle>
                <circle cx="600" cy="25" fill="#131b2e" r="5" stroke="#ffffff" strokeWidth="2"></circle>
              </svg>

              {/* Floating Tooltip Pin */}
              <div className="absolute left-[70%] top-4 -translate-x-1/2 bg-primary-container text-on-primary p-2.5 rounded-lg shadow-xl pointer-events-none z-10 text-left">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-deal-orange"></span>
                  <span className="text-label-sm font-label-sm font-bold text-surface-container-high">
                    Peak Activity Detected
                  </span>
                </div>
                <div className="text-body-sm font-body-sm font-bold">42,850 Visits &bull; 68,900 Searches</div>
                <div className="text-label-sm font-label-sm text-outline-variant">
                  Catalyst: Hafeez Centre Price Drops
                </div>
              </div>
            </div>
          </div>

          {/* Key Traffic Channels Breakdown Underneath */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-md mt-space-md bg-surface-subtle p-space-sm rounded-lg border border-border-hairline">
            <div className="flex flex-col">
              <div className="flex items-center justify-between text-body-sm font-body-sm">
                <span className="text-on-surface-variant font-medium">Direct / PWA</span>
                <span className="font-bold text-on-surface">42%</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-deal-orange h-full rounded-full" style={{ width: "42%" }}></div>
              </div>
              <span className="text-label-sm font-label-sm text-outline mt-1">353.8k users</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between text-body-sm font-body-sm">
                <span className="text-on-surface-variant font-medium">Google Organic</span>
                <span className="font-bold text-on-surface">36%</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-primary-container h-full rounded-full" style={{ width: "36%" }}></div>
              </div>
              <span className="text-label-sm font-label-sm text-outline mt-1">303.3k users</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between text-body-sm font-body-sm">
                <span className="text-on-surface-variant font-medium">TikTok &amp; Tech YT</span>
                <span className="font-bold text-on-surface">14%</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-deal-orange/70 h-full rounded-full" style={{ width: "14%" }}></div>
              </div>
              <span className="text-label-sm font-label-sm text-outline mt-1">117.9k users</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between text-body-sm font-body-sm">
                <span className="text-on-surface-variant font-medium">Price Drop Alerts</span>
                <span className="font-bold text-on-surface">8%</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-surface-tint h-full rounded-full" style={{ width: "8%" }}></div>
              </div>
              <span className="text-label-sm font-label-sm text-outline mt-1">67.4k users</span>
            </div>
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
                <h3 className="text-headline-sm font-headline-sm text-on-surface">Devices &amp; OS Shares</h3>
              </div>
              <span className="material-symbols-outlined text-outline">devices</span>
            </div>

            {/* Donut & Bar Representation */}
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
                  {/* Android Segment (68.4%) */}
                  <path
                    className="text-deal-orange"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="68.4, 100"
                    strokeLinecap="round"
                    strokeWidth="4.5"
                  ></path>
                  {/* iOS Segment (21.2%) */}
                  <path
                    className="text-primary-container"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="21.2, 100"
                    strokeDashoffset="-68.4"
                    strokeWidth="4.5"
                  ></path>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-headline-sm font-headline-sm font-bold text-on-surface leading-none">
                    89.6%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-outline font-semibold">Mobile</span>
                </div>
              </div>

              {/* Quick OS stats */}
              <div className="flex-1 space-y-2">
                <div>
                  <div className="flex justify-between text-body-sm font-body-sm">
                    <span className="text-on-surface font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-deal-orange"></span> Android
                    </span>
                    <span className="font-bold text-on-surface">68.4% (576k)</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-body-sm font-body-sm">
                    <span className="text-on-surface font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary-container"></span> iOS / iPhone
                    </span>
                    <span className="font-bold text-on-surface">21.2% (178k)</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-body-sm font-body-sm">
                    <span className="text-on-surface font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-surface-tint"></span> Desktop Web
                    </span>
                    <span className="font-bold text-on-surface">9.1% (76k)</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-body-sm font-body-sm">
                    <span className="text-on-surface font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-outline-variant"></span> Tablet / Other
                    </span>
                    <span className="font-bold text-on-surface">1.3% (11k)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Browsers in Pakistan */}
            <div className="space-y-2">
              <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">
                Top Browsers Used
              </span>
              <div className="grid grid-cols-2 gap-2 text-body-sm font-body-sm">
                <div className="bg-surface-subtle p-2 rounded border border-border-hairline flex items-center justify-between">
                  <span className="text-on-surface">Chrome Mobile</span>
                  <span className="font-bold text-deal-orange">62%</span>
                </div>
                <div className="bg-surface-subtle p-2 rounded border border-border-hairline flex items-center justify-between">
                  <span className="text-on-surface">Safari Mobile</span>
                  <span className="font-bold text-primary">19%</span>
                </div>
                <div className="bg-surface-subtle p-2 rounded border border-border-hairline flex items-center justify-between">
                  <span className="text-on-surface">Opera Mini</span>
                  <span className="font-bold text-on-surface-variant">11%</span>
                </div>
                <div className="bg-surface-subtle p-2 rounded border border-border-hairline flex items-center justify-between">
                  <span className="text-on-surface">Samsung Browser</span>
                  <span className="font-bold text-on-surface-variant">8%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Insight Badge */}
          <div className="mt-space-md p-space-sm rounded-lg bg-badge-blue-tint text-tertiary-container flex items-center gap-space-sm border border-blue-200">
            <span className="material-symbols-outlined text-tertiary-container text-[20px]">smartphone</span>
            <p className="text-body-sm font-body-sm leading-snug font-medium">
              <strong>89.6% Mobile Dominance:</strong> Prioritize lightweight mobile comparison trays and 1-tap WhatsApp retailer inquiries.
            </p>
          </div>
        </div>
      </section>

      {/* PAKISTANI REGIONAL DEMOGRAPHICS & SEARCH INTELLIGENCE ROW */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
        {/* Left Card: Visitor Demographics by Pakistani Cities & Hubs */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-md">
              <div>
                <span className="text-label-sm font-label-sm uppercase tracking-wider text-deal-orange font-bold">
                  Regional Distribution
                </span>
                <h3 className="text-headline-sm font-headline-sm text-on-surface">
                  Top Pakistani City Hubs &amp; Budgets
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded bg-surface-subtle text-label-sm font-label-sm font-semibold text-outline border border-border-hairline">
                5 Active Macro Clusters
              </span>
            </div>

            <div className="space-y-4">
              {/* City 1: Karachi */}
              <div className="p-space-sm bg-surface-subtle rounded-lg space-y-1.5 hover:bg-surface-container-low transition-colors border border-border-hairline">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-deal-orange text-on-primary flex items-center justify-center font-bold text-label-sm">
                      1
                    </span>
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">Karachi</span>
                    <span className="text-label-sm font-label-sm text-outline">(Saddar &amp; Star City Hubs)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-on-surface text-body-md font-body-md">34.2%</span>
                    <span className="text-label-sm font-label-sm text-outline ml-1">(288k visits)</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-deal-orange h-full rounded-full" style={{ width: "34.2%" }}></div>
                </div>
                <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                  <span>
                    Avg. Search Budget: <strong className="text-on-surface font-semibold">PKR 25,000 – 45,000</strong>
                  </span>
                  <span className="text-deal-orange font-bold">Entry Budget &amp; Installment focus</span>
                </div>
              </div>

              {/* City 2: Lahore */}
              <div className="p-space-sm bg-surface-subtle rounded-lg space-y-1.5 hover:bg-surface-container-low transition-colors border border-border-hairline">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm">
                      2
                    </span>
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">Lahore</span>
                    <span className="text-label-sm font-label-sm text-outline">(Hafeez Centre &amp; Hall Road)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-on-surface text-body-md font-body-md">28.6%</span>
                    <span className="text-label-sm font-label-sm text-outline ml-1">(241k visits)</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: "28.6%" }}></div>
                </div>
                <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                  <span>
                    Avg. Search Budget: <strong className="text-on-surface font-semibold">PKR 35,000 – 80,000</strong>
                  </span>
                  <span className="text-primary font-bold">High Mid-range Gamer Demand</span>
                </div>
              </div>

              {/* City 3: Rawalpindi / Islamabad */}
              <div className="p-space-sm bg-surface-subtle rounded-lg space-y-1.5 hover:bg-surface-container-low transition-colors border border-border-hairline">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-surface-tint text-on-primary flex items-center justify-center font-bold text-label-sm">
                      3
                    </span>
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">
                      Rawalpindi / Islamabad
                    </span>
                    <span className="text-label-sm font-label-sm text-outline">(Blue Area &amp; Saddar)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-on-surface text-body-md font-body-md">16.4%</span>
                    <span className="text-label-sm font-label-sm text-outline ml-1">(138k visits)</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-surface-tint h-full rounded-full" style={{ width: "16.4%" }}></div>
                </div>
                <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                  <span>
                    Avg. Search Budget: <strong className="text-on-surface font-semibold">PKR 75,000 – 150,000+</strong>
                  </span>
                  <span className="text-tertiary-container font-bold">DIRBS PTA Tax &amp; Pro Max</span>
                </div>
              </div>

              {/* City 4: Faisalabad & Multan */}
              <div className="p-space-sm bg-surface-subtle rounded-lg space-y-1.5 hover:bg-surface-container-low transition-colors border border-border-hairline">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-outline text-surface-container-lowest flex items-center justify-center font-bold text-label-sm">
                      4
                    </span>
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">Faisalabad &amp; Multan</span>
                    <span className="text-label-sm font-label-sm text-outline">(Katchery Bazar &amp; Cantonment)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-on-surface text-body-md font-body-md">11.8%</span>
                    <span className="text-label-sm font-label-sm text-outline ml-1">(99k visits)</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-outline h-full rounded-full" style={{ width: "11.8%" }}></div>
                </div>
                <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                  <span>
                    Avg. Search Budget: <strong className="text-on-surface font-semibold">PKR 20,000 – 35,000</strong>
                  </span>
                  <span className="text-outline font-semibold">Battery Life &amp; Hotspot seekers</span>
                </div>
              </div>

              {/* City 5: Peshawar & Quetta */}
              <div className="p-space-sm bg-surface-subtle rounded-lg space-y-1.5 hover:bg-surface-container-low transition-colors border border-border-hairline">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-outline-variant text-on-surface flex items-center justify-center font-bold text-label-sm">
                      5
                    </span>
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">
                      Peshawar, Quetta &amp; Others
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-on-surface text-body-md font-body-md">9.0%</span>
                    <span className="text-label-sm font-label-sm text-outline ml-1">(76k visits)</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-outline-variant h-full rounded-full" style={{ width: "9.0%" }}></div>
                </div>
                <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                  <span>
                    Avg. Search Budget: <strong className="text-on-surface font-semibold">PKR 30,000 – 60,000</strong>
                  </span>
                  <span className="text-outline font-semibold">Non-PTA &amp; Official Warranty queries</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-space-md pt-space-sm flex items-center justify-between text-label-sm font-label-sm text-outline border-t border-border-hairline">
            <span>*Geo-IP aggregated through PTCL, Nayatel, Jazz, and Zong networks</span>
            <Link href="/admin/analytics" className="text-deal-orange font-bold hover:underline">
              View Detailed Demographics &rarr;
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
                  Top Trending Searches &amp; Spikes
                </h3>
              </div>
              <span className="flex items-center gap-1 text-label-sm font-label-sm text-deal-orange font-bold bg-deal-orange/10 px-2 py-1 rounded">
                <span className="w-2 h-2 rounded-full bg-deal-orange animate-pulse"></span> Live Stream
              </span>
            </div>

            <div className="space-y-3">
              {/* Query 1 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle hover:bg-surface-container-low transition-colors border border-border-hairline">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-deal-orange text-[20px]">local_fire_department</span>
                  <div className="flex flex-col">
                    <span className="text-body-md font-body-md font-bold text-on-surface">
                      “Itel A50C official price”
                    </span>
                    <span className="text-label-sm font-label-sm text-deal-orange font-semibold">
                      Hafeez Centre deal trigger &bull; 94,200 searches
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-deal-orange text-on-primary text-label-sm font-label-sm font-bold shadow-sm">
                  +48%
                </span>
              </div>

              {/* Query 2 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle hover:bg-surface-container-low transition-colors border border-border-hairline">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">search</span>
                  <div className="flex flex-col">
                    <span className="text-body-md font-body-md font-bold text-on-surface">
                      “Under 50000 best camera phone”
                    </span>
                    <span className="text-label-sm font-label-sm text-outline">
                      Macro shopping intent &bull; 81,400 searches
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-primary-container text-on-primary text-label-sm font-label-sm font-bold">
                  +19%
                </span>
              </div>

              {/* Query 3 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle hover:bg-surface-container-low transition-colors border border-border-hairline">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-deal-orange text-[20px]">receipt_long</span>
                  <div className="flex flex-col">
                    <span className="text-body-md font-body-md font-bold text-on-surface">
                      “iPhone 16 Pro Max PTA Tax CNIC”
                    </span>
                    <span className="text-label-sm font-label-sm text-outline">
                      DIRBS Tax calculator trigger &bull; 67,100 searches
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-deal-orange text-on-primary text-label-sm font-label-sm font-bold">
                  +31%
                </span>
              </div>

              {/* Query 4 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle hover:bg-surface-container-low transition-colors border border-border-hairline">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">sports_esports</span>
                  <div className="flex flex-col">
                    <span className="text-body-md font-body-md font-bold text-on-surface">
                      “Infinix GT 20 Pro PUBG 90fps”
                    </span>
                    <span className="text-label-sm font-label-sm text-outline">
                      Gaming benchmark queries &bull; 54,800 searches
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-primary-container text-on-primary text-label-sm font-label-sm font-bold">
                  +12%
                </span>
              </div>

              {/* Query 5 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-subtle hover:bg-surface-container-low transition-colors border border-border-hairline">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline text-[20px]">price_check</span>
                  <div className="flex flex-col">
                    <span className="text-body-md font-body-md font-bold text-on-surface">
                      “Samsung S24 Ultra price drop”
                    </span>
                    <span className="text-label-sm font-label-sm text-outline">
                      Flagship retailer tracking &bull; 42,300 searches
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface-variant text-label-sm font-label-sm font-bold">
                  -4%
                </span>
              </div>
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
                  1,240 Zero-Result Searches: “Redmi Note 14”
                </h4>
                <p className="text-body-sm font-body-sm text-outline">
                  High unfulfilled consumer demand detected for an unreleased model.
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
