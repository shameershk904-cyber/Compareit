"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(
    urlError === "AccessDenied"
      ? "Access denied. Admin or Editor privileges are required."
      : urlError
      ? "An authentication error occurred. Please sign in again."
      : ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMsg("Invalid email or password. Please verify your credentials.");
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error("Login exception:", err);
      setErrorMsg("An unexpected error occurred during sign-in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-border-hairline p-8 font-['Poppins',sans-serif]">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-container text-on-primary mb-4 shadow-sm font-headline-md font-bold text-headline-md">
          C
        </div>
        <h1 className="text-headline-md font-headline-md text-on-surface tracking-tight">
          CompareIt.pk Admin
        </h1>
        <p className="text-body-sm font-body-sm text-outline mt-1">
          Intelligence &amp; Operations Portal
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-body-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-label-sm font-semibold uppercase tracking-wider text-outline mb-1.5">
            Administrator Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@compareit.pk"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-hairline bg-surface-subtle text-on-surface placeholder:text-outline focus:outline-none focus:border-deal-orange transition-all text-body-sm"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-label-sm font-semibold uppercase tracking-wider text-outline">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-hairline bg-surface-subtle text-on-surface placeholder:text-outline focus:outline-none focus:border-deal-orange transition-all text-body-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-deal-orange hover:bg-deal-orange/90 disabled:opacity-60 text-on-primary font-bold text-label-md shadow-md shadow-deal-orange/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer info */}
      <div className="mt-8 pt-6 border-t border-border-hairline text-center">
        <Link
          href="/"
          className="text-body-sm text-outline hover:text-on-surface transition-colors inline-flex items-center gap-1.5"
        >
          &larr; Return to CompareIt.pk Public Site
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen w-full bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-deal-orange/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-primary-container/5 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-on-surface text-body-sm">Loading admin login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
