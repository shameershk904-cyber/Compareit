"use client";

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
            <h4>⚔️ Direct Market Competitors in this Range:</h4>
            <div className="rivals-list">
              {rivals.map(r => (
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
          </div>
        )}
      </div>
    </div>
  );
}
