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
  const displayName = user?.name || user?.email?.split("@")[0] || "Admin User";

  const navItems = [
    {
      title: "Overview Analytics",
      href: "/admin/dashboard",
      icon: "analytics",
    },
    {
      title: "Phone Catalog",
      href: "/admin/phones",
      icon: "smartphone",
    },
    {
      title: "Search & Query Intelligence",
      href: "/admin/search",
      icon: "query_stats",
    },
    {
      title: "Device & Demographics",
      href: "/admin/analytics",
      icon: "devices",
    },
    {
      title: "Banner & Media Manager",
      href: "/admin/banners",
      icon: "perm_media",
    },
    {
      title: "Audit & Activity Logs",
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
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between border-r border-border-hairline">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-space-lg flex items-center justify-between bg-surface-container-lowest border-b border-border-hairline">
          <Link href="/admin/dashboard" className="flex items-center gap-space-sm group">
            <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-bold font-headline-sm text-headline-sm shadow-sm group-hover:scale-105 transition-transform">
              C
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface leading-none">
                CompareIt.pk
              </span>
              <span className="font-label-sm text-label-sm text-deal-orange uppercase tracking-wider mt-0.5">
                Admin Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="px-space-md py-space-sm">
          <p className="px-space-sm py-space-xs font-label-sm text-label-sm text-outline uppercase tracking-wider">
            Intelligence & Control
          </p>

          <nav className="flex flex-col gap-1 mt-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin/dashboard"
                  ? pathname === "/admin/dashboard" || pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-space-sm px-space-md py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary-container text-on-primary font-bold shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="font-label-lg text-label-lg">{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Status & Admin Profile */}
      <div className="p-space-md bg-surface-container-lowest border-t border-border-hairline">
        {/* Live Sync Badge */}
        <div className="mb-space-sm p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-deal-orange animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">System Status</span>
          </div>
          <span className="font-label-sm text-label-sm text-deal-orange font-bold">Live Sync OK</span>
        </div>

        {/* User Card with Logout */}
        <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-subtle">
          <div className="flex items-center gap-space-sm">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[18px]">shield_person</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface leading-tight font-semibold">
                {displayName}
              </span>
              <span className="font-body-sm text-body-sm text-outline capitalize">
                {effectiveRole.toLowerCase()} &bull; CompareIt
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out of Admin Dashboard"
            className="p-1 rounded text-outline hover:text-deal-orange hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
