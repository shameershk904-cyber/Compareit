"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface AdminSidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  userRole?: string;
}

export function AdminSidebar({ user, userRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const effectiveRole = user?.role || userRole || "ADMIN";
  const displayName = user?.name || user?.email?.split("@")[0] || "Admin";

  const navItems = [
    {
      title: "Overview Analytics",
      href: "/admin/dashboard",
      icon: "dashboard",
    },
    {
      title: "Phone Catalog",
      href: "/admin/phones",
      icon: "smartphone",
    },
    {
      title: "Search Intelligence",
      href: "/admin/search",
      icon: "search_insights",
    },
    {
      title: "Device Telemetry",
      href: "/admin/analytics",
      icon: "devices",
    },
    {
      title: "Banner Manager",
      href: "/admin/banners",
      icon: "perm_media",
    },
    {
      title: "Inquiries & Messages",
      href: "/admin/messages",
      icon: "mail",
    },
    {
      title: "Activity Logs",
      href: "/admin/activity",
      icon: "history",
    },
    {
      title: "System Settings",
      href: "/admin/settings",
      icon: "settings",
    },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-zinc-200/80 z-50 flex flex-col justify-between shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-200/80 bg-white">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
              C
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-zinc-900 leading-none">
                CompareIt<span className="text-orange-600">.pk</span>
              </span>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">
                Admin Center
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="px-3 py-4">
          <p className="px-2 pb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Management &amp; Data
          </p>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin/dashboard"
                  ? pathname === "/admin/dashboard" || pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-zinc-950 text-white font-semibold shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[19px] ${
                      isActive ? "text-orange-400" : "text-zinc-400"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Status & Admin Profile */}
      <div className="p-3 bg-white border-t border-zinc-200/80 space-y-2.5">
        {/* Live Sync Status */}
        <div className="px-3 py-2 rounded-xl bg-emerald-50/60 border border-emerald-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-medium text-emerald-800">Database Engine</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
            Connected
          </span>
        </div>

        {/* User Card with Logout */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-200/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-900 truncate leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] font-medium text-zinc-500 capitalize tracking-wide">
                {effectiveRole.toLowerCase()} role
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out of Admin Dashboard"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
