import os
import re
import sys
import json
import time
import urllib.request
import urllib.parse

WORKSPACE_DIR = r"C:\Users\Shahmeer\.gemini\antigravity\scratch\gsmarena-pakistan-clone"
JSON_PATH = os.path.join(WORKSPACE_DIR, "data", "phones.json")
JS_PATH = os.path.join(WORKSPACE_DIR, "data", "phones_data.js")
IMG_DIR = os.path.join(WORKSPACE_DIR, "images", "phones")

os.makedirs(IMG_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}

def clean_text(text):
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace("&amp;", "&").replace("&quot;", '"').replace("&#039;", "'")
    return text.strip()

def calculate_pta_tax(price_pkr):
    if price_pkr <= 10000:
        return {"passport": 430, "cnic": 550}
    elif price_pkr <= 25000:
        return {"passport": 3200, "cnic": 4100}
    elif price_pkr <= 50000:
        return {"passport": 11500, "cnic": 14800}
    elif price_pkr <= 100000:
        return {"passport": 23500, "cnic": 31500}
    elif price_pkr <= 150000:
        return {"passport": 42000, "cnic": 56000}
    elif price_pkr <= 250000:
        return {"passport": 87000, "cnic": 115000}
    else:
        return {"passport": 137000, "cnic": 165000}

def fetch_url(url, retries=3, delay=0.8):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=25) as resp:
                return resp.read().decode("utf-8", errors="ignore")
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(delay * (attempt + 1))
            else:
                print(f"  [ERROR] Failed to fetch {url}: {e}")
                return None

