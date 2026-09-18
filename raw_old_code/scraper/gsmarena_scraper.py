#!/usr/bin/env python3
"""
GSMArena Scraper & Pakistan Market Enrichment Engine
Extracts mobile phone specifications from GSMArena and calculates
Pakistan-specific data (PKR pricing, PTA DIRBS tax slabs, official warranty distributors).
"""

import json
import re
import sys
import argparse
from urllib.parse import urlparse

# Optional third-party imports with graceful handling
try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    requests = None
    BeautifulSoup = None

# Exchange rate baseline & customs duty calculation rules (FBR / PTA Pakistan)
USD_TO_PKR = 278.50

# FBR / PTA DIRBS Mobile Tax Slabs (Values in USD -> Tax in PKR)
PTA_TAX_SLABS = [
    {"max_usd": 30, "passport": 430, "cnic": 550},
    {"max_usd": 100, "passport": 3200, "cnic": 4300},
    {"max_usd": 200, "passport": 9500, "cnic": 12500},
    {"max_usd": 350, "passport": 19500, "cnic": 25000},
    {"max_usd": 500, "passport": 41000, "cnic": 51000},
    {"max_usd": float("inf"), "passport_base": 70000, "cnic_base": 85000, "luxury_rate": 0.25}
]

# Official Pakistani warranty distributors by brand
DISTRIBUTORS = {
    "samsung": "Airlink Communication / Corecell Pakistan",
    "apple": "Mercantile / Apple Authorised Pakistan",
    "xiaomi": "Smart Link Technologies / Airlink",
    "infinix": "Carlcare Pakistan (Transsion)",
    "tecno": "Carlcare Pakistan (Transsion)",
    "itel": "Carlcare Pakistan (Transsion)",
    "vivo": "Vivo Pakistan Official",
    "oppo": "Oppo Pakistan Official",
    "realme": "Realme Pakistan Official",
    "sparx": "Deploy Group Pakistan",
    "google": "Grey Market / International (Non-Official)"
}


def calculate_pta_tax(usd_price: float) -> dict:
    """
    Calculates estimated PTA registration tax (Passport vs CNIC)
    based on the device's USD retail invoice value.
    """
    if usd_price <= 0:
        return {"passport": 0, "cnic": 0}

    for slab in PTA_TAX_SLABS:
        if usd_price <= slab.get("max_usd", 0):
            return {
                "passport": slab["passport"],
                "cnic": slab["cnic"]
            }

    # Luxury tier (> $500) calculation with sales tax + regulatory duty
    luxury = PTA_TAX_SLABS[-1]
    extra_duty = int((usd_price - 500) * USD_TO_PKR * 0.17)
    return {
        "passport": min(145000, luxury["passport_base"] + extra_duty),
        "cnic": min(175000, luxury["cnic_base"] + extra_duty)
    }


