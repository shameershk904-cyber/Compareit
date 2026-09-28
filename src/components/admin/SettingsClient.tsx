"use client";

import { useState } from "react";
import {
  Shield,
  KeyRound,
  Users,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Trash2,
  Database,
  HardDrive,
  Cpu,
  Server,
  X,
  UserPlus,
} from "lucide-react";
import { changePasswordAction } from "@/app/(admin)/admin/actions";

export interface TeamMember {
  id: string;
  name?: string | null;
  email: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  mustChangePassword: boolean;
  createdAt: string;
}

export interface DiagnosticsData {
  status: string;
  timestamp: string;
  totalDurationMs: number;
  environment: {
    nodeEnv: string;
    nodeVersion: string;
    region: string;
  };
  services: {
    database: {
      provider: string;
      status: string;
      latencyMs: number;
      error?: string | null;
    };
    storage: {
      provider: string;
      status: string;
      latencyMs: number;
      details: {
        bucketName: string;
        exists: boolean;
        public: boolean;
      };
      error?: string | null;
    };
    auth: {
      provider: string;
      status: string;
      sessionRole: string;
      sessionEmail: string;
    };
  };
  counts: {
    users: number;
    banners: number;
    pageViews: number;
    searchLogs: number;
    activityLogs: number;
  };
}

interface SettingsClientProps {
  currentUser: {
    id: string;
    name?: string | null;
    email: string;
    role: string;
  };
  initialTeam: TeamMember[];
  initialDiagnostics: DiagnosticsData | null;
}

