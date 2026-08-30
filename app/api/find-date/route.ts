import { NextResponse } from 'next/server';

const PI_SEARCH_URL = 'https://www.angio.net/pi/bigpi.cgi';
const EXTENDED_PI_SEARCH_URL = 'https://pi.thefirstverse.com/api/search/substring';

type CachedMatch = { position: number; expires: number };
const matches = new Map<string, CachedMatch>();
const CACHE_FOR_MS = 24 * 60 * 60 * 1000;

/**
 * Finds an eight-digit YYYYMMDD sequence in pi. The result is a 1-based
 * fractional position: position 1 is the first digit after `3.`.
 */
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get('date');

  if (!date || !/^\d{8}$/.test(date)) {
    return NextResponse.json({ error: 'Expected a date in YYYYMMDD format.' }, { status: 400 });
  }

  const cached = matches.get(date);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ found: true, date, position: cached.position, cached: true });
  }

  try {
    const response = await fetch(PI_SEARCH_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ UsrQuery: date }).toString(),
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 86_400 },
    });

    if (!response.ok) throw new Error(`Pi search returned ${response.status}`);

    const html = await response.text();
    const match = html.match(/occurs at position\s+([\d,]+)/i);
    if (!match) {
      // The primary source covers 200M digits. Fall back to a public 9B-digit
      // index before reporting that an eight-digit date cannot be located.
      const extendedUrl = new URL(EXTENDED_PI_SEARCH_URL);
      extendedUrl.searchParams.set('q', date);
      extendedUrl.searchParams.set('top', '1');
      const extendedResponse = await fetch(extendedUrl, {
        signal: AbortSignal.timeout(8_000),
        next: { revalidate: 86_400 },
      });
      if (!extendedResponse.ok) throw new Error(`Extended Pi search returned ${extendedResponse.status}`);
      const extended = await extendedResponse.json() as { positions?: number[] };
      const position = extended.positions?.[0];
      if (typeof position !== 'number' || !Number.isSafeInteger(position) || position < 1) return NextResponse.json({ found: false, date });

      matches.set(date, { position, expires: Date.now() + CACHE_FOR_MS });
      return NextResponse.json({ found: true, date, position });
    }

    const position = Number(match[1].replaceAll(',', ''));
    if (!Number.isSafeInteger(position) || position < 1) throw new Error('Invalid position returned by Pi search');

    matches.set(date, { position, expires: Date.now() + CACHE_FOR_MS });
    return NextResponse.json({ found: true, date, position });
  } catch (error) {
    console.error('Unable to find date in pi:', error);
    return NextResponse.json(
      { error: 'The Pi search service is temporarily unavailable.' },
      { status: 502 },
    );
  }
}
