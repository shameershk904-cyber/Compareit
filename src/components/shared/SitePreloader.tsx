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
        {/* Brand Icon Badge */}
        <div
          style={{
            position: "relative",
            width: "68px",
            height: "68px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
            boxShadow: "0 10px 25px -5px rgba(244, 120, 32, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-4px",
              borderRadius: "24px",
              border: "2px solid rgba(244, 120, 32, 0.4)",
              animation: "preloader-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />

          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f47820"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
            <path d="M12 18h.01" />
          </svg>
        </div>

        {/* Brand Title */}
        <div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#09090b",
              lineHeight: 1.2,
            }}
          >
            Compare<span style={{ color: "#f47820" }}>It</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#71717a", marginLeft: "2px" }}>.pk</span>
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "#71717a",
              marginTop: "0.25rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Find • Compare • Decide
          </p>
        </div>

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
