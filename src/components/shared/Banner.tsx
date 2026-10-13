"use client";

import { useEffect, useState, useRef } from "react";

interface BannerItem {
  id: string;
  title: string;
  desktopImage: string;
  mobileImage?: string | null;
  altText?: string | null;
  linkUrl: string;
  placement: string;
}

export function Banner({
  placement = "HERO",
  className = "",
  fallbackSrc,
  fallbackHref = "#",
  fallbackAlt = "Advertisement Banner",
}: {
  placement?: "HERO" | "TOP_BAR" | "POPUP" | "SIDEBAR";
  className?: string;
  /** Shown until a dashboard banner is published for this placement */
  fallbackSrc?: string;
  fallbackHref?: string;
  fallbackAlt?: string;
}) {
  const [banner, setBanner] = useState<BannerItem | null>(null);
  const [loaded, setLoaded] = useState(false);
  const trackedImpression = useRef(false);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/banners?placement=${placement}`)
      .then((res) => (res.ok ? res.json() : { banners: [] }))
      .then((data) => {
        if (isMounted && data.banners && data.banners.length > 0) {
          setBanner(data.banners[0]); // Highest priority active banner
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [placement]);

  useEffect(() => {
    if (banner && !trackedImpression.current) {
      trackedImpression.current = true;
      fetch(`/api/banners/${banner.id}/impression`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    }
  }, [banner]);

  const imageSrc = banner?.desktopImage || (loaded ? fallbackSrc : undefined);
  const href = banner?.linkUrl || fallbackHref;
  const alt = banner?.altText || banner?.title || fallbackAlt;
  const isExternal = Boolean(href && /^https?:\/\//i.test(href));

  if (!imageSrc) return null;

  const handleClick = () => {
    if (!banner) return;
    try {
      fetch(`/api/banners/${banner.id}/click`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  };

  const isSidebar = placement === "SIDEBAR";
  const isCompact = placement === "TOP_BAR" || placement === "POPUP";

  return (
    <div
      className={`w-full overflow-hidden transition-all ${
        isSidebar ? "h-full" : ""
      } ${className}`}
    >
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        onClick={handleClick}
        className={`block relative w-full overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 hover:opacity-95 transition-opacity ${
          isSidebar ? "h-full rounded-[16px]" : "rounded-2xl"
        }`}
      >
        <picture>
          {banner?.mobileImage && (
            <source media="(max-width: 640px)" srcSet={banner.mobileImage} />
          )}
          <img
            src={imageSrc}
            alt={alt}
            className={
              isSidebar
                ? "w-full h-full object-cover min-h-[200px] max-h-[180px] md:max-h-none"
                : isCompact
                  ? "w-full h-auto object-cover max-h-28 sm:max-h-36"
                  : "w-full h-auto object-cover max-h-56 sm:max-h-72"
            }
            loading="lazy"
          />
        </picture>
      </a>
    </div>
  );
}
