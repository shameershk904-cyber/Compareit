/**
 * PakMobiles - Smart Phone Recommendation Engine & Live Price Aggregator (Pakistan)
 * Dedicated Product Page routing, authentic store comparison, and intelligent buyer advisor.
 */

// App State
let allPhones = [];
let filteredPhones = [];
let compareList = [];
let currentProductPhone = null;

const state = {
  searchQuery: '',
  minPrice: 0,
  maxPrice: 600000,
  ptaStatus: 'all',
  selectedBrands: new Set(),
  selectedRam: 'all',
  selectedBattery: 'all',
  selectedCharging: 'all',
  only5G: false,
  cam108: false,
  wireless: false,
  sortBy: 'popular',
  visibleCount: 24
};

// Advisor Wizard State
const advisorState = {
  minBudget: 35000,
  maxBudget: 75000,
  priority: 'balanced'
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  await loadPhonesData();
  setupEventListeners();
  renderBrandCheckboxes();
  renderBrandQuickBar();
  populateTaxCalcDropdown();

  // Handle URL Routing (?phone=<slug>)
  handleRouting();
  window.addEventListener('popstate', handleRouting);

  applyFiltersAndRender(true);
});

// Load phone data from window.PAKMOBILES_PHONES with fallback to fetch('data/phones.json')
async function loadPhonesData() {
  if (window.PAKMOBILES_PHONES && window.PAKMOBILES_PHONES.length > 0) {
    allPhones = window.PAKMOBILES_PHONES;
    return;
  }
  try {
    const res = await fetch('data/phones.json');
    if (res.ok) {
      allPhones = await res.json();
    }
  } catch (err) {
    console.warn('Could not fetch data/phones.json:', err);
  }
}


// Format number to Pakistani Rupee string (e.g. Rs. 74,999)
function formatPKR(amount) {
  if (!amount && amount !== 0) return 'N/A';
  return 'Rs. ' + Math.round(amount).toLocaleString('en-PK');
}

