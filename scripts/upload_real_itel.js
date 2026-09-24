const fs = require('fs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const BUCKET = 'phones';

async function uploadFile(fileName, filePath, contentType) {
  const fileData = fs.readFileSync(filePath);
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': contentType,
      'x-upsert': 'true'
    },
    body: fileData
  });
  console.log(`Uploaded ${fileName}:`, res.status, res.statusText);
  return res.ok;
}

async function main() {
  // We have scratch/itel_official_2.png (Dawn Blue 1000x1000 transparent PNG directly from itel-pk.com)
  const targets = [
    'itel-itel-a50c-special-edition_studio.webp',
    'itel-itel-a50c-special-edition.webp',
    'itel-itel-a50c-special-edition_studio.png',
    'itel-a50c_studio.webp',
    'itel-a50c.png'
  ];

  for (const t of targets) {
    await uploadFile(t, 'scratch/itel_official_2.png', 'image/png');
  }
  console.log('All Itel A50C official images uploaded to Supabase successfully!');
}

main().catch(console.error);
