"use client";

import { useRef, useState } from "react";
import { type Phone } from "@/types";
import { formatPKR, getSupabaseImageUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

function ScrollableSpecCell({
  icon,
  text,
  title,
}: {
  icon: string;
  text: string;
  title: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleMouseEnter = () => {
    if (containerRef.current && textRef.current) {
      const containerW = containerRef.current.clientWidth;
      const textW = textRef.current.scrollWidth;
      const diff = textW - containerW;
      if (diff > 1) {
        const distance = diff + 8;
        // ~35px/s provides smooth, comfortable reading speed
        const time = Math.max(1.3, distance / 35);
        setScrollDistance(distance);
        setDuration(time);
        setIsHovered(true);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setScrollDistance(0);
    setDuration(0.35);
  };

  return (
    <div
      className={`spec-cell ${isHovered && scrollDistance > 0 ? "is-scrolling" : ""}`}
      title={title}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="spec-icon shrink-0">{icon}</span>
      <div ref={containerRef} className="spec-text-track flex-1 overflow-hidden min-w-0">
        <span
          ref={textRef}
          className="spec-text-inner inline-block whitespace-nowrap will-change-transform"
          style={{
            transform: isHovered && scrollDistance > 0 ? `translateX(-${scrollDistance}px)` : "translateX(0)",
            transition: isHovered
              ? `transform ${duration}s linear`
              : "transform 0.35s ease-out",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

export function PhoneCard({ phone, isCompared, toggleCompare }: { phone: Phone; isCompared: boolean; toggleCompare: (id: string) => void }) {
  const lowestPrice = (phone.lowest_verified_price && phone.lowest_verified_price > 0)
    ? phone.lowest_verified_price
    : (phone.price_pkr && phone.price_pkr > 0 ? phone.price_pkr : 0);
  const storeCount = Array.isArray(phone.retailers) ? phone.retailers.length : 0;
  const isAvailableWithPrice = lowestPrice > 0 && phone.status !== "Discontinued";

  const isUnreleased = phone.status === "Rumored / Unreleased";
  const isComingSoon = isUnreleased || Boolean(phone.release_date && (phone.release_date.toLowerCase().includes('exp') || phone.release_date.includes('2027') || phone.release_date.includes('2028')));
  const trendingBadge = phone.popular ? <span className="badge-trending"><span className="badge-full">🔥 Trending</span><span className="badge-short">🔥 Hot</span></span> : null;

  const ptaBadge = isUnreleased
    ? <span className="badge-pta-non" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}><span className="badge-full">🕐 Expected Soon</span><span className="badge-short">🕐 Upcoming</span></span>
    : isAvailableWithPrice
    ? (phone.pta_status === 'approved'
        ? <span className="badge-pta-approved"><span className="badge-full">✓ PTA Approved</span><span className="badge-short">✓ PTA</span></span>
        : <span className="badge-pta-non" title="Non-PTA (Duty required)"><span className="badge-full">⚠️ Non-PTA / JV</span><span className="badge-short">⚠️ Non-PTA</span></span>)
    : <span className="badge-pta-non" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}><span className="badge-full">Unlisted / Discontinued</span><span className="badge-short">Unlisted</span></span>;

  const ramDisplay = (phone.memory.virtual_ram_gb && phone.memory.virtual_ram_gb > 0)
    ? `${phone.memory.ram_gb}GB + ${phone.memory.virtual_ram_gb}GB`
    : `${phone.memory.ram_gb}GB`;

  const imgCount = (phone.images && phone.images.length) || 1;
  const galleryPill = imgCount > 1
    ? <span className="card-gallery-pill">📸 {imgCount} Photos</span>
    : null;

  const productUrl = `/phone/${phone.slug || phone.id}`;

  const displayType = (phone.display?.type || '').split(',')[0].trim();
  const refreshRate = (phone.display?.type || '').match(/(\d+Hz)/i)?.[1];
  const displayDisplay = phone.display?.size
    ? `${phone.display.size}" ${displayType}${refreshRate ? ` ${refreshRate}` : ''}`
    : (phone.display?.type || 'N/A');

  const cameraDisplay = `${phone.camera?.main_mp} MP ${(phone.camera?.setup || '').includes('OIS') ? 'OIS' : ''}`.trim();

  return (
    <article className="phone-card">
      <div className="card-header-bar">
        <div className="card-badge-left">
          {ptaBadge}
        </div>
        <div className="card-badge-right" style={{ display: 'flex', gap: '0.25rem' }}>
          {isComingSoon && <span className="badge-trending" style={{ background: '#000', color: '#fff' }}>Coming Soon</span>}
          {trendingBadge}
        </div>
      </div>

      {/* Clicking photo navigates to product page */}
      <Link 
        href={productUrl} 
        className="card-top" 
        style={{ textDecoration: 'none', display: 'flex', cursor: 'pointer' }}
        title={`View details for ${phone.brand} ${phone.model}`}
      >
        <Image 
          src={getSupabaseImageUrl(phone.image || (phone.images && phone.images[0]) || '')} 
          alt={`${phone.brand} ${phone.model}`} 
          className="card-img" 
          width={250} 
          height={300} 
          unoptimized 
        />
        {galleryPill}
      </Link>

      <div className="card-body">
        <Link 
          href={productUrl} 
          className="card-title-link-wrapper"
          style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
          title={`View details for ${phone.brand} ${phone.model}`}
        >
          <span className="card-brand">{phone.brand}</span>
          <h3 className="card-title">{phone.model}</h3>
        </Link>

        <div className="card-pricing">
          {isUnreleased ? (
            <>
              <span className="price-lowest-badge" style={{ color: 'var(--brand-primary, #2563eb)', fontWeight: 600 }}>Expected Price:</span>
              <div className="price-pkr-official" style={{ color: 'var(--brand-primary, #2563eb)' }}>
                {(phone.expected_price_pkr && phone.expected_price_pkr > 0)
                  ? formatPKR(phone.expected_price_pkr)
                  : lowestPrice > 0
                  ? formatPKR(lowestPrice)
                  : "Coming Soon"}
              </div>
              <div className="price-sub">
                <span className="retailers-count-tag" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe', fontWeight: 600 }}>
                  Expected / Coming Soon
                </span>
              </div>
            </>
          ) : isAvailableWithPrice ? (
            <>
              <span className="price-lowest-badge">{storeCount > 0 ? "Estimated Market Price:" : "Price in Pakistan:"}</span>
              <div className="price-pkr-official">{formatPKR(lowestPrice)}</div>
              <div className="price-sub">
                {phone.price_pkr && phone.price_pkr > lowestPrice && (
                  <span>List: <del>{formatPKR(phone.price_pkr)}</del></span>
                )}
                {storeCount > 0 ? (
                  <span className="retailers-count-tag">{storeCount} Stores Tracked</span>
                ) : (
                  <span className="retailers-count-tag">Estimated Market</span>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="price-lowest-badge" style={{ color: 'var(--text-muted)' }}>Market Status:</span>
              <div className="price-pkr-official" style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 800 }}>
                Price N/A
              </div>
              <div className="price-sub">
                <span className="retailers-count-tag" style={{ background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0', fontWeight: 600 }}>
                  {phone.status || 'Discontinued / Unlisted'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Spec Matrix with hover-scroll support for long text */}
        <div className="spec-matrix">
          <ScrollableSpecCell
            icon="💾"
            text={`${ramDisplay} / ${phone.memory.storage_gb}GB`}
            title="RAM & Storage"
          />
          <ScrollableSpecCell
            icon="📺"
            text={displayDisplay}
            title={`Display: ${phone.display.size}" ${phone.display.type || ''}`}
          />
          <ScrollableSpecCell
            icon="⚡"
            text={`${phone.battery.capacity_mah} mAh (${phone.battery.charging_watt}W)`}
            title="Battery & Fast Charging"
          />
          <ScrollableSpecCell
            icon="📸"
            text={cameraDisplay}
            title="Main Camera"
          />
        </div>

        <div className="card-actions">
          <Link href={productUrl} className="btn-spec" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            View Details →
          </Link>
          <button className={`btn-compare-card ${isCompared ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); toggleCompare(phone.id); }} title="Compare this phone">
            {isCompared ? '✓ Added' : '+ Compare'}
          </button>
        </div>
      </div>
    </article>
  );
}
