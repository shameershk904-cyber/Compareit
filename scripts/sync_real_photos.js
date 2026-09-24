const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const BUCKET = 'phones';

const targetPhones = [
  { slug: 'sparx-edge-20-pro', wmSlug: 'Sparx_Edge-20-Pro', targetName: 'sparx-edge-20-pro-official.jpg' },
  { slug: 'sparx-neo-7-ultra', wmSlug: 'Sparx_Neo-7-Ultra', targetName: 'sparx-neo-7-ultra-official.jpg' },
  { slug: 'dcode-bold-3-pro', wmSlug: 'Dcode_Bold-3-Pro', targetName: 'dcode-bold-3-pro-official.jpg' },
  { slug: 'itel-a70', wmSlug: 'itel_A70', targetName: 'itel-a70-official.jpg' },
  { slug: 'itel-s23-plus', wmSlug: 'itel_S23-Plus', targetName: 'itel-s23-plus-official.jpg' },
  { slug: 'infinix-smart-8', wmSlug: 'Infinix_Smart-8', targetName: 'infinix-smart-8-official.jpg' },
  { slug: 'infinix-note-40-pro', wmSlug: 'Infinix_Note-40-Pro', targetName: 'infinix-note-40-pro-official.jpg' },
  { slug: 'infinix-gt-20-pro', wmSlug: 'Infinix_GT-20-Pro', targetName: 'infinix-gt-20-pro-official.jpg' },
  { slug: 'tecno-camon-30', wmSlug: 'Tecno_Camon-30', targetName: 'tecno-camon-30-official.jpg' },
  { slug: 'tecno-spark-go-2024', wmSlug: 'Tecno_Spark-Go-2024', targetName: 'tecno-spark-go-2024-official.jpg' },
  { slug: 'realme-c67', wmSlug: 'Realme_C67', targetName: 'realme-c67-official.jpg' },
  { slug: 'realme-note-50', wmSlug: 'Realme_Note-50', targetName: 'realme-note-50-official.jpg' },
  { slug: 'vivo-v30-5g', wmSlug: 'Vivo_V30', targetName: 'vivo-v30-official.jpg' },
  { slug: 'oppo-reno-11f-5g', wmSlug: 'Oppo_Reno-11F', targetName: 'oppo-reno-11f-official.jpg' }
];

async function fetchWhatMobileImage(wmSlug) {
  const url = `https://www.whatmobile.com.pk/${wmSlug}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!res.ok) {
      console.warn(`WhatMobile page error for ${wmSlug}: ${res.status}`);
      return null;
    }
    const html = await res.text();
    const match = html.match(/src=["']([^"']*(?:admin\/images|images\/brands)[^"']*)["']/i);
    if (match && match[1]) {
      const imgPath = match[1].replace(/^\//, '');
      return `https://www.whatmobile.com.pk/${imgPath}`;
    }
    return null;
  } catch (err) {
    console.error(`Error scraping ${wmSlug}:`, err.message);
    return null;
  }
}

async function uploadToSupabase(fileName, buffer, contentType) {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': contentType,
    },
    body: buffer
  });

  const resText = await res.text();
  if (res.ok) {
    console.log(`Successfully uploaded: ${fileName}`);
    return true;
  } else {
    console.warn(`Upload failed for ${fileName} (${res.status}): ${resText}`);
    return false;
  }
}

async function main() {
  const phonesPath = path.join(process.cwd(), 'public', 'data', 'phones.json');
  const phonesData = JSON.parse(fs.readFileSync(phonesPath, 'utf8'));

  let updatedCount = 0;

  for (const item of targetPhones) {
    console.log(`\nProcessing: ${item.slug} (${item.wmSlug})...`);
    const imgUrl = await fetchWhatMobileImage(item.wmSlug);
    if (!imgUrl) {
      console.log(`Could not find image URL on WhatMobile for ${item.wmSlug}`);
      continue;
    }

    console.log(`Downloading: ${imgUrl}`);
    const imgRes = await fetch(imgUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!imgRes.ok) {
      console.log(`Failed to download ${imgUrl}: ${imgRes.status}`);
      continue;
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    console.log(`Downloaded image size: ${buffer.length} bytes`);

    const uploaded = await uploadToSupabase(item.targetName, buffer, contentType);
    if (uploaded) {
      const phoneObj = phonesData.find(p => p.slug === item.slug || p.id === item.slug);
      if (phoneObj) {
        const newPath = `phones/${item.targetName}`;
        phoneObj.image = newPath;
        if (Array.isArray(phoneObj.images) && phoneObj.images.length > 0) {
          phoneObj.images[0] = newPath;
        } else {
          phoneObj.images = [newPath];
        }
        updatedCount++;
        console.log(`Updated phones.json entry for ${phoneObj.model} -> ${newPath}`);
      } else {
        console.warn(`Phone slug ${item.slug} not found in phones.json`);
      }
    }
  }

  if (updatedCount > 0) {
    fs.writeFileSync(phonesPath, JSON.stringify(phonesData, null, 2), 'utf8');
    console.log(`\nSaved updated phones.json! Total updated: ${updatedCount}`);
  } else {
    console.log('\nNo updates made to phones.json');
  }
}

main().catch(console.error);
