const fs = require('fs');

async function checkItelPk() {
  const r = await fetch('https://itel-pk.com/products/a50c', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await r.text();
  const re = /src=["']([^"']+\.(?:png|jpg|webp))["']/gi;
  let m;
  const urls = [];
  while ((m = re.exec(html)) !== null) {
    if (m[1].includes('cdn.shopify.com') || m[1].includes('a50c') || m[1].includes('products')) {
      urls.push(m[1].startsWith('//') ? 'https:' + m[1] : m[1]);
    }
  }
  console.log('Found itel-pk shopify images:', urls);
  if (urls.length > 0) {
    const imgUrl = urls[0];
    const imgRes = await fetch(imgUrl);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync('scratch/itel_official_store.webp', buf);
    console.log('Saved scratch/itel_official_store.webp, size:', buf.length);
  }
}

checkItelPk().catch(console.error);
