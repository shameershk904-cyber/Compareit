const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const BUCKET = 'phones';

async function uploadToSupabase(fileName, buffer, contentType) {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': contentType,
      'x-upsert': 'true'
    },
    body: buffer
  });
  const text = await res.text();
  console.log(`Uploaded ${fileName}:`, res.status, text);
  return res.ok;
}

async function findWhatMobileImage(pageSlug) {
  const url = `https://www.whatmobile.com.pk/${pageSlug}`;
  console.log('Fetching', url);
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await r.text();
  
  // Whatmobile product image is typically in an img tag with admin/images or similar
  const matches = html.match(/src=["']([^"']*(?:admin\/images|images\/[^"']+\.(?:jpg|png|webp)))["']/gi);
  console.log('Found matches:', matches);
  if (matches && matches.length > 0) {
    const rawSrc = matches[0].replace(/^src=["']|["']$/gi, '');
    const imgUrl = rawSrc.startsWith('http') ? rawSrc : `https://www.whatmobile.com.pk/${rawSrc.replace(/^\//, '')}`;
    return imgUrl;
  }
  return null;
}

async function test() {
  const itelImg = await findWhatMobileImage('itel_A50c');
  console.log('Itel A50c image:', itelImg);
  if (itelImg) {
    const r = await fetch(itelImg);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync('scratch/itel_whatmobile.jpg', buf);
    console.log('Saved scratch/itel_whatmobile.jpg, size:', buf.length);
  }
}

test().catch(console.error);
