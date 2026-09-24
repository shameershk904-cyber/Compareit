"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  AlertCircle,
  TrendingUp,
  MousePointerClick,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Clock,
} from "lucide-react";

interface KeywordData {
  query: string;
  normalized: string;
  count: number;
  resultsCount: number;
  clicks: number;
  lastSearched: string;
}

interface SearchStats {
  summary: {
    totalSearches: number;
    uniqueKeywords: number;
    zeroResultCount: number;
    ctr: number;
    range: string;
  };
  topKeywords: KeywordData[];
  zeroResults: KeywordData[];
  recentSearches: Array<{
    id: string;
    query: string;
    resultsCount: number;
    clickedResult: string | null;
    createdAt: string;
  }>;
}

export function SearchClient({ initialData }: { initialData: SearchStats | null }) {
  const [range, setRange] = useState<"today" | "7d" | "30d" | "all">("7d");
  const [data, setData] = useState<SearchStats | null>(initialData);
  const [activeTab, setActiveTab] = useState<"top" | "zero" | "recent">("top");
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async (selectedRange: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/search/stats?range=${selectedRange}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Search fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(range);
  }, [range, fetchStats]);

  const summary = data?.summary || {
    totalSearches: 0,
    uniqueKeywords: 0,
    zeroResultCount: 0,
    ctr: 0,
    range: "7d",
  };

  return (
    <div className="space-y-space-lg max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-deal-orange animate-ping"></span>
            <span className="text-label-sm font-label-sm tracking-wider uppercase text-deal-orange font-bold">
              Consumer Demand Intelligence
            </span>
          </div>
          <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight mt-1 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-deal-orange text-[26px]">query_stats</span>
            <span>Search Monitoring &amp; Keyword Intelligence</span>
          </h1>
          <p className="text-body-sm font-body-sm text-outline mt-0.5">
            Discover unfulfilled demand, missing smartphones, and search-to-click conversion rates across Pakistan.
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-2">
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
            onClick={() => fetchStats(range)}
            disabled={loading}
            className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-outline hover:text-on-surface border border-border-hairline transition-all cursor-pointer"
            title="Refresh search data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-deal-orange" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between text-outline mb-3">
            <span className="text-label-sm font-label-sm uppercase tracking-wider">Total Searches</span>
            <div className="p-2 rounded-lg bg-tertiary-fixed text-tertiary-container">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="text-headline-lg font-headline-lg text-on-surface tracking-tight">
            {summary.totalSearches.toLocaleString()}
          </div>
          <div className="text-body-sm font-body-sm text-outline mt-1">On-site search queries</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between text-outline mb-3">
            <span className="text-label-sm font-label-sm uppercase tracking-wider">Unique Keywords</span>
            <div className="p-2 rounded-lg bg-deal-orange/10 text-deal-orange">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-headline-lg font-headline-lg text-on-surface tracking-tight">
            {summary.uniqueKeywords.toLocaleString()}
          </div>
          <div className="text-body-sm font-body-sm text-outline mt-1">Distinct search intents</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between text-outline mb-3">
            <span className="text-label-sm font-label-sm uppercase tracking-wider">Zero Results</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-headline-lg font-headline-lg text-rose-600 tracking-tight">
            {summary.zeroResultCount.toLocaleString()}
          </div>
          <div className="text-body-sm font-body-sm text-rose-600 font-medium mt-1">Unmatched search demand</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between text-outline mb-3">
            <span className="text-label-sm font-label-sm uppercase tracking-wider">Search CTR</span>
            <div className="p-2 rounded-lg bg-badge-emerald-tint text-secondary">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="text-headline-lg font-headline-lg text-on-surface tracking-tight">
            {summary.ctr}%
          </div>
          <div className="text-body-sm font-body-sm text-outline mt-1">Click conversion rate</div>
        </div>
      </div>

      {/* Opportunity Banner: Zero Results */}
      {data?.zeroResults && data.zeroResults.length > 0 && (
        <div className="p-space-md rounded-xl bg-deal-orange/10 border border-deal-orange/20 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-deal-orange text-on-primary shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-label-lg font-label-lg text-on-surface font-bold flex items-center gap-2">
                <span>Catalog Expansion Opportunities</span>
                <span className="text-[10px] uppercase font-bold bg-deal-orange text-on-primary px-2 py-0.5 rounded shadow-sm">
                  High Demand
                </span>
              </h3>
              <p className="text-body-sm font-body-sm text-outline mt-1 leading-relaxed">
                Users searched for these keywords but found 0 results. Adding these models to your database will immediately capture this unfulfilled traffic:
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {data.zeroResults.slice(0, 8).map((k) => (
                  <span
                    key={k.normalized}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-lowest border border-border-hairline text-body-sm font-mono text-on-surface font-medium"
                  >
                    <span>&ldquo;{k.query}&rdquo;</span>
                    <span className="text-deal-orange font-bold">
                      ({k.count} {k.count === 1 ? "search" : "searches"})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border-hairline pb-3">
        <button
          onClick={() => setActiveTab("top")}
          className={`px-4 py-2 rounded-lg text-label-md font-label-md transition-all cursor-pointer ${
            activeTab === "top"
              ? "bg-primary-container text-on-primary font-bold shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle"
          }`}
        >
          Top Searched Keywords
        </button>
        <button
          onClick={() => setActiveTab("zero")}
          className={`px-4 py-2 rounded-lg text-label-md font-label-md transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "zero"
              ? "bg-deal-orange text-on-primary font-bold shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle"
          }`}
        >
          <span>Zero Results</span>
          {data?.zeroResults?.length ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-container-lowest text-deal-orange font-bold">
              {data.zeroResults.length}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab("recent")}
          className={`px-4 py-2 rounded-lg text-label-md font-label-md transition-all cursor-pointer ${
            activeTab === "recent"
              ? "bg-primary-container text-on-primary font-bold shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle"
          }`}
        >
          Recent Activity Stream
        </button>
      </div>

      {/* Tab Content: Top Keywords */}
      {activeTab === "top" && (
        <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm font-body-sm">
              <thead>
                <tr className="border-b border-border-hairline text-outline font-semibold uppercase tracking-wider text-label-sm font-label-sm bg-surface-subtle">
                  <th className="py-2.5 px-3 w-12">#</th>
                  <th className="py-2.5 px-3">Search Term</th>
                  <th className="py-2.5 px-3 text-right">Volume</th>
                  <th className="py-2.5 px-3 text-right">Avg Results</th>
                  <th className="py-2.5 px-3 text-right">Clicks</th>
                  <th className="py-2.5 px-3 text-right w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-hairline font-medium">
                {data?.topKeywords && data.topKeywords.length > 0 ? (
                  data.topKeywords.map((k, idx) => (
                    <tr key={k.normalized} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-3 text-outline font-mono">{idx + 1}</td>
                      <td className="py-3 px-3 text-on-surface font-semibold">
                        <span>{k.query}</span>
                      </td>
                      <td className="py-3 px-3 text-right text-deal-orange font-mono font-bold">
                        {k.count.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-on-surface-variant font-mono">
                        {k.resultsCount}
                      </td>
                      <td className="py-3 px-3 text-right text-secondary font-mono font-bold">
                        {k.clicks}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <a
                          href={`/?q=${encodeURIComponent(k.query)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-label-sm font-label-sm text-deal-orange hover:underline"
                        >
                          <span>Test</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-outline text-body-sm font-body-sm">
                      No search logs recorded yet. Search in the site header to see keyword demand.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Zero Results */}
      {activeTab === "zero" && (
        <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm font-body-sm">
              <thead>
                <tr className="border-b border-border-hairline text-outline font-semibold uppercase tracking-wider text-label-sm font-label-sm bg-surface-subtle">
                  <th className="py-2.5 px-3 w-12">#</th>
                  <th className="py-2.5 px-3">Missing Keyword / Phone</th>
                  <th className="py-2.5 px-3 text-right">Lost Queries</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                  <th className="py-2.5 px-3 text-right w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-hairline font-medium">
                {data?.zeroResults && data.zeroResults.length > 0 ? (
                  data.zeroResults.map((k, idx) => (
                    <tr key={k.normalized} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-3 text-outline font-mono">{idx + 1}</td>
                      <td className="py-3 px-3 text-rose-600 font-semibold">
                        <span>{k.query}</span>
                      </td>
                      <td className="py-3 px-3 text-right text-rose-600 font-mono font-bold">
                        {k.count}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-200">
                          0 Matches
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <a
                          href={`/?q=${encodeURIComponent(k.query)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-label-sm font-label-sm text-deal-orange hover:underline"
                        >
                          <span>Test</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-outline text-body-sm">
                      No zero-result searches found! All queries returned matches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Recent Searches Feed */}
      {activeTab === "recent" && (
        <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="space-y-3">
            {data?.recentSearches && data.recentSearches.length > 0 ? (
              data.recentSearches.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-lg bg-surface-subtle border border-border-hairline flex items-center justify-between text-body-sm font-body-sm hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-surface-container-lowest border border-border-hairline text-outline">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-on-surface">&ldquo;{s.query}&rdquo;</div>
                      <div className="text-body-sm text-outline mt-0.5">
                        Found {s.resultsCount} {s.resultsCount === 1 ? "result" : "results"}
                        {s.clickedResult && (
                          <span className="text-secondary font-bold ml-2">
                            &bull; Clicked: {s.clickedResult}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-label-sm font-label-sm text-outline font-mono">
                    {new Date(s.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-outline text-body-sm">
                No recent searches in feed.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
