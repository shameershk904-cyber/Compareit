"use client";

import { useState, useEffect } from "react";
import { type Phone } from "@/types";
import { formatPKR, getSupabaseImageUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ScrollableSpecCell } from "./PhoneCard";

interface AdvisorResultsProps {
  winner: Phone;
  rivals: Phone[];
  rationale?: string;
  maxBudget: number;
  minBudget?: number;
  budgetLabel?: string;
  onClose: () => void;
  onToggleCompare: (id: string) => void;
  onCompareTwo: (id1: string, id2: string) => void;
}

export function AdvisorResults({
  winner,
  rivals,
  rationale,
  maxBudget,
  minBudget,
  budgetLabel,
  onClose,
  onToggleCompare,
  onCompareTwo
}: AdvisorResultsProps) {
  const [visibleCount, setVisibleCount] = useState<number>(3);

  // Reset count whenever recommended winner or budget scope updates
  useEffect(() => {
    setVisibleCount(3);
  }, [winner.id, minBudget, maxBudget]);

  const displayBudget = budgetLabel || (() => {
    if (minBudget === undefined || minBudget === 0) {
      return `Under ${formatPKR(maxBudget)}`;
    }
    if (maxBudget >= 600000) {
      return `${formatPKR(minBudget)} to ${formatPKR(maxBudget).replace("Rs. ", "")}+`;
    }
    return `${formatPKR(minBudget)} to ${formatPKR(maxBudget).replace("Rs. ", "")}`;
  })();

  const ramDisplay = (winner.memory?.virtual_ram_gb && winner.memory.virtual_ram_gb > 0)
    ? `${winner.memory.ram_gb}GB + ${winner.memory.virtual_ram_gb}GB`
    : `${winner.memory?.ram_gb || 8}GB`;

  const displayType = (winner.display?.type || '').split(',')[0].trim();
  const refreshRate = (winner.display?.type || '').match(/(\d+Hz)/i)?.[1];
  const displayDisplay = winner.display?.size
    ? `${winner.display.size}" ${displayType}${refreshRate && !displayType.includes(refreshRate) ? ` ${refreshRate}` : ''}`
    : (winner.display?.type || 'N/A');

  const hasOis = (winner.camera?.setup || '').includes('OIS') || (winner.camera?.features || '').includes('OIS');
  const cameraDisplay = `${winner.camera?.main_mp || 50} MP ${hasOis ? 'OIS' : ''}`.trim();

  const batteryDisplay = winner.battery?.capacity_mah
    ? `${winner.battery.capacity_mah} mAh${winner.battery.charging_watt ? ` (${winner.battery.charging_watt}W)` : ''}`
    : '5000 mAh';

  const visibleRivals = rivals.slice(0, visibleCount);
  const hasMore = rivals.length > visibleCount;

  return (
    <div id="advisor-results-box" className="advisor-results">
      <div className="advisor-results-header">
        <div className="advisor-results-title">
          <span className="advisor-results-badge">AI Analysis</span>
          <span className="advisor-results-heading">Best Value Match for {displayBudget}</span>
        </div>
        <button 
          className="advisor-toggle-btn" 
          onClick={onClose} 
          type="button" 
        >
          ✕ Close
        </button>
      </div>
      
      <div className="rec-layout">
        {/* WINNER CARD */}
        <div className="rec-winner-card border-2 border-[#f47820] shadow-[0_4px_20px_-2px_rgba(244,120,32,0.15)]">
          <span className="rec-badge-winner">🏆 #1 Top Recommendation</span>
          <div className="rec-winner-hero">
            <Link href={`/phone/${winner.slug || winner.id}`} title={`View ${winner.model}`} style={{ display: 'inline-block' }}>
              <Image src={getSupabaseImageUrl(winner.image)} alt={winner.model} width={90} height={90} unoptimized />
            </Link>
            <div>
              <span className="card-brand">{winner.brand}</span>
              <h3>
                <Link href={`/phone/${winner.slug || winner.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {winner.model}
                </Link>
              </h3>
              <div className="rec-price">{formatPKR(winner.lowest_verified_price || winner.price_pkr)}</div>
              <span className="badge-warranty">{winner.warranty?.provider?.split('/')[0] || 'Local Warranty'}</span>
            </div>
          </div>

          {/* Spec Matrix */}
          <div className="spec-matrix">
            <ScrollableSpecCell
              icon="💾"
              text={`${ramDisplay} / ${winner.memory?.storage_gb || 128}GB`}
              title="RAM & Storage"
            />
            <ScrollableSpecCell
              icon="📺"
              text={displayDisplay}
              title={`Display: ${winner.display?.size || ''}" ${winner.display?.type || ''}`}
            />
            <ScrollableSpecCell
              icon="⚡"
              text={batteryDisplay}
              title="Battery & Fast Charging"
            />
            <ScrollableSpecCell
              icon="📸"
              text={cameraDisplay}
              title="Main Camera"
            />
          </div>

          <div className="rec-winner-actions">
            <Link href={`/phone/${winner.id}`} className="primary-btn sm">Full Specs & Prices</Link>
            <button className="btn-ghost" onClick={() => onToggleCompare(winner.id)}>+ Compare</button>
          </div>
        </div>

        {/* DIRECT MARKET RIVALS IN BUDGET */}
        {rivals.length > 0 && (
          <div className="rec-rivals-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h4 style={{ margin: 0 }}>⚔️ Direct Market Competitors in this Range:</h4>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                Showing {visibleRivals.length} of {rivals.length}
              </span>
            </div>

            <div className="rivals-list">
              {visibleRivals.map(r => (
                <div key={r.id} className="rival-card">
                  <div className="rival-left">
                    <Link href={`/phone/${r.slug || r.id}`} title={`View ${r.model}`} style={{ display: 'inline-block' }}>
                      <Image src={getSupabaseImageUrl(r.image)} alt={r.model} width={40} height={40} unoptimized />
                    </Link>
                    <div className="rival-info">
                      <h5>
                        <Link href={`/phone/${r.slug || r.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {r.brand} {r.model}
                        </Link>
                      </h5>
                      <div className="rival-price">{formatPKR(r.lowest_verified_price || r.price_pkr)}</div>
                      <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {r.platform?.chipset?.split('(')[0] || 'Unknown Chip'} • {r.camera?.main_mp || 0}MP
                      </small>
                    </div>
                  </div>
                  <div className="rival-actions">
                    <Link href={`/phone/${r.id}`} className="primary-btn sm">Details</Link>
                    <button className="btn-ghost sm" onClick={() => onCompareTwo(winner.id, r.id)}>Compare</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore ? (
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setVisibleCount(prev => prev + 3)}
                  className="advisor-load-more-btn"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: '#000000',
                    background: '#ffffff',
                    border: '1.5px solid #000000',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#000000';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.color = '#000000';
                  }}
                >
                  <span>Load More Phones in this Budget</span>
                  <span style={{ fontSize: '0.78rem', opacity: 0.85, fontWeight: 600 }}>({rivals.length - visibleCount} more)</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>
            ) : rivals.length > 3 ? (
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
                  Showing all {rivals.length} phones in this budget
                </span>
                <button
                  type="button"
                  onClick={() => setVisibleCount(3)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#000000',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: '2px 6px'
                  }}
                >
                  Show Less
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
