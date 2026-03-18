import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Module-level cache for the date index (loaded once per cold start)
let dateIndexCache: Record<string, number> | null = null;

// Configuration
// PI_CORPUS_URL must be set to a blob storage URL that supports HTTP Range requests.
// If not set, chunk fetching will be skipped and only position info will be returned.
// Read dynamically so tests can stub process.env.PI_CORPUS_URL via vi.stubEnv.
function getPiCorpusUrl(): string | null {
  return process.env.PI_CORPUS_URL || null;
}
const INDEX_PATH = path.join(process.cwd(), 'public', 'pi-date-index.json');

/**
 * Load the precomputed date index from disk
 * Uses module-level caching to avoid repeated file reads
 */
function loadDateIndex(): Record<string, number> {
  if (dateIndexCache !== null) {
    return dateIndexCache;
  }

  try {
    console.log('Loading date index from:', INDEX_PATH);
    const indexData = fs.readFileSync(INDEX_PATH, 'utf-8');
    dateIndexCache = JSON.parse(indexData);
    console.log(`Date index loaded: ${Object.keys(dateIndexCache!).length} entries`);
    return dateIndexCache!
  } catch (error) {
    console.error('Error loading date index:', error);
    throw new Error('Failed to load date index. Please ensure the index has been generated.');
  }
}

/**
 * Fetch surrounding digits from the pi corpus using HTTP Range requests
 * @param position - 0-based position in the pi corpus (after "3.")
 * @param dateLength - Length of the date string (always 8 for YYYYMMDD)
 * @returns Surrounding digits string (100 before + date + 100 after)
 * @throws Error if PI_CORPUS_URL is not configured or the fetch fails
 */
async function fetchSurroundingDigits(position: number, dateLength: number): Promise<string> {
  const PI_CORPUS_URL = getPiCorpusUrl();
  if (!PI_CORPUS_URL) {
    throw new Error('PI_CORPUS_URL is not configured - blob storage unavailable');
  }

  const contextBefore = 100;
  const contextAfter = 100;
  
  // Calculate the range in the digit string (0-based, after "3.")
  const digitStart = Math.max(0, position - contextBefore);
  const digitEnd = position + dateLength + contextAfter - 1;
  
  try {
    console.log(`Fetching chunk: bytes ${digitStart}-${digitEnd} from blob storage`);
    
    const response = await fetch(PI_CORPUS_URL, {
      headers: {
        'Range': `bytes=${digitStart}-${digitEnd}`,
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout for chunk fetch
    });

    if (!response.ok && response.status !== 206) {
      throw new Error(`Blob storage returned ${response.status}: ${response.statusText}`);
    }

    const chunk = await response.text();
    
    return chunk;
  } catch (error) {
    console.error('Chunk fetch failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const dateString = searchParams.get('date');

  if (!dateString || !/^\d{8}$/.test(dateString)) {
    return NextResponse.json(
      { error: 'Invalid date format. Expected YYYYMMDD' },
      { status: 400 }
    );
  }

  try {
    console.log(`Searching for ${dateString} using precomputed index...`);
    
    // Load the date index (cached after first load)
    const indexLoadStart = Date.now();
    const dateIndex = loadDateIndex();
    const indexLoadTime = Date.now() - indexLoadStart;
    console.log(`Index load time: ${indexLoadTime}ms`);
    
    // Perform O(1) index lookup
    const lookupStart = Date.now();
    const position = dateIndex[dateString];
    const lookupTime = Date.now() - lookupStart;
    console.log(`Index lookup time: ${lookupTime}ms`);

    if (position === undefined) {
      const totalTime = Date.now() - startTime;
      console.log(`Date not found. Total response time: ${totalTime}ms`);
      return NextResponse.json({
        found: false,
        dateString,
        message: `${dateString} not found in first billion digits of π`
      });
    }

    console.log(`Found ${dateString} at position ${position + 1} (index lookup)`);

    // Fetch surrounding digits using HTTP Range request
    let surroundingDigits: string;
    let highlightStart: number;
    
    try {
      const chunkFetchStart = Date.now();
      surroundingDigits = await fetchSurroundingDigits(position, dateString.length);
      const chunkFetchTime = Date.now() - chunkFetchStart;
      console.log(`Chunk fetch time: ${chunkFetchTime}ms, size: ${surroundingDigits.length} bytes`);
      
      // Calculate highlight position within the chunk
      const contextBefore = 100;
      const actualStart = Math.max(0, position - contextBefore);
      highlightStart = position - actualStart;
      
    } catch (chunkError) {
      // Graceful degradation: return position without surrounding digits
      // This handles both blob storage being unavailable and transient fetch failures
      const isUnavailable = chunkError instanceof Error && chunkError.message.includes('not configured');
      const errorReason = isUnavailable
        ? 'Blob storage is not configured'
        : 'Surrounding digits temporarily unavailable';
      console.error(`Chunk fetch failed (${errorReason}):`, chunkError instanceof Error ? chunkError.message : chunkError);
      const totalTime = Date.now() - startTime;
      console.log(`Fallback response time: ${totalTime}ms`);
      return NextResponse.json({
        found: true,
        dateString,
        position: position + 1,
        startDigit: position + 1,
        endDigit: position + dateString.length,
        message: `Date found at position ${position + 1}. ${errorReason} - surrounding digits unavailable.`
      });
    }

    const totalTime = Date.now() - startTime;
    console.log(`Total response time: ${totalTime}ms`);

    return NextResponse.json({
      found: true,
      dateString,
      position: position + 1, // +1 because position is after "3."
      startDigit: position + 1,
      endDigit: position + dateString.length,
      surroundingDigits,
      highlightStart,
      highlightLength: dateString.length,
      totalDigitsSearched: 1000000000 // Billion digits
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`Error searching pi (after ${totalTime}ms):`, error);
    return NextResponse.json(
      { 
        error: 'Failed to search pi digits',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