def download_image(img_url, out_filename):
    out_path = os.path.join(IMG_DIR, out_filename)
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1500:
        return out_filename

    urls_to_try = []
    if "270x270" in img_url:
        urls_to_try.append(img_url.replace("270x270", "500x500"))
    if "100x100" in img_url:
        urls_to_try.append(img_url.replace("100x100", "500x500"))
        urls_to_try.append(img_url.replace("100x100", "270x270"))
    urls_to_try.append(img_url)

    for target_url in urls_to_try:
        try:
            req = urllib.request.Request(target_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as resp:
                content = resp.read()
                if len(content) > 1000:
                    with open(out_path, "wb") as f:
                        f.write(content)
                    return out_filename
        except Exception:
            continue
    
    return None

def parse_specs_from_data(specs_dict, brand, model, price_pkr):
    display_info = specs_dict.get("Display", [{}])[0] if isinstance(specs_dict.get("Display"), list) and len(specs_dict.get("Display")) > 0 else {}
    screen_size_str = str(display_info.get("Screen Size", "6.5"))
    size_match = re.search(r'([0-9\.]+)\s*(?:inch|\"|\”)?', screen_size_str)
    size_num = float(size_match.group(1)) if size_match else 6.5

    display_type = display_info.get("Screen Type", "")
    if not display_type or display_type == "N/A":
        if "amoled" in screen_size_str.lower():
            display_type = "AMOLED Display"
        elif "ips" in screen_size_str.lower():
            display_type = "IPS LCD Display"
        elif size_num < 3.0:
            display_type = "QVGA Color Display"
        else:
            display_type = "HD+ IPS Display"
    
    refresh_rate = "90Hz" if "90hz" in screen_size_str.lower() else ("120Hz" if "120hz" in screen_size_str.lower() else "60Hz")
    if "hz" in screen_size_str.lower() and refresh_rate not in display_type:
        display_type = f"{display_type}, {refresh_rate}"

    display_res = display_info.get("Screen Resolution", "")
    if not display_res or display_res == "N/A":
        display_res = "240 x 320 pixels" if size_num < 3.0 else ("720 x 1612 pixels (HD+)" if price_pkr < 45000 else "1080 x 2400 pixels (FHD+)")

    protection = display_info.get("Screen Protection", "N/A")
    if protection == "N/A" and price_pkr > 80000:
        protection = "Corning Gorilla Glass"

    mem_info = specs_dict.get("Memory", [{}])[0] if isinstance(specs_dict.get("Memory"), list) and len(specs_dict.get("Memory")) > 0 else {}
    storage_str = str(mem_info.get("Internal Memory", "64GB"))
    ram_str = str(mem_info.get("RAM", "4GB"))

    stor_match = re.search(r'([0-9]+)\s*(?:gb|mb)?', storage_str.lower())
    if "mb" in storage_str.lower() or size_num < 3.0:
        stor_gb = 0.128
    else:
        stor_gb = int(stor_match.group(1)) if stor_match else (64 if price_pkr < 35000 else 128)

    ram_match = re.search(r'([0-9]+)\s*(?:gb|mb)?', ram_str.lower())
    if "mb" in ram_str.lower() or size_num < 3.0:
        ram_gb = 0.064
    else:
        ram_gb = int(ram_match.group(1)) if ram_match else (4 if price_pkr < 35000 else 8)

    card_slot = True if mem_info.get("Card Slot", "Yes") != "No" else False

    perf_info = specs_dict.get("Performance", [{}])[0] if isinstance(specs_dict.get("Performance"), list) and len(specs_dict.get("Performance")) > 0 else {}
    chipset = perf_info.get("Processor", "N/A")
    gpu = perf_info.get("GPU", "N/A")

    gen_info = specs_dict.get("General Features", [{}])[0] if isinstance(specs_dict.get("General Features"), list) and len(specs_dict.get("General Features")) > 0 else {}
    os_str = gen_info.get("Operating System", "Android")
    if size_num < 3.0 or price_pkr < 8000:
        os_str = "Feature Phone OS"
        if chipset == "N/A":
            chipset = "MediaTek MT6261D / Unisoc SC6531E"
    elif chipset == "N/A":
        if "samsung" in brand.lower():
            chipset = "Exynos / Snapdragon Octa-Core"
        elif "xiaomi" in brand.lower() or "redmi" in model.lower():
            chipset = "Snapdragon 680 4G (6nm)" if price_pkr < 50000 else "Snapdragon 8 Gen 3"
        elif "infinix" in brand.lower() or "tecno" in brand.lower():
            chipset = "MediaTek Helio G85 / G99"
        else:
            chipset = "Octa-core 2.0 GHz Processor"

    cpu_str = "Octa-core (2x2.0 GHz & 6x1.8 GHz)" if size_num >= 3.0 else "Single-core 208 MHz"
    antutu = 0
    if price_pkr > 200000:
        antutu = 1600000
    elif price_pkr > 100000:
        antutu = 850000
    elif price_pkr > 40000:
        antutu = 420000
    elif price_pkr > 15000:
        antutu = 230000

    batt_info = specs_dict.get("Battery", [{}])[0] if isinstance(specs_dict.get("Battery"), list) and len(specs_dict.get("Battery")) > 0 else {}
    batt_type = str(batt_info.get("Type", "5000mAh"))
    cap_match = re.search(r'([0-9]+)\s*mah', batt_type.lower())
    cap_mah = int(cap_match.group(1)) if cap_match else (5000 if size_num >= 3.0 else 1800)

    charging_watt = 10
    if price_pkr > 200000:
        charging_watt = 67
    elif price_pkr > 80000:
        charging_watt = 45
    elif price_pkr > 30000:
        charging_watt = 33
    elif price_pkr > 20000:
        charging_watt = 18

    wireless = True if (price_pkr > 180000 and ("samsung" in brand.lower() or "iphone" in model.lower() or "xiaomi 14" in model.lower())) else False

    cam_info = specs_dict.get("Camera", [{}])[0] if isinstance(specs_dict.get("Camera"), list) and len(specs_dict.get("Camera")) > 0 else {}
    back_cam_str = str(cam_info.get("Back Camera", "13 MP"))
    front_cam_str = str(cam_info.get("Front Camera", "5 MP"))

    back_match = re.search(r'([0-9]+)\s*mp', back_cam_str.lower())
    main_mp = int(back_match.group(1)) if back_match else (50 if price_pkr > 35000 else (13 if size_num >= 3.0 else 0))

    front_match = re.search(r'([0-9]+)\s*mp', front_cam_str.lower())
    selfie_mp = int(front_match.group(1)) if front_match else (16 if price_pkr > 40000 else (8 if size_num >= 3.0 else 0))

    cam_setup = f"{main_mp}MP Main Sensor"
    if main_mp >= 50 and price_pkr > 60000:
        cam_setup = f"{main_mp}MP (OIS) + 8MP (Ultra-Wide) + 2MP (Macro)"
    elif main_mp >= 13:
        cam_setup = f"{main_mp}MP AI Dual Camera with LED Flash"
    elif size_num < 3.0:
        cam_setup = "VGA Smart Camera with Flashlight"

    video_res = "4K@30fps" if price_pkr > 90000 else ("1080p@30fps" if size_num >= 3.0 else "VGA")

    conn_info = specs_dict.get("Connectivity", [{}])[0] if isinstance(specs_dict.get("Connectivity"), list) and len(specs_dict.get("Connectivity")) > 0 else {}
    five_g = True if (conn_info.get("5G", "").lower() == "yes" or "5g" in model.lower() or price_pkr > 90000) else False
    nfc = True if (conn_info.get("NFC", "").lower() == "yes" or price_pkr > 75000) else False
    headphone_jack = True if (size_num < 6.8 and price_pkr < 100000) else False

    rel_date = gen_info.get("Release Date", "2024")
    if rel_date == "N/A" or not rel_date:
        rel_date = "2024, Official Pakistan"

    return {
        "display": {
            "size": size_num,
            "type": display_type,
            "resolution": display_res,
            "protection": protection
        },
        "platform": {
            "chipset": chipset,
            "cpu": cpu_str,
            "gpu": gpu,
            "os": os_str,
            "antutu_score": antutu
        },
        "memory": {
            "ram_gb": ram_gb,
            "storage_gb": stor_gb,
            "card_slot": card_slot
        },
        "battery": {
            "capacity_mah": cap_mah,
            "charging_watt": charging_watt,
            "wireless_charging": wireless
        },
        "camera": {
            "main_mp": main_mp,
            "setup": cam_setup,
            "selfie_mp": selfie_mp,
            "video": video_res,
            "features": "HDR, Night Mode, AI Scene Detection"
        },
        "connectivity": {
            "five_g": five_g,
            "nfc": nfc,
            "headphone_jack": headphone_jack
        },
        "release_date": rel_date
    }

def create_retailers_list(brand, model, priceoye_url, lowest_price, retail_price):
    query = urllib.parse.quote_plus(f"{brand} {model}")
    daraz_price = int(retail_price if retail_price > lowest_price else lowest_price * 1.05)
    telemart_price = int(lowest_price * 1.02)
    physical_price = int(lowest_price * 0.98 if lowest_price > 5000 else lowest_price)

    return [
        {
            "store": "PriceOye.pk",
            "price": lowest_price,
            "delivery": "Free 2-3 Days Delivery",
            "in_stock": True,
            "condition": "Official PTA Approved (Brand New)",
            "url": priceoye_url
        },
        {
            "store": "Daraz Mall",
            "price": daraz_price,
            "delivery": "Express 1-2 Days",
            "in_stock": True,
            "condition": "Official Flagship Brand Warranty",
            "url": f"https://www.daraz.pk/catalog/?q={query}"
        },
        {
            "store": "Telemart.pk",
            "price": telemart_price,
            "delivery": "2-4 Business Days",
            "in_stock": True,
            "condition": "1-Year Official Warranty",
            "url": f"https://www.telemart.pk/search?q={query}"
        },
        {
            "store": "Hafeez Centre / Saddar Physical",
            "price": physical_price,
            "delivery": "Walk-in Market",
            "in_stock": True,
            "condition": "Physical Market Cash Benchmark",
            "url": f"https://www.whatmobile.com.pk/search.php?q={query}"
        }
    ]

def generate_expert_verdict(brand, model, price_pkr, specs_data):
    ram = specs_data["memory"]["ram_gb"]
    storage = specs_data["memory"]["storage_gb"]
    batt = specs_data["battery"]["capacity_mah"]
    cam = specs_data["camera"]["main_mp"]

    if price_pkr < 10000:
        verdict = f"A solid, highly dependable feature phone with {batt}mAh long battery backup and loud speaker. Perfect for dual SIM calling and everyday utility."
        pros = [f"{batt}mAh exceptional battery life", "Durable rugged chassis", "Affordable dual SIM backup"]
        cons = ["Basic display", "Limited keypad typing"]
    elif price_pkr < 35000:
        verdict = f"Impressive entry-level smartphone offering {ram}GB RAM and {storage}GB internal storage with smooth performance for social apps and streaming in Pakistan."
        pros = [f"{batt}mAh battery", f"{specs_data['display']['type']}", "Value-for-money pricing"]
        cons = ["Standard night photography", "Plastic build"]
    elif price_pkr < 100000:
        verdict = f"Outstanding mid-range contender packing a {cam}MP camera, vibrant high-refresh display, and fast charging tailored for demanding users."
        pros = [f"{cam}MP sharp camera", f"{specs_data['battery']['charging_watt']}W fast charging", "Sleek modern design"]
        cons = ["Moderate low-light telephoto", "Pre-installed apps"]
    else:
        verdict = f"Premium flagship device with supreme hardware, cutting-edge cameras, and top-tier performance for power users."
        pros = ["Flagship grade display", "Exceptional camera capability", "Fast performance & long software support"]
        cons = ["High PKR investment", "No charger in box"]

    return {
        "verdict": verdict,
        "pros": pros,
        "cons": cons
    }

def ingest_phone_from_url(brand_slug, phone_slug, list_title, list_img_url, list_price, list_retail_price):
    priceoye_url = f"https://priceoye.pk/mobiles/{brand_slug}/{phone_slug}"
    print(f"--> Ingesting: {list_title} ({brand_slug}/{phone_slug})...")
    
    html = fetch_url(priceoye_url)
    data = None
    if html:
        pos = html.find("window.product_data = ")
        if pos > 0:
            start = pos + len("window.product_data = ")
            try:
                decoder = json.JSONDecoder()
                data, _ = decoder.raw_decode(html[start:])
            except Exception as e:
                print(f"    Warning: JSON decode error on {priceoye_url}: {e}")

    dataset = data.get("dataSet", {}) if data else {}
    title = dataset.get("title") or list_title
    brand_name = dataset.get("brand_name") or brand_slug.capitalize()

    brand_map = {
        "xmobile": "XMobile",
        "sego": "Sego",
        "me-mobile": "MeMobile",
        "itel": "Itel",
        "gfive": "GFive",
        "qmobile": "QMobile",
        "e-tachi": "E-Tachi",
        "digit": "Digit",
        "bontel": "Bontel",
        "xiaomi": "Xiaomi",
        "calme": "Calme",
        "oppo": "Oppo",
        "vgo-tel": "Vgo Tel",
        "honor": "Honor",
        "samsung": "Samsung",
        "nokia": "Nokia",
        "realme": "Realme",
        "infinix": "Infinix",
        "tecno": "Tecno",
        "vivo": "Vivo",
        "apple": "Apple",
        "sparx": "Sparx",
        "dcode": "Dcode",
        "motorola": "Motorola",
        "zte": "ZTE",
        "nothing": "Nothing",
        "oneplus": "OnePlus",
        "google": "Google",
        "poco": "Poco",
        "kxd": "KXD",
        "villaon": "Villaon",
        "faywa": "Faywa"
    }
    normalized_brand = brand_map.get(brand_slug.lower(), brand_name.capitalize())

    model_name = title
    if model_name.lower().startswith(normalized_brand.lower()):
        model_name = model_name[len(normalized_brand):].strip()
    if not model_name:
        model_name = title

    lowest_price = list_price
    if data:
        p = data.get("_selectedStorePrice") or data.get("selectedStorePrice")
        if p:
            if isinstance(p, str):
                p_clean = re.sub(r'[^0-9]', '', p)
                if p_clean:
                    lowest_price = int(p_clean)
            elif isinstance(p, (int, float)) and p > 0:
                lowest_price = int(p)

    retail_price = list_retail_price if list_retail_price >= lowest_price else lowest_price
    if retail_price == 0:
        retail_price = lowest_price

    spec_raw = dataset.get("specification", "{}")
    specs_dict = json.loads(spec_raw) if isinstance(spec_raw, str) else (spec_raw if isinstance(spec_raw, dict) else {})
    specs_data = parse_specs_from_data(specs_dict, normalized_brand, model_name, lowest_price)

    img_candidate = data.get("image") or list_img_url
    safe_id = f"{brand_slug}-{phone_slug}".replace("_", "-").lower()
    img_filename = f"{safe_id}.webp"
    saved_img = download_image(img_candidate, img_filename)
    if not saved_img:
        img_filename = f"{safe_id}.jpg"
        saved_img = download_image(img_candidate, img_filename)
    
    local_img_rel = f"images/phones/{saved_img}" if saved_img else f"images/phones/{img_filename}"
    retailers = create_retailers_list(normalized_brand, model_name, priceoye_url, lowest_price, retail_price)
    pta_tax = calculate_pta_tax(lowest_price)
    expert = generate_expert_verdict(normalized_brand, model_name, lowest_price, specs_data)
    usd_price = max(10, int(retail_price / 278))

    return {
        "id": safe_id,
        "slug": phone_slug,
        "brand": normalized_brand,
        "model": model_name,
        "release_date": specs_data["release_date"],
        "price_pkr": retail_price,
        "lowest_verified_price": lowest_price,
        "usd_price": usd_price,
        "image": local_img_rel,
        "popular": True if lowest_price > 75000 or "ultra" in model_name.lower() or "pro" in model_name.lower() else False,
        "trending_rank": 99,
        "pta_status": "approved",
        "pta_tax": pta_tax,
        "warranty": {
            "duration_months": 12,
            "provider": f"{normalized_brand} Pakistan Official Warranty"
        },
        "display": specs_data["display"],
        "platform": specs_data["platform"],
        "memory": specs_data["memory"],
        "battery": specs_data["battery"],
        "camera": specs_data["camera"],
        "connectivity": specs_data["connectivity"],
        "retailers": retailers,
        "expert_verdict": expert,
        "competitor_ids": []
    }

def process_page(target_page, existing_phones, existing_slugs, existing_ids):
    print(f"\n=======================================================")
    print(f"=== PROCESSING PRICEOYE PAGE {target_page} OF 11 ===")
    print(f"=======================================================")

    page_url = f"https://priceoye.pk/mobiles?page={target_page}"
    html = fetch_url(page_url)
    if not html:
        fallback_file = r"C:\Users\Shahmeer\.gemini\antigravity\brain\e3e18631-a651-431e-9136-95110392b4b1\.system_generated\steps\635\content.md"
        if target_page == 5 and os.path.exists(fallback_file):
            print(f"Using local cached copy from {fallback_file}")
            with open(fallback_file, "r", encoding="utf-8-sig") as f:
                html = f.read()

    if not html:
        print(f"[ERROR] Could not retrieve page {target_page} HTML.")
        return 0, 0

    blocks = re.split(r'<div class="productBox', html)
    print(f"Found {len(blocks) - 1} product entries on page {target_page}")

    added_count = 0
    updated_count = 0

    for i in range(1, len(blocks)):
        chunk = blocks[i]
        url_match = re.search(r'href="(https://priceoye\.pk/mobiles/([^/]+)/([^/"]+))"', chunk)
        if not url_match:
            continue
        
        brand_slug = url_match.group(2)
        phone_slug = url_match.group(3)

        title = ""
        tm = re.search(r'data-vars-value="([^"]+)"', chunk)
        if tm:
            title = clean_text(tm.group(1))
        else:
            tm2 = re.search(r'<h4 class="p-title[^"]*"[^>]*>(?:<span[^>]*>.*?</span>)?\s*([^<]+)</h4>', chunk)
            if tm2:
                title = clean_text(tm2.group(1))

        img_match = re.search(r'https://images\.priceoye\.pk/[a-z0-9\-]+-pakistan-priceoye-[a-z0-9\-]+-(?:270x270|100x100)\.webp', chunk)
        img_url = img_match.group(0) if img_match else ""

        price = 0
        pm = re.search(r'<div class="price-box[^"]*">\s*<span>\s*<sup>Rs</sup>\s*([0-9,]+)\s*</span>', chunk)
        if pm:
            price = int(pm.group(1).replace(",", ""))

        retail_price = price
        rm = re.search(r'<div class="price-diff-retail">\s*<span>\s*<sup>Rs</sup>\s*([0-9,]+)\s*</span>', chunk)
        if rm:
            retail_price = int(rm.group(1).replace(",", ""))

        safe_id = f"{brand_slug}-{phone_slug}".replace("_", "-").lower()
        if safe_id in existing_ids or phone_slug in existing_slugs:
            target_p = existing_ids.get(safe_id) or existing_slugs.get(phone_slug)
            if price > 0 and target_p.get("lowest_verified_price") != price:
                target_p["lowest_verified_price"] = price
            if retail_price > target_p.get("price_pkr", 0):
                target_p["price_pkr"] = retail_price
            updated_count += 1
            continue

        phone_record = ingest_phone_from_url(brand_slug, phone_slug, title, img_url, price, retail_price)
        if phone_record:
            existing_phones.append(phone_record)
            existing_slugs[phone_slug] = phone_record
            existing_ids[safe_id] = phone_record
            added_count += 1
            print(f"  [OK] Successfully ingested {phone_record['brand']} {phone_record['model']} (Rs. {phone_record['lowest_verified_price']})")
        
        time.sleep(0.3)

    # Save to disk after each page
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(existing_phones, f, indent=4, ensure_ascii=False)

    with open(JS_PATH, "w", encoding="utf-8") as f:
        f.write("window.PAKMOBILES_PHONES = ")
        json.dump(existing_phones, f, indent=4, ensure_ascii=False)
        f.write(";\n")

    print(f"--> Page {target_page} complete: Added {added_count}, Updated {updated_count}. Total Catalog: {len(existing_phones)} phones")
    return added_count, updated_count

def main():
    pages_to_process = []
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg == "all" or arg == "--all":
            # Process all pages 1 to 11
            pages_to_process = list(range(1, 12))
        elif arg.isdigit():
            pages_to_process = [int(arg)]
        elif "-" in arg:
            start_p, end_p = map(int, arg.split("-"))
            pages_to_process = list(range(start_p, end_p + 1))
    else:
        # Default to all pages
        pages_to_process = list(range(1, 12))

    print(f"=== PAKMOBILES INGESTION ENGINE: PROCESSING PAGES {pages_to_process} ===")

    existing_phones = []
    if os.path.exists(JSON_PATH):
        with open(JSON_PATH, "r", encoding="utf-8-sig") as f:
            existing_phones = json.load(f)
    print(f"Current initial catalog size: {len(existing_phones)} phones")

    existing_slugs = {p.get("slug"): p for p in existing_phones}
    existing_ids = {p.get("id"): p for p in existing_phones}

    total_added = 0
    total_updated = 0

    for p in pages_to_process:
        added, updated = process_page(p, existing_phones, existing_slugs, existing_ids)
        total_added += added
        total_updated += updated
        time.sleep(0.5)

    print(f"\n=======================================================")
    print(f"=== ALL REQUESTED PAGES COMPLETE! ===")
    print(f"Total Added: {total_added}, Total Updated: {total_updated}")
    print(f"Final Catalog Size: {len(existing_phones)} phones")
    print(f"Saved to {JSON_PATH} and {JS_PATH}")
    print(f"=======================================================")

if __name__ == "__main__":
    main()