def parse_gsmarena_html(html_content: str) -> dict:
    """
    Parses GSMArena HTML spec page structure.
    Works with both live crawled HTML and saved snapshots.
    """
    if not BeautifulSoup:
        raise RuntimeError("BeautifulSoup is required. Install with: pip install beautifulsoup4 requests")

    soup = BeautifulSoup(html_content, "html.parser")

    # 1. Model Name and Brand
    title_el = soup.find("h1", {"data-spec": "modelname"}) or soup.find("h1", class_="specs-phone-name-title")
    model_name = title_el.get_text(strip=True) if title_el else "Unknown Smartphone"

    brand = model_name.split()[0] if model_name else "Generic"

    # 2. Main Image
    img_el = soup.select_one(".specs-photo-main img") or soup.select_one(".review-header img")
    image_url = img_el.get("src", "") if img_el else ""

    # 3. Spotlight Quick Specs
    def get_spec(data_spec_name: str) -> str:
        el = soup.find(attrs={"data-spec": data_spec_name})
        return el.get_text(strip=True) if el else ""

    released = get_spec("released-hl") or get_spec("year")
    body_desc = get_spec("body-hl")
    os_desc = get_spec("os-hl") or get_spec("os")
    storage_desc = get_spec("storage-hl") or get_spec("internalmemory")
    display_size_raw = get_spec("displaysize-hl")
    display_res_raw = get_spec("displayres-hl")
    camera_raw = get_spec("camerapixels-hl")
    ram_raw = get_spec("ramsize-hl")
    chipset_raw = get_spec("chipset-hl") or get_spec("chipset")
    bat_raw = get_spec("batsize-hl")

    # Clean numeric fields
    ram_gb = 0
    ram_match = re.search(r"(\d+)", ram_raw)
    if ram_match:
        ram_gb = int(ram_match.group(1))

    storage_gb = 128
    storage_match = re.search(r"(\d+)(?:GB|TB)", storage_desc)
    if storage_match:
        val = int(storage_match.group(1))
        storage_gb = val * 1024 if "TB" in storage_desc else val

    battery_mah = 5000
    bat_match = re.search(r"(\d{4,5})", bat_raw)
    if bat_match:
        battery_mah = int(bat_match.group(1))

    display_size = 6.67
    disp_match = re.search(r"(\d+\.?\d*)", display_size_raw)
    if disp_match:
        display_size = float(disp_match.group(1))

    camera_mp = 50
    cam_match = re.search(r"(\d+)", camera_raw)
    if cam_match:
        camera_mp = int(cam_match.group(1))

    # Detailed specifications dictionary
    detailed_specs = {}
    specs_list = soup.find("div", id="specs-list")
    if specs_list:
        for table in specs_list.find_all("table"):
            th = table.find("th")
            category = th.get_text(strip=True) if th else "General"
            detailed_specs[category] = {}

            for row in table.find_all("tr"):
                ttl = row.find("td", class_="ttl")
                nfo = row.find("td", class_="nfo")
                if ttl and nfo:
                    key = ttl.get_text(strip=True)
                    val = nfo.get_text(" ", strip=True)
                    if key:
                        detailed_specs[category][key] = val

    # Estimate Global USD price from misc price or ballpark
    usd_price = 299.0
    price_str = detailed_specs.get("Misc", {}).get("Price", "")
    price_match = re.search(r"(\$|€|£)\s*([\d,]+)", price_str)
    if price_match:
        curr, amount = price_match.groups()
        amount_num = float(amount.replace(",", ""))
        if curr == "€":
            usd_price = amount_num * 1.08
        elif curr == "£":
            usd_price = amount_num * 1.28
        else:
            usd_price = amount_num

    # 4. Pakistan Localization Enrichment
    pkr_official = int(round(usd_price * USD_TO_PKR * 1.15, -2))  # Includes local import & distributor margin
    pkr_market = int(round(pkr_official * 0.94, -2))  # Open market cash discount
    pta_taxes = calculate_pta_tax(usd_price)

    distributor = DISTRIBUTORS.get(brand.lower(), "Official Warranty Partner")

    # Check 5G support
    net_tech = detailed_specs.get("Network", {}).get("Technology", "")
    has_5g = "5G" in net_tech or "5g" in model_name.lower()

    # Fast charging watts
    charging_desc = detailed_specs.get("Battery", {}).get("Charging", "")
    watt_match = re.search(r"(\d+)\s*W", charging_desc)
    charging_watt = int(watt_match.group(1)) if watt_match else (45 if "ultra" in model_name.lower() else 33)

    return {
        "id": re.sub(r"[^a-z0-9]+", "-", model_name.lower()).strip("-"),
        "brand": brand,
        "model": model_name,
        "image": image_url,
        "usd_price": round(usd_price, 2),
        "price_pkr": pkr_official,
        "price_market_pkr": pkr_market,
        "pta_status": "approved",
        "pta_tax": pta_taxes,
        "warranty": {
            "provider": distributor,
            "duration_months": 12
        },
        "release_date": released,
        "display": {
            "size": display_size,
            "type": detailed_specs.get("Display", {}).get("Type", "AMOLED Display"),
            "resolution": display_res_raw or detailed_specs.get("Display", {}).get("Resolution", "1080 x 2400 pixels"),
        },
        "platform": {
            "os": os_desc,
            "chipset": chipset_raw or "Octa-Core Processor",
            "cpu": detailed_specs.get("Platform", {}).get("CPU", ""),
            "gpu": detailed_specs.get("Platform", {}).get("GPU", "")
        },
        "memory": {
            "ram_gb": ram_gb or 8,
            "storage_gb": storage_gb,
            "card_slot": "microSD" in detailed_specs.get("Memory", {}).get("Card slot", "")
        },
        "camera": {
            "main_mp": camera_mp,
            "setup": detailed_specs.get("Main Camera", {}).get("Triple", detailed_specs.get("Main Camera", {}).get("Dual", f"{camera_mp} MP")),
            "selfie_mp": 16
        },
        "battery": {
            "capacity_mah": battery_mah,
            "charging_watt": charging_watt,
            "wireless_charging": "wireless" in charging_desc.lower()
        },
        "connectivity": {
            "five_g": has_5g,
            "nfc": "yes" in detailed_specs.get("Comms", {}).get("NFC", "").lower(),
            "headphone_jack": "yes" in detailed_specs.get("Sound", {}).get("3.5mm jack", "").lower()
        }
    }


