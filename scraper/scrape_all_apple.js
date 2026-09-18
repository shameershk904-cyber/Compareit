const https = require('https');
const fs = require('fs');
const path = require('path');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: HEADERS }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parsePhones(html) {
  const phones = [];
  // GSMArena li format: <li><a href="apple_iphone_14-11861.php"><img src=https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14.jpg title="Apple iPhone 14 smartphone. Announced Sep 2022. Features 6.1&Prime;  display, Apple A15 Bionic chipset, 3279 mAh battery, 512 GB storage, 6 GB RAM, Ceramic Shield glass."><strong><span>iPhone 14</span></strong></a></li>
  const regex = /<li><a href="([^"]+)"><img src=(["']?)([^"'\s>]+)\2 title="([^"]+)"><strong><span>(.*?)<\/span><\/strong><\/a><\/li>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    phones.push({
      url_slug: match[1],
      image_url: match[3],
      title: match[4],
      name: match[5].trim()
    });
  }
  return phones;
}

async function run() {
  const allPhones = [];
  const pages = [
    'https://www.gsmarena.com/apple-phones-48.php',
    'https://www.gsmarena.com/apple-phones-f-48-0-p2.php',
    'https://www.gsmarena.com/apple-phones-f-48-0-p3.php',
    'https://www.gsmarena.com/apple-phones-f-48-0-p4.php'
  ];

  for (let page of pages) {
    console.log('Fetching', page);
    try {
      const html = await fetchPage(page);
      const phones = parsePhones(html);
      console.log(`Found ${phones.length} phones on this page.`);
      allPhones.push(...phones);
    } catch(err) {
      console.error(err);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`Total Apple phones found: ${allPhones.length}`);
  fs.writeFileSync(path.join(__dirname, 'apple_phones_raw.json'), JSON.stringify(allPhones, null, 2));
}

run();
