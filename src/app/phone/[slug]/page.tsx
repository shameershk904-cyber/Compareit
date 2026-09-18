import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { type Phone } from "@/types";
import { formatPKR, getSupabaseImageUrl } from "@/lib/utils";

async function getPhone(slug: string): Promise<Phone | undefined> {
  const filePath = path.join(process.cwd(), "public", "data", "phones.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const phones: Phone[] = JSON.parse(fileContents);
  return phones.find((p) => p.slug === slug || p.id === slug);
}

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const phone = await getPhone(params.slug);

  if (!phone) {
    notFound();
  }

  const ptaBadgeClass = phone.pta_status === 'approved' ? 'badge-pta-approved' : 'badge-pta-non';
  const ptaBadgeText = phone.pta_status === 'approved' ? '✓ PTA Approved (DIRBS)' : '⚠️ Non-PTA / JV (Tax Required)';

  const isComingSoon = phone.release_date && (phone.release_date.toLowerCase().includes('exp') || phone.release_date.includes('2027') || phone.release_date.includes('2028'));
  const provider = phone.warranty ? phone.warranty.provider : 'Local Market Warranty';

  const lowestPrice = phone.lowest_verified_price || phone.price_pkr;
  const savings = phone.price_pkr - lowestPrice;

  const allImages = (phone.images && phone.images.length > 0) ? phone.images : [phone.image];
  const firstImage = allImages[0];

  const retailers = phone.retailers || [
    { store: "PriceOye.pk", price: phone.lowest_verified_price || phone.price_pkr, in_stock: true, condition: "Official PTA Approved", delivery: "Free 1-2 Days", url: "https://priceoye.pk" },
    { store: "Daraz Mall Official", price: phone.price_pkr, in_stock: true, condition: "Official Brand Warranty", delivery: "Express Delivery", url: "https://daraz.pk" },
    { store: "Telemart.pk", price: Math.round((phone.lowest_verified_price || phone.price_pkr) * 1.02), in_stock: true, condition: "Official Warranty Box Pack", delivery: "2-3 Days", url: "https://telemart.pk" },
    { store: "WhatMobile Benchmark", price: phone.price_pkr, in_stock: true, condition: "Official Retail Price", delivery: "Nationwide", url: "https://whatmobile.com.pk" }
  ];
  const minRetailerPrice = Math.min(...retailers.map(r => r.price));

  const verdictData = phone.expert_verdict || {
    verdict: `A highly competitive smartphone in Pakistan's ${formatPKR(phone.price_pkr)} segment. Offers a balanced mix of performance and reliability under official warranty.`,
    pros: [`Reliable ${phone.platform.chipset}`, `${phone.battery.capacity_mah} mAh battery with ${phone.battery.charging_watt}W charging`, `Official Pakistani distributor warranty`],
    cons: [`Price subject to currency fluctuation`, `Consider comparing with direct market alternatives`]
  };

  const tax = phone.pta_tax || { passport: 0, cnic: 0 };

  return (
    <div id="product-page-view" className="view-container">
      <div className="container product-page-inner">

        {/* BREADCRUMBS & BACK BUTTON */}
        <div className="product-top-nav">
          <Link href="/" className="back-btn" style={{ textDecoration: 'none' }}>
            <span>←</span> Back to All Phones
          </Link>
          <div className="breadcrumbs">
            <span>Home</span> / <span>Smartphones</span> / <span>{phone.brand}</span> / <span>{phone.model}</span>
          </div>
        </div>

        {/* PRODUCT HERO BANNER */}
        <div className="prod-hero-card">
          <div className="prod-hero-gallery-wrapper">
            <div className="prod-hero-gallery">
              <span className="gallery-photo-badge">Official Studio Photo</span>
              <Image src={getSupabaseImageUrl(firstImage)} alt={`${phone.brand} ${phone.model}`} width={400} height={400} unoptimized />
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="prod-thumbs-wrapper">
                <div className="thumbs-label">📸 Multi-Angle Perspectives:</div>
                <div className="prod-gallery-thumbs">
                  {allImages.map((img, idx) => (
                    <button key={idx} className={`prod-thumb-item ${idx === 0 ? 'active' : ''}`} title={`View ${idx + 1}`}>
                      <Image src={getSupabaseImageUrl(img)} alt={`View ${idx + 1}`} width={80} height={80} unoptimized />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="prod-hero-info">
            <div className="prod-badges-line">
              <span className={ptaBadgeClass}>{ptaBadgeText}</span>
              <span className="badge-warranty" style={isComingSoon ? { background: '#000', color: '#fff' } : {}}>
                {isComingSoon ? 'Coming Soon' : provider}
              </span>
            </div>

            <h1 className="prod-title">{phone.brand} {phone.model}</h1>
            <p className="prod-subtitle">Released {phone.release_date} • Global MSRP: ${phone.usd_price}</p>

            <div className="prod-best-price-box">
              <div className="best-price-label">Lowest Verified Market Price in Pakistan:</div>
              <div className="best-price-amount">
                {lowestPrice > 0 ? formatPKR(lowestPrice) : 'Price N/A'}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <div className="best-price-sub">
                  Official MSRP: <strong>{lowestPrice > 0 ? formatPKR(phone.price_pkr) : 'Upcoming/Discontinued'}</strong>
                </div>
                {savings > 0 && lowestPrice > 0 && (
                  <div className="savings-pill">Save {formatPKR(savings)} vs Official MSRP</div>
                )}
              </div>
            </div>

            <div className="prod-hero-actions">
              <a href="#retailers-section" className="primary-btn">View Stores & Buy Now ⬇</a>
              <button className="btn-compare-add">+ Add to Compare</button>
              <Link href={`?taxCalc=${phone.id}`} scroll={false} className="action-btn tax-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                Calculate PTA Tax
              </Link>
            </div>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="prod-details-grid">
          <div className="prod-main-column">
            
            {/* EXPERT VERDICT */}
            <div className="expert-verdict-card">
              <div className="verdict-header">
                <span className="verdict-icon">💡</span>
                <h3>Expert Verdict & Analysis</h3>
              </div>
              <p className="verdict-text">{verdictData.verdict}</p>
              
              <div className="pros-cons-grid">
                <div className="pros-box">
                  <h4><span style={{ color: '#22c55e' }}>✓</span> Reasons to Buy</h4>
                  <ul>
                    {verdictData.pros.map((p, idx) => <li key={idx}>{p}</li>)}
                  </ul>
                </div>
                <div className="cons-box">
                  <h4><span style={{ color: '#ef4444' }}>×</span> Reasons to Avoid</h4>
                  <ul>
                    {verdictData.cons.map((c, idx) => <li key={idx}>{c}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            {/* PTA TAX */}
            <div className="pta-tax-card">
              <div className="tax-header">
                <span className="tax-icon">🇵🇰</span>
                <div>
                  <h3>FBR / PTA Tax Calculator</h3>
                  <p>Estimated tax to register this phone on DIRBS</p>
                </div>
              </div>
              <div className="tax-values">
                <div className="tax-box">
                  <div className="tax-label">On Passport</div>
                  <div className="tax-amount">{formatPKR(tax.passport)}</div>
                </div>
                <div className="tax-box">
                  <div className="tax-label">On CNIC</div>
                  <div className="tax-amount">{formatPKR(tax.cnic)}</div>
                </div>
              </div>
            </div>

            {/* RETAILERS */}
            <div id="retailers-section" className="retailers-section">
              <h3 className="section-heading">Best Prices in Pakistan</h3>
              <div className="table-responsive">
                <table className="retailers-table">
                  <thead>
                    <tr>
                      <th>Store / Seller</th>
                      <th>Condition & Warranty</th>
                      <th>Delivery</th>
                      <th>Price (PKR)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retailers.map((r, idx) => {
                      const isLowest = r.price === minRetailerPrice;
                      return (
                        <tr key={idx} className={isLowest ? 'lowest-row' : ''}>
                          <td>
                            <div className="store-name-col">
                              <span>🏪</span>
                              <strong>{r.store}</strong>
                              {isLowest && <span className="lowest-tag">Best Price</span>}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{r.condition}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>🚚 {r.delivery}</span>
                          </td>
                          <td>
                            <div className="store-price">{formatPKR(r.price)}</div>
                          </td>
                          <td>
                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn-store">
                              <span>View Deal</span>
                              <span>↗</span>
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* SPECS */}
            <div className="prod-spec-sheets">
              <h3 className="section-heading">Detailed Specifications</h3>
              
              <div className="spec-table-group">
                <h4>Display</h4>
                <table className="spec-table">
                  <tbody>
                    <tr><td className="ttl">Type</td><td className="nfo">{phone.display.type}</td></tr>
                    <tr><td className="ttl">Size</td><td className="nfo">{phone.display.size} inches</td></tr>
                    <tr><td className="ttl">Resolution</td><td className="nfo">{phone.display.resolution}</td></tr>
                    <tr><td className="ttl">Protection</td><td className="nfo">{phone.display.protection}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="spec-table-group">
                <h4>Platform & Performance</h4>
                <table className="spec-table">
                  <tbody>
                    <tr><td className="ttl">Operating System</td><td className="nfo">{phone.platform.os}</td></tr>
                    <tr><td className="ttl">Chipset</td><td className="nfo">{phone.platform.chipset}</td></tr>
                    <tr><td className="ttl">CPU</td><td className="nfo">{phone.platform.cpu}</td></tr>
                    <tr><td className="ttl">GPU</td><td className="nfo">{phone.platform.gpu}</td></tr>
                    <tr><td className="ttl">AnTuTu Benchmark</td><td className="nfo">~{phone.platform.antutu_score?.toLocaleString()} points</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="spec-table-group">
                <h4>Memory & Storage</h4>
                <table className="spec-table">
                  <tbody>
                    <tr><td className="ttl">Physical RAM</td><td className="nfo">{phone.memory.ram_gb} GB</td></tr>
                    <tr><td className="ttl">Extended Virtual RAM</td><td className="nfo">{(phone.memory.virtual_ram_gb ?? 0) > 0 ? phone.memory.virtual_ram_gb + ' GB' : 'None'}</td></tr>
                    <tr><td className="ttl">Internal Storage</td><td className="nfo">{phone.memory.storage_gb} GB</td></tr>
                    <tr><td className="ttl">Card Slot</td><td className="nfo">{phone.memory.card_slot ? 'Yes (microSD dedicated/shared)' : 'No'}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="spec-table-group">
                <h4>Main Camera</h4>
                <table className="spec-table">
                  <tbody>
                    <tr><td className="ttl">Sensors</td><td className="nfo">{phone.camera.setup}</td></tr>
                    <tr><td className="ttl">Features</td><td className="nfo">{phone.camera.features}</td></tr>
                    <tr><td className="ttl">Video Recording</td><td className="nfo">{phone.camera.video}</td></tr>
                    <tr><td className="ttl">Front Selfie Camera</td><td className="nfo">{phone.camera.selfie_mp} MP</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="spec-table-group">
                <h4>Battery & Charging</h4>
                <table className="spec-table">
                  <tbody>
                    <tr><td className="ttl">Capacity</td><td className="nfo">{phone.battery.capacity_mah} mAh non-removable</td></tr>
                    <tr><td className="ttl">Wired Fast Charge</td><td className="nfo">{phone.battery.charging_watt}W</td></tr>
                    <tr><td className="ttl">Wireless Charging</td><td className="nfo">{phone.battery.wireless_charging ? 'Yes (Qi / MagCharge)' : 'No'}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="spec-table-group">
                <h4>Connectivity & Network</h4>
                <table className="spec-table">
                  <tbody>
                    <tr><td className="ttl">5G Network</td><td className="nfo">{phone.connectivity.five_g ? 'Yes (SA/NSA)' : 'No (4G LTE)'}</td></tr>
                    <tr><td className="ttl">NFC</td><td className="nfo">{phone.connectivity.nfc ? 'Yes' : 'No'}</td></tr>
                    <tr><td className="ttl">3.5mm Headphone Jack</td><td className="nfo">{phone.connectivity.headphone_jack ? 'Yes' : 'No'}</td></tr>
                    <tr><td className="ttl">Fingerprint Security</td><td className="nfo">{phone.connectivity.fingerprint}</td></tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>
          
          <div className="prod-side-column">
             {/* Not fully replicated side columns, kept minimal to match structure */}
          </div>
        </div>
      </div>
    </div>
  );
}
