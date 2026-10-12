"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TopLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  };

  const startProgress = () => {
    clearTimers();
    setIsVisible(true);
    setProgress(18);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 50) return prev + Math.random() * 15 + 5;
        if (prev < 80) return prev + Math.random() * 8 + 2;
        if (prev < 92) return prev + Math.random() * 3 + 0.5;
        return prev;
      });
    }, 180);

    safetyTimeoutRef.current = setTimeout(() => {
      completeProgress();
    }, 8000);
  };

  const completeProgress = () => {
    clearTimers();
    setProgress(100);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setProgress(0);
      }, 200);
    }, 200);
  };

  useEffect(() => {
    if (isVisible) {
      completeProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        if (targetUrl.origin !== currentUrl.origin) return;
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search
        ) {
          return;
        }

        startProgress();
      } catch {
        // invalid URL
      }
    };

    const handlePopState = () => {
      startProgress();
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "3px",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #f47820 0%, #ff8c38 50%, #ff4500 100%)",
          boxShadow: "0 0 12px rgba(244, 120, 32, 0.8), 0 0 6px rgba(255, 69, 0, 0.6)",
          transition: progress === 100 ? "width 150ms ease-out, opacity 180ms ease-in" : "width 220ms ease-out",
          opacity: isVisible ? 1 : 0,
        }}
      />

      {isVisible && progress < 100 && (
        <div
          style={{
            position: "fixed",
            top: "10px",
            right: "14px",
            zIndex: 9999999,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            padding: "4px 8px",
            borderRadius: "9999px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(244, 120, 32, 0.3)",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              border: "2px solid rgba(244, 120, 32, 0.25)",
              borderTopColor: "#f47820",
              animation: "toploader-spin 0.6s linear infinite",
            }}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: "0.02em",
            }}
          >
            Loading...
          </span>
          <style>{`
            @keyframes toploader-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderInner />
    </Suspense>
  );
}
