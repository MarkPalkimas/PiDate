import { NextResponse } from 'next/server';

const PI_DELIVERY_URL = 'https://api.pi.delivery/v1/pi';
const MAX_DIGITS = 1_000;

/** Returns an exact, contiguous slice of pi. Position 0 is the leading 3. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const start = Number(params.get('start'));
  const count = Number(params.get('count') ?? 1_000);

  if (!Number.isSafeInteger(start) || start < 0 || !Number.isSafeInteger(count) || count < 1 || count > MAX_DIGITS) {
    return NextResponse.json({ error: `start must be positive and count must be 1–${MAX_DIGITS}.` }, { status: 400 });
  }

  try {
    const source = new URL(PI_DELIVERY_URL);
    source.searchParams.set('start', String(start));
    source.searchParams.set('numberOfDigits', String(count));
    const response = await fetch(source, { next: { revalidate: 31_536_000 } });
    if (!response.ok) throw new Error(`Pi digit service returned ${response.status}`);

    const data = await response.json() as { content?: string };
    if (!data.content || !/^\d+$/.test(data.content)) throw new Error('Pi digit service returned invalid content');
    return NextResponse.json({ start, digits: data.content }, { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch (error) {
    console.error('Unable to get pi digits:', error);
    return NextResponse.json({ error: 'The Pi digit service is temporarily unavailable.' }, { status: 502 });
  }
}
