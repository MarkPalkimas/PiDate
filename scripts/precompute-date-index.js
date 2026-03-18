#!/usr/bin/env node

/**
 * Build-time precomputation script for pi date index
 * 
 * This script:
 * 1. Downloads the billion-digit pi corpus from MIT
 * 2. Generates all valid YYYYMMDD dates (1000-9999)
 * 3. Searches for each date in the pi corpus
 * 4. Builds an index mapping dates to positions
 * 5. Saves the index to public/pi-date-index.json
 * 6. Uploads the pi corpus to Vercel Blob storage
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PI_URL = 'https://stuff.mit.edu/afs/sipb/contrib/pi/pi-billion.txt';
const OUTPUT_INDEX = path.join(__dirname, '..', 'public', 'pi-date-index.json');
const TEMP_PI_FILE = path.join(__dirname, '..', 'temp-pi-corpus.txt');

// Progress tracking
let progressInterval;
let lastProgress = 0;

/**
 * Download pi corpus from MIT
 */
async function downloadPiCorpus() {
  console.log('📥 Downloading pi corpus from MIT...');
  console.log(`   URL: ${PI_URL}`);
  
  return new Promise((resolve, reject) => {
    const protocol = PI_URL.startsWith('https') ? https : http;
    
    protocol.get(PI_URL, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      let data = '';
      let downloaded = 0;
      const totalSize = parseInt(response.headers['content-length'] || '0', 10);
      
      response.on('data', (chunk) => {
        data += chunk;
        downloaded += chunk.length;
        
        // Progress reporting every 10MB
        if (downloaded - lastProgress >= 10_000_000) {
          const percent = totalSize > 0 ? ((downloaded / totalSize) * 100).toFixed(1) : '?';
          console.log(`   Downloaded ${(downloaded / 1_000_000).toFixed(1)}MB (${percent}%)...`);
          lastProgress = downloaded;
        }
      });
      
      response.on('end', () => {
        console.log(`✅ Download complete! Total size: ${(downloaded / 1_000_000).toFixed(1)}MB`);
        
        // Strip "3." prefix to get pure digit string
        console.log('🔧 Stripping "3." prefix...');
        const piDigits = data.replace(/^3\./, '');
        console.log(`✅ Pi corpus ready: ${piDigits.length.toLocaleString()} digits`);
        
        // Save to temp file for potential blob upload
        fs.writeFileSync(TEMP_PI_FILE, piDigits);
        console.log(`💾 Saved to temporary file: ${TEMP_PI_FILE}`);
        
        resolve(piDigits);
      });
    }).on('error', (err) => {
      reject(new Error(`Download failed: ${err.message}`));
    });
  });
}

/**
 * Check if a year is a leap year
 */
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Get the number of days in a month
 */
function getDaysInMonth(year, month) {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return daysInMonth[month - 1];
}

/**
 * Generate all valid YYYYMMDD dates
 */
function generateValidDates() {
  console.log('📅 Generating all valid YYYYMMDD dates...');
  const dates = [];
  
  for (let year = 1000; year <= 9999; year++) {
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = getDaysInMonth(year, month);
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = 
          String(year).padStart(4, '0') +
          String(month).padStart(2, '0') +
          String(day).padStart(2, '0');
        dates.push(dateString);
      }
    }
    
    // Progress reporting every 100 years
    if (year % 100 === 0) {
      console.log(`   Generated dates for years 1000-${year}...`);
    }
  }
  
  console.log(`✅ Generated ${dates.length.toLocaleString()} valid dates`);
  return dates;
}

/**
 * Search for dates in pi corpus and build index
 */
