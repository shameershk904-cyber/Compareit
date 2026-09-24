"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "anon";

  const key = "compareit_session_id";
  try {
    let sid = window.sessionStorage.getItem(key);
    if (!sid) {
      sid = `csess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
      window.sessionStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return `csess_${Date.now().toString(36)}`;
  }
}

export function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    // Avoid re-tracking identical path within same tick or admin pages
    const fullPath = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    if (!fullPath || fullPath.startsWith("/admin") || fullPath.startsWith("/api/")) {
      return;
    }

    if (lastTracked.current === fullPath) {
      return;
    }
    lastTracked.current = fullPath;

    const sessionId = getOrCreateSessionId();
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    const screenSize =
      typeof window !== "undefined"
        ? `${window.innerWidth}x${window.innerHeight}`
        : null;

    const utmSource = searchParams?.get("utm_source") || null;
    const utmMedium = searchParams?.get("utm_medium") || null;
    const utmCampaign = searchParams?.get("utm_campaign") || null;

    const payload = JSON.stringify({
      path: fullPath,
      referrer,
      screenSize,
      sessionId,
      utmSource,
      utmMedium,
      utmCampaign,
    });

    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/track", blob);
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Non-blocking telemetry failover
    }
  }, [pathname, searchParams]);

  return null;
}
