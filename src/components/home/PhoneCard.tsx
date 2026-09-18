"use client";

import { type Phone } from "@/types";
import { formatPKR, getSupabaseImageUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export function PhoneCard({ phone, isCompared, toggleCompare }: { phone: Phone; isCompared: boolean; toggleCompare: (id: string) => void }) {
  const ptaBadge = phone.pta_status === 'approved'
    ? <span className="badge-pta-approved">✓ PTA Approved</span>
    : <span className="badge-pta-non" title="Non-PTA (Duty required)">⚠️ Non-PTA / JV</span>;

  const isComingSoon = phone.release_date && (phone.release_date.toLowerCase().includes('exp') || phone.release_date.includes('2027') || phone.release_date.includes('2028'));
  const trendingBadge = phone.popular ? <span className="badge-trending">🔥 Trending</span> : null;

  const ramDisplay = (phone.memory.virtual_ram_gb && phone.memory.virtual_ram_gb > 0)
    ? `${phone.memory.ram_gb}GB + ${phone.memory.virtual_ram_gb}GB`
    : `${phone.memory.ram_gb}GB`;

  const lowestPrice = phone.lowest_verified_price || phone.price_pkr;
  const storeCount = (phone.retailers && phone.retailers.length) || 4;

  const imgCount = (phone.images && phone.images.length) || 1;
  const galleryPill = imgCount > 1
    ? <span className="card-gallery-pill">📸 {imgCount} Photos</span>
    : null;

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

      <div className="card-top">
        <Image 
          src={getSupabaseImageUrl(phone.image || (phone.images && phone.images[0]) || '')} 
          alt={`${phone.brand} ${phone.model}`} 
          className="card-img" 
          width={250} 
          height={300} 
          unoptimized 
        />
        {galleryPill}
      </div>

      <div className="card-body">
        <span className="card-brand">{phone.brand}</span>
        <h3 className="card-title">{phone.model}</h3>

        <div className="card-pricing">
          {lowestPrice > 0 ? (
            <>
              <span className="price-lowest-badge">Lowest Verified Price:</span>
              <div className="price-pkr-official">{formatPKR(lowestPrice)}</div>
              <div className="price-sub">
                <span>List: <del>{formatPKR(phone.price_pkr)}</del></span>
                <span className="retailers-count-tag">{storeCount} Stores Tracked</span>
              </div>
            </>
          ) : (
            <>
              <span className="price-lowest-badge">Market Status:</span>
              <div className="price-pkr-official" style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Price N/A</div>
              <div className="price-sub">
                <span>Older or Unreleased Model</span>
              </div>
            </>
          )}
        </div>

        <div className="spec-matrix">
          <div className="spec-cell" title="RAM & Storage">
            <span>💾</span>
            <span>{ramDisplay} / {phone.memory.storage_gb}GB</span>
          </div>
          <div className="spec-cell" title="Display">
            <span>📺</span>
            <span>{phone.display.size}&quot; {(phone.display.type || '').split(',')[0]}</span>
          </div>
          <div className="spec-cell" title="Battery & Fast Charging">
            <span>⚡</span>
            <span>{phone.battery.capacity_mah} mAh ({phone.battery.charging_watt}W)</span>
          </div>
          <div className="spec-cell" title="Main Camera">
            <span>📸</span>
            <span>{phone.camera.main_mp} MP {(phone.camera.setup || '').includes('OIS') ? 'OIS' : ''}</span>
          </div>
        </div>

        <div className="card-actions">
          <Link href={`/phone/${phone.slug || phone.id}`} className="btn-spec" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
