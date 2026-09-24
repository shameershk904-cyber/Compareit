"use client";

import { useState } from "react";
import { Lock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { changePasswordAction } from "@/app/(admin)/admin/actions";
import { useRouter } from "next/navigation";

export function ChangePasswordModal({ isRequired = false }: { isRequired?: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    const res = await changePasswordAction({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || "Failed to update password.");
      return;
    }

    setSuccessMsg(res.message || "Password successfully changed!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    // Refresh page state
    setTimeout(() => {
      router.refresh();
    }, 1500);
  };

  return (
    <div className="rounded-xl bg-deal-orange/10 border border-deal-orange/20 p-6 mb-8 text-on-surface shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-deal-orange text-on-primary flex items-center justify-center shrink-0 shadow-sm">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-headline-sm font-headline-sm text-on-surface">
              {isRequired ? "Action Required: Update Temporary Password" : "Change Admin Password"}
            </h3>
            {isRequired && (
              <span className="text-[10px] uppercase font-bold bg-deal-orange text-on-primary px-2 py-0.5 rounded shadow-sm">
                First Login
              </span>
            )}
          </div>
          <p className="text-body-sm font-body-sm text-outline mt-1">
            Your account was initialized with an auto-generated password. Please choose a personal password to secure your portal access.
          </p>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-300 text-rose-700 text-body-sm font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mt-4 p-3 rounded-lg bg-badge-emerald-tint border border-emerald-300 text-secondary text-body-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-label-sm font-semibold text-outline uppercase mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-border-hairline text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-deal-orange"
              />
            </div>

            <div>
              <label className="block text-label-sm font-semibold text-outline uppercase mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-border-hairline text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-deal-orange"
              />
            </div>

            <div>
              <label className="block text-label-sm font-semibold text-outline uppercase mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-border-hairline text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-deal-orange"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-lg bg-deal-orange hover:bg-deal-orange/90 disabled:opacity-50 text-on-primary font-bold text-label-md flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-deal-orange/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Save &amp; Clear Flag</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