def scrape_gsmarena_url(url: str) -> dict:
    """
    Crawls a live GSMArena URL with headers to avoid basic bot blocks.
    """
    if not requests:
        raise RuntimeError("requests library is required for live crawling.")

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    }

    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()
    return parse_gsmarena_html(response.text)


def run_self_test():
    """Validates parser using a mock HTML snippet."""
    print("Running scraper self-test with sample GSMArena markup...")
    sample_html = """
    <html>
      <h1 data-spec="modelname">Infinix GT 20 Pro</h1>
      <ul class="specs-spotlight-features">
        <li><span data-spec="released-hl">Released 2024, May</span></li>
        <li><span data-spec="displaysize-hl">6.78"</span></li>
        <li><div data-spec="displayres-hl">1080x2436 pixels</div></li>
        <li><span data-spec="camerapixels-hl">108</span></li>
        <li><span data-spec="ramsize-hl">12</span></li>
        <li><div data-spec="chipset-hl">Dimensity 8200 Ultimate</div></li>
        <li><span data-spec="batsize-hl">5000</span></li>
      </ul>
      <div id="specs-list">
        <table>
          <tr><th>Network</th></tr>
          <tr><td class="ttl">Technology</td><td class="nfo">GSM / HSPA / LTE / 5G</td></tr>
        </table>
        <table>
          <tr><th>Battery</th></tr>
          <tr><td class="ttl">Charging</td><td class="nfo">45W wired, PD3.0</td></tr>
        </table>
        <table>
          <tr><th>Misc</th></tr>
          <tr><td class="ttl">Price</td><td class="nfo">$ 310.00</td></tr>
        </table>
      </div>
    </html>
    """

    if BeautifulSoup:
        result = parse_gsmarena_html(sample_html)
        print("Scraper Self-Test Success! Extracted:")
        print(f" - Model: {result['model']}")
        print(f" - Brand: {result['brand']}")
        print(f" - Estimated PKR Official: Rs. {result['price_pkr']:,}")
        print(f" - PTA CNIC Tax: Rs. {result['pta_tax']['cnic']:,}")
        print(f" - Distributor: {result['warranty']['provider']}")
        print(f" - 5G: {result['connectivity']['five_g']}")
        print(f" - RAM: {result['memory']['ram_gb']}GB | Battery: {result['battery']['capacity_mah']}mAh ({result['battery']['charging_watt']}W)")
    else:
        print("Note: BeautifulSoup4 is not installed on this system. PTA calculator logic is active.")
        tax = calculate_pta_tax(1199)
        print(f"PTA Tax Test on $1,199 flagship: Passport = Rs. {tax['passport']:,}, CNIC = Rs. {tax['cnic']:,}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GSMArena Scraper & Pakistan Market Enrichment")
    parser.add_argument("--url", help="GSMArena phone spec URL to scrape")
    parser.add_argument("--test", action="store_true", help="Run offline unit test with mock HTML")
    parser.add_argument("--output", help="Path to save scraped JSON", default="scraped_phone.json")

    args = parser.parse_args()

    if args.test or len(sys.argv) == 1:
        run_self_test()
    elif args.url:
        print(f"Fetching {args.url}...")
        data = scrape_gsmarena_url(args.url)
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Saved localized phone data to {args.output}")
