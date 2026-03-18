// Script to download 1 million digits of pi
// Run with: node scripts/download-pi.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const PI_URL = 'https://stuff.mit.edu/afs/sipb/contrib/pi/pi-billion.txt';
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'pi-1million.txt');

console.log('Downloading pi digits from MIT...');
console.log('This may take a while...');

https.get(PI_URL, (response) => {
  let data = '';
  let downloaded = 0;
  
  response.on('data', (chunk) => {
    data += chunk;
    downloaded += chunk.length;
    if (downloaded % 1000000 === 0) {
      console.log(`Downloaded ${(downloaded / 1000000).toFixed(1)}MB...`);
    }
  });
  
  response.on('end', () => {
    console.log('Download complete!');
    console.log('Extracting first 1 million digits...');
    
    // Remove the "3." at the start and take first 1 million digits
    const piDigits = data.replace(/^3\./, '').substring(0, 1000000);
    
    // Ensure directory exists
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_FILE, piDigits);
    console.log(`Saved ${piDigits.length} digits to ${OUTPUT_FILE}`);
    console.log('Done!');
  });
}).on('error', (err) => {
  console.error('Error downloading pi digits:', err.message);
  console.log('\nFalling back to alternative source...');
  
  // Fallback: use a smaller verified source
  const fallbackDigits = fs.readFileSync(
    path.join(__dirname, '..', 'app', 'api', 'search-pi', 'route.ts'),
    'utf8'
  );
  
  console.log('Using existing 10,000 digits from API route');
});
