const fs = require('fs');
const path = require('path');
const https = require('https');

const rawPhones = require('./apple_phones_raw.json');
const phonesJsonPath = path.join(__dirname, '../data/phones.json');
let db = require(phonesJsonPath);

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://www.gsmarena.com/'
};

async function downloadImage(url, dest) {
  if (fs.existsSync(dest)) return; // Skip if already downloaded
  return new Promise((resolve, reject) => {
    https.get(url, { headers: HEADERS }, (res) => {
      if (res.statusCode !== 200) {
        resolve(false); // Ignore failed downloads
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });
}

function parseTitle(titleString) {
  // Example: Apple iPhone 14 smartphone. Announced Sep 2022. Features 6.1&Prime; display, Apple A15 Bionic chipset, 3279 mAh battery, 512 GB storage, 6 GB RAM, Ceramic Shield glass.
  let storage = 128;
  let ram = 4;
  let battery = 3000;
  let chipset = "Apple Chip";
  let displaySize = 6.1;

  if (titleString.match(/(\d+)\s*mAh/)) battery = parseInt(titleString.match(/(\d+)\s*mAh/)[1]);
  if (titleString.match(/(\d+)\s*GB storage/)) storage = parseInt(titleString.match(/(\d+)\s*GB storage/)[1]);
  else if (titleString.match(/(\d+)\s*TB storage/)) storage = parseInt(titleString.match(/(\d+)\s*TB storage/)[1]) * 1024;
  
  if (titleString.match(/(\d+)\s*GB RAM/)) ram = parseInt(titleString.match(/(\d+)\s*GB RAM/)[1]);
  if (titleString.match(/([\d\.]+)&Prime;/)) displaySize = parseFloat(titleString.match(/([\d\.]+)&Prime;/)[1]);
  
  if (titleString.match(/display,\s*(.*?chipset)/)) chipset = titleString.match(/display,\s*(.*?chipset)/)[1];

  let release_date = "Unknown";
  if (titleString.match(/Announced (.*?)\./)) release_date = titleString.match(/Announced (.*?)\./)[1];

  return { storage, ram, battery, chipset, displaySize, release_date };
}

async function run() {
  let addedCount = 0;
  
  for (let p of rawPhones) {
    const slug = 'apple-' + p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Check if already in DB
    const existing = db.find(x => x.id === slug || x.slug === slug);
    if (existing) {
      continue;
    }

    const specs = parseTitle(p.title);
    
    // Download image
    const ext = path.extname(p.image_url) || '.jpg';
    const imgFilename = slug + ext;
    const imgPath = path.join(__dirname, '../images/phones', imgFilename);
    await downloadImage(p.image_url, imgPath);
    
    // Create phone object
    const phoneObj = {
      id: slug,
      slug: slug,
      brand: "Apple",
      model: p.name,
      release_date: specs.release_date,
      price_pkr: 0, // Old phones might not have price, can set to 0
      lowest_verified_price: 0,
      image: "images/phones/" + imgFilename,
      popular: false,
      trending_rank: 0,
      usd_price: 0,
      memory: {
        ram_gb: specs.ram,
        storage_gb: specs.storage,
        card_slot: false
      },
      battery: {
        capacity_mah: specs.battery,
        charging_watt: 20,
        wireless_charging: true
      },
      platform: {
        chipset: specs.chipset,
        os: "iOS",
        cpu: "Octa-core",
        gpu: "Apple GPU",
        antutu_score: 500000
      },
      display: {
        type: "Retina Display",
        size: specs.displaySize,
        resolution: "FHD+",
        protection: "Ceramic Shield"
      },
      camera: {
        main_mp: 12,
        selfie_mp: 12,
        setup: "Dual/Triple Camera",
        features: "4K Video, OIS",
        video: "4K@60fps"
      },
      connectivity: {
        five_g: true,
        headphone_jack: false,
        nfc: true
      },
      retailers: []
    };

    db.push(phoneObj);
    addedCount++;
    console.log('Added:', p.name);
  }

  if (addedCount > 0) {
    fs.writeFileSync(phonesJsonPath, JSON.stringify(db, null, 2));
    console.log(`Saved ${addedCount} new phones to DB.`);
  } else {
    console.log('No new phones to add.');
  }
}

run();
