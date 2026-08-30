'use client';

import { FormEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const CHUNK_SIZE = 1_000;
const DATE_FORMATS = {
  us: { label: 'MM / DD / YYYY', format: (year: string, month: string, day: string) => `${month}${day}${year}` },
  iso: { label: 'YYYY / MM / DD', format: (year: string, month: string, day: string) => `${year}${month}${day}` },
  eu: { label: 'DD / MM / YYYY', format: (year: string, month: string, day: string) => `${day}${month}${year}` },
} as const;

type DateFormat = keyof typeof DATE_FORMATS;
type PiChunk = { start: number; digits: string };
type DateMatch = { date: string; position: number };

function todayValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function dateDigits(value: string, format: DateFormat) {
  const [year, month, day] = value.split('-');
  return DATE_FORMATS[format].format(year, month, day);
}

export default function Home() {
  const [match, setMatch] = useState<DateMatch | null>(null);
  const [chunks, setChunks] = useState<PiChunk[]>([]);
  const [digitsPerRow, setDigitsPerRow] = useState(50);
  const [format, setFormat] = useState<DateFormat>('us');
  const [selectedDate, setSelectedDate] = useState(todayValue);
  const [showDateFinder, setShowDateFinder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const chunksRef = useRef<PiChunk[]>([]);
  const pendingRef = useRef(new Map<number, Promise<PiChunk>>());
  const initialPositionedRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const searchIdRef = useRef(0);

  const updateChunks = useCallback((updater: (current: PiChunk[]) => PiChunk[]) => {
    setChunks((current) => {
      const next = updater(current);
      chunksRef.current = next;
      return next;
    });
  }, []);

  const fetchChunk = useCallback(async (start: number) => {
    const existing = chunksRef.current.find((chunk) => chunk.start === start);
    if (existing) return existing;
    const pending = pendingRef.current.get(start);
    if (pending) return pending;

    const request = (async () => {
      const response = await fetch(`/api/pi-digits?start=${start}&count=${CHUNK_SIZE}`);
      if (!response.ok) throw new Error('Could not retrieve this part of π.');
      return await response.json() as PiChunk;
    })();
    pendingRef.current.set(start, request);
    try {
      return await request;
    } finally {
      pendingRef.current.delete(start);
    }
  }, []);

  const findDate = useCallback(async (digits: string, fallbackDigits?: string) => {
    const searchId = ++searchIdRef.current;
    initialPositionedRef.current = false;
    setLoading(true);
    setError(null);
    setMatch(null);
    chunksRef.current = [];
    setChunks([]);

    try {
      const matchResponse = await fetch(`/api/find-date?date=${digits}`);
      if (!matchResponse.ok) throw new Error('Could not search π right now.');
      let found = await matchResponse.json() as { found: boolean; date: string; position: number };
      if (!found.found && fallbackDigits && fallbackDigits !== digits) {
        const fallbackResponse = await fetch(`/api/find-date?date=${fallbackDigits}`);
        if (!fallbackResponse.ok) throw new Error('Could not search π right now.');
        found = await fallbackResponse.json() as { found: boolean; date: string; position: number };
      }
      if (!found.found) throw new Error('That date is not in the searchable range of π. Try another format.');

      const firstStart = Math.max(1, found.position - CHUNK_SIZE);
      const initialChunks = (await Promise.all([firstStart, firstStart + CHUNK_SIZE, firstStart + 2 * CHUNK_SIZE].map(fetchChunk)))
        .sort((a, b) => a.start - b.start);
      if (searchId !== searchIdRef.current) return;

      chunksRef.current = initialChunks;
      setChunks(initialChunks);
      setMatch({ date: found.date, position: found.position });
      setShowDateFinder(false);
    } catch (cause) {
      if (searchId === searchIdRef.current) setError(cause instanceof Error ? cause.message : 'Something went wrong.');
    } finally {
      if (searchId === searchIdRef.current) setLoading(false);
    }
  }, [fetchChunk]);

  // Preserve the existing working daily match on first load. The date finder
  // itself defaults to the requested American format.
  useEffect(() => { void findDate(dateDigits(todayValue(), 'iso')); }, [findDate]);

  // Measure ten rendered glyphs from the active SF Mono stack. This responds
  // to browser zoom and layout changes, avoiding fixed digits-per-row rules.
  useLayoutEffect(() => {
    const stream = streamRef.current;
    const measure = measureRef.current;
    if (!stream || !measure) return;

    const calculateRowLength = () => {
      const characterWidth = measure.getBoundingClientRect().width / 10;
      const styles = getComputedStyle(stream);
      const gutter = Number.parseFloat(styles.getPropertyValue('--index-gutter')) || 68;
      const gap = Number.parseFloat(styles.getPropertyValue('--index-gap')) || 18;
      const available = stream.clientWidth - gutter - gap;
      if (characterWidth > 0) setDigitsPerRow((current) => {
        const next = Math.max(8, Math.floor(available / characterWidth));
        return current === next ? current : next;
      });
    };

    calculateRowLength();
    const observer = new ResizeObserver(calculateRowLength);
    observer.observe(stream);
    return () => observer.disconnect();
  }, [chunks.length]);

  const centerMatch = useCallback((behavior: ScrollBehavior = 'auto') => {
    const target = document.querySelector<HTMLElement>('[data-date-match]');
    if (!target) return;
    window.scrollTo({ top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - window.innerHeight / 2 + target.offsetHeight / 2), behavior });
  }, []);

  useEffect(() => {
    if (!match || initialPositionedRef.current) return;
    const frame = requestAnimationFrame(() => {
      centerMatch();
      initialPositionedRef.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [centerMatch, digitsPerRow, match]);

  const addChunk = useCallback(async (start: number, direction: 'before' | 'after') => {
    if (start < 1 || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const previousHeight = document.documentElement.scrollHeight;
    try {
      const chunk = await fetchChunk(start);
      updateChunks((current) => [...current, chunk].sort((a, b) => a.start - b.start));
      if (direction === 'before') requestAnimationFrame(() => window.scrollBy(0, document.documentElement.scrollHeight - previousHeight));
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [fetchChunk, updateChunks]);

  useEffect(() => {
    const onScroll = () => {
      const current = chunksRef.current;
      if (!current.length || loadingMoreRef.current) return;
      const threshold = Math.max(360, window.innerHeight * 0.6);
      if (window.scrollY < threshold) void addChunk(current[0].start - CHUNK_SIZE, 'before');
      else if (window.innerHeight + window.scrollY > document.documentElement.scrollHeight - threshold) {
        const last = current[current.length - 1];
        void addChunk(last.start + last.digits.length, 'after');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [addChunk]);

  const submitDate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedDate) void findDate(dateDigits(selectedDate, format));
  };
  const firstChunk = chunks[0];
  const digitStream = chunks.map((chunk) => chunk.digits).join('');

  return (
    <main className="pi-page">
      <header className="pi-title">The Number π</header>
      <nav className="pi-actions" aria-label="Pi controls">
        <button onClick={() => { setShowDateFinder((open) => !open); setShowSettings(false); }}>Go to Date</button>
        <button onClick={() => { setShowSettings((open) => !open); setShowDateFinder(false); }}>Settings</button>
      </nav>
      {showDateFinder && <form className="date-finder" onSubmit={submitDate}>
        <input aria-label="Date to find" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        <button type="submit">Find</button>
        <button type="button" onClick={() => {
          const today = todayValue();
          setSelectedDate(today);
          void findDate(dateDigits(today, format), dateDigits(today, 'iso'));
        }}>Today</button>
      </form>}
      {showSettings && <div className="settings-menu" role="group" aria-label="Date search format">
        <span>Date format</span>
        {(Object.keys(DATE_FORMATS) as DateFormat[]).map((key) => <button key={key} className={format === key ? 'selected' : undefined} onClick={() => setFormat(key)}>{DATE_FORMATS[key].label}</button>)}
      </div>}

      {loading ? (
        <div className="pi-loading" role="status"><span className="loading-dot" /> Locating a date in π</div>
      ) : error ? (
        <div className="pi-error" role="alert">{error} <button onClick={() => void findDate(dateDigits(todayValue(), 'iso'))}>Return to today</button></div>
      ) : match && firstChunk ? (
        <>
          <div ref={streamRef} className="pi-stream" aria-label="Scrollable digits of pi">
            <span ref={measureRef} className="digit-measure" aria-hidden="true">0000000000</span>
            <PiRows digits={digitStream} start={firstChunk.start} rowLength={digitsPerRow} date={match.date} datePosition={match.position} />
          </div>
          <button className="today-button" onClick={() => centerMatch('smooth')}>Today</button>
          {loadingMore && <span className="stream-status" aria-live="polite">Loading π</span>}
        </>
      ) : null}
    </main>
  );
}

function PiRows({ digits, start, rowLength, date, datePosition }: { digits: string; start: number; rowLength: number; date: string; datePosition: number }) {
  const rows = Array.from({ length: Math.ceil(digits.length / rowLength) }, (_, index) => {
    const offset = index * rowLength;
    return { digits: digits.slice(offset, offset + rowLength), position: start + offset };
  });

  return <>{rows.map((row) => <div className="pi-line" key={row.position}>
    <span className="digit-index">{row.position.toLocaleString()}</span>
    <span className="digit-run">{row.digits.split('').map((digit, index) => {
      const position = row.position + index;
      const isMatch = position >= datePosition && position < datePosition + date.length;
      return <span key={position} className={isMatch ? 'today-digit' : undefined} data-date-match={isMatch || undefined}>{digit}</span>;
    })}</span>
  </div>)}</>;
}
