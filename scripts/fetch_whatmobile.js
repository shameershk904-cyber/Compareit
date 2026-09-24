const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchUrl(urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.whatmobile.com.pk',
      path: urlPath,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    };

    const req = https.request(options, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', err => reject(err));
    req.end();
  });
}

function parseWhatMobileTable(html) {
  const tableMatch = html.match(/<table[^>]*class="specs"[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return null;

  const rows = tableMatch[1].match(/<tr[\s\S]*?<\/tr>/gi) || [];
  let currentCategory = '';
  const specs = {};

  rows.forEach(row => {
    const catMatch = row.match(/class="[^"]*specs-mainheading[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
    if (catMatch) {
      currentCategory = catMatch[1].replace(/<[^>]+>/g, '').trim();
      if (!specs[currentCategory]) {
        specs[currentCategory] = [];
      }
    }

    const labelMatch = row.match(/<th[^>]*class="[^"]*specs-subHeading[^"]*"[^>]*>([\s\S]*?)<\/th>/i);
    const valueMatch = row.match(/<td[^>]*class="[^"]*specs-value[^"]*"[^>]*>([\s\S]*?)<\/td>/i);

    if (labelMatch && valueMatch && currentCategory) {
      const label = labelMatch[1].replace(/<[^>]+>/g, '').trim();
      const value = valueMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Filter out empty rows or ads
      if (label && value && !value.includes('googletag')) {
        specs[currentCategory].push({ label, value });
      }
    }
  });

  return Object.keys(specs).length > 0 ? specs : null;
}

// Map of popular slugs to WhatMobile URL paths
const WHATMOBILE_URL_MAP = {
  'samsung-galaxy-s24-ultra': '/Samsung_Galaxy-S24-Ultra',
  'samsung-galaxy-s24-plus': '/Samsung_Galaxy-S24-Plus',
  'samsung-galaxy-s24': '/Samsung_Galaxy-S24',
  'samsung-galaxy-a55-5g': '/Samsung_Galaxy-A55',
  'samsung-galaxy-a35-5g': '/Samsung_Galaxy-A35',
  'samsung-galaxy-a15': '/Samsung_Galaxy-A15',
  'samsung-galaxy-a05s': '/Samsung_Galaxy-A05s',
  'samsung-galaxy-a05': '/Samsung_Galaxy-A05',
  'samsung-galaxy-s23-fe': '/Samsung_Galaxy-S23-FE',
  'apple-iphone-15-pro-max': '/Apple_iPhone-15-Pro-Max',
  'apple-iphone-15-pro': '/Apple_iPhone-15-Pro',
  'apple-iphone-15': '/Apple_iPhone-15',
  'apple-iphone-14': '/Apple_iPhone-14',
  'apple-iphone-13': '/Apple_iPhone-13',
  'xiaomi-redmi-a3': '/Xiaomi_Redmi-A3',
  'xiaomi-14-ultra': '/Xiaomi_14-Ultra',
  'xiaomi-redmi-note-13': '/Xiaomi_Redmi-Note-13',
  'xiaomi-redmi-note-13-pro': '/Xiaomi_Redmi-Note-13-Pro',
  'xiaomi-poco-f6': '/Poco_F6',
  'xiaomi-poco-x6-pro': '/Poco_X6-Pro',
  'infinix-smart-8': '/Infinix_Smart-8',
  'infinix-note-40': '/Infinix_Note-40',
  'infinix-hot-40-pro': '/Infinix_Hot-40-Pro',
  'infinix-gt-20-pro': '/Infinix_GT-20-Pro',
  'tecno-camon-30': '/Tecno_Camon-30',
  'tecno-spark-20-pro-plus': '/Tecno_Spark-20-Pro-Plus',
  'tecno-spark-go-2024': '/Tecno_Spark-Go-2024',
  'itel-a50c-special-edition': '/itel_A50c',
  'itel-itel-a50c-special-edition': '/itel_A50c',
  'itel-s23-plus': '/itel_S23-Plus',
  'itel-a70': '/itel_A70',
  'vivo-v30': '/Vivo_V30',
  'vivo-v30e': '/Vivo_V30e',
  'vivo-y27s': '/Vivo_Y27s',
  'oppo-reno-11-f': '/Oppo_Reno-11-F',
  'realme-12-plus': '/Realme_12-Plus',
  'realme-c67': '/Realme_C67'
};

async function run() {
  const phonesPath = path.join(__dirname, '../public/data/phones.json');
  const phones = JSON.parse(fs.readFileSync(phonesPath, 'utf8'));

  console.log(`Starting WhatMobile specs enrichment for ${phones.length} phones...`);

  let fetchedCount = 0;

  for (const [slug, wmPath] of Object.entries(WHATMOBILE_URL_MAP)) {
    const phone = phones.find(p => p.slug === slug || p.id === slug);
    if (!phone) {
      console.log(`Skipping slug not in catalog: ${slug}`);
      continue;
    }

    try {
      console.log(`Fetching WhatMobile specs for ${phone.brand} ${phone.model} (${wmPath})...`);
      const res = await fetchUrl(wmPath);
      if (res.status === 200) {
        const specs = parseWhatMobileTable(res.data);
        if (specs) {
          phone.detailed_specs = specs;
          fetchedCount++;
          console.log(`  ✓ Successfully parsed ${Object.keys(specs).length} categories for ${phone.model}`);
        } else {
          console.log(`  ⚠ No specs table found on ${wmPath}`);
        }
      } else {
        console.log(`  ✗ HTTP ${res.status} for ${wmPath}`);
      }
    } catch (e) {
      console.error(`  ✗ Error fetching ${wmPath}:`, e.message);
    }

    // Small delay to be polite
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`Writing updated phones.json with ${fetchedCount} enriched phones...`);
  fs.writeFileSync(phonesPath, JSON.stringify(phones, null, 2), 'utf8');
  console.log('Done!');
}

run();
