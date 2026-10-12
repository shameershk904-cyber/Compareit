"use client";

import { useEffect, useState } from "react";

export function SitePreloader() {
  const [mounted, setMounted] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const minDisplayTime = 550;
    const startTime = Date.now();

    const dismissPreloader = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDisplayTime - elapsed);

      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setMounted(false);
        }, 400);
      }, remaining);
    };

    if (document.readyState === "complete") {
      dismissPreloader();
    } else {
      window.addEventListener("load", dismissPreloader, { once: true });
    }

    const fallbackTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => setMounted(false), 400);
    }, 2500);

    return () => {
      window.removeEventListener("load", dismissPreloader);
      clearTimeout(fallbackTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      id="site-preloader"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        transition: "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? "scale(1.03)" : "scale(1)",
        pointerEvents: isExiting ? "none" : "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
          maxWidth: "340px",
          width: "90%",
          textAlign: "center",
        }}
      >
        {/* Compare It Logo with Soft Ambient Pulse */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.5rem 0",
          }}
        >
          {/* Subtle Ambient Pulse Glow */}
          <div
            style={{
              position: "absolute",
              inset: "-20px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(244, 120, 32, 0.22) 0%, transparent 70%)",
              animation: "preloader-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              pointerEvents: "none",
            }}
          />

          <img
            src="/logo.png"
            alt="Compare It"
            width={190}
            height={50}
            style={{
              height: "48px",
              width: "auto",
              objectFit: "contain",
              display: "block",
              position: "relative",
              filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.06))",
            }}
          />
        </div>

        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "#71717a",
            marginTop: "-0.5rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Find • Compare • Decide
        </p>

        {/* Progress track */}
        <div
          style={{
            width: "160px",
            height: "4px",
            backgroundColor: "#f4f4f5",
            borderRadius: "9999px",
            overflow: "hidden",
            position: "relative",
            marginTop: "0.5rem",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "45%",
              background: "linear-gradient(90deg, #f47820, #ff8c38)",
              borderRadius: "9999px",
              animation: "preloader-slide 1.2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes preloader-slide {
          0% {
            left: -45%;
            width: 30%;
          }
          50% {
            width: 55%;
          }
          100% {
            left: 100%;
            width: 30%;
          }
        }
        @keyframes preloader-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.15;
          }
        }
      `}</style>
    </div>
  );
}
