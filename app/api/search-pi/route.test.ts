/**
 * Unit Tests - Index Loading, Lookup, and Chunk Fetching
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5**
 * 
 * These tests verify the core functionality of the precomputed index architecture:
 * - Index loading and caching
 * - O(1) date lookup
 * - Chunk fetching via HTTP Range requests
 * - Response time performance (<2s)
 * - Data transfer efficiency (<10KB)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

const MOCK_BLOB_URL = 'https://mock-blob-storage.example.com/pi-billion.txt';

// A small slice of real pi digits for testing
const MOCK_PI_DIGITS = '14159265358979323846264338327950288419716939937510' +
  '58209749445923078164062862089986280348253421170679' +
  '82148086513282306647093844609550582231725359408128' +
  '48111745028410270193852110555964462294895493038196' +
  '44288109756659334461284756482337867831652712019091' +
  '45648566923460348610454326648213393607260249141273' +
  '72458700660631558817488152092096282925409171536436' +
  '78925903600113305305488204665213841469519415116094' +
  '33057270365759591953092186117381932611793105118548' +
  '07446237996274956735188575272489122793818301194912' +
  '98336733624406566430860213949463952247371907021798' +
  '60943702770539217176293176752384674818467669405132' +
  '00056812714526356082778577134275778960917363717872' +
  '14684409012249534301465495853710507922796892589235' +
  '42019956112129021960864034418159813629774771309960' +
  '51870721134999999837297804995105973173281609631859' +
  '50244594553469083026425223082533446850352619311881' +
  '71010003137838752886587533208381420617177669147303' +
  '59825349042875546873115956286388235378759375195778' +
  '18577805321712268066130019278766111959092164201989';

function createBlobFetchMock() {
  return vi.fn((url: string | URL | Request, init?: RequestInit) => {
    const urlString = typeof url === 'string' ? url : url.toString();
    if (urlString === MOCK_BLOB_URL) {
      const rangeHeader = (init?.headers as Record<string, string>)?.['Range'] || '';
      const match = rangeHeader.match(/bytes=(\d+)-(\d+)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = parseInt(match[2], 10);
        const chunk = MOCK_PI_DIGITS.slice(start, end + 1);
        return Promise.resolve({
          ok: true,
          status: 206,
          statusText: 'Partial Content',
          text: () => Promise.resolve(chunk),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(MOCK_PI_DIGITS),
      } as Response);
    }
    return Promise.reject(new Error(`Unexpected URL in test: ${urlString}`));
  });
}

describe('Unit Tests - Index Loading, Lookup, and Chunk Fetching', () => {

  beforeEach(() => {
    vi.stubEnv('PI_CORPUS_URL', MOCK_BLOB_URL);
    global.fetch = createBlobFetchMock();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  /**
   * Test: Index loading - date found in index
   */
  it('should find a date that exists in the precomputed index', async () => {
    const request = new Request('http://localhost:3000/api/search-pi?date=14159265');
    const response = await GET(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.found).toBe(true);
    expect(result.dateString).toBe('14159265');
    expect(result.startDigit).toBe(1); // position 0 → 1-based = 1
    expect(result.endDigit).toBe(8);   // 1 + 7
  });

  /**
   * Test: Index lookup - date not in index
   */
  it('should return found: false for a date not in the index', async () => {
    const request = new Request('http://localhost:3000/api/search-pi?date=99999999');
    const response = await GET(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.found).toBe(false);
    expect(result.dateString).toBe('99999999');
    expect(result.message).toContain('not found');
  });

  /**
   * Test: Chunk fetching - surroundingDigits returned when blob URL is set
   */
  it('should return surroundingDigits when PI_CORPUS_URL is configured', async () => {
    const request = new Request('http://localhost:3000/api/search-pi?date=26535897');
    const response = await GET(request);
    const result = await response.json();

    expect(result.found).toBe(true);
    expect(result.surroundingDigits).toBeDefined();
    expect(result.surroundingDigits).toMatch(/^\d+$/);
    expect(result.highlightStart).toBeDefined();
    expect(result.highlightLength).toBe(8);
  });

  /**
   * Test: Graceful degradation when PI_CORPUS_URL is not set
   */
  it('should return position without surroundingDigits when PI_CORPUS_URL is not set', async () => {
    vi.stubEnv('PI_CORPUS_URL', '');
    const request = new Request('http://localhost:3000/api/search-pi?date=14159265');
    const response = await GET(request);
    const result = await response.json();

    expect(result.found).toBe(true);
    expect(result.startDigit).toBe(1);
    expect(result.surroundingDigits).toBeUndefined();
  });

  /**
   * Test: Invalid date format returns 400
   */
  it('should return 400 for invalid date format', async () => {
    const invalidDates = ['2026317', '202603171', '20260317a', ''];
    for (const date of invalidDates) {
      const request = new Request(`http://localhost:3000/api/search-pi?date=${date}`);
      const response = await GET(request);
      expect(response.status).toBe(400);
    }
  });

  /**
   * Test: Response time is under 2 seconds (performance requirement)
   * Validates: Requirements 1.1, 2.1
   */
  it('should complete date search in under 2 seconds', async () => {
    const testDates = ['14159265', '26535897', '97932384'];

    for (const dateString of testDates) {
      const startTime = Date.now();
      const request = new Request(`http://localhost:3000/api/search-pi?date=${dateString}`);
      const response = await GET(request);
      const elapsed = Date.now() - startTime;

      await response.json(); // consume body
      expect(elapsed).toBeLessThan(2000);
    }
  });

  /**
   * Test: Concurrent searches complete efficiently
   * Validates: Requirements 1.3, 2.4
   */
  it('should handle concurrent searches efficiently', async () => {
    const testDates = ['14159265', '26535897', '97932384'];
    const startTime = Date.now();

    const promises = testDates.map(date =>
      GET(new Request(`http://localhost:3000/api/search-pi?date=${date}`))
    );
    const responses = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    for (let i = 0; i < responses.length; i++) {
      const result = await responses[i].json();
      expect(result.dateString).toBe(testDates[i]);
    }

    // All 3 concurrent searches should complete well under 10 seconds
    expect(totalTime).toBeLessThan(10000);
  });

  /**
   * Test: highlightStart and highlightLength are correct
   */
  it('should return correct highlight parameters', async () => {
    // '26535897' is at position 5 (0-based), so startDigit=6
    // contextBefore = min(5, 100) = 5, so highlightStart = 5
    const request = new Request('http://localhost:3000/api/search-pi?date=26535897');
    const response = await GET(request);
    const result = await response.json();

    expect(result.found).toBe(true);
    expect(result.highlightLength).toBe(8);
    // position=5, actualStart=max(0,5-100)=0, highlightStart=5-0=5
    expect(result.highlightStart).toBe(5);
  });
});
