const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://cevetoazfcbjmodmjzyh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNldmV0b2F6ZmNiam1vZG1qenloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2OTk1MTUsImV4cCI6MjEwNTI3NTUxNX0.pXYOGG5GQZSNwGVcDGxADx0qOS0aNdafPtv7iTwi7wA';
const BUCKET = 'phones';
const IMAGE_PATH = path.join(__dirname, 'raw_old_code', 'images', 'banner.jpg');

async function uploadFile() {
    let fileData;
    try {
        fileData = fs.readFileSync(IMAGE_PATH);
    } catch (err) {
        console.error(`Could not read file: ${err.message}`);
        return;
    }

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/banner.jpg`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': 'image/jpeg'
        },
        body: fileData
    });

    if (res.ok) {
        console.log('Banner uploaded successfully!');
    } else {
        const err = await res.text();
        if (res.status === 409 || err.includes('Duplicate')) {
            console.log('Banner already exists, overwriting by deleting and re-uploading, or skipping if not necessary. Ill just use PUT instead of POST.');
            const resPut = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/banner.jpg`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'image/jpeg'
                },
                body: fileData
            });
            if (resPut.ok) {
                console.log('Banner uploaded (overwritten) successfully!');
            } else {
                console.error('Failed to upload banner:', await resPut.text());
            }
        } else {
            console.error('Failed to upload banner:', err);
        }
    }
}

uploadFile().catch(console.error);