function buildDateIndex(piDigits, dates) {
  console.log('🔍 Searching for dates in pi corpus...');
  console.log('   This will take several minutes...');
  
  const index = {};
  let foundCount = 0;
  let notFoundCount = 0;
  const startTime = Date.now();
  
  // Progress reporting
  const totalDates = dates.length;
  let processedDates = 0;
  
  progressInterval = setInterval(() => {
    const percent = ((processedDates / totalDates) * 100).toFixed(2);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const rate = (processedDates / elapsed).toFixed(0);
    const remaining = Math.ceil((totalDates - processedDates) / rate);
    console.log(`   Progress: ${processedDates.toLocaleString()}/${totalDates.toLocaleString()} (${percent}%) - ${foundCount.toLocaleString()} found - ${rate}/sec - ~${remaining}s remaining`);
  }, 5000);
  
  for (const dateString of dates) {
    const position = piDigits.indexOf(dateString);
    
    if (position !== -1) {
      index[dateString] = position;
      foundCount++;
    } else {
      notFoundCount++;
    }
    
    processedDates++;
  }
  
  clearInterval(progressInterval);
  
  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Search complete in ${elapsedTime}s`);
  console.log(`   Found: ${foundCount.toLocaleString()} dates (${((foundCount / totalDates) * 100).toFixed(2)}%)`);
  console.log(`   Not found: ${notFoundCount.toLocaleString()} dates (${((notFoundCount / totalDates) * 100).toFixed(2)}%)`);
  
  return index;
}

/**
 * Save index to JSON file
 */
function saveIndex(index) {
  console.log('💾 Saving index to file...');
  
  // Ensure public directory exists
  const publicDir = path.dirname(OUTPUT_INDEX);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Save as JSON
  const jsonString = JSON.stringify(index, null, 2);
  fs.writeFileSync(OUTPUT_INDEX, jsonString);
  
  const fileSizeMB = (fs.statSync(OUTPUT_INDEX).size / 1_000_000).toFixed(2);
  console.log(`✅ Index saved to ${OUTPUT_INDEX}`);
  console.log(`   File size: ${fileSizeMB}MB`);
  console.log(`   Entries: ${Object.keys(index).length.toLocaleString()}`);
}

/**
 * Upload pi corpus to Vercel Blob storage
 */
async function uploadToVercelBlob() {
  console.log('☁️  Uploading pi corpus to Vercel Blob...');
  
  // Check if Vercel Blob token is available
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!blobToken) {
    console.log('⚠️  BLOB_READ_WRITE_TOKEN not found in environment');
    console.log('   Skipping Vercel Blob upload');
    console.log('   You can upload manually later or set the token and re-run');
    console.log('');
    console.log('   Manual upload instructions:');
    console.log('   1. Install @vercel/blob: npm install @vercel/blob');
    console.log('   2. Upload temp-pi-corpus.txt to Vercel Blob via dashboard or CLI');
    console.log('   3. Set PI_CORPUS_URL environment variable with the blob URL');
    console.log('   4. Ensure the blob has public read access for HTTP Range requests');
    return null;
  }
  
  try {
    // Try to use @vercel/blob package if available
    let put;
    try {
      const vercelBlob = require('@vercel/blob');
      put = vercelBlob.put;
    } catch (err) {
      console.log('⚠️  @vercel/blob package not installed');
      console.log('   Install with: npm install @vercel/blob');
      console.log('   Then re-run this script to upload automatically');
      console.log('');
      console.log('   Or upload manually:');
      console.log('   1. Upload temp-pi-corpus.txt to Vercel Blob via dashboard');
      console.log('   2. Set PI_CORPUS_URL environment variable with the blob URL');
      console.log('   3. Ensure the blob has public read access');
      return null;
    }
    
    // Read the pi corpus
    const piCorpus = fs.readFileSync(TEMP_PI_FILE, 'utf8');
    console.log('   Size: ' + (piCorpus.length / 1_000_000).toFixed(1) + 'MB');
    console.log('   Uploading to Vercel Blob...');
    
    // Upload to Vercel Blob
    const blob = await put('pi-billion.txt', piCorpus, {
      access: 'public',
      token: blobToken,
    });
    
    console.log('✅ Upload successful!');
    console.log('   Blob URL: ' + blob.url);
    console.log('');
    console.log('📋 Next step:');
    console.log('   Set PI_CORPUS_URL environment variable to: ' + blob.url);
    console.log('   Add to .env.local: PI_CORPUS_URL=' + blob.url);
    
    return blob.url;
  } catch (error) {
    console.error('❌ Error uploading to Vercel Blob:', error.message);
    console.log('   You can upload manually using the Vercel dashboard');
    console.log('   1. Upload temp-pi-corpus.txt to Vercel Blob');
    console.log('   2. Set PI_CORPUS_URL environment variable with the blob URL');
    console.log('   3. Ensure the blob has public read access');
    return null;
  }
}

/**
 * Cleanup temporary files
 */
function cleanup() {
  console.log('🧹 Cleaning up temporary files...');
  
  if (fs.existsSync(TEMP_PI_FILE)) {
    // Keep the temp file for manual blob upload if needed
    console.log(`   Keeping ${TEMP_PI_FILE} for manual blob upload`);
    console.log('   You can delete it after uploading to Vercel Blob');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Pi Date Index Precomputation Script');
  console.log('=====================================\n');
  
  const overallStart = Date.now();
  
  try {
    // Step 1: Download pi corpus
    const piDigits = await downloadPiCorpus();
    console.log('');
    
    // Step 2: Generate valid dates
    const dates = generateValidDates();
    console.log('');
    
    // Step 3: Build index
    const index = buildDateIndex(piDigits, dates);
    console.log('');
    
    // Step 4: Save index
    saveIndex(index);
    console.log('');
    
    // Step 5: Upload to Vercel Blob
    await uploadToVercelBlob();
    console.log('');
    
    // Step 6: Cleanup
    cleanup();
    console.log('');
    
    const totalTime = ((Date.now() - overallStart) / 1000 / 60).toFixed(1);
    console.log('✅ Precomputation complete!');
    console.log(`   Total time: ${totalTime} minutes`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. If not uploaded automatically, upload temp-pi-corpus.txt to Vercel Blob storage');
    console.log('   2. Set PI_CORPUS_URL environment variable in .env.local and Vercel dashboard');
    console.log('   3. Ensure the blob has public read access for HTTP Range requests');
    console.log('   4. Deploy your application with: vercel --prod');
    
  } catch (error) {
    console.error('❌ Error during precomputation:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateValidDates, isLeapYear, getDaysInMonth };
