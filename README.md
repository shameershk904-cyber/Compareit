# PakMobiles - Smart Phone Recommendation Engine & Price Aggregator (Pakistan)

> An independent mobile phone specification, recommendation, and price comparison platform tailored for the **Pakistani market**. 
> **Important**: This platform is **NOT** a marketplace or store; we do not list our own inventory or sell phones. We aggregate verified live pricing from authentic Pakistani retailers (**PriceOye.pk**, **Daraz Mall Official**, **Telemart.pk**, **WhatMobile.com.pk**) and guide users to the best phone for their budget and requirements.

---

## 🎯 1. Core Purpose & Architectural Pivot

1. **Dedicated Product Page (`?phone=<slug>`)**:
   - Every smartphone has a full dedicated web page route.
   - Includes high-res gallery, complete GSMArena-style specification sheet, PTA DIRBS tax breakdown, and expert Pakistani buyer verdict (pros & cons).
2. **Authentic Pakistani Retailer Price Comparison**:
   - Automatically tracks and compares verified prices from **PriceOye.pk**, **Daraz Mall (Official Stores)**, **Telemart.pk**, **WhatMobile**, and physical wholesale markets (**Hafeez Centre Lahore / Saddar Karachi**).
   - Highlights the **Lowest Verified Market Price** and shows direct external links to purchase from authentic stores.
3. **Smart Phone Recommendation Advisor ("Find My Best Phone")**:
   - Takes user requirements:
     - **Budget Range**: (e.g. Under 35k, 35k–75k, 75k–130k, 130k+ PKR)
     - **Primary Priority**: Balanced All-Rounder, Camera & OIS, Gaming & PUBG 90fps, Battery & Fast Charging.
   - Algorithms evaluate candidates and present:
     - 🥇 **#1 Top Recommendation**: The best value buy with a tailored rationale.
     - ⚖️ **Direct Competitors in this Budget**: Highlights 2-3 market rivals in that exact price bracket with side-by-side comparison buttons.

---

## 🏗️ 2. System Architecture

```
                 ┌─────────────────────────────────────────────────────────┐
                 │                DATA INGESTION PIPELINE                  │
                 │  - GSMArena.com: Global hardware specs & images         │
                 │  - PriceOye.pk: Lowest online retail benchmark          │
                 │  - Daraz Mall: Official brand flagship store prices     │
                 │  - Telemart.pk: Authorized distributor rates            │
                 │  - FBR / PTA DIRBS: Customs duty slabs (Passport/CNIC)  │
                 └────────────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                 ┌─────────────────────────────────────────────────────────┐
                 │             PRICE AGGREGATOR & SYNC ENGINE              │
                 │  - scraper/price_aggregator.py                          │
                 │  - Computes lowest verified price                       │
                 │  - Assigns savings badges vs official MSRP              │
                 └────────────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                 ┌─────────────────────────────────────────────────────────┐
                 │                CENTRAL CATALOG DATABASE                 │
                 │  - data/phones.json                                     │
                 │  - Multi-retailer quotes, expert verdicts & rivals      │
                 └────────────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                 ┌─────────────────────────────────────────────────────────┐
                 │                   FRONTEND INTERFACE                    │
                 │  - Catalog View: Multi-facet filters, Budget slider     │
                 │  - Smart Advisor: Priority-based recommendation engine  │
                 │  - Dedicated Product Page: Live store comparison table  │
                 │  - Comparison Dock: Side-by-side matrix (up to 3 phones)│
                 └─────────────────────────────────────────────────────────┘
```

---

## 🇵🇰 3. Tracked Pakistani Retailers & Price Benchmarks

| Retailer | Specialization | Role in PakMobiles |
|---|---|---|
| **PriceOye.pk** | High-volume online tech retailer | Real-time competitive benchmark for lowest online prices |
| **Daraz Mall (Official)** | Brand flagship stores (Samsung, Xiaomi, Infinix) | Official MSRP benchmark with brand warranty |
| **Telemart.pk** | Major electronics store | Cross-reference quote for box-pack availability |
| **WhatMobile.com.pk** | Pakistan's oldest specs & price database | Reference for official launch MSRPs |
| **Hafeez Centre / Saddar** | Physical open mobile markets | Unofficial cash rates and used / non-PTA market prices |

---

## 🚀 4. How to Run the Project

### Running Live Locally
The server is currently running at:
👉 **[http://localhost:5500](http://localhost:5500)**

To run or restart the server manually via PowerShell:
```powershell
cd C:\Users\Shahmeer\.gemini\antigravity\scratch\gsmarena-pakistan-clone
powershell -ExecutionPolicy Bypass -File .\server.ps1 -Port 5500
```

### Syncing Retailer Prices via Python
To run the automated price aggregator script:
```powershell
python scraper/price_aggregator.py --sync
```

---

## 📁 5. Project File Map

* **[`index.html`](file:///C:/Users/Shahmeer/.gemini/antigravity/scratch/gsmarena-pakistan-clone/index.html)**: Dual-view application (Catalog + Smart Advisor, and Dedicated Full Product Page view).
* **[`styles.css`](file:///C:/Users/Shahmeer/.gemini/antigravity/scratch/gsmarena-pakistan-clone/styles.css)**: Responsive styling with retailer comparison tables, winner badges, and competitor grids.
* **[`app.js`](file:///C:/Users/Shahmeer/.gemini/antigravity/scratch/gsmarena-pakistan-clone/app.js)**: State store, URL parameter router (`?phone=<id>`), recommendation scoring engine, and comparison matrix.
* **[`data/phones.json`](file:///C:/Users/Shahmeer/.gemini/antigravity/scratch/gsmarena-pakistan-clone/data/phones.json)**: Localized catalog with live retailer quotes, pros/cons, and competitor IDs.
* **[`scraper/price_aggregator.py`](file:///C:/Users/Shahmeer/.gemini/antigravity/scratch/gsmarena-pakistan-clone/scraper/price_aggregator.py)**: Multi-retailer price aggregator and sync engine.
* **[`scraper/gsmarena_scraper.py`](file:///C:/Users/Shahmeer/.gemini/antigravity/scratch/gsmarena-pakistan-clone/scraper/gsmarena_scraper.py)**: Spec scraping pipeline for GSMArena.
* **[`server.ps1`](file:///C:/Users/Shahmeer/.gemini/antigravity/scratch/gsmarena-pakistan-clone/server.ps1)**: Native PowerShell HTTP server.
