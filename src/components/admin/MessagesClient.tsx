"use client";

import { useState, useMemo } from "react";
import {
  Mail,
  MailOpen,
  CheckCircle2,
  Trash2,
  Search,
  Clock,
  User,
  Tag,
  ExternalLink,
  Archive,
  RefreshCw,
  AlertCircle,
  X,
  Send,
  MessageSquare,
  FileEdit,
  Inbox,
} from "lucide-react";

export type MessageStatus = "UNREAD" | "READ" | "RESOLVED" | "ARCHIVED";

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  inquiry: string;
  subject: string;
  message: string;
  status: MessageStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

const INQUIRY_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: string }
> = {
  price_report: {
    label: "Price Report",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    icon: "🚨",
  },
  missing_phone: {
    label: "Missing Phone",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "📱",
  },
  partnership: {
    label: "Partnership",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "🤝",
  },
  data_update: {
    label: "Data Update",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "🔄",
  },
  technical: {
    label: "Bug Report",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    icon: "🐛",
  },
  general: {
    label: "General",
    badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200",
    icon: "💬",
  },
};

const STATUS_CONFIG: Record<
  MessageStatus,
  { label: string; badgeClass: string }
> = {
  UNREAD: {
    label: "Unread",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200 font-semibold",
  },
  READ: {
    label: "Read",
    badgeClass: "bg-zinc-100 text-zinc-600 border-zinc-200",
  },
  RESOLVED: {
    label: "Resolved",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  ARCHIVED: {
    label: "Archived",
    badgeClass: "bg-zinc-100 text-zinc-500 border-zinc-200 line-through",
  },
};

export function MessagesClient({
  initialMessages,
}: {
  initialMessages: ContactMessageRecord[];
}) {
  const [messages, setMessages] = useState<ContactMessageRecord[]>(initialMessages);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [inquiryFilter, setInquiryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Compute stats
  const totalCount = messages.length;
  const unreadCount = messages.filter((m) => m.status === "UNREAD").length;
  const resolvedCount = messages.filter((m) => m.status === "RESOLVED").length;

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (statusFilter !== "ALL" && msg.status !== statusFilter) return false;
      if (inquiryFilter !== "ALL" && msg.inquiry !== inquiryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = msg.name.toLowerCase().includes(q);
        const matchesEmail = msg.email.toLowerCase().includes(q);
        const matchesSubject = msg.subject.toLowerCase().includes(q);
        const matchesBody = msg.message.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesSubject && !matchesBody) {
          return false;
        }
      }
      return true;
    });
  }, [messages, statusFilter, inquiryFilter, searchQuery]);

  // Refresh messages from server
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open modal and optionally mark as read
  const handleOpenMessage = async (msg: ContactMessageRecord) => {
    setSelectedMessage(msg);
    setAdminNote(msg.notes || "");

    // If it is unread, automatically mark as read
    if (msg.status === "UNREAD") {
      updateStatus(msg.id, "READ");
    }
  };

  // Update status
  const updateStatus = async (id: string, newStatus: MessageStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
        );
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Save admin notes
  const handleSaveNotes = async () => {
    if (!selectedMessage) return;
    setIsSavingNote(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedMessage.id, notes: adminNote }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === selectedMessage.id ? { ...m, notes: adminNote } : m
          )
        );
        setSelectedMessage((prev) =>
          prev ? { ...prev, notes: adminNote } : null
        );
      }
    } catch (err) {
      console.error("Save note error:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Delete message
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this message?")) return;

    try {
      const res = await fetch(`/api/admin/messages?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Stats ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Customer Inquiries &amp; Messages
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold border border-orange-200">
              {unreadCount} Unread
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            Real-time messages submitted by visitors on the Contact Us page.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-zinc-200 rounded-xl text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition shadow-sm self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Feed
        </button>
      </div>

      {/* ── Quick KPI Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Total Inquiries
            </p>
            <p className="text-2xl font-bold text-zinc-900 mt-0.5">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
              Requires Attention
            </p>
            <p className="text-2xl font-bold text-orange-600 mt-0.5">{unreadCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Resolved Cases
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{resolvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Filter Controls Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sender, email, subject, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-500 whitespace-nowrap">
              Inquiry Type:
            </label>
            <select
              value={inquiryFilter}
              onChange={(e) => setInquiryFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
            >
              <option value="ALL">All Inquiries</option>
              <option value="price_report">🚨 Report Incorrect Price</option>
              <option value="missing_phone">📱 Missing Phone Listing</option>
              <option value="partnership">🤝 Partnership / Advertising</option>
              <option value="data_update">🔄 Request Data Update</option>
              <option value="technical">🐛 Technical Issue / Bug</option>
              <option value="general">💬 General Inquiry</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-zinc-100">
          {[
            { id: "ALL", label: "All Messages", count: totalCount },
            { id: "UNREAD", label: "Unread", count: unreadCount },
            { id: "READ", label: "Read", count: messages.filter((m) => m.status === "READ").length },
            { id: "RESOLVED", label: "Resolved", count: resolvedCount },
            { id: "ARCHIVED", label: "Archived", count: messages.filter((m) => m.status === "ARCHIVED").length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id
                    ? "bg-zinc-700 text-zinc-100"
                    : "bg-zinc-200 text-zinc-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages List / Table ── */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
        {filteredMessages.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-800">No messages found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              {searchQuery || statusFilter !== "ALL" || inquiryFilter !== "ALL"
                ? "Try adjusting your filters or search keywords."
                : "No customer messages have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredMessages.map((msg) => {
              const inq = INQUIRY_CONFIG[msg.inquiry] || {
                label: msg.inquiry,
                badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200",
                icon: "📌",
              };
              const stat = STATUS_CONFIG[msg.status] || STATUS_CONFIG.READ;
              const isUnread = msg.status === "UNREAD";

              return (
                <div
                  key={msg.id}
                  onClick={() => handleOpenMessage(msg)}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition hover:bg-zinc-50/80 ${
                    isUnread ? "bg-orange-50/30 font-medium" : "bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Status indicator dot */}
                    <div className="pt-1 shrink-0">
                      {isUnread ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 block animate-pulse" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 block" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      {/* Top line: Sender & Category Badge */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-zinc-900 truncate">
                          {msg.name}
                        </span>
                        <span className="text-xs text-zinc-400">
                          &bull; {msg.email}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold inline-flex items-center gap-1 ${inq.badgeClass}`}
                        >
                          <span>{inq.icon}</span>
                          <span>{inq.label}</span>
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border ${stat.badgeClass}`}
                        >
                          {stat.label}
                        </span>
                      </div>

                      {/* Subject */}
                      <h4
                        className={`text-sm truncate text-zinc-900 ${
                          isUnread ? "font-bold" : "font-semibold"
                        }`}
                      >
                        {msg.subject}
                      </h4>

                      {/* Message preview snippet */}
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                        {msg.message}
                      </p>

                      {/* Note indicator if exists */}
                      {msg.notes && (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded w-fit border border-amber-200">
                          <FileEdit className="w-3 h-3" />
                          <span className="line-clamp-1">Note: {msg.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Date & Action buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-100">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(msg.createdAt)}
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                        title="Reply via Email"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-orange-600 hover:bg-orange-50 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </a>

                      {msg.status !== "RESOLVED" && (
                        <button
                          onClick={() => updateStatus(msg.id, "RESOLVED")}
                          title="Mark as Resolved"
                          disabled={updatingId === msg.id}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(msg.id)}
                        title="Delete Message"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Slide-Over / Detail Modal ── */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-100 flex items-start justify-between bg-zinc-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-md border font-semibold ${
                      INQUIRY_CONFIG[selectedMessage.inquiry]?.badgeClass || "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {INQUIRY_CONFIG[selectedMessage.inquiry]?.icon}{" "}
                    {INQUIRY_CONFIG[selectedMessage.inquiry]?.label || selectedMessage.inquiry}
                  </span>
                  <span className="text-xs text-zinc-400">
                    Received {new Date(selectedMessage.createdAt).toLocaleString("en-PK")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mt-1">
                  {selectedMessage.subject}
                </h3>
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Sender Details */}
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {selectedMessage.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 leading-tight">
                      {selectedMessage.name}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {selectedMessage.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                      selectedMessage.subject
                    )}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Reply via Email
                  </a>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Message Content
                </label>
                <div className="p-4 bg-white border border-zinc-200 rounded-2xl text-zinc-800 text-sm whitespace-pre-wrap leading-relaxed shadow-xs">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Status Switcher */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Update Inquiry Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["UNREAD", "READ", "RESOLVED", "ARCHIVED"] as MessageStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => updateStatus(selectedMessage.id, st)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition text-center ${
                          selectedMessage.status === st
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                        }`}
                      >
                        {STATUS_CONFIG[st].label}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Internal Admin Notes
                </label>
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Add private notes for your team (e.g., 'Checked Hafeez Centre price, updated phone entry')..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full p-3 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNote}
                    className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-semibold transition disabled:opacity-50"
                  >
                    {isSavingNote ? "Saving..." : "Save Note"}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <button
                onClick={() => handleDelete(selectedMessage.id)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Inquiry
              </button>
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition"
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

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const mins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return `${mins}m ago`;
    }
    if (diffHours < 24) {
      return `${Math.round(diffHours)}h ago`;
    }
    if (diffHours < 48) {
      return "Yesterday";
    }
    return d.toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}
