"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface AdminNavbarProps {
  user: {
    email?: string | null;
    name?: string | null;
    role?: string;
  };
}

export function AdminNavbar({ user }: AdminNavbarProps) {
  const router = useRouter();
  const [liveUsers, setLiveUsers] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasRecentActivity, setHasRecentActivity] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveUsers = async () => {
      try {
        const res = await fetch("/api/admin/analytics/live");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setLiveUsers(typeof data.activeUsers === "number" ? data.activeUsers : 0);
          }
        } else if (isMounted) {
          setLiveUsers(0);
        }
      } catch {
        if (isMounted) {
          setLiveUsers(0);
        }
      }
    };

    const fetchRecentActivity = async () => {
      try {
        const res = await fetch("/api/admin/activity?limit=1&page=1");
        if (!res.ok || !isMounted) return;
        const data = await res.json();
        const latest = data.logs?.[0]?.createdAt;
        if (!latest) return;
        const ageMs = Date.now() - new Date(latest).getTime();
        setHasRecentActivity(ageMs < 24 * 60 * 60 * 1000);
      } catch {
        /* ignore */
      }
    };

    fetchLiveUsers();
    fetchRecentActivity();
    const interval = setInterval(fetchLiveUsers, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      router.push("/admin/phones");
      return;
    }
    router.push(`/admin/phones?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-zinc-200/80 z-40">
      <div className="h-16 w-full px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <Link href="/admin/dashboard" className="text-zinc-600 hover:text-zinc-950 transition-colors">
            CompareIt.pk
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 font-semibold">Admin Center</span>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative items-center hidden md:flex">
            <span className="material-symbols-outlined absolute left-3 text-zinc-400 text-[18px] pointer-events-none">
              search
            </span>
            <input
              className="bg-zinc-50 text-zinc-900 text-xs pl-9 pr-3.5 py-1.5 rounded-xl border border-zinc-200/80 focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 w-52 lg:w-60 transition-all placeholder:text-zinc-400"
              placeholder="Search phone catalog…"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-zinc-200/80 shadow-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                (liveUsers ?? 0) > 0 ? "bg-emerald-500 animate-ping" : "bg-zinc-300"
              }`}
            ></span>
            <span className="text-xs font-semibold text-zinc-800 font-mono tracking-tight">
              {liveUsers !== null ? `${liveUsers.toLocaleString()} Online` : "…"}
            </span>
          </div>

          <Link
            href="/admin/activity"
            className="relative p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            title="Activity logs & audit"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {hasRecentActivity && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-orange-600"></span>
            )}
          </Link>

          <Link
            href="/admin/banners"
            className="hidden sm:flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[17px]">cloud_upload</span>
            <span>Upload Media</span>
          </Link>

          <button
            onClick={handleLogout}
            title={`Logged in as ${user.email}. Click to sign out.`}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-rose-600 text-white flex items-center justify-center font-bold text-xs transition-colors shrink-0 shadow-sm cursor-pointer ml-1"
          >
            {user.email?.charAt(0).toUpperCase() || "A"}
          </button>
        </div>
      </div>
    </header>
  );
}
