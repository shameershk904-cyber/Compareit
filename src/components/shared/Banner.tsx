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
}: {
  placement?: "HERO" | "TOP_BAR" | "POPUP" | "SIDEBAR";
  className?: string;
}) {
  const [banner, setBanner] = useState<BannerItem | null>(null);
  const trackedImpression = useRef(false);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/banners?placement=${placement}`)
      .then((res) => (res.ok ? res.json() : { banners: [] }))
      .then((data) => {
        if (isMounted && data.banners && data.banners.length > 0) {
          setBanner(data.banners[0]); // Display highest priority banner
        }
      })
      .catch(() => {});

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

  if (!banner) return null;

  const handleClick = () => {
    try {
      fetch(`/api/banners/${banner.id}/click`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    } catch {}
  };

  return (
    <div className={`w-full overflow-hidden transition-all ${className}`}>
      <a
        href={banner.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block relative w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 hover:opacity-95 transition-opacity"
      >
        <picture>
          {banner.mobileImage && (
            <source media="(max-width: 640px)" srcSet={banner.mobileImage} />
          )}
          <img
            src={banner.desktopImage}
            alt={banner.altText || banner.title}
            className="w-full h-auto object-cover max-h-56 sm:max-h-72"
            loading="lazy"
          />
        </picture>
      </a>
    </div>
  );
}