// --- ROUTING & VIEW CONTROLLER ---
function navigateTo(view, phoneId = null) {
  const catalogView = document.getElementById('catalog-view');
  const productPageView = document.getElementById('product-page-view');

  if (view === 'product' && phoneId) {
    const phone = allPhones.find(p => p.id === phoneId || p.slug === phoneId);
    if (phone) {
      currentProductPhone = phone;
      renderProductPage(phone);
      catalogView.classList.add('hidden');
      productPageView.classList.remove('hidden');

      // Update browser URL without reload
      const newUrl = `${window.location.pathname}?phone=${phone.id}`;
      window.history.pushState({ view: 'product', phoneId: phone.id }, '', newUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  }

  // Default: Catalog / Finder View
  currentProductPhone = null;
  productPageView.classList.add('hidden');
  catalogView.classList.remove('hidden');
  window.history.pushState({ view: 'catalog' }, '', window.location.pathname);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleRouting() {
  const params = new URLSearchParams(window.location.search);
  const phoneParam = params.get('phone');
  if (phoneParam && allPhones.length > 0) {
    navigateTo('product', phoneParam);
  } else {
    document.getElementById('product-page-view').classList.add('hidden');
    document.getElementById('catalog-view').classList.remove('hidden');
  }
}

// Global scroll to Smart Advisor
window.scrollToAdvisor = function() {
  if (document.getElementById('catalog-view').classList.contains('hidden')) {
    navigateTo('catalog');
  }
  const el = document.getElementById('smart-advisor-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

// Global scroll to Retailers table
window.scrollToRetailers = function() {
  const el = document.getElementById('retailers-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

// --- DEDICATED PRODUCT PAGE RENDERER ---
function renderProductPage(phone) {
  // Breadcrumbs & Title
  document.getElementById('bread-brand').textContent = phone.brand;
  document.getElementById('bread-model').textContent = phone.model;
  document.getElementById('prod-title').textContent = `${phone.brand} ${phone.model}`;
  document.getElementById('prod-release').textContent = `Released ${phone.release_date} • Global MSRP: $${phone.usd_price}`;

  // Image & Badges
  const heroImg = document.getElementById('prod-hero-img');
  heroImg.src = phone.image;
  heroImg.alt = `${phone.brand} ${phone.model}`;

  const ptaBadge = document.getElementById('prod-pta-badge');
  if (phone.pta_status === 'approved') {
    ptaBadge.className = 'badge-pta-approved';
    ptaBadge.textContent = '✓ PTA Approved (DIRBS)';
  } else {
    ptaBadge.className = 'badge-pta-non';
    ptaBadge.textContent = '⚠️ Non-PTA / JV (Tax Required)';
  }

  const isComingSoon = phone.release_date && (phone.release_date.toLowerCase().includes('exp') || phone.release_date.includes('2027') || phone.release_date.includes('2028'));
  
  const provider = phone.warranty ? phone.warranty.provider : 'Local Market Warranty';
  document.getElementById('prod-warranty-badge').textContent = isComingSoon ? 'Coming Soon' : provider;
  if (isComingSoon) {
    document.getElementById('prod-warranty-badge').style.background = '#000';
    document.getElementById('prod-warranty-badge').style.color = '#fff';
  } else {
    document.getElementById('prod-warranty-badge').style.background = '';
    document.getElementById('prod-warranty-badge').style.color = '';
  }

  // Pricing Box
  const lowestPrice = phone.lowest_verified_price || phone.price_pkr;
  if (lowestPrice > 0) {
    document.getElementById('prod-lowest-price').textContent = formatPKR(lowestPrice);
    document.getElementById('prod-official-price').textContent = formatPKR(phone.price_pkr);
  } else {
    document.getElementById('prod-lowest-price').textContent = 'Price N/A';
    document.getElementById('prod-official-price').textContent = 'Upcoming/Discontinued';
  }

  const savings = phone.price_pkr - lowestPrice;
  const savingsPill = document.getElementById('prod-savings-pill');
  if (savings > 0 && lowestPrice > 0) {
    savingsPill.textContent = `Save ${formatPKR(savings)} vs Official MSRP`;
    savingsPill.classList.remove('hidden');
  } else {
    savingsPill.classList.add('hidden');
  }

  // Compare Button state
  const compBtn = document.getElementById('prod-compare-btn');
  const isCompared = compareList.includes(phone.id);
  compBtn.textContent = isCompared ? '✓ Added to Compare' : '+ Add to Compare';
  compBtn.classList.toggle('active', isCompared);

  // 0. Render Interactive Multi-Angle Gallery, Color Swatches & Banners
  renderProductGallery(phone);

  // 1. Render Retailer Price Comparison Table
  renderRetailersTable(phone);

  // 2. Render Competitors in Same Budget Range
  renderCompetitorsSection(phone);

  // 3. Render Expert Verdict
  renderExpertVerdict(phone);

  // 4. Render GSMArena Specification Tables
  renderProductSpecTables(phone);

  // 5. Render PTA Tax Details
  const tax = phone.pta_tax || calculateCustomPTATax(phone.usd_price || (phone.price_pkr / 280));
  document.getElementById('prod-tax-passport').textContent = formatPKR(tax.passport);
  document.getElementById('prod-tax-cnic').textContent = formatPKR(tax.cnic);
}

function renderProductGallery(phone) {
  const heroImg = document.getElementById('prod-hero-img');
  const viewTag = document.getElementById('prod-gallery-view-tag');
  const thumbsContainer = document.getElementById('prod-gallery-thumbs');
  const thumbsWrapper = document.getElementById('prod-thumbs-wrapper');
  const colorsContainer = document.getElementById('prod-colors-container');
  const colorSwatches = document.getElementById('prod-color-swatches');
  const bannersSection = document.getElementById('official-gallery-section');
  const bannersGrid = document.getElementById('prod-official-banners');

  if (!heroImg) return;

  // 1. Initial Hero Setup
  const allImages = (phone.images && phone.images.length > 0)
    ? phone.images
    : [phone.image];
  
  let currentActiveImg = phone.image || allImages[0];
  heroImg.src = currentActiveImg;
  heroImg.alt = `${phone.brand} ${phone.model}`;
  if (viewTag) {
    viewTag.textContent = `Official Studio View (1 of ${allImages.length})`;
  }

  // Helper to update hero image and active thumbnail
  function setActiveImage(imgUrl, label) {
    heroImg.style.opacity = '0.4';
    setTimeout(() => {
      heroImg.src = imgUrl;
      heroImg.style.opacity = '1';
      if (viewTag && label) {
        viewTag.textContent = label;
      }
    }, 100);

    if (thumbsContainer) {
      thumbsContainer.querySelectorAll('.prod-thumb-item').forEach(thumb => {
        thumb.classList.toggle('active', thumb.dataset.src === imgUrl);
      });
    }
  }

  // 2. Render Thumbnails
  function updateThumbnails(imgList, perspectivePrefix = 'View') {
    if (!thumbsContainer || !thumbsWrapper) return;
    if (!imgList || imgList.length <= 1) {
      thumbsWrapper.classList.add('hidden');
      return;
    }
    thumbsWrapper.classList.remove('hidden');

    thumbsContainer.innerHTML = imgList.map((imgUrl, idx) => {
      const isAct = imgUrl === currentActiveImg || (idx === 0 && !imgList.includes(currentActiveImg));
      const angleLabel = idx === 0 ? 'Front View' : (idx === 1 ? 'Back View' : (idx === 2 ? 'Side Profile' : `${perspectivePrefix} ${idx + 1}`));
      return `
        <button class="prod-thumb-item ${isAct ? 'active' : ''}" data-src="${imgUrl}" data-label="${angleLabel}" title="${angleLabel}">
          <img src="${imgUrl}" alt="${angleLabel}" loading="lazy" onerror="this.src='${allImages[0]}'">
        </button>
      `;
    }).join('');

    thumbsContainer.querySelectorAll('.prod-thumb-item').forEach(btn => {
      const src = btn.dataset.src;
      const lbl = btn.dataset.label;
      btn.addEventListener('click', () => {
        currentActiveImg = src;
        setActiveImage(src, lbl);
      });
      btn.addEventListener('mouseenter', () => {
        setActiveImage(src, lbl);
      });
    });
  }

  // 3. Render Color Variant Switcher
  const variants = phone.color_variants || [];
  if (colorsContainer && colorSwatches) {
    if (variants.length > 0) {
      colorsContainer.classList.remove('hidden');
      colorSwatches.innerHTML = variants.map((v, idx) => `
        <button class="color-swatch-btn ${idx === 0 ? 'active' : ''}" data-color-idx="${idx}">
          <span>🎨</span>
          <span>${v.name}</span>
          <span style="font-size:0.68rem; opacity:0.75;">(${v.images.length})</span>
        </button>
      `).join('');

      colorSwatches.querySelectorAll('.color-swatch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          colorSwatches.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const cIdx = parseInt(btn.dataset.colorIdx, 10);
          const chosenVariant = variants[cIdx];
          if (chosenVariant && chosenVariant.images.length > 0) {
            const firstImg = chosenVariant.images[0];
            currentActiveImg = firstImg;
            setActiveImage(firstImg, `${chosenVariant.name} - Front View`);
            updateThumbnails(chosenVariant.images, chosenVariant.name);
          }
        });
      });

      if (variants[0] && variants[0].images.length > 0) {
        updateThumbnails(variants[0].images, variants[0].name);
      } else {
        updateThumbnails(allImages, 'Perspective');
      }
    } else {
      colorsContainer.classList.add('hidden');
      updateThumbnails(allImages, 'Perspective');
    }
  } else {
    updateThumbnails(allImages, 'Perspective');
  }

  // 4. Render Official Feature Banners
  const banners = phone.banners || [];
  if (bannersSection && bannersGrid) {
    if (banners.length > 0) {
      bannersSection.classList.remove('hidden');
      bannersGrid.innerHTML = banners.map((bUrl, idx) => `
        <div class="official-banner-card">
          <img src="${bUrl}" alt="${phone.brand} ${phone.model} Official Feature ${idx + 1}" loading="lazy">
        </div>
      `).join('');
    } else {
      bannersSection.classList.add('hidden');
      bannersGrid.innerHTML = '';
    }
  }
}

function renderRetailersTable(phone) {
  const tbody = document.getElementById('retailers-table-body');
  if (!tbody) return;

  const retailers = phone.retailers || [
    { store: "PriceOye.pk", price: phone.lowest_verified_price || phone.price_pkr, in_stock: true, condition: "Official PTA Approved", delivery: "Free 1-2 Days", url: "https://priceoye.pk" },
    { store: "Daraz Mall Official", price: phone.price_pkr, in_stock: true, condition: "Official Brand Warranty", delivery: "Express Delivery", url: "https://daraz.pk" },
    { store: "Telemart.pk", price: Math.round((phone.lowest_verified_price || phone.price_pkr) * 1.02), in_stock: true, condition: "Official Warranty Box Pack", delivery: "2-3 Days", url: "https://telemart.pk" },
    { store: "WhatMobile Benchmark", price: phone.price_pkr, in_stock: true, condition: "Official Retail Price", delivery: "Nationwide", url: "https://whatmobile.com.pk" }
  ];

  // Find lowest price
  const minPrice = Math.min(...retailers.map(r => r.price));

  tbody.innerHTML = retailers.map(r => {
    const isLowest = r.price === minPrice;
    return `
      <tr class="${isLowest ? 'lowest-row' : ''}">
        <td>
          <div class="store-name-col">
            <span>🏪</span>
            <strong>${r.store}</strong>
            ${isLowest ? '<span class="lowest-tag">Best Price</span>' : ''}
          </div>
        </td>
        <td>
          <span style="font-size:0.84rem; color: var(--text-secondary);">${r.condition}</span>
        </td>
        <td>
          <span style="font-size:0.84rem; color: var(--text-muted);">🚚 ${r.delivery}</span>
        </td>
        <td>
          <div class="store-price">${formatPKR(r.price)}</div>
        </td>
        <td>
          <a href="${r.url}" target="_blank" rel="noopener" class="btn-store">
            <span>View Deal</span>
            <span>↗</span>
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

function renderCompetitorsSection(phone) {
  const container = document.getElementById('competitors-grid');
  if (!container) return;

  let rivals = [];
  if (phone.competitor_ids && phone.competitor_ids.length > 0) {
    rivals = phone.competitor_ids.map(id => allPhones.find(p => p.id === id)).filter(Boolean);
  }

  // Fallback: find phones within ±25% price range
  if (rivals.length === 0) {
    const minP = phone.price_pkr * 0.75;
    const maxP = phone.price_pkr * 1.25;
    rivals = allPhones.filter(p => p.id !== phone.id && p.price_pkr >= minP && p.price_pkr <= maxP).slice(0, 3);
  }

  if (rivals.length === 0) {
    rivals = allPhones.filter(p => p.id !== phone.id).slice(0, 3);
  }

  container.innerHTML = rivals.map(rival => {
    const isComp = compareList.includes(rival.id);
    const lowest = rival.lowest_verified_price || rival.price_pkr;
    return `
      <div class="competitor-card">
        <div class="comp-card-top">
          <img src="${rival.image}" alt="${rival.model}">
          <div>
            <span class="card-brand">${rival.brand}</span>
            <h4 class="comp-card-title">${rival.model}</h4>
            <div class="comp-card-price">${formatPKR(lowest)}</div>
          </div>
        </div>
        <ul class="comp-features-list">
          <li>📺 ${rival.display.size}" ${rival.display.type.split(',')[0]}</li>
          <li>⚡ ${rival.platform.chipset.split('(')[0]}</li>
          <li>📸 ${rival.camera.main_mp} MP Main Camera</li>
          <li>🔋 ${rival.battery.capacity_mah} mAh (${rival.battery.charging_watt}W)</li>
        </ul>
        <div class="comp-actions">
          <button class="primary-btn sm" onclick="navigateTo('product', '${rival.id}')">View Details</button>
          <button class="btn-ghost" onclick="compareTwoPhones('${phone.id}', '${rival.id}')">Compare vs ${phone.model.split(' ')[0]}</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderExpertVerdict(phone) {
  const verdictEl = document.getElementById('prod-verdict-text');
  const prosList = document.getElementById('prod-pros-list');
  const consList = document.getElementById('prod-cons-list');

  const verdictData = phone.expert_verdict || {
    verdict: `A highly competitive smartphone in Pakistan's ${formatPKR(phone.price_pkr)} segment. Offers a balanced mix of performance and reliability under official warranty.`,
    pros: [`Reliable ${phone.platform.chipset}`, `${phone.battery.capacity_mah} mAh battery with ${phone.battery.charging_watt}W charging`, `Official Pakistani distributor warranty`],
    cons: [`Price subject to currency fluctuation`, `Consider comparing with direct market alternatives`]
  };

  verdictEl.textContent = verdictData.verdict;
  prosList.innerHTML = verdictData.pros.map(p => `<li>${p}</li>`).join('');
  consList.innerHTML = verdictData.cons.map(c => `<li>${c}</li>`).join('');
}

function renderProductSpecTables(phone) {
  const container = document.getElementById('prod-spec-tables');
  if (!container) return;

  container.innerHTML = `
    <div class="spec-table-group">
      <h4>Display</h4>
      <table class="spec-table">
        <tr><td class="ttl">Type</td><td class="nfo">${phone.display.type}</td></tr>
        <tr><td class="ttl">Size</td><td class="nfo">${phone.display.size} inches</td></tr>
        <tr><td class="ttl">Resolution</td><td class="nfo">${phone.display.resolution}</td></tr>
        <tr><td class="ttl">Protection</td><td class="nfo">${phone.display.protection}</td></tr>
      </table>
    </div>

    <div class="spec-table-group">
      <h4>Platform & Performance</h4>
      <table class="spec-table">
        <tr><td class="ttl">Operating System</td><td class="nfo">${phone.platform.os}</td></tr>
        <tr><td class="ttl">Chipset</td><td class="nfo">${phone.platform.chipset}</td></tr>
        <tr><td class="ttl">CPU</td><td class="nfo">${phone.platform.cpu}</td></tr>
        <tr><td class="ttl">GPU</td><td class="nfo">${phone.platform.gpu}</td></tr>
        <tr><td class="ttl">AnTuTu Benchmark</td><td class="nfo">~${phone.platform.antutu_score.toLocaleString()} points</td></tr>
      </table>
    </div>

    <div class="spec-table-group">
      <h4>Memory & Storage</h4>
      <table class="spec-table">
        <tr><td class="ttl">Physical RAM</td><td class="nfo">${phone.memory.ram_gb} GB</td></tr>
        <tr><td class="ttl">Extended Virtual RAM</td><td class="nfo">${phone.memory.virtual_ram_gb > 0 ? phone.memory.virtual_ram_gb + ' GB' : 'None'}</td></tr>
        <tr><td class="ttl">Internal Storage</td><td class="nfo">${phone.memory.storage_gb} GB</td></tr>
        <tr><td class="ttl">Card Slot</td><td class="nfo">${phone.memory.card_slot ? 'Yes (microSD dedicated/shared)' : 'No'}</td></tr>
      </table>
    </div>

    <div class="spec-table-group">
      <h4>Main Camera</h4>
      <table class="spec-table">
        <tr><td class="ttl">Sensors</td><td class="nfo">${phone.camera.setup}</td></tr>
        <tr><td class="ttl">Features</td><td class="nfo">${phone.camera.features}</td></tr>
        <tr><td class="ttl">Video Recording</td><td class="nfo">${phone.camera.video}</td></tr>
        <tr><td class="ttl">Front Selfie Camera</td><td class="nfo">${phone.camera.selfie_mp} MP</td></tr>
      </table>
    </div>

    <div class="spec-table-group">
      <h4>Battery & Charging</h4>
      <table class="spec-table">
        <tr><td class="ttl">Capacity</td><td class="nfo">${phone.battery.capacity_mah} mAh non-removable</td></tr>
        <tr><td class="ttl">Wired Fast Charge</td><td class="nfo">${phone.battery.charging_watt}W</td></tr>
        <tr><td class="ttl">Wireless Charging</td><td class="nfo">${phone.battery.wireless_charging ? 'Yes (Qi / MagCharge)' : 'No'}</td></tr>
      </table>
    </div>

    <div class="spec-table-group">
      <h4>Connectivity & Network</h4>
      <table class="spec-table">
        <tr><td class="ttl">5G Network</td><td class="nfo">${phone.connectivity.five_g ? 'Yes (SA/NSA)' : 'No (4G LTE)'}</td></tr>
        <tr><td class="ttl">NFC</td><td class="nfo">${phone.connectivity.nfc ? 'Yes' : 'No'}</td></tr>
        <tr><td class="ttl">3.5mm Headphone Jack</td><td class="nfo">${phone.connectivity.headphone_jack ? 'Yes' : 'No'}</td></tr>
        <tr><td class="ttl">Fingerprint Security</td><td class="nfo">${phone.connectivity.fingerprint}</td></tr>
      </table>
    </div>
  `;
}

window.toggleCompareFromProduct = function() {
  if (!currentProductPhone) return;
  toggleCompare(currentProductPhone.id);
  const isCompared = compareList.includes(currentProductPhone.id);
  const btn = document.getElementById('prod-compare-btn');
  btn.textContent = isCompared ? '✓ Added to Compare' : '+ Add to Compare';
  btn.classList.toggle('active', isCompared);
};

window.openTaxCalcCurrentProduct = function() {
  if (!currentProductPhone) return;
  openTaxCalcForPhone(currentProductPhone.id);
};

window.compareTwoPhones = function(id1, id2) {
  compareList = [id1, id2];
  updateCompareDock();
  openCompareModal();
};

// --- SMART PHONE RECOMMENDATION & COMPARISON ENGINE ---
function runSmartAdvisor() {
  const { minBudget, maxBudget, priority } = advisorState;

  // Filter candidates in budget range (with 10% flexible boundary)
  let candidates = allPhones.filter(p => {
    const price = p.lowest_verified_price || p.price_pkr;
    return price >= minBudget * 0.9 && price <= maxBudget * 1.1;
  });

  if (candidates.length === 0) {
    candidates = allPhones.slice(0, 4);
  }

  // Score candidates based on selected priority
  candidates.forEach(p => {
    let score = 0;
    if (priority === 'gaming') {
      score = (p.platform.antutu_score || 300000) / 10000 + (p.memory.ram_gb * 8) + (p.display.refresh_rate || 90);
    } else if (priority === 'camera') {
      score = (p.camera.main_mp * 1.5) + (p.camera.setup.includes('OIS') ? 80 : 0) + (p.camera.selfie_mp * 1.2);
    } else if (priority === 'battery') {
      score = (p.battery.capacity_mah / 50) + (p.battery.charging_watt * 2) + (p.battery.wireless_charging ? 30 : 0);
    } else {
      // Balanced
      score = ((p.platform.antutu_score || 300000) / 20000) +
              (p.camera.main_mp * 0.8) +
              (p.battery.charging_watt * 0.8) +
              (p.pta_status === 'approved' ? 50 : 0) +
              (p.memory.ram_gb * 5);
    }
    p._advisorScore = score;
  });

  candidates.sort((a, b) => b._advisorScore - a._advisorScore);

  const winner = candidates[0];
  const rivals = candidates.slice(1, 5);

  const resultsBox = document.getElementById('advisor-results-box');
  resultsBox.classList.remove('hidden');

  let rationale = "";
  if (priority === 'gaming') {
    rationale = `Delivers the highest benchmark score (~${winner.platform.antutu_score.toLocaleString()} AnTuTu) with ${winner.platform.chipset.split('(')[0]} for butter-smooth 60fps/90fps PUBG and thermal stability.`;
  } else if (priority === 'camera') {
    rationale = `Dominates mobile photography in this bracket with its ${winner.camera.main_mp}MP sensor${winner.camera.setup.includes('OIS') ? ' and Optical Image Stabilization (OIS)' : ''}, producing crisp portraits and night shots.`;
  } else if (priority === 'battery') {
    rationale = `Equipped with ${winner.battery.capacity_mah} mAh battery and blistering ${winner.battery.charging_watt}W fast charging, ensuring minimal downtime during Pakistani load-shedding.`;
  } else {
    rationale = `The most complete all-rounder in Pakistan under ${formatPKR(maxBudget)}. Combines solid performance, ${winner.pta_status === 'approved' ? 'official PTA approval' : 'high specs'}, and reliable local warranty.`;
  }

  resultsBox.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; padding-bottom:0.75rem; border-bottom:1px solid var(--border-subtle);">
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <span style="background:#000; color:#fff; font-size:0.68rem; font-weight:800; padding:2px 8px; border-radius:var(--radius-full); text-transform:uppercase;">AI Analysis</span>
        <span style="font-size:0.92rem; font-weight:800; color:#000;">Best Value Match for ${formatPKR(maxBudget)}</span>
      </div>
      <button class="advisor-toggle-btn" onclick="document.getElementById('advisor-results-box').classList.add('hidden')" type="button" style="font-size:0.75rem;">✕ Close</button>
    </div>
    <div class="rec-layout">
      <!-- WINNER CARD -->
      <div class="rec-winner-card">
        <span class="rec-badge-winner">🥇 #1 Top Recommendation</span>
        <div class="rec-winner-hero">
          <img src="${winner.image}" alt="${winner.model}">
          <div>
            <span class="card-brand">${winner.brand}</span>
            <h3>${winner.model}</h3>
            <div class="rec-price">${formatPKR(winner.lowest_verified_price || winner.price_pkr)}</div>
            <span class="badge-warranty">${winner.warranty.provider.split('/')[0]}</span>
          </div>
        </div>

        <div class="rec-rationale">
          <strong>Why this is your best buy:</strong><br>
          ${rationale}
        </div>

        <div style="display:flex; gap:0.5rem; margin-top:auto;">
          <button class="primary-btn sm" onclick="navigateTo('product', '${winner.id}')">View Full Product Page & Stores</button>
          <button class="btn-ghost" onclick="toggleCompare('${winner.id}')">+ Compare</button>
        </div>
      </div>

      <!-- DIRECT MARKET RIVALS IN BUDGET -->
      <div class="rec-rivals-box">
        <h4>⚖️ Direct Market Competitors in this Range:</h4>
        <div class="rivals-list">
          ${rivals.map(r => `
            <div class="rival-card">
              <div class="rival-left">
                <img src="${r.image}" alt="${r.model}">
                <div class="rival-info">
                  <h5>${r.brand} ${r.model}</h5>
                  <div class="rival-price">${formatPKR(r.lowest_verified_price || r.price_pkr)}</div>
                  <small style="font-size:0.72rem; color: var(--text-muted);">${r.platform.chipset.split('(')[0]} • ${r.camera.main_mp}MP</small>
                </div>
              </div>
              <div style="display:flex; flex-direction:column; gap:0.3rem;">
                <button class="primary-btn sm" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="navigateTo('product', '${r.id}')">Details</button>
                <button class="btn-ghost" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="compareTwoPhones('${winner.id}', '${r.id}')">Compare</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  resultsBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// --- CATALOG FILTERING & RENDERING ---
function applyFiltersAndRender() {
  filteredPhones = allPhones.filter(phone => {
    // 1. Search Query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const matchName = phone.model.toLowerCase().includes(q);
      const matchBrand = phone.brand.toLowerCase().includes(q);
      const matchChipset = phone.platform.chipset.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchChipset) return false;
    }

    // 2. Budget Range
    const effectivePrice = phone.lowest_verified_price || phone.price_pkr;
    if (effectivePrice < state.minPrice || effectivePrice > state.maxPrice) {
      return false;
    }

    // 3. PTA Status
    if (state.ptaStatus !== 'all' && phone.pta_status !== state.ptaStatus) {
      return false;
    }

    // 4. Brands
    if (state.selectedBrands.size > 0 && !state.selectedBrands.has(phone.brand)) {
      return false;
    }

    // 5. RAM
    if (state.selectedRam !== 'all') {
      const minRam = parseInt(state.selectedRam, 10);
      if (phone.memory.ram_gb < minRam) return false;
    }

    // 6. Battery
    if (state.selectedBattery !== 'all') {
      const minBat = parseInt(state.selectedBattery, 10);
      if (phone.battery.capacity_mah < minBat) return false;
    }

    // 7. Fast Charging
    if (state.selectedCharging !== 'all') {
      const minWatt = parseInt(state.selectedCharging, 10);
      if (phone.battery.charging_watt < minWatt) return false;
    }

    // 8. 5G
    if (state.only5G && !phone.connectivity.five_g) return false;

    // 9. Camera MP
    if (state.cam108 && phone.camera.main_mp < 108) return false;

    // 10. Wireless Charging
    if (state.wireless && !phone.battery.wireless_charging) return false;

    return true;
  });

  sortPhones();
  renderPhoneCards();
  renderActiveFilterChips();
  updateResultsHeader();
}

function sortPhones() {
  switch (state.sortBy) {
    case 'price-asc':
      filteredPhones.sort((a, b) => (a.lowest_verified_price || a.price_pkr) - (b.lowest_verified_price || b.price_pkr));
      break;
    case 'price-desc':
      filteredPhones.sort((a, b) => (b.lowest_verified_price || b.price_pkr) - (a.lowest_verified_price || a.price_pkr));
      break;
    case 'camera-desc':
      filteredPhones.sort((a, b) => b.camera.main_mp - a.camera.main_mp);
      break;
    case 'ram-desc':
      filteredPhones.sort((a, b) => b.memory.ram_gb - a.memory.ram_gb);
      break;
    case 'charging-desc':
      filteredPhones.sort((a, b) => b.battery.charging_watt - a.battery.charging_watt);
      break;
    case 'popular':
    default:
      filteredPhones.sort((a, b) => (a.trending_rank || 99) - (b.trending_rank || 99));
      break;
  }
}

function renderBrandCheckboxes() {
  const container = document.getElementById('brand-list-container');
  if (!container) return;

  const brandCounts = {};
  allPhones.forEach(p => {
    brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
  });

  const sortedBrands = Object.keys(brandCounts).sort((a, b) => brandCounts[b] - brandCounts[a]);

  container.innerHTML = sortedBrands.map(brand => `
    <label class="brand-check-item ${state.selectedBrands.has(brand) ? 'selected' : ''}" data-brand="${brand}">
      <input type="checkbox" value="${brand}" ${state.selectedBrands.has(brand) ? 'checked' : ''}>
      <span>${brand}</span>
      <span class="brand-count">${brandCounts[brand]}</span>
    </label>
  `).join('');

  container.querySelectorAll('.brand-check-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const brand = item.dataset.brand;
      if (state.selectedBrands.has(brand)) {
        state.selectedBrands.delete(brand);
      } else {
        state.selectedBrands.add(brand);
      }
      state.visibleCount = 24;
      renderBrandCheckboxes();
      renderBrandQuickBar();
      applyFiltersAndRender(false);
    });
  });
}

function renderBrandQuickBar() {
  // Bar removed from main page
  return;
}

function renderPhoneCards() {
  const grid = document.getElementById('phones-grid');
  const emptyState = document.getElementById('no-results-state');

  if (filteredPhones.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    updatePaginationControls();
    return;
  }

  emptyState.classList.add('hidden');

  const visiblePhones = filteredPhones.slice(0, state.visibleCount);

  grid.innerHTML = visiblePhones.map(phone => {
    const isCompared = compareList.includes(phone.id);
    const ptaBadge = phone.pta_status === 'approved'
      ? `<span class="badge-pta-approved">✓ PTA Approved</span>`
      : `<span class="badge-pta-non" title="Non-PTA (Duty required)">⚠️ Non-PTA / JV</span>`;

    const trendingBadge = phone.popular
      ? `<span class="badge-trending">🔥 Trending</span>`
      : '';

    const ramDisplay = (phone.memory.virtual_ram_gb && phone.memory.virtual_ram_gb > 0)
      ? `${phone.memory.ram_gb}GB + ${phone.memory.virtual_ram_gb}GB`
      : `${phone.memory.ram_gb}GB`;

    const lowestPrice = phone.lowest_verified_price || phone.price_pkr;
    const storeCount = (phone.retailers && phone.retailers.length) || 4;

    const imgCount = (phone.images && phone.images.length) || 1;
    const galleryPill = imgCount > 1
      ? `<span class="card-gallery-pill">📸 ${imgCount} Photos</span>`
      : '';

    return `
      <article class="phone-card" onclick="handleCardClick(event, '${phone.id}')">
        <div class="card-header-bar">
          <div class="card-badge-left">
            ${ptaBadge}
          </div>
          <div class="card-badge-right" style="display:flex; gap:0.25rem;">
            ${(phone.release_date && (phone.release_date.toLowerCase().includes('exp') || phone.release_date.includes('2027') || phone.release_date.includes('2028'))) ? '<span class="badge-trending" style="background:#000; color:#fff;">Coming Soon</span>' : ''}
            ${trendingBadge}
          </div>
        </div>

        <div class="card-top">
          <img src="${phone.image}" alt="${phone.brand} ${phone.model}" class="card-img" loading="lazy" onerror="this.src='${phone.images && phone.images[0] ? phone.images[0] : phone.image}'">
          ${galleryPill}
        </div>

        <div class="card-body">
          <span class="card-brand">${phone.brand}</span>
          <h3 class="card-title">${phone.model}</h3>

          <div class="card-pricing">
            ${lowestPrice > 0 ? `
              <span class="price-lowest-badge">Lowest Verified Price:</span>
              <div class="price-pkr-official">${formatPKR(lowestPrice)}</div>
              <div class="price-sub">
                <span>List: <del>${formatPKR(phone.price_pkr)}</del></span>
                <span class="retailers-count-tag">${storeCount} Stores Tracked</span>
              </div>
            ` : `
              <span class="price-lowest-badge">Market Status:</span>
              <div class="price-pkr-official" style="font-size:1.1rem; color:var(--text-muted);">Price N/A</div>
              <div class="price-sub">
                <span>Older or Unreleased Model</span>
              </div>
            `}
          </div>

          <div class="spec-matrix">
            <div class="spec-cell" title="RAM & Storage" onmouseenter="scrollSpec(this)" onmouseleave="resetSpec(this)">
              <span>💾</span>
              <span>${ramDisplay} / ${phone.memory.storage_gb}GB</span>
            </div>
            <div class="spec-cell" title="Display" onmouseenter="scrollSpec(this)" onmouseleave="resetSpec(this)">
              <span>📺</span>
              <span>${phone.display.size}" ${(phone.display.type || '').split(',')[0]}</span>
            </div>
            <div class="spec-cell" title="Battery & Fast Charging" onmouseenter="scrollSpec(this)" onmouseleave="resetSpec(this)">
              <span>⚡</span>
              <span>${phone.battery.capacity_mah} mAh (${phone.battery.charging_watt}W)</span>
            </div>
            <div class="spec-cell" title="Main Camera" onmouseenter="scrollSpec(this)" onmouseleave="resetSpec(this)">
              <span>📸</span>
              <span>${phone.camera.main_mp} MP ${(phone.camera.setup || '').includes('OIS') ? 'OIS' : ''}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-spec" onclick="event.stopPropagation(); navigateTo('product', '${phone.id}')">View Details →</button>
            <button class="btn-compare-card ${isCompared ? 'active' : ''}" onclick="event.stopPropagation(); toggleCompare('${phone.id}')" title="Compare this phone">
              ${isCompared ? '✓ Added' : '+ Compare'}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  updatePaginationControls();
}

function updatePaginationControls() {
  const container = document.getElementById('catalog-pagination-container');
  const infoText = document.getElementById('pagination-info-text');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const showAllBtn = document.getElementById('show-all-btn');

  if (!container) return;

  if (filteredPhones.length === 0) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  const total = filteredPhones.length;
  const current = Math.min(state.visibleCount, total);
  const remaining = total - current;

  if (infoText) {
    infoText.textContent = `Showing ${current} of ${total} Smartphones in Pakistan`;
  }

  if (loadMoreBtn) {
    if (remaining > 0) {
      loadMoreBtn.classList.remove('hidden');
      loadMoreBtn.textContent = `Load More Phones (${remaining} Remaining) ⬇`;
    } else {
      loadMoreBtn.classList.add('hidden');
    }
  }

  if (showAllBtn) {
    if (remaining > 0 && total > 16) {
      showAllBtn.classList.remove('hidden');
      showAllBtn.textContent = `Show All ${total} Phones`;
    } else {
      showAllBtn.classList.add('hidden');
    }
  }
}

window.handleCardClick = function(event, phoneId) {
  navigateTo('product', phoneId);
};

function renderActiveFilterChips() {
  const container = document.getElementById('active-filter-chips');
  if (!container) return;

  const chips = [];

  if (state.searchQuery) {
    chips.push({ label: `"${state.searchQuery}"`, action: () => { state.searchQuery = ''; document.getElementById('global-search').value = ''; } });
  }

  if (state.maxPrice < 600000 || state.minPrice > 0) {
    chips.push({
      label: `Budget: ${formatPKR(state.minPrice)} - ${formatPKR(state.maxPrice)}`,
      action: () => {
        state.minPrice = 0;
        state.maxPrice = 600000;
        document.getElementById('budget-slider').value = 600000;
        document.getElementById('min-price-input').value = 0;
        document.getElementById('max-price-input').value = 600000;
        document.getElementById('budget-display').textContent = 'Max: Rs. 600,000';
      }
    });
  }

  if (state.ptaStatus !== 'all') {
    chips.push({
      label: state.ptaStatus === 'approved' ? 'PTA Approved' : 'Non-PTA',
      action: () => {
        state.ptaStatus = 'all';
        document.querySelector('input[name="pta_status"][value="all"]').checked = true;
        document.getElementById('pta-only-toggle').checked = false;
      }
    });
  }

  state.selectedBrands.forEach(brand => {
    chips.push({
      label: brand,
      action: () => {
        state.selectedBrands.delete(brand);
        renderBrandCheckboxes();
      }
    });
  });

  if (state.selectedRam !== 'all') {
    chips.push({ label: `${state.selectedRam}GB+ RAM`, action: () => { state.selectedRam = 'all'; resetSpecPills('ram-pills-container'); } });
  }

  if (state.selectedBattery !== 'all') {
    chips.push({ label: `${state.selectedBattery}+ mAh`, action: () => { state.selectedBattery = 'all'; resetSpecPills('battery-pills-container'); } });
  }

  if (state.selectedCharging !== 'all') {
    chips.push({ label: `${state.selectedCharging}W+ Charging`, action: () => { state.selectedCharging = 'all'; resetSpecPills('charging-pills-container'); } });
  }

  if (state.only5G) {
    chips.push({ label: '5G Only', action: () => { state.only5G = false; document.getElementById('filter-5g').checked = false; } });
  }

  if (state.cam108) {
    chips.push({ label: '108MP+ Camera', action: () => { state.cam108 = false; document.getElementById('filter-cam-108').checked = false; } });
  }

  if (state.wireless) {
    chips.push({ label: 'Wireless Charging', action: () => { state.wireless = false; document.getElementById('filter-wireless').checked = false; } });
  }

  container.innerHTML = chips.map((chip, idx) => `
    <span class="filter-chip">
      ${chip.label}
      <span class="filter-chip-remove" data-idx="${idx}">✕</span>
    </span>
  `).join('');

  container.querySelectorAll('.filter-chip-remove').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx, 10);
      chips[idx].action();
      applyFiltersAndRender();
    });
  });
}

function updateResultsHeader() {
  const header = document.getElementById('results-count-title');
  if (header) {
    header.textContent = `Tracking ${filteredPhones.length} Smartphone${filteredPhones.length === 1 ? '' : 's'} Across Pakistani Stores`;
  }
}

function resetSpecPills(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.spec-pill').forEach((pill, idx) => {
    pill.classList.toggle('active', idx === 0);
  });
}

// Brand filter shortcut for footer links
window.filterByBrand = function(brand) {
  navigateTo('catalog');
  state.selectedBrands.clear();
  state.selectedBrands.add(brand);
  renderBrandCheckboxes();
  applyFiltersAndRender();
  window.scrollTo({ top: 400, behavior: 'smooth' });
};

// --- COMPARISON TRAY & MODAL ---
window.toggleCompare = function(phoneId) {
  const index = compareList.indexOf(phoneId);
  if (index > -1) {
    compareList.splice(index, 1);
  } else {
    if (compareList.length >= 3) {
      alert('You can compare a maximum of 3 smartphones at a time.');
      return;
    }
    compareList.push(phoneId);
  }

  updateCompareDock();
  renderPhoneCards();
};

function updateCompareDock() {
  const dock = document.getElementById('compare-dock');
  const countBadge = document.getElementById('compare-badge');
  const dockCount = document.getElementById('dock-count');
  const slotsContainer = document.getElementById('dock-slots-container');

  countBadge.textContent = compareList.length;
  dockCount.textContent = compareList.length;

  if (compareList.length > 0) {
    dock.classList.remove('hidden');
    slotsContainer.innerHTML = compareList.map(id => {
      const p = allPhones.find(item => item.id === id);
      if (!p) return '';
      return `
        <div class="dock-slot-item">
          <img src="${p.image}" alt="${p.model}">
          <span>${p.model}</span>
          <span class="dock-remove-item" onclick="toggleCompare('${p.id}')">✕</span>
        </div>
      `;
    }).join('');
  } else {
    dock.classList.add('hidden');
  }
}

function openCompareModal() {
  if (compareList.length < 1) {
    alert('Please select at least 1 smartphone to view comparison.');
    return;
  }

  const selected = compareList.map(id => allPhones.find(p => p.id === id)).filter(Boolean);
  const container = document.getElementById('compare-table-container');

  const getTax = p => p.pta_tax || calculateCustomPTATax(p.usd_price || (p.price_pkr / 280));

  let html = `<div class="comp-table-wrapper"><table class="comp-data-table">`;

  // 1. STICKY HEADER ROW (Images & Titles)
  html += `<thead><tr><th class="comp-label-col empty"></th>`;
  selected.forEach(p => {
    const isComingSoon = p.release_date && (p.release_date.toLowerCase().includes('exp') || p.release_date.includes('2027'));
    html += `<th class="comp-item-col">
      <button class="remove-comp-btn" onclick="toggleCompare('${p.id}'); openCompareModal();" title="Remove">✕</button>
      <div class="comp-img-wrapper">
        <img src="${p.image}" alt="${p.brand} ${p.model}" onerror="this.src='${p.images && p.images[0] ? p.images[0] : p.image}'">
      </div>
      <div class="comp-title-area">
        <span class="comp-brand">${p.brand}</span>
        <h3 class="comp-model">${p.model}</h3>
        ${isComingSoon ? '<span class="badge-trending" style="background:#000; color:#fff; display:inline-block; margin-top:0.25rem;">Coming Soon</span>' : ''}
      </div>
      <div class="comp-price-highlight">
        <span class="comp-price-label">Lowest Price</span>
        <div class="comp-price-val">${p.lowest_verified_price > 0 ? formatPKR(p.lowest_verified_price) : 'N/A'}</div>
      </div>
    </th>`;
  });
  html += `</tr></thead><tbody>`;

  // Helper to render rows
  const renderRow = (label, propFn) => {
    let rowHtml = `<tr><td class="comp-label-col">${label}</td>`;
    selected.forEach(p => {
      rowHtml += `<td class="comp-item-val">${propFn(p)}</td>`;
    });
    rowHtml += `</tr>`;
    return rowHtml;
  };

  const renderSection = (title) => `<tr class="comp-section-row"><td colspan="${selected.length + 1}" class="comp-section-title">${title}</td></tr>`;

  // --- SECTIONS ---
  html += renderSection('📱 Display & Design');
  html += renderRow('Screen Size', p => `<strong>${p.display.size}"</strong>`);
  html += renderRow('Panel Type', p => p.display.type || 'N/A');
  html += renderRow('Resolution', p => p.display.resolution || 'N/A');
  html += renderRow('Protection', p => p.display.protection || 'N/A');

  html += renderSection('⚡ Performance & Core');
  html += renderRow('Processor (SoC)', p => `<strong>${p.platform.chipset || 'N/A'}</strong>`);
  html += renderRow('RAM', p => `<strong>${p.memory.ram_gb} GB</strong>`);
  html += renderRow('Internal Storage', p => `<strong>${p.memory.storage_gb} GB</strong>`);
  html += renderRow('AnTuTu Score', p => p.platform.antutu_score ? `~${p.platform.antutu_score.toLocaleString()} pts` : 'N/A');

  html += renderSection('📸 Cameras');
  html += renderRow('Main Camera', p => `<strong>${p.camera.main_mp} MP</strong> <br><span class="comp-subtext">${p.camera.setup || ''}</span>`);
  html += renderRow('Selfie Camera', p => `${p.camera.selfie_mp} MP`);
  html += renderRow('Video Recording', p => p.camera.video || 'N/A');

  html += renderSection('🔋 Battery & Charging');
  html += renderRow('Capacity', p => `<strong>${p.battery.capacity_mah} mAh</strong>`);
  html += renderRow('Fast Charging', p => p.battery.charging_watt ? `${p.battery.charging_watt}W` : 'N/A');
  html += renderRow('Wireless Charging', p => p.battery.wireless_charging ? '✅ Yes' : '❌ No');

  html += renderSection('📦 Connectivity & Taxes');
  html += renderRow('5G Support', p => p.connectivity.five_g ? '✅ 5G Supported' : '❌ 4G Only');
  html += renderRow('PTA Tax (Passport)', p => `<strong>${formatPKR(getTax(p).passport)}</strong>`);
  html += renderRow('PTA Tax (CNIC)', p => `<strong>${formatPKR(getTax(p).cnic)}</strong>`);

  html += '</tbody></table></div>';

  container.innerHTML = html;
  
  if (compareList.length === 0) {
    document.getElementById('compare-modal').classList.add('hidden');
  } else {
    document.getElementById('compare-modal').classList.remove('hidden');
  }
}

// --- PTA TAX CALCULATOR ---
function populateTaxCalcDropdown() {
  const input = document.getElementById('calc-phone-input');
  const list = document.getElementById('calc-phone-list');
  if (!input || !list) return;

  list.innerHTML = allPhones.map(p => `
    <option value="${p.brand} ${p.model}"></option>
  `).join('');

  input.addEventListener('input', () => {
    const val = input.value;
    const phone = allPhones.find(p => `${p.brand} ${p.model}` === val);
    if (phone) {
      updateTaxResultsForPhone(phone.id);
    }
  });

  if (allPhones.length > 0) {
    input.value = `${allPhones[0].brand} ${allPhones[0].model}`;
    updateTaxResultsForPhone(allPhones[0].id);
  }
}

function updateTaxResultsForPhone(phoneId) {
  const p = allPhones.find(item => item.id === phoneId);
  if (!p) return;
  
  const tax = p.pta_tax || calculateCustomPTATax(p.usd_price || (p.price_pkr / 280));
  
  document.getElementById('tax-passport-val').textContent = formatPKR(tax.passport);
  document.getElementById('tax-cnic-val').textContent = formatPKR(tax.cnic);
}

function calculateCustomPTATax(usdPrice) {
  const USD_TO_PKR = 278.50;
  if (usdPrice <= 30) return { passport: 430, cnic: 550 };
  if (usdPrice <= 100) return { passport: 3200, cnic: 4300 };
  if (usdPrice <= 200) return { passport: 9500, cnic: 12500 };
  if (usdPrice <= 350) return { passport: 19500, cnic: 25000 };
  if (usdPrice <= 500) return { passport: 41000, cnic: 51000 };

  const extra = Math.round((usdPrice - 500) * USD_TO_PKR * 0.17);
  return {
    passport: Math.min(145000, 70000 + extra),
    cnic: Math.min(175000, 85000 + extra)
  };
}

window.openTaxCalcForPhone = function(phoneId) {
  const modal = document.getElementById('tax-calc-modal');
  modal.classList.remove('hidden');

  const input = document.getElementById('calc-phone-input');
  if (input) {
    const p = allPhones.find(item => item.id === phoneId);
    if (p) {
      input.value = `${p.brand} ${p.model}`;
      updateTaxResultsForPhone(phoneId);
    }
  }
};

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Global Search
  const searchInput = document.getElementById('global-search');
  const clearSearchBtn = document.getElementById('clear-search-btn');

  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    clearSearchBtn.classList.toggle('hidden', state.searchQuery === '');
    if (document.getElementById('catalog-view').classList.contains('hidden')) {
      navigateTo('catalog');
    }
    applyFiltersAndRender();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    applyFiltersAndRender();
  });

  // Advisor Wizard Budget & Priority Cards
  const budgetCards = document.querySelectorAll('#advisor-budget-cards .adv-card-tile');
  const priorityCards = document.querySelectorAll('#advisor-priority-cards .adv-card-tile');
  const selectedBudgetTag = document.getElementById('selected-budget-tag');
  const selectedPriorityTag = document.getElementById('selected-priority-tag');
  const summaryText = document.getElementById('advisor-summary-text');

  function updateAdvisorSummary() {
    const budgetLabel = selectedBudgetTag ? selectedBudgetTag.textContent : '';
    const priorityLabel = selectedPriorityTag ? selectedPriorityTag.textContent : '';
    if (summaryText) {
      summaryText.innerHTML = `Ready to Compare: <strong>${budgetLabel}</strong> • <strong>${priorityLabel}</strong>`;
    }
  }

  budgetCards.forEach(card => {
    card.addEventListener('click', () => {
      budgetCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      advisorState.minBudget = parseInt(card.dataset.min, 10);
      advisorState.maxBudget = parseInt(card.dataset.max, 10);
      if (selectedBudgetTag) {
        selectedBudgetTag.textContent = card.dataset.label || `${card.dataset.min} - ${card.dataset.max}`;
      }
      updateAdvisorSummary();
    });
  });

  priorityCards.forEach(card => {
    card.addEventListener('click', () => {
      priorityCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      advisorState.priority = card.dataset.priority;
      if (selectedPriorityTag) {
        selectedPriorityTag.textContent = card.dataset.label || card.dataset.priority;
      }
      updateAdvisorSummary();
    });
  });

  // Run Advisor Button
  const runAdvisorBtn = document.getElementById('run-advisor-btn');
  if (runAdvisorBtn) {
    runAdvisorBtn.addEventListener('click', runSmartAdvisor);
  }

  // Toggle Advisor Minimize / Expand
  const toggleAdvisorBtn = document.getElementById('toggle-advisor-btn');
  const advisorFormContainer = document.getElementById('advisor-form-container');
  const toggleAdvisorText = document.getElementById('toggle-advisor-text');
  const toggleAdvisorIcon = document.getElementById('toggle-advisor-icon');

  if (toggleAdvisorBtn && advisorFormContainer) {
    toggleAdvisorBtn.addEventListener('click', () => {
      const isCollapsed = advisorFormContainer.classList.toggle('collapsed');
      if (toggleAdvisorText) {
        toggleAdvisorText.textContent = isCollapsed ? 'Customize' : 'Minimize';
      }
      if (toggleAdvisorIcon) {
        toggleAdvisorIcon.textContent = isCollapsed ? '▾' : '▴';
      }
    });
  }

  // Budget Slider & Inputs
  const budgetSlider = document.getElementById('budget-slider');
  const budgetDisplay = document.getElementById('budget-display');
  const minPriceInput = document.getElementById('min-price-input');
  const maxPriceInput = document.getElementById('max-price-input');

  budgetSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.maxPrice = val;
    maxPriceInput.value = val;
    budgetDisplay.textContent = `Max: ${formatPKR(val)}`;
    applyFiltersAndRender();
  });

  minPriceInput.addEventListener('change', (e) => {
    state.minPrice = parseInt(e.target.value, 10) || 0;
    applyFiltersAndRender();
  });

  maxPriceInput.addEventListener('change', (e) => {
    state.maxPrice = parseInt(e.target.value, 10) || 600000;
    budgetSlider.value = state.maxPrice;
    budgetDisplay.textContent = `Max: ${formatPKR(state.maxPrice)}`;
    applyFiltersAndRender();
  });

  // Quick Preset Buttons
  document.querySelectorAll('.quick-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.quick-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const preset = pill.dataset.preset;
      switch (preset) {
        case 'under-10k':
          state.minPrice = 0;
          state.maxPrice = 10000;
          break;
        case '10k-30k':
          state.minPrice = 10000;
          state.maxPrice = 30000;
          break;
        case 'under-30k':
          state.minPrice = 0;
          state.maxPrice = 30000;
          break;
        case '30k-60k':
          state.minPrice = 30000;
          state.maxPrice = 60000;
          break;
        case '60k-120k':
          state.minPrice = 60000;
          state.maxPrice = 120000;
          break;
        case '120k-200k':
          state.minPrice = 120000;
          state.maxPrice = 200000;
          break;
        case 'flagship':
          state.minPrice = 200000;
          state.maxPrice = 600000;
          break;
        case 'all':
        default:
          state.minPrice = 0;
          state.maxPrice = 600000;
          break;
      }

      budgetSlider.value = state.maxPrice;
      minPriceInput.value = state.minPrice;
      maxPriceInput.value = state.maxPrice;
      budgetDisplay.textContent = `Max: ${formatPKR(state.maxPrice)}`;
      applyFiltersAndRender();
    });
  });

  // PTA Approved Toggle in Top Bar
  const ptaOnlyToggle = document.getElementById('pta-only-toggle');
  ptaOnlyToggle.addEventListener('change', (e) => {
    state.ptaStatus = e.target.checked ? 'approved' : 'all';
    const radio = document.querySelector(`input[name="pta_status"][value="${state.ptaStatus}"]`);
    if (radio) radio.checked = true;
    applyFiltersAndRender();
  });

  // PTA Status Radio Pills in Sidebar
  document.querySelectorAll('input[name="pta_status"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.ptaStatus = e.target.value;
      ptaOnlyToggle.checked = state.ptaStatus === 'approved';
      applyFiltersAndRender();
    });
  });

  // Spec Pills (RAM, Battery, Charging)
  const bindPillGroup = (containerId, stateKey) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.spec-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        container.querySelectorAll('.spec-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state[stateKey] = pill.dataset[stateKey.replace('selected', '').toLowerCase()];
        applyFiltersAndRender();
      });
    });
  };

  bindPillGroup('ram-pills-container', 'selectedRam');
  bindPillGroup('battery-pills-container', 'selectedBattery');
  bindPillGroup('charging-pills-container', 'selectedCharging');

  // Feature Checkboxes
  document.getElementById('filter-5g').addEventListener('change', (e) => {
    state.only5G = e.target.checked;
    applyFiltersAndRender();
  });

  document.getElementById('filter-cam-108').addEventListener('change', (e) => {
    state.cam108 = e.target.checked;
    applyFiltersAndRender();
  });

  document.getElementById('filter-wireless').addEventListener('change', (e) => {
    state.wireless = e.target.checked;
    applyFiltersAndRender();
  });

  // Sorting
  document.getElementById('sort-select').addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    sortPhones();
    renderPhoneCards();
  });

  // Pagination Load More & Show All
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      state.visibleCount += 24;
      renderPhoneCards();
    });
  }

  const showAllBtn = document.getElementById('show-all-btn');
  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => {
      state.visibleCount = filteredPhones.length;
      renderPhoneCards();
    });
  }

  // Reset Filters
  const resetAll = () => {
    state.searchQuery = '';
    state.minPrice = 0;
    state.maxPrice = 600000;
    state.ptaStatus = 'all';
    state.selectedBrands.clear();
    state.selectedRam = 'all';
    state.selectedBattery = 'all';
    state.selectedCharging = 'all';
    state.only5G = false;
    state.cam108 = false;
    state.wireless = false;
    state.sortBy = 'popular';
    state.visibleCount = 24;

    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    budgetSlider.value = 600000;
    minPriceInput.value = 0;
    maxPriceInput.value = 600000;
    budgetDisplay.textContent = 'Max: Rs. 600,000';
    ptaOnlyToggle.checked = false;
    document.querySelector('input[name="pta_status"][value="all"]').checked = true;
    document.getElementById('filter-5g').checked = false;
    document.getElementById('filter-cam-108').checked = false;
    document.getElementById('filter-wireless').checked = false;
    document.getElementById('sort-select').value = 'popular';

    resetSpecPills('ram-pills-container');
    resetSpecPills('battery-pills-container');
    resetSpecPills('charging-pills-container');
    document.querySelectorAll('.quick-pill').forEach((p, idx) => p.classList.toggle('active', idx === 0));

    renderBrandCheckboxes();
    renderBrandQuickBar();
    applyFiltersAndRender(true);
  };

  document.getElementById('reset-filters-btn').addEventListener('click', resetAll);
  document.getElementById('empty-reset-btn').addEventListener('click', resetAll);

  // Modals & Navigation Buttons
  document.getElementById('open-tax-calc-btn').addEventListener('click', () => {
    document.getElementById('tax-calc-modal').classList.remove('hidden');
  });

  document.getElementById('close-tax-modal-btn').addEventListener('click', () => {
    document.getElementById('tax-calc-modal').classList.add('hidden');
  });

  document.getElementById('open-compare-btn').addEventListener('click', openCompareModal);
  document.getElementById('trigger-compare-modal-btn').addEventListener('click', openCompareModal);
  document.getElementById('close-compare-modal-btn').addEventListener('click', () => {
    document.getElementById('compare-modal').classList.add('hidden');
  });

  document.getElementById('clear-dock-btn').addEventListener('click', () => {
    compareList = [];
    updateCompareDock();
    renderPhoneCards();
  });

  // Modal Backdrop Click
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
    }
  });

  // Tax Calculator Tabs
  document.querySelectorAll('.calc-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const isCustom = tab.dataset.tab === 'custom';
      document.getElementById('calc-device-view').classList.toggle('hidden', isCustom);
      document.getElementById('calc-custom-view').classList.toggle('hidden', !isCustom);
    });
  });

  // Custom USD Tax Calculation
  document.getElementById('calc-custom-btn').addEventListener('click', () => {
    const usd = parseFloat(document.getElementById('calc-usd-input').value);
    if (!usd || usd <= 0) {
      alert('Please enter a valid dollar amount (e.g. 599).');
      return;
    }
    const taxes = calculateCustomPTATax(usd);
    document.getElementById('tax-passport-val').textContent = formatPKR(taxes.passport);
    document.getElementById('tax-cnic-val').textContent = formatPKR(taxes.cnic);
  });
}

// Spec Marquee Hover Logic
function scrollSpec(el) {
  const textSpan = el.querySelector("span:last-child");
  if (!textSpan) return;
  // Calculate overflow (approx 30px taken by padding and emoji)
  const overflowAmount = textSpan.scrollWidth - (el.clientWidth - 30); 
  if (overflowAmount > 0) {
    // Scroll speed: 25ms per pixel, starts after 0.2s hover delay
    textSpan.style.transition = "transform " + (overflowAmount * 25) + "ms linear 0.15s";
    textSpan.style.transform = "translateX(-" + (overflowAmount + 8) + "px)";
  }
}
function resetSpec(el) {
  const textSpan = el.querySelector("span:last-child");
  if (!textSpan) return;
  textSpan.style.transition = "transform 0.3s ease-out";
  textSpan.style.transform = "translateX(0)";
}

