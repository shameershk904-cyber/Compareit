"use client";

import { useState } from "react";
import {
  History,
  Download,
  Search,
  RefreshCw,
  Layers,
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface ActivityRecord {
  id: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: any;
  createdAt: string;
}

interface ActivityClientProps {
  initialLogs: ActivityRecord[];
  totalCount: number;
}

export function ActivityClient({ initialLogs, totalCount: initialTotal }: ActivityClientProps) {
  const [logs, setLogs] = useState<ActivityRecord[]>(initialLogs);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const limit = 20;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const fetchLogs = async (newPage = 1, actionFilter = selectedAction, searchVal = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: newPage.toString(),
        limit: limit.toString(),
      });
      if (actionFilter && actionFilter !== "ALL") params.set("action", actionFilter);
      if (searchVal.trim()) params.set("search", searchVal.trim());

      const res = await fetch(`/api/admin/activity?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalCount(data.pagination?.totalCount || 0);
        setPage(newPage);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionChange = (act: string) => {
    setSelectedAction(act);
    fetchLogs(1, act, search);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1, selectedAction, search);
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({ export: "csv" });
    if (selectedAction !== "ALL") params.set("action", selectedAction);
    if (search.trim()) params.set("search", search.trim());
    window.location.href = `/api/admin/activity?${params.toString()}`;
  };

  const copyDetailsToClipboard = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.details, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper badge color
  const getActionBadge = (action: string) => {
    if (action.startsWith("CREATE")) {
      return "bg-badge-emerald-tint text-secondary border border-emerald-300";
    }
    if (action.startsWith("UPDATE") || action === "PASSWORD_CHANGED") {
      return "bg-deal-orange/10 text-deal-orange border border-deal-orange/20";
    }
    if (action.startsWith("DELETE")) {
      return "bg-rose-500/10 text-rose-600 border border-rose-200";
    }
    if (action.startsWith("INVITE")) {
      return "bg-badge-blue-tint text-tertiary-container border border-blue-200";
    }
    return "bg-surface-subtle text-on-surface-variant border border-border-hairline";
  };

  return (
    <div className="space-y-space-lg max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-deal-orange animate-ping"></span>
            <span className="text-label-sm font-label-sm tracking-wider uppercase text-deal-orange font-bold">
              Tamper-Evident Trail
            </span>
          </div>
          <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight mt-1 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-deal-orange text-[26px]">history</span>
            <span>Audit &amp; Activity Logs</span>
          </h1>
          <p className="text-body-sm font-body-sm text-outline mt-0.5">
            Complete audit trail of administrative events, content updates, and access controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLogs(page)}
            disabled={loading}
            className="p-2.5 rounded-lg bg-surface-subtle hover:bg-surface-container-low border border-border-hairline text-outline hover:text-on-surface transition-all cursor-pointer disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-deal-orange" : ""}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary-container hover:bg-inverse-surface text-on-primary text-label-md font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-space-md rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by action, email, or entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-20 py-2 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm text-on-surface placeholder-outline focus:outline-none focus:border-deal-orange transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-surface-container-lowest border border-border-hairline text-label-sm font-semibold text-on-surface hover:bg-surface-container"
            >
              Search
            </button>
          </form>

          {/* Quick Action Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "ALL", label: "All Events" },
              { id: "CREATE_BANNER", label: "Create Banner" },
              { id: "UPDATE_BANNER", label: "Update Banner" },
              { id: "DELETE_BANNER", label: "Delete Banner" },
              { id: "PASSWORD_CHANGED", label: "Password" },
              { id: "INVITE_USER", label: "User Invites" },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => handleActionChange(chip.id)}
                className={`px-3 py-1.5 rounded-lg text-label-sm font-label-sm whitespace-nowrap transition-all border ${
                  selectedAction === chip.id
                    ? "bg-primary-container text-on-primary border-primary-container font-bold shadow-sm"
                    : "bg-surface-subtle border-border-hairline text-outline hover:text-on-surface hover:border-outline"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl bg-surface-container-lowest border border-border-hairline overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm font-body-sm">
            <thead className="bg-surface-subtle border-b border-border-hairline text-outline font-semibold uppercase tracking-wider text-label-sm">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Admin User</th>
                <th className="py-3 px-4">Details &amp; Payload</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-outline">
                    <History className="w-8 h-8 mx-auto mb-2 text-outline" />
                    <p className="text-body-md font-semibold text-on-surface">No activity records match your criteria</p>
                    <p className="text-body-sm text-outline mt-0.5">Admin operations will appear here in real time</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const date = new Date(log.createdAt);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-on-surface">
                          <Layers className="w-3.5 h-3.5 text-outline" />
                          <span>{log.entity}</span>
                          {log.entityId && (
                            <span className="text-[11px] text-outline font-mono">
                              ({log.entityId.slice(0, 8)}...)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-[10px]">
                            {log.userEmail.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-on-surface font-medium">{log.userEmail}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="truncate text-outline font-mono text-body-sm">
                          {log.details ? JSON.stringify(log.details) : "—"}
                        </p>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-outline text-label-sm font-mono">
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 rounded bg-surface-subtle group-hover:bg-deal-orange group-hover:text-on-primary text-on-surface text-label-sm font-semibold transition-all border border-border-hairline"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-border-hairline flex flex-col sm:flex-row items-center justify-between gap-3 text-body-sm text-outline bg-surface-subtle/50">
          <div>
            Showing <span className="font-semibold text-on-surface">{logs.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{" "}
            <span className="font-semibold text-on-surface">{Math.min(page * limit, totalCount)}</span> of{" "}
            <span className="font-semibold text-on-surface">{totalCount}</span> events
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-border-hairline text-on-surface hover:bg-surface-container-low disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-2 font-mono text-label-sm text-outline">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-border-hairline text-on-surface hover:bg-surface-container-low disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-xl bg-surface-container-lowest border border-border-hairline p-6 shadow-2xl space-y-4 text-on-surface">
            <div className="flex items-center justify-between border-b border-border-hairline pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded text-label-sm font-mono font-bold ${getActionBadge(
                    selectedLog.action
                  )}`}
                >
                  {selectedLog.action}
                </span>
                <span className="text-label-sm text-outline font-mono">ID: {selectedLog.id}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg hover:bg-surface-subtle text-outline hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-body-sm">
              <div className="p-3 rounded-lg bg-surface-subtle border border-border-hairline">
                <span className="text-outline block mb-0.5 text-label-sm">Admin Email</span>
                <span className="text-on-surface font-semibold">{selectedLog.userEmail}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-subtle border border-border-hairline">
                <span className="text-outline block mb-0.5 text-label-sm">Entity / Target</span>
                <span className="text-on-surface font-semibold">
                  {selectedLog.entity} {selectedLog.entityId ? `(${selectedLog.entityId})` : ""}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-subtle border border-border-hairline col-span-2">
                <span className="text-outline block mb-0.5 text-label-sm">Recorded Timestamp</span>
                <span className="text-on-surface font-mono">{new Date(selectedLog.createdAt).toUTCString()}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-label-md font-semibold text-on-surface">Payload Details (JSON)</span>
                <button
                  onClick={copyDetailsToClipboard}
                  className="flex items-center gap-1 text-label-sm text-deal-orange font-bold hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy JSON"}</span>
                </button>
              </div>

              <div className="p-4 rounded-lg bg-surface-subtle border border-border-hairline font-mono text-body-sm text-on-surface overflow-x-auto max-h-60 scrollbar-thin">
                <pre>{JSON.stringify(selectedLog.details || {}, null, 2)}</pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-label-md font-semibold border border-border-hairline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
