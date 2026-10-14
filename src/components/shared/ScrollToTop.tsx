"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(24);

  useEffect(() => {
    let ticking = false;

    const checkScrollAndDock = () => {
      // Show when scrolled down 300px
      const scrolled = window.scrollY > 300;
      setIsVisible(scrolled);

      // Sit above home/catalog compare dock or product compare tray
      const dock = document.getElementById("compare-dock");
      const productTray = document.getElementById("compare-bar");
      const activeEl =
        dock && !dock.classList.contains("hidden")
          ? dock
          : productTray;

      if (activeEl) {
        const rect = activeEl.getBoundingClientRect();
        const gapAbove = 12;
        const fromBottom = window.innerHeight - rect.top + gapAbove;
        setBottomOffset(Math.max(24, Math.ceil(fromBottom)));
      } else {
        setBottomOffset(24);
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(checkScrollAndDock);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // Periodically check in case compare items changed without scrolling
    const dockInterval = setInterval(checkScrollAndDock, 500);

    // Initial check
    checkScrollAndDock();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearInterval(dockInterval);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      style={{
        position: "fixed",
        right: "20px",
        bottom: `${bottomOffset}px`,
        zIndex: 80,
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#09090b",
        color: "#ffffff",
        border: "1.5px solid #27272a",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.15)",
        cursor: "pointer",
        transition: "opacity 0.25s ease, transform 0.25s ease, bottom 0.25s ease, border-color 0.2s ease, background-color 0.2s ease",
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
        transform: isVisible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.9)",
      }}
      className="hover:!bg-black hover:!border-[#f47820] hover:scale-105 active:scale-95 group"
    >
      <ArrowUp
        className="w-5 h-5 text-zinc-300 group-hover:text-[#f47820] transition-colors"
        strokeWidth={2.5}
      />
    </button>
  );
}
