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

function isClickableUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed !== "" && trimmed !== "#" && trimmed.toLowerCase() !== "javascript:void(0)";
}

export function Banner({
  placement = "HERO",
  className = "",
  fallbackSrc,
  fallbackAlt = "Advertisement Banner",
}: {
  placement?: "HERO" | "TOP_BAR" | "POPUP" | "SIDEBAR";
  className?: string;
  /** Shown until a dashboard banner is published for this placement */
  fallbackSrc?: string;
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
          setBanner(data.banners[0]);
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
  const alt = banner?.altText || banner?.title || fallbackAlt;
  const href = banner?.linkUrl;
  const clickable = Boolean(banner && isClickableUrl(href));
  const isExternal = Boolean(href && /^https?:\/\//i.test(href));

  if (!imageSrc) return null;

  const handleClick = () => {
    if (!banner || !clickable) return;
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

  const imgClass = isSidebar
    ? "w-full h-full object-cover min-h-[200px] max-h-[180px] md:max-h-none"
    : isCompact
      ? "w-full h-auto object-cover max-h-28 sm:max-h-36"
      : "w-full h-auto object-cover max-h-56 sm:max-h-72";

  const shellClass = `block relative w-full overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 ${
    isSidebar ? "h-full rounded-[16px]" : "rounded-2xl"
  } ${clickable ? "hover:opacity-95 transition-opacity cursor-pointer" : "cursor-default"}`;

  const media = (
    <picture>
      {banner?.mobileImage && (
        <source media="(max-width: 640px)" srcSet={banner.mobileImage} />
      )}
      <img src={imageSrc} alt={alt} className={imgClass} loading="lazy" />
    </picture>
  );

  return (
    <div
      className={`w-full overflow-hidden transition-all ${
        isSidebar ? "h-full" : ""
      } ${className}`}
    >
      {clickable ? (
        <a
          href={href!}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          onClick={handleClick}
          className={shellClass}
        >
          {media}
        </a>
      ) : (
        <div className={shellClass} aria-label={alt}>
          {media}
        </div>
      )}
    </div>
  );
}
