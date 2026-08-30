'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const CHUNK_SIZE = 1_000;

type PiChunk = { start: number; digits: string };
type DateMatch = { date: string; position: number };

function todayAsDigits() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

function readableDate(date: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(
    new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T12:00:00`),
  );
}

export default function Home() {
  const [match, setMatch] = useState<DateMatch | null>(null);
  const [chunks, setChunks] = useState<PiChunk[]>([]);
  const [digitsPerRow, setDigitsPerRow] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const chunksRef = useRef<PiChunk[]>([]);
  const pendingRef = useRef(new Map<number, Promise<PiChunk>>());
  const initialPositionedRef = useRef(false);
  const loadingMoreRef = useRef(false);

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

  // The row width is measured from the actual active mono font, so it follows
  // browser zoom and any viewport resize instead of relying on breakpoints.
  useLayoutEffect(() => {
    const stream = streamRef.current;
    const measure = measureRef.current;
    if (!stream || !measure) return;

    const calculateRowLength = () => {
      const characterWidth = measure.getBoundingClientRect().width / 10;
      const styles = getComputedStyle(stream);
      const gutter = Number.parseFloat(styles.getPropertyValue('--index-gutter')) || 64;
      const gap = Number.parseFloat(styles.getPropertyValue('--index-gap')) || 18;
      const available = stream.clientWidth - gutter - gap;
      if (characterWidth > 0) setDigitsPerRow(Math.max(8, Math.floor(available / characterWidth)));
    };

    calculateRowLength();
    const observer = new ResizeObserver(calculateRowLength);
    observer.observe(stream);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function begin() {
      try {
        const date = todayAsDigits();
        const matchResponse = await fetch(`/api/find-date?date=${date}`);
        if (!matchResponse.ok) throw new Error('Could not find today in π.');
        const found = await matchResponse.json() as { found: boolean; date: string; position: number };
        if (!found.found) throw new Error("Today wasn't found in the available digits of π.");

        const firstStart = Math.max(1, found.position - CHUNK_SIZE);
        const initialChunks = (await Promise.all([firstStart, firstStart + CHUNK_SIZE, firstStart + 2 * CHUNK_SIZE].map(fetchChunk)))
          .sort((a, b) => a.start - b.start);
        if (cancelled) return;

        chunksRef.current = initialChunks;
        setChunks(initialChunks);
        setMatch({ date: found.date, position: found.position });
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Something went wrong.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    begin();
    return () => { cancelled = true; };
  }, [fetchChunk]);

  const centerToday = useCallback((behavior: ScrollBehavior = 'auto') => {
    const today = document.querySelector<HTMLElement>('[data-today-in-pi]');
    if (!today) return;
    window.scrollTo({ top: Math.max(0, window.scrollY + today.getBoundingClientRect().top - window.innerHeight / 2 + today.offsetHeight / 2), behavior });
  }, []);

  useEffect(() => {
    if (!match || initialPositionedRef.current) return;
    const frame = requestAnimationFrame(() => {
      centerToday();
      initialPositionedRef.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [centerToday, digitsPerRow, match]);

  const addChunk = useCallback(async (start: number, direction: 'before' | 'after') => {
    if (start < 1 || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const previousHeight = document.documentElement.scrollHeight;
    try {
      const chunk = await fetchChunk(start);
      updateChunks((current) => [...current, chunk].sort((a, b) => a.start - b.start));
      if (direction === 'before') {
        requestAnimationFrame(() => window.scrollBy(0, document.documentElement.scrollHeight - previousHeight));
      }
    } catch {
      // The loaded portion remains readable if an adjacent request is unavailable.
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
      if (window.scrollY < threshold) {
        void addChunk(current[0].start - CHUNK_SIZE, 'before');
      } else if (window.innerHeight + window.scrollY > document.documentElement.scrollHeight - threshold) {
        const last = current[current.length - 1];
        void addChunk(last.start + last.digits.length, 'after');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [addChunk]);

  const firstChunk = chunks[0];
  const digitStream = chunks.map((chunk) => chunk.digits).join('');

  return (
    <main className="pi-page">
      <header className="pi-title" aria-label="The Number Pi">The Number π</header>
      {loading ? (
        <div className="pi-loading" role="status"><span className="loading-dot" /> Locating today in π</div>
      ) : error ? (
        <div className="pi-error" role="alert">{error} <button onClick={() => window.location.reload()}>Try again</button></div>
      ) : match && firstChunk ? (
        <>
          <div ref={streamRef} className="pi-stream" aria-label="Scrollable digits of pi">
            <span ref={measureRef} className="digit-measure" aria-hidden="true">0000000000</span>
            <PiRows digits={digitStream} start={firstChunk.start} rowLength={digitsPerRow} date={match.date} datePosition={match.position} />
          </div>
          <button className="today-button" onClick={() => centerToday('smooth')} aria-label={`Return to ${readableDate(match.date)} in pi`}>Today</button>
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

  return <>{rows.map((row) => (
    <div className="pi-line" key={row.position}>
      <span className="digit-index">{row.position.toLocaleString()}</span>
      <span className="digit-run">{row.digits.split('').map((digit, index) => {
        const position = row.position + index;
        const isToday = position >= datePosition && position < datePosition + date.length;
        return <span key={position} className={isToday ? 'today-digit' : undefined} data-today-in-pi={isToday || undefined}>{digit}</span>;
      })}</span>
    </div>
  ))}</>;
}