export function SettingsClient({
  currentUser,
  initialTeam,
  initialDiagnostics,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"team" | "security" | "diagnostics">("team");

  // Team state
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EDITOR" as "ADMIN" | "EDITOR" | "VIEWER",
  });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(initialDiagnostics);
  const [diagLoading, setDiagLoading] = useState(false);

  const isAdmin = currentUser.role === "ADMIN";

  // Handle Team member add
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);

    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create team member");
      }

      setTeam((prev) => [...prev, data.user]);
      setIsInviteModalOpen(false);
      setInviteForm({ name: "", email: "", password: "", role: "EDITOR" });
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Failed to create team member");
    } finally {
      setInviteLoading(false);
    }
  };

  // Handle Role change
  const handleRoleChange = async (userId: string, newRole: "ADMIN" | "EDITOR" | "VIEWER") => {
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        setTeam((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update role");
      }
    } catch {
      alert("Network error updating user role");
    }
  };

  // Handle Remove member
  const handleRemoveMember = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove team access for ${email}?`)) return;

    try {
      const res = await fetch(`/api/admin/team?id=${userId}`, { method: "DELETE" });
      if (res.ok) {
        setTeam((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove team member");
      }
    } catch {
      alert("Network error removing team member");
    }
  };

  // Handle Password submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const result = await changePasswordAction(passwordForm);
      if (result.success) {
        setPasswordMessage({ type: "success", text: result.message || "Password updated successfully!" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordMessage({ type: "error", text: result.error || "Failed to update password." });
      }
    } catch (err: unknown) {
      setPasswordMessage({ type: "error", text: err instanceof Error ? err.message : "An unexpected error occurred." });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Re-run diagnostics
  const handleRunDiagnostics = async () => {
    setDiagLoading(true);
    try {
      const res = await fetch("/api/admin/diagnostics");
      if (res.ok) {
        const data = await res.json();
        setDiagnostics(data);
      }
    } catch (err) {
      console.error("Diagnostics check failed:", err);
    } finally {
      setDiagLoading(false);
    }
  };

  return (
    <div className="space-y-space-lg max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] border border-border-hairline">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-deal-orange animate-ping"></span>
          <span className="text-label-sm font-label-sm tracking-wider uppercase text-deal-orange font-bold">
            Portal Control &amp; Health
          </span>
        </div>
        <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight mt-1 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-deal-orange text-[26px]">settings</span>
          <span>System Settings &amp; Team Management</span>
        </h1>
        <p className="text-body-sm font-body-sm text-outline mt-0.5">
          Configure administrative users, update credentials, and review live infrastructure telemetry.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-hairline pb-3">
        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-label-md font-label-md transition-all cursor-pointer ${
            activeTab === "team"
              ? "bg-primary-container text-on-primary font-bold shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Members ({team.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-label-md font-label-md transition-all cursor-pointer ${
            activeTab === "security"
              ? "bg-primary-container text-on-primary font-bold shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Security &amp; Password</span>
        </button>

        <button
          onClick={() => setActiveTab("diagnostics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-label-md font-label-md transition-all cursor-pointer ${
            activeTab === "diagnostics"
              ? "bg-primary-container text-on-primary font-bold shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Diagnostics</span>
        </button>
      </div>

      {/* TAB 1: TEAM MANAGEMENT */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-headline-sm font-headline-sm text-on-surface">Administrator &amp; Editor Roster</h2>
              <p className="text-body-sm font-body-sm text-outline">
                Grant or modify access levels for the CompareIt.pk management portal.
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-deal-orange hover:bg-deal-orange/90 text-on-primary text-label-md font-bold transition-all shadow-md shadow-deal-orange/20 self-start sm:self-auto cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Team Member</span>
              </button>
            )}
          </div>

          <div className="rounded-xl bg-surface-container-lowest border border-border-hairline overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm font-body-sm">
                <thead className="bg-surface-subtle border-b border-border-hairline text-outline font-semibold uppercase tracking-wider text-label-sm">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Password Status</th>
                    <th className="py-3 px-4">Added</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-hairline">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm">
                            {member.name ? member.name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-on-surface flex items-center gap-2">
                              <span>{member.name || "Administrator"}</span>
                              {member.id === currentUser.id && (
                                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-deal-orange/10 text-deal-orange font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-body-sm text-outline font-mono">{member.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isAdmin && member.id !== currentUser.id ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.id, e.target.value as "ADMIN" | "EDITOR" | "VIEWER")
                            }
                            className="px-2.5 py-1 rounded bg-surface-subtle border border-border-hairline text-body-sm font-semibold text-on-surface focus:outline-none focus:border-deal-orange"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="EDITOR">EDITOR</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              member.role === "ADMIN"
                                ? "bg-deal-orange/10 text-deal-orange border-deal-orange/20"
                                : member.role === "EDITOR"
                                ? "bg-badge-blue-tint text-tertiary-container border-blue-200"
                                : "bg-surface-subtle text-outline border-border-hairline"
                            }`}
                          >
                            {member.role}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {member.mustChangePassword ? (
                          <span className="inline-flex items-center gap-1 text-label-sm text-deal-orange font-bold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Change Required</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-label-sm text-secondary font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-outline text-label-sm">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>

                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          {member.id !== currentUser.id && (
                            <button
                              onClick={() => handleRemoveMember(member.id, member.email)}
                              className="p-1.5 rounded-lg bg-surface-subtle hover:bg-rose-500/10 text-outline hover:text-rose-600 transition-colors"
                              title="Remove member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-5">
            <div>
              <h2 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-deal-orange" />
                <span>Change Your Password</span>
              </h2>
              <p className="text-body-sm font-body-sm text-outline mt-1">
                Passwords are authenticated with Argon2id memory-hard hashing and multi-layer role validation.
              </p>
            </div>

            {passwordMessage && (
              <div
                className={`p-4 rounded-lg text-body-sm flex items-center gap-3 border ${
                  passwordMessage.type === "success"
                    ? "bg-badge-emerald-tint text-secondary border-emerald-300"
                    : "bg-rose-500/10 text-rose-700 border-rose-300"
                }`}
              >
                {passwordMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-label-sm font-semibold text-on-surface mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter your current password"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm text-on-surface focus:outline-none focus:border-deal-orange"
                />
              </div>

              <div>
                <label className="block text-label-sm font-semibold text-on-surface mb-1.5">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter a new strong password"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm text-on-surface focus:outline-none focus:border-deal-orange"
                />
              </div>

              <div>
                <label className="block text-label-sm font-semibold text-on-surface mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm text-on-surface focus:outline-none focus:border-deal-orange"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2.5 rounded-lg bg-deal-orange hover:bg-deal-orange/90 text-on-primary text-label-md font-bold transition-all shadow-md shadow-deal-orange/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {passwordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Update Password</span>
              </button>
            </form>
          </div>

          <div className="p-6 rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-4">
            <h3 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2">
              <Shield className="w-4 h-4 text-deal-orange" />
              <span>Session Details</span>
            </h3>

            <div className="space-y-3 text-body-sm">
              <div className="p-3 rounded-lg bg-surface-subtle border border-border-hairline">
                <span className="text-outline block mb-0.5 text-label-sm">Authenticated User</span>
                <span className="text-on-surface font-semibold font-mono">{currentUser.email}</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-subtle border border-border-hairline">
                <span className="text-outline block mb-0.5 text-label-sm">Assigned Role</span>
                <span className="text-deal-orange font-bold font-mono">{currentUser.role}</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-subtle border border-border-hairline">
                <span className="text-outline block mb-0.5 text-label-sm">Encryption Standard</span>
                <span className="text-secondary font-semibold font-mono">Argon2id Memory-Hard</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM DIAGNOSTICS */}
      {activeTab === "diagnostics" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2">
                <Server className="w-4 h-4 text-deal-orange" />
                <span>Infrastructure &amp; Database Health Check</span>
              </h2>
              <p className="text-body-sm font-body-sm text-outline">
                Live telemetry connecting to Supabase PostgreSQL, Storage, and edge runtime.
              </p>
            </div>

            <button
              onClick={handleRunDiagnostics}
              disabled={diagLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low text-on-surface text-label-md font-semibold transition-all border border-border-hairline disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${diagLoading ? "animate-spin text-deal-orange" : ""}`} />
              <span>Re-run Diagnostics</span>
            </button>
          </div>

          {diagnostics && (
            <div className="space-y-4">
              {/* Overall Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  diagnostics.status === "operational"
                    ? "bg-badge-emerald-tint border-emerald-300 text-secondary"
                    : "bg-deal-orange/10 border-deal-orange/20 text-deal-orange"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="font-bold text-body-md text-on-surface">
                      System Status: {diagnostics.status.toUpperCase()}
                    </div>
                    <div className="text-body-sm opacity-80">
                      Total diagnostic roundtrip: {diagnostics.totalDurationMs}ms &bull; Checked at{" "}
                      {new Date(diagnostics.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-surface-container-lowest border border-border-hairline text-on-surface">
                  {diagnostics.environment.region}
                </span>
              </div>

              {/* Service Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Database Card */}
                <div className="p-5 rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-label-md font-bold text-on-surface flex items-center gap-2">
                      <Database className="w-4 h-4 text-deal-orange" />
                      <span>PostgreSQL (Supabase)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-badge-emerald-tint text-secondary border border-emerald-300">
                      {diagnostics.services.database.latencyMs}ms
                    </span>
                  </div>
                  <p className="text-body-sm text-outline leading-relaxed font-mono">
                    {diagnostics.services.database.provider}
                  </p>
                  <div className="text-label-sm text-outline flex items-center gap-1.5 pt-1 border-t border-border-hairline">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span>Connection pooled &amp; ready</span>
                  </div>
                </div>

                {/* Storage Card */}
                <div className="p-5 rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-label-md font-bold text-on-surface flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-deal-orange" />
                      <span>Supabase Storage</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        diagnostics.services.storage.details.exists
                          ? "bg-badge-emerald-tint text-secondary border-emerald-300"
                          : "bg-deal-orange/10 text-deal-orange border-deal-orange/20"
                      }`}
                    >
                      {diagnostics.services.storage.details.exists ? "Bucket Ready" : "Unverified"}
                    </span>
                  </div>
                  <p className="text-body-sm text-outline leading-relaxed font-mono">
                    Bucket: &apos;{diagnostics.services.storage.details.bucketName}&apos; (Public)
                  </p>
                  <div className="text-label-sm text-outline flex items-center gap-1.5 pt-1 border-t border-border-hairline">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        diagnostics.services.storage.details.exists ? "bg-secondary" : "bg-deal-orange"
                      }`}
                    />
                    <span>Max 2MB &bull; JPG/PNG/WEBP</span>
                  </div>
                </div>

                {/* Runtime Card */}
                <div className="p-5 rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-label-md font-bold text-on-surface flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-deal-orange" />
                      <span>Runtime &amp; Auth</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-badge-blue-tint text-tertiary-container border border-blue-200">
                      {diagnostics.environment.nodeVersion}
                    </span>
                  </div>
                  <p className="text-body-sm text-outline leading-relaxed font-mono">
                    Next.js App Router &bull; {diagnostics.services.auth.provider}
                  </p>
                  <div className="text-label-sm text-outline flex items-center gap-1.5 pt-1 border-t border-border-hairline">
                    <span className="w-2 h-2 rounded-full bg-deal-orange" />
                    <span>Edge middleware active</span>
                  </div>
                </div>
              </div>

              {/* Entity Record Counter Grid */}
              <div className="p-5 rounded-xl bg-surface-container-lowest border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-3">
                <h3 className="text-label-sm font-bold text-outline uppercase tracking-wider">
                  Database Table Volume
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-lg bg-surface-subtle border border-border-hairline">
                    <div className="text-headline-sm font-headline-sm font-bold text-on-surface">
                      {diagnostics.counts.pageViews.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-outline uppercase font-semibold">Page Views</div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-subtle border border-border-hairline">
                    <div className="text-headline-sm font-headline-sm font-bold text-primary-container">
                      {diagnostics.counts.searchLogs.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-outline uppercase font-semibold">Search Queries</div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-subtle border border-border-hairline">
                    <div className="text-headline-sm font-headline-sm font-bold text-deal-orange">
                      {diagnostics.counts.banners}
                    </div>
                    <div className="text-[10px] text-outline uppercase font-semibold">Banners</div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-subtle border border-border-hairline">
                    <div className="text-headline-sm font-headline-sm font-bold text-secondary">
                      {diagnostics.counts.users}
                    </div>
                    <div className="text-[10px] text-outline uppercase font-semibold">Admin Team</div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-subtle border border-border-hairline">
                    <div className="text-headline-sm font-headline-sm font-bold text-tertiary-container">
                      {diagnostics.counts.activityLogs.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-outline uppercase font-semibold">Audit Logs</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-surface-container-lowest border border-border-hairline p-6 shadow-2xl space-y-4 text-on-surface">
            <div className="flex items-center justify-between border-b border-border-hairline pb-3">
              <h3 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-deal-orange" />
                <span>Add Team Member</span>
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-subtle text-outline hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteError && (
              <div className="p-3 rounded-lg bg-rose-500/10 text-rose-700 border border-rose-300 text-body-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-label-sm font-semibold text-on-surface mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asad Khan"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm text-on-surface focus:outline-none focus:border-deal-orange"
                />
              </div>

              <div>
                <label className="block text-label-sm font-semibold text-on-surface mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="asad@compareit.pk"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm text-on-surface focus:outline-none focus:border-deal-orange"
                />
              </div>

              <div>
                <label className="block text-label-sm font-semibold text-on-surface mb-1.5">Temporary Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm text-on-surface focus:outline-none focus:border-deal-orange"
                />
                <p className="text-label-sm text-outline mt-1">
                  User will be forced to change this password on first login.
                </p>
              </div>

              <div>
                <label className="block text-label-sm font-semibold text-on-surface mb-1.5">Portal Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, role: e.target.value as "ADMIN" | "EDITOR" | "VIEWER" })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-subtle border border-border-hairline text-body-sm text-on-surface focus:outline-none focus:border-deal-orange"
                >
                  <option value="EDITOR">EDITOR (Manage Banners, View Analytics &amp; Search)</option>
                  <option value="VIEWER">VIEWER (Read-Only access to dashboards)</option>
                  <option value="ADMIN">ADMIN (Full access including User Management)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-hairline">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-subtle hover:bg-surface-container text-on-surface text-label-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 rounded-lg bg-deal-orange hover:bg-deal-orange/90 text-on-primary text-label-md font-bold transition-all shadow-md shadow-deal-orange/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {inviteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
