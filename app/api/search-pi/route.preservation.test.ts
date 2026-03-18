/**
 * Preservation Property Tests
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 * 
 * Property 2: Preservation - Display Behavior Unchanged
 * 
 * IMPORTANT: These tests verify that the fixed system produces exactly the same
 * display output as the original system. They test the response format, position
 * ranges, surrounding digits, highlighting parameters, and not-found behavior.
 * 
 * EXPECTED OUTCOME: Tests PASS on both unfixed and fixed code (confirms no regressions)
 * 
 * Testing Approach:
 * - Use property-based testing to generate many test cases
 * - Verify response format matches expected structure
 * - Verify position calculations are correct
 * - Verify surrounding digits are real pi digits
 * - Verify highlighting parameters are correct
 * - Verify not-found behavior is preserved
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';
import fc from 'fast-check';

/**
 * Mock pi data for testing
 * 
 * This is a small sample of pi digits for testing purposes.
 * In the real system, this would be the full billion-digit pi corpus.
 * 
 * Format: "3.14159265358979323846264338327950288419716939937510..."
 * 
 * We'll use the first 1000 digits of pi for testing.
 */
const MOCK_PI_DIGITS = `14159265358979323846264338327950288419716939937510
  58209749445923078164062862089986280348253421170679
  82148086513282306647093844609550582231725359408128
  48111745028410270193852110555964462294895493038196
  44288109756659334461284756482337867831652712019091
  45648566923460348610454326648213393607260249141273
  72458700660631558817488152092096282925409171536436
  78925903600113305305488204665213841469519415116094
  33057270365759591953092186117381932611793105118548
  07446237996274956735188575272489122793818301194912
  98336733624406566430860213949463952247371907021798
  60943702770539217176293176752384674818467669405132
  00056812714526356082778577134275778960917363717872
  14684409012249534301465495853710507922796892589235
  42019956112129021960864034418159813629774771309960
  51870721134999999837297804995105973173281609631859
  50244594553469083026425223082533446850352619311881
  71010003137838752886587533208381420617177669147303
  59825349042875546873115956286388235378759375195778
  18577805321712268066130019278766111959092164201989`.replace(/\s+/g, '');

const MOCK_BLOB_URL = 'https://mock-blob-storage.example.com/pi-billion.txt';

/**
 * Create a mock fetch that handles Range requests against MOCK_PI_DIGITS.
 * The route requests bytes=<start>-<end> from the blob URL, where start/end
 * are 0-based offsets into the pure digit string (after "3.").
 */
