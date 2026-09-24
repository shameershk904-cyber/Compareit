"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

interface AdminNavbarProps {
  user: {
    email?: string | null;
    name?: string | null;
    role?: string;
  };
}

export function AdminNavbar({ user }: AdminNavbarProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface/80 backdrop-blur-xl border-b border-border-hairline shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40">
      <div className="h-16 w-full px-space-lg flex items-center justify-between">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-space-xs font-label-md text-label-md text-outline">
          <span className="text-on-surface-variant">CompareIt.pk Admin</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Analytics &amp; Media Management</span>
        </div>

        {/* Right: Actions, Search, Live Shoppers, User */}
        <div className="flex items-center gap-space-md">
          {/* Search Pill */}
          <div className="relative flex items-center hidden md:flex">
            <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
              search
            </span>
            <input
              className="bg-surface-container-lowest text-on-surface font-body-sm text-body-sm pl-9 pr-space-md py-1.5 rounded-lg border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)] focus:outline-none focus:border-deal-orange w-56 lg:w-64 transition-all"
              placeholder="Search queries or models..."
              type="text"
            />
          </div>

          {/* Date Selector Pill */}
          <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-1.5 rounded-lg border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)] hidden lg:flex">
            <span className="material-symbols-outlined text-outline text-[18px]">calendar_today</span>
            <span className="font-label-md text-label-md text-on-surface">Live Pakistan Telemetry</span>
          </div>

          {/* Live Online Badge */}
          <div className="flex items-center gap-1.5 bg-surface-container-lowest px-space-sm py-1.5 rounded-full border border-border-hairline shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <span className="w-2 h-2 rounded-full bg-deal-orange animate-ping"></span>
            <span className="font-label-sm text-label-sm text-on-surface font-bold">1,284 Online</span>
          </div>

          {/* Notifications Button */}
          <Link
            href="/admin/activity"
            className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
            title="Activity logs & notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-deal-orange"></span>
          </Link>

          {/* Action Button: Upload / Deploy */}
          <Link
            href="/admin/banners"
            className="flex items-center gap-space-xs bg-primary text-on-primary px-space-md py-2 rounded-lg font-label-md text-label-md hover:bg-inverse-surface transition-colors shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
          >
            <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            <span>Upload Media</span>
          </Link>

          {/* Avatar Profile */}
          <div
            onClick={handleLogout}
            title={`Logged in as ${user.email}. Click to sign out.`}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary cursor-pointer hover:bg-deal-orange transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
