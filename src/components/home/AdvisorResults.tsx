import { type Phone } from "@/types";
import { formatPKR, getSupabaseImageUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface AdvisorResultsProps {
  winner: Phone;
  rivals: Phone[];
  rationale: string;
  maxBudget: number;
  onClose: () => void;
  onToggleCompare: (id: string) => void;
  onCompareTwo: (id1: string, id2: string) => void;
}

export function AdvisorResults({
  winner,
  rivals,
  rationale,
  maxBudget,
  onClose,
  onToggleCompare,
  onCompareTwo
}: AdvisorResultsProps) {
  return (
    <div id="advisor-results-box" className="advisor-results">
      <div className="advisor-results-header">
        <div className="advisor-results-title">
          <span className="advisor-results-badge">AI Analysis</span>
          <span className="advisor-results-heading">Best Value Match for {formatPKR(maxBudget)}</span>
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
        <div className="rec-winner-card">
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

          <div className="rec-rationale">
            <strong>Why this is your best buy:</strong><br />
            {rationale}
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