function createBlobFetchMock() {
  return vi.fn((url: string | URL | Request, init?: RequestInit) => {
    const urlString = typeof url === 'string' ? url : url.toString();

    if (urlString === MOCK_BLOB_URL) {
      // Parse Range header: "bytes=start-end"
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
      // No range header - return full mock data
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

describe('Preservation Property Tests - Display Behavior Unchanged', () => {
  
  beforeEach(() => {
    // Set PI_CORPUS_URL so the route uses blob storage (chunk fetching)
    vi.stubEnv('PI_CORPUS_URL', MOCK_BLOB_URL);
    // Mock fetch to serve Range requests from our mock pi digits
    global.fetch = createBlobFetchMock();
  });
  
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
  
  /**
   * Property 2.1: Response Format Preservation
   * 
   * Validates: Requirements 3.1, 3.2, 3.3
   * 
   * For any valid date search, the response must have the correct structure:
   * - found: boolean
   * - dateString: string (the input date)
   * - startDigit: number (position after decimal point, 1-based)
   * - endDigit: number (end position)
   * - surroundingDigits: string (100 before + date + 100 after)
   * - highlightStart: number (always 100)
   * - highlightLength: number (always 8 for YYYYMMDD)
   */
  it('property: response format matches expected structure for found dates', async () => {
    // Test with known dates in our mock pi data
    // "14159265" appears at position 0 in our mock data (after "3.")
    const testDate = '14159265';
    
    const request = new Request(`http://localhost:3000/api/search-pi?date=${testDate}`);
    const response = await GET(request);
    const result = await response.json();
    
    // Verify response structure
    expect(result).toHaveProperty('found');
    expect(result).toHaveProperty('dateString');
    expect(result).toHaveProperty('startDigit');
    expect(result).toHaveProperty('endDigit');
    expect(result).toHaveProperty('surroundingDigits');
    expect(result).toHaveProperty('highlightStart');
    expect(result).toHaveProperty('highlightLength');
    
    // Verify values
    expect(result.found).toBe(true);
    expect(result.dateString).toBe(testDate);
    expect(result.startDigit).toBe(1); // Position 1 (1-based, after "3.")
    expect(result.endDigit).toBe(8); // Position 8 (end of 8-digit date)
    expect(result.highlightLength).toBe(8); // Always 8 for YYYYMMDD
  });
  
  /**
   * Property 2.2: Position Range Accuracy
   * 
   * Validates: Requirement 3.1
   * 
   * For any date found in pi, the position range (startDigit to endDigit)
   * must accurately reflect the date's location after the decimal point.
   * 
   * Position is 1-based (first digit after "3." is position 1).
   */
  it('property: position ranges are accurate and 1-based', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate dates that we know exist in our mock pi data
        fc.constantFrom(
          { date: '14159265', expectedStart: 1 },
          { date: '26535897', expectedStart: 6 },
          { date: '97932384', expectedStart: 12 }, // Fixed: actual position is 12
        ),
        async ({ date, expectedStart }) => {
          const request = new Request(`http://localhost:3000/api/search-pi?date=${date}`);
          const response = await GET(request);
          const result = await response.json();
          
          if (!result.found) {
            // If not found, skip this test case
            return true;
          }
          
          // Verify position is 1-based
          expect(result.startDigit).toBeGreaterThanOrEqual(1);
          
          // Verify endDigit is startDigit + 7 (8 digits total, 0-indexed length)
          expect(result.endDigit).toBe(result.startDigit + 7);
          
          // Verify the position matches expected
          expect(result.startDigit).toBe(expectedStart);
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });
  
  /**
   * Property 2.3: Surrounding Digits Accuracy
   * 
   * Validates: Requirements 3.2, 3.5
   * 
   * For any date found in pi, the surrounding digits must be real pi digits:
   * - 100 digits before the date
   * - The date itself (8 digits)
   * - 100 digits after the date
   * 
   * Total: 208 digits (or less if near the start/end of the corpus)
   */
  it('property: surrounding digits are real pi digits', async () => {
    const testDate = '26535897'; // Appears at position 6 in mock data
    
    const request = new Request(`http://localhost:3000/api/search-pi?date=${testDate}`);
    const response = await GET(request);
    const result = await response.json();
    
    expect(result.found).toBe(true);
    expect(result.surroundingDigits).toBeDefined();
    
    // Verify surrounding digits contain only digits
    expect(result.surroundingDigits).toMatch(/^\d+$/);
    
    // Verify the date appears in the surrounding digits at the highlight position
    const highlightedPortion = result.surroundingDigits.substring(
      result.highlightStart,
      result.highlightStart + result.highlightLength
    );
    expect(highlightedPortion).toBe(testDate);
    
    // Verify surrounding digits are from the actual pi corpus
    // The surrounding digits should be a substring of our mock pi data
    expect(MOCK_PI_DIGITS).toContain(result.surroundingDigits);
  });
  
  /**
   * Property 2.4: Highlighting Parameters Preservation
   * 
   * Validates: Requirement 3.2
   * 
   * For any date found in pi, the highlighting parameters must be:
   * - highlightStart: 100 (offset within surrounding digits)
   * - highlightLength: 8 (length of YYYYMMDD format)
   * 
   * Exception: If the date is within the first 100 digits, highlightStart
   * will be less than 100 (equal to the number of digits before the date).
   */
  it('property: highlighting parameters are correct', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          '14159265', // Position 1 - near start, highlightStart < 100
          '26535897', // Position 6 - near start, highlightStart < 100
          '97932384', // Position 11 - near start, highlightStart < 100
        ),
        async (date) => {
          const request = new Request(`http://localhost:3000/api/search-pi?date=${date}`);
          const response = await GET(request);
          const result = await response.json();
          
          if (!result.found) {
            return true;
          }
          
          // Verify highlightLength is always 8 for YYYYMMDD
          expect(result.highlightLength).toBe(8);
          
          // Verify highlightStart is correct based on position
          // If position <= 100, highlightStart = position - 1 (0-based)
          // If position > 100, highlightStart = 100
          const position = result.startDigit;
          const expectedHighlightStart = Math.min(position - 1, 100);
          expect(result.highlightStart).toBe(expectedHighlightStart);
          
          return true;
        }
      ),
      { numRuns: 3 }
    );
  });
  
  /**
   * Property 2.5: Not-Found Behavior Preservation
   * 
   * Validates: Requirement 3.3
   * 
   * For any date not found in pi, the response must:
   * - Set found: false
   * - Include the dateString
   * - Include a message indicating the date was not found
   * - NOT include position, surroundingDigits, or highlighting parameters
   */
  it('property: not-found behavior is preserved', async () => {
    // Use a date that definitely doesn't exist in our small mock data
    const testDate = '99999999';
    
    const request = new Request(`http://localhost:3000/api/search-pi?date=${testDate}`);
    const response = await GET(request);
    const result = await response.json();
    
    // Verify not-found response structure
    expect(result.found).toBe(false);
    expect(result.dateString).toBe(testDate);
    expect(result.message).toBeDefined();
    expect(result.message).toContain('not found');
    
    // Verify position and surrounding digits are not included
    expect(result.position).toBeUndefined();
    expect(result.surroundingDigits).toBeUndefined();
    expect(result.highlightStart).toBeUndefined();
    expect(result.highlightLength).toBeUndefined();
  });
  
  /**
   * Property 2.6: Date Format Preservation
   * 
   * Validates: Requirement 3.4
   * 
   * The system must continue to use YYYYMMDD format (8 digits).
   * Invalid formats should be rejected with a 400 error.
   */
  it('property: date format validation is preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          '2026317',    // Too short (7 digits)
          '202603171',  // Too long (9 digits)
          '20260317a',  // Contains letter
          '2026-03-17', // Contains dashes
          '',           // Empty string
        ),
        async (invalidDate) => {
          const request = new Request(`http://localhost:3000/api/search-pi?date=${invalidDate}`);
          const response = await GET(request);
          
          // Verify 400 error for invalid format
          expect(response.status).toBe(400);
          
          const result = await response.json();
          expect(result.error).toBeDefined();
          expect(result.error).toContain('Invalid date format');
          
          return true;
        }
      ),
      { numRuns: 5 }
    );
  });
  
  /**
   * Property 2.7: Comprehensive Preservation Test
   * 
   * Validates: All preservation requirements (3.1-3.7)
   * 
   * This property-based test generates many valid dates and verifies
   * that all preservation requirements are met for each date.
   */
  it('property: all preservation requirements are met for valid dates', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid YYYYMMDD dates
        fc.integer({ min: 1000, max: 2999 }), // Year
        fc.integer({ min: 1, max: 12 }), // Month
        fc.integer({ min: 1, max: 28 }), // Day (use 28 to avoid invalid dates)
        async (year, month, day) => {
          const dateString = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
          
          const request = new Request(`http://localhost:3000/api/search-pi?date=${dateString}`);
          const response = await GET(request);
          const result = await response.json();
          
          // Verify response has required fields
          expect(result).toHaveProperty('found');
          expect(result).toHaveProperty('dateString');
          expect(result.dateString).toBe(dateString);
          
          if (result.found) {
            // For found dates, verify all preservation requirements
            
            // 3.1: Position range format
            expect(result.startDigit).toBeGreaterThanOrEqual(1);
            expect(result.endDigit).toBe(result.startDigit + 7);
            
            // 3.2: Surrounding digits with highlighting
            expect(result.surroundingDigits).toBeDefined();
            expect(result.surroundingDigits).toMatch(/^\d+$/);
            expect(result.highlightStart).toBeDefined();
            expect(result.highlightLength).toBe(8);
            
            // Verify the date appears at the highlight position
            const highlightedPortion = result.surroundingDigits.substring(
              result.highlightStart,
              result.highlightStart + result.highlightLength
            );
            expect(highlightedPortion).toBe(dateString);
            
            // 3.5: Real pi digits (no fabrication)
            expect(MOCK_PI_DIGITS).toContain(result.surroundingDigits);
            
          } else {
            // 3.3: Not-found behavior
            expect(result.message).toBeDefined();
            expect(result.message).toContain('not found');
            expect(result.surroundingDigits).toBeUndefined();
          }
          
          return true;
        }
      ),
      { numRuns: 20 } // Test with 20 random dates
    );
  });
});
