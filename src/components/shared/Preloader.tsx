"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function Preloader() {
  const [phase, setPhase] = useState<"visible" | "fading" | "hidden">("visible");

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const minDelay = prefersReducedMotion ? 50 : 650;
    const fadeDelay = prefersReducedMotion ? 50 : 450;

    const minTimer = setTimeout(() => {
      setPhase("fading");
      const removeTimer = setTimeout(() => {
        setPhase("hidden");
      }, fadeDelay);
      return () => clearTimeout(removeTimer);
    }, minDelay);

    return () => clearTimeout(minTimer);
  }, []);

  if (phase === "hidden") {
    return null;
  }

  return (
    <div
      id="app-preloader"
      aria-hidden={phase === "fading"}
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-white transition-all duration-400 ease-out select-none ${
        phase === "fading"
          ? "opacity-0 pointer-events-none scale-105"
          : "opacity-100 pointer-events-auto scale-100"
      }`}
      style={{ backgroundColor: "#ffffff" }}
    >
      <div className="flex flex-col items-center justify-center px-4 max-w-sm text-center">
        {/* Brand Logo with gentle pulse */}
        <div className="relative mb-6 animate-pulse-gentle">
          <Image
            src="/logo.png"
            alt="Compare It - Pakistan's #1 Smartphone Portal"
            width={180}
            height={48}
            priority
            className="h-11 sm:h-12 w-auto object-contain"
          />
        </div>

        {/* Minimalist Progress Track */}
        <div className="w-48 h-1 bg-[#f4f4f6] rounded-full overflow-hidden relative mb-3.5">
          <div className="preloader-bar" />
        </div>

        {/* Subtle tagline */}
        <p className="text-xs text-[#71717a] font-medium tracking-wide">
          Finding best mobile rates across Pakistan...
        </p>
      </div>
    </div>
  );
}
