const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://cevetoazfcbjmodmjzyh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNldmV0b2F6ZmNiam1vZG1qenloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2OTk1MTUsImV4cCI6MjEwNTI3NTUxNX0.pXYOGG5GQZSNwGVcDGxADx0qOS0aNdafPtv7iTwi7wA';
const BUCKET = 'phones';
const IMAGE_DIR = path.join(__dirname, 'images', 'phones');
const BATCH_SIZE = 10;

function getMime(ext) {
    if (ext === '.webp') return 'image/webp';
    if (ext === '.png') return 'image/png';
    return 'image/jpeg';
}

async function uploadFile(fileName) {
    const filePath = path.join(IMAGE_DIR, fileName);
    let fileData;
    try {
        fileData = fs.readFileSync(filePath);
    } catch (err) {
        return { file: fileName, status: 'FAIL', error: `Could not read file: ${err.message}` };
    }
    const ext = path.extname(fileName).toLowerCase();

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': getMime(ext)
        },
        body: fileData
    });

    if (res.ok) return { file: fileName, status: 'OK' };
    const err = await res.text();
    return { file: fileName, status: 'FAIL', error: err };
}

async function main() {
    const files = fs.readdirSync(IMAGE_DIR).filter(f => {
        const ext = path.extname(f).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    });

    console.log(`Found ${files.length} images to upload.\n`);
    let success = 0, fail = 0;

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(f => uploadFile(f)));

        for (const r of results) {
            if (r.status === 'OK') success++;
            else { fail++; console.log(`  FAIL: ${r.file} -> ${r.error}`); }
        }

        const pct = Math.round(((i + batch.length) / files.length) * 100);
        process.stdout.write(`\r  Uploaded: ${success}/${files.length} (${pct}%) | Failed: ${fail}`);
    }

    console.log(`\n\nDone! ${success} uploaded, ${fail} failed.`);
    console.log(`\nPublic URL: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/<filename>`);
}

main().catch(console.error);