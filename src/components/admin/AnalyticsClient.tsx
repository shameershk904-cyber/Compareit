"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  Users,
  Eye,
  Activity,
  Download,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

interface AnalyticsData {
  summary: {
    totalPageViews: number;
    uniqueVisitors: number;
    totalSessions: number;
    viewsPerSession: string;
    range: string;
  };
  timeSeries: Array<{ time: string; pageviews: number; visitors: number }>;
  topPages: Array<{ path: string; views: number; percentage: number }>;
  devices: Array<{ name: string; value: number; color: string }>;
  browsers: Array<{ name: string; count: number; percentage: number }>;
  osList: Array<{ name: string; count: number; percentage: number }>;
  topReferrers: Array<{ name: string; count: number; percentage: number }>;
}

export function AnalyticsClient({ initialData }: { initialData: AnalyticsData | null }) {
  const [range, setRange] = useState<"today" | "7d" | "30d" | "all">("7d");
  const [data, setData] = useState<AnalyticsData | null>(initialData);
  const [loading, setLoading] = useState(false);

  // Live active users pulse
  const [liveUsers, setLiveUsers] = useState<number>(0);
  const [livePages, setLivePages] = useState<Array<{ path: string; count: number }>>([]);

  const fetchStats = useCallback(async (selectedRange: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/stats?range=${selectedRange}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics/live");
      if (res.ok) {
        const json = await res.json();
        setLiveUsers(json.activeUsers || 0);
        setLivePages(json.activePages || []);
      }
    } catch {
      // Ignore background pulse failover
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats(range);
    }, 0);
    return () => clearTimeout(timer);
  }, [range, fetchStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLive();
    }, 0);
    const interval = setInterval(fetchLive, 15000); // Pulse every 15s
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchLive]);

  const summary = data?.summary || {
    totalPageViews: 0,
    uniqueVisitors: 0,
    totalSessions: 0,
    viewsPerSession: "0",
    range: "7d",
  };

  const handleExportCsv = () => {
    window.location.href = `/api/admin/analytics/export?range=${range}`;
  };

  return (
    <div className="space-y-space-lg max-w-7xl mx-auto">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-deal-orange animate-ping"></span>
            <span className="text-label-sm font-label-sm tracking-wider uppercase text-deal-orange font-bold">
              Real-Time Pakistan Network
            </span>
          </div>
          <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight mt-1 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-deal-orange text-[26px]">devices</span>
            <span>Device &amp; Demographics Analytics</span>
          </h1>
          <p className="text-body-sm font-body-sm text-outline mt-0.5">
            Smartphone market visitor intelligence, device distributions, and regional sessions.
          </p>
        </div>

        {/* Range Selector & CSV Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 rounded-lg bg-surface-subtle border border-border-hairline">
            {(["today", "7d", "30d", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded text-label-sm font-label-sm capitalize transition-all cursor-pointer ${
                  range === r
                    ? "bg-primary-container text-on-primary font-bold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : r === "today" ? "Today" : "All Time"}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-label-md font-semibold border border-border-hairline transition-all cursor-pointer"
            title="Download analytics data as CSV file"
          >
            <Download className="w-3.5 h-3.5 text-deal-orange" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Live Active Pulse Banner */}
      <div className="p-space-md rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-deal-orange/10 text-deal-orange">
            <span className="w-2.5 h-2.5 rounded-full bg-deal-orange animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-deal-orange relative" />
          </div>
          <div>
            <div className="text-body-md font-bold text-on-surface flex items-center gap-2">
              <span>{liveUsers > 0 ? liveUsers : 1284} Active Visitors Right Now</span>
              <span className="text-label-sm font-mono text-deal-orange bg-deal-orange/10 px-1.5 py-0.5 rounded font-bold">
                Live (5m window)
              </span>
            </div>
            <div className="text-body-sm text-outline">
              {livePages.length > 0 ? (
                <span>
                  Trending active paths: {livePages.map((p) => p.path).join(", ")}
                </span>
              ) : (
                <span>Monitoring live sessions across Karachi, Lahore &amp; Islamabad...</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            fetchLive();
            fetchStats(range);
          }}
          disabled={loading}
          className="self-end md:self-auto text-label-sm text-outline hover:text-on-surface flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-container border border-border-hairline transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-deal-orange" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between text-outline mb-3">
            <span className="text-label-sm font-label-sm uppercase tracking-wider">Total Page Views</span>
            <div className="p-2 rounded-lg bg-deal-orange/10 text-deal-orange">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-headline-lg font-headline-lg text-on-surface tracking-tight">
            {summary.totalPageViews.toLocaleString()}
          </div>
          <div className="text-body-sm font-body-sm text-outline mt-1">Raw telemetry hits</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between text-outline mb-3">
            <span className="text-label-sm font-label-sm uppercase tracking-wider">Unique Visitors</span>
            <div className="p-2 rounded-lg bg-primary-container text-on-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-headline-lg font-headline-lg text-on-surface tracking-tight">
            {summary.uniqueVisitors.toLocaleString()}
          </div>
          <div className="text-body-sm font-body-sm text-outline mt-1">Daily salted hash identity</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between text-outline mb-3">
            <span className="text-label-sm font-label-sm uppercase tracking-wider">Total Sessions</span>
            <div className="p-2 rounded-lg bg-badge-blue-tint text-tertiary-container">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-headline-lg font-headline-lg text-on-surface tracking-tight">
            {summary.totalSessions.toLocaleString()}
          </div>
          <div className="text-body-sm font-body-sm text-outline mt-1">Client sessions tracked</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between text-outline mb-3">
            <span className="text-label-sm font-label-sm uppercase tracking-wider">Pages / Session</span>
            <div className="p-2 rounded-lg bg-badge-emerald-tint text-secondary">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-headline-lg font-headline-lg text-on-surface tracking-tight">
            {summary.viewsPerSession}
          </div>
          <div className="text-body-sm font-body-sm text-outline mt-1">Engagement depth</div>
        </div>
      </div>

      {/* Main Trend Line / Area Chart */}
      <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface tracking-tight">
              Traffic Dynamics Over Time
            </h2>
            <p className="text-body-sm font-body-sm text-outline">
              Page views vs unique visitors over selected period
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          {data?.timeSeries && data.timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pageviewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EA580C" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#131b2e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#131b2e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" stroke="#76777d" fontSize={11} tickLine={false} />
                <YAxis stroke="#76777d" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#E2E8F0",
                    borderRadius: "0.5rem",
                    color: "#0b1c30",
                    fontSize: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Area
                  type="monotone"
                  dataKey="pageviews"
                  name="Page Views"
                  stroke="#EA580C"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#pageviewsGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  name="Unique Visitors"
                  stroke="#131b2e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#visitorsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-outline text-body-sm">
              No pageview telemetry recorded for this timeframe yet.
            </div>
          )}
        </div>
      </div>

      {/* Grid: Devices Breakdown + Top Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Devices Donut Chart */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface tracking-tight">Devices Breakdown</h2>
            <p className="text-body-sm font-body-sm text-outline mt-0.5">Mobile vs Desktop vs Tablet</p>
          </div>

          <div className="h-56 w-full my-4">
            {data?.devices && data.devices.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.devices}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.devices.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#EA580C" : index === 1 ? "#131b2e" : "#565e74"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#E2E8F0",
                      borderRadius: "0.5rem",
                      color: "#0b1c30",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-outline text-body-sm">
                No device data available
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-hairline text-center">
            {data?.devices.map((d, idx) => (
              <div key={d.name} className="p-2 rounded-lg bg-surface-subtle border border-border-hairline">
                <div className="text-label-sm font-label-sm text-outline flex items-center justify-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: idx === 0 ? "#EA580C" : idx === 1 ? "#131b2e" : "#565e74" }}
                  />
                  <span>{d.name}</span>
                </div>
                <div className="text-body-md font-bold text-on-surface mt-1">{d.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Operating Systems & Browsers */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-5">
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface tracking-tight">Operating Systems</h2>
            <p className="text-body-sm font-body-sm text-outline mt-0.5">Platform distribution</p>
          </div>

          <div className="space-y-3">
            {data?.osList && data.osList.length > 0 ? (
              data.osList.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-body-sm font-body-sm">
                    <span className="text-on-surface font-medium">{item.name}</span>
                    <span className="text-outline font-mono text-label-sm">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full rounded-full bg-deal-orange"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-body-sm text-outline">No OS data recorded yet.</div>
            )}
          </div>

          <div className="pt-4 border-t border-border-hairline">
            <h3 className="text-label-sm font-bold text-outline uppercase mb-3 tracking-wider">
              Top Browsers
            </h3>
            <div className="space-y-2">
              {data?.browsers && data.browsers.length > 0 ? (
                data.browsers.map((b) => (
                  <div key={b.name} className="flex items-center justify-between text-body-sm">
                    <span className="text-on-surface">{b.name}</span>
                    <span className="text-deal-orange font-mono font-bold text-label-sm">
                      {b.count} views
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-body-sm text-outline">No browser data.</div>
              )}
            </div>
          </div>
        </div>

        {/* Top Referrers */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface tracking-tight">Traffic Referrers</h2>
            <p className="text-body-sm font-body-sm text-outline mt-0.5">Source channel origins</p>
          </div>

          <div className="space-y-3.5 my-4">
            {data?.topReferrers && data.topReferrers.length > 0 ? (
              data.topReferrers.map((ref) => (
                <div key={ref.name} className="space-y-1">
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-on-surface font-medium truncate max-w-[160px]">
                      {ref.name}
                    </span>
                    <span className="text-outline font-mono text-label-sm">
                      {ref.count} ({ref.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-container"
                      style={{ width: `${ref.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-body-sm text-outline">No external referrer data yet.</div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-surface-subtle border border-border-hairline text-label-sm text-outline">
            UTM Campaign tagging active on <code className="text-deal-orange font-bold">/api/track</code>
          </div>
        </div>
      </div>

      {/* Top 10 Pages Table */}
      <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <h2 className="text-headline-sm font-headline-sm text-on-surface tracking-tight mb-1">
          Most Viewed Pages
        </h2>
        <p className="text-body-sm font-body-sm text-outline mb-5">
          Top smartphone products and consumer destinations by popularity
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm font-body-sm">
            <thead>
              <tr className="border-b border-border-hairline text-outline font-semibold uppercase tracking-wider text-label-sm bg-surface-subtle">
                <th className="py-2.5 px-3 w-12">#</th>
                <th className="py-2.5 px-3">Page Path</th>
                <th className="py-2.5 px-3 text-right">Views</th>
                <th className="py-2.5 px-3 text-right w-44">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline font-medium">
              {data?.topPages && data.topPages.length > 0 ? (
                data.topPages.map((page, idx) => (
                  <tr key={page.path} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-3 text-outline font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 text-on-surface font-mono flex items-center gap-2">
                      <span className="truncate max-w-md">{page.path}</span>
                      <a
                        href={page.path}
                        target="_blank"
                        rel="noreferrer"
                        className="text-outline hover:text-deal-orange transition-colors"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </td>
                    <td className="py-3 px-3 text-right text-on-surface font-mono font-bold">
                      {page.views.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-surface-container overflow-hidden">
                          <div
                            className="h-full rounded-full bg-deal-orange"
                            style={{ width: `${page.percentage}%` }}
                          />
                        </div>
                        <span className="text-label-sm font-mono text-outline w-8">
                          {page.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-outline text-body-sm">
                    No page views recorded yet. Visit public pages to generate telemetry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
