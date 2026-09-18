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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ background: '#000', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase' }}>AI Analysis</span>
          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#000' }}>Best Value Match for {formatPKR(maxBudget)}</span>
        </div>
        <button 
          className="advisor-toggle-btn" 
          onClick={onClose} 
          type="button" 
          style={{ fontSize: '0.75rem' }}
        >
          ✕ Close
        </button>
      </div>
      
      <div className="rec-layout">
        {/* WINNER CARD */}
        <div className="rec-winner-card">
          <span className="rec-badge-winner">🏆 #1 Top Recommendation</span>
          <div className="rec-winner-hero">
            <Image src={getSupabaseImageUrl(winner.image)} alt={winner.model} width={90} height={90} unoptimized />
            <div>
              <span className="card-brand">{winner.brand}</span>
              <h3>{winner.model}</h3>
              <div className="rec-price">{formatPKR(winner.lowest_verified_price || winner.price_pkr)}</div>
              <span className="badge-warranty">{winner.warranty?.provider?.split('/')[0] || 'Local Warranty'}</span>
            </div>
          </div>

          <div className="rec-rationale">
            <strong>Why this is your best buy:</strong><br />
            {rationale}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
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
                    <Image src={getSupabaseImageUrl(r.image)} alt={r.model} width={40} height={40} unoptimized />
                    <div className="rival-info">
                      <h5>{r.brand} {r.model}</h5>
                      <div className="rival-price">{formatPKR(r.lowest_verified_price || r.price_pkr)}</div>
                      <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {r.platform?.chipset?.split('(')[0] || 'Unknown Chip'} • {r.camera?.main_mp || 0}MP
                      </small>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <Link href={`/phone/${r.id}`} className="primary-btn sm" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Details</Link>
                    <button className="btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => onCompareTwo(winner.id, r.id)}>Compare</button>
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
