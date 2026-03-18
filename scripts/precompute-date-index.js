#!/usr/bin/env node

/**
 * Build-time precomputation script for pi date index
 *
 * Streams the 1GB pi corpus to avoid Node.js string length limits.
 * Uses a sliding-window buffer to search for all valid YYYYMMDD dates.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PI_URL = 'https://stuff.mit.edu/afs/sipb/contrib/pi/pi-billion.txt';
const OUTPUT_INDEX = path.join(__dirname, '..', 'public', 'pi-date-index.json');
const TEMP_PI_FILE = path.join(__dirname, '..', 'temp-pi-corpus.txt');
const CHUNK_SIZE = 64 * 1024 * 1024; // 64MB chunks for indexOf search

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getDaysInMonth(year, month) {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) return 29;
  return days[month - 1];
}

function generateValidDates() {
  console.log('📅 Generating all valid YYYYMMDD dates...');
  const dates = [];
  for (let year = 1000; year <= 9999; year++) {
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = getDaysInMonth(year, month);
      for (let day = 1; day <= daysInMonth; day++) {
        dates.push(
          String(year) +
          String(month).padStart(2, '0') +
          String(day).padStart(2, '0')
        );
      }
    }
  }
  console.log(`✅ Generated ${dates.length.toLocaleString()} valid dates`);
  return dates;
}

/**
 * Download pi corpus streaming to disk
 */
async function downloadPiCorpus() {
  console.log('📥 Downloading pi corpus from MIT...');

  await new Promise((resolve, reject) => {
    const protocol = PI_URL.startsWith('https') ? https : http;
    const fileStream = fs.createWriteStream(TEMP_PI_FILE);
    let downloaded = 0;
    let lastProgress = 0;

    protocol.get(PI_URL, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      const totalSize = parseInt(response.headers['content-length'] || '0', 10);

      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (downloaded - lastProgress >= 10_000_000) {
          const pct = totalSize > 0 ? ((downloaded / totalSize) * 100).toFixed(1) : '?';
          console.log(`   Downloaded ${(downloaded / 1_000_000).toFixed(1)}MB (${pct}%)...`);
          lastProgress = downloaded;
        }
      });

      response.pipe(fileStream);
      fileStream.on('finish', () => {
        console.log(`✅ Download complete: ${(downloaded / 1_000_000).toFixed(1)}MB`);
        resolve();
      });
      fileStream.on('error', reject);
      response.on('error', reject);
    }).on('error', (err) => reject(new Error(`Download failed: ${err.message}`)));
  });
}

/**
 * Search for all dates using chunked reads with overlap to catch boundary-spanning matches.
 * Reads CHUNK_SIZE bytes at a time with an 8-byte overlap between chunks.
 */
async function buildDateIndex(dates) {
  console.log('🔍 Searching for dates using chunked streaming...');

  const index = {};
  const dateSet = new Set(dates);
  let found = 0;

  const stat = fs.statSync(TEMP_PI_FILE);
  const fileSize = stat.size;

  // The file starts with "3." (2 bytes) then digits
  const HEADER = 2; // bytes to skip ("3.")
  const DATE_LEN = 8;
  const overlap = DATE_LEN - 1; // 7 bytes overlap between chunks

  const fd = fs.openSync(TEMP_PI_FILE, 'r');
  let filePos = HEADER; // start after "3."
  let digitOffset = 0;  // position in the digit string (0-based)
  let buffer = Buffer.alloc(CHUNK_SIZE + overlap);
  let prevTail = '';
  let processedDates = 0;
  const startTime = Date.now();

  // Progress interval
  const progressInterval = setInterval(() => {
    const pct = ((filePos / fileSize) * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    console.log(`   Progress: ${pct}% — ${found.toLocaleString()} dates found — ${elapsed}s elapsed`);
  }, 10_000);

  while (filePos < fileSize) {
    const bytesToRead = Math.min(CHUNK_SIZE, fileSize - filePos);
    const bytesRead = fs.readSync(fd, buffer, 0, bytesToRead, filePos);
    if (bytesRead === 0) break;

    // Combine previous tail with current chunk to catch boundary-spanning dates
    const chunkStr = prevTail + buffer.slice(0, bytesRead).toString('utf8');
    const chunkDigitStart = digitOffset - prevTail.length;

    // Search each date in this chunk
    for (const date of dateSet) {
      let searchFrom = 0;
      while (true) {
        const pos = chunkStr.indexOf(date, searchFrom);
        if (pos === -1) break;
        const absolutePos = chunkDigitStart + pos;
        if (absolutePos >= 0 && !(date in index)) {
          index[date] = absolutePos;
          found++;
          dateSet.delete(date); // stop searching for this date once found
        }
        searchFrom = pos + 1;
      }
    }

    // Keep last 7 chars as overlap for next chunk
    prevTail = chunkStr.slice(-overlap);
    digitOffset += bytesRead;
    filePos += bytesRead;
  }

  clearInterval(progressInterval);
  fs.closeSync(fd);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Search complete in ${elapsed}s — ${found.toLocaleString()} dates found`);
  return index;
}

function saveIndex(index) {
  console.log('💾 Saving index...');
  const publicDir = path.dirname(OUTPUT_INDEX);
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(OUTPUT_INDEX, JSON.stringify(index));
  const sizeMB = (fs.statSync(OUTPUT_INDEX).size / 1_000_000).toFixed(2);
  console.log(`✅ Index saved: ${sizeMB}MB, ${Object.keys(index).length.toLocaleString()} entries`);
}

async function uploadToVercelBlob() {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    console.log('⚠️  BLOB_READ_WRITE_TOKEN not set — skipping blob upload');
    console.log('   Set PI_CORPUS_URL to the MIT URL or upload manually');
    return null;
  }

  try {
    const { put } = require('@vercel/blob');
    console.log('☁️  Uploading pi corpus to Vercel Blob...');
    const fileBuffer = fs.readFileSync(TEMP_PI_FILE);
    const blob = await put('pi-billion.txt', fileBuffer, { access: 'public', token: blobToken });
    console.log(`✅ Uploaded to Vercel Blob: ${blob.url}`);
    console.log(`   Set PI_CORPUS_URL=${blob.url}`);
    return blob.url;
  } catch (err) {
    console.log(`⚠️  Blob upload failed: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Pi Date Index Precomputation Script\n');
  const overall = Date.now();

  await downloadPiCorpus();
  const dates = generateValidDates();
  const index = await buildDateIndex(dates);
  saveIndex(index);
  await uploadToVercelBlob();

  // Cleanup temp file to save disk space
  if (fs.existsSync(TEMP_PI_FILE)) {
    fs.unlinkSync(TEMP_PI_FILE);
    console.log('🧹 Cleaned up temp file');
  }

  console.log(`\n✅ Done in ${((Date.now() - overall) / 1000 / 60).toFixed(1)} minutes`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });
}

module.exports = { generateValidDates, isLeapYear, getDaysInMonth };
