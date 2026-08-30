'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CHUNK_SIZE = 1_000;
const DIGITS_PER_LINE = 50;

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const chunksRef = useRef<PiChunk[]>([]);
  const pendingRef = useRef(new Map<number, Promise<PiChunk>>());

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

  useEffect(() => {
    let cancelled = false;

    async function begin() {
      try {
        const date = todayAsDigits();
        const matchResponse = await fetch(`/api/find-date?date=${date}`);
        if (!matchResponse.ok) throw new Error('Could not find today in π.');
        const found = await matchResponse.json() as { found: boolean; date: string; position: number };
        if (!found.found) throw new Error("Today wasn't found in the available digits of π.");

        const starts = [Math.max(1, found.position - CHUNK_SIZE), found.position, found.position + CHUNK_SIZE];
        const initialChunks = (await Promise.all(starts.map(fetchChunk))).sort((a, b) => a.start - b.start);
        if (cancelled) return;

        chunksRef.current = initialChunks;
        setChunks(initialChunks);
        setMatch({ date: found.date, position: found.position });
        requestAnimationFrame(() => {
          const viewer = viewerRef.current;
          const today = viewer?.querySelector<HTMLElement>('[data-today-in-pi]');
          if (viewer && today) viewer.scrollTop = today.offsetTop - viewer.clientHeight / 2 + today.offsetHeight / 2;
        });
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Something went wrong.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    begin();
    return () => { cancelled = true; };
  }, [fetchChunk]);

  const addChunk = useCallback(async (start: number, direction: 'before' | 'after') => {
    const viewer = viewerRef.current;
    if (!viewer || start < 1 || loadingMore) return;
    setLoadingMore(true);
    const previousHeight = viewer.scrollHeight;
    try {
      const chunk = await fetchChunk(start);
      updateChunks((current) => [...current, chunk].sort((a, b) => a.start - b.start));
      if (direction === 'before') {
        requestAnimationFrame(() => {
          const activeViewer = viewerRef.current;
          if (activeViewer) activeViewer.scrollTop += activeViewer.scrollHeight - previousHeight;
        });
      }
    } catch {
      // The already-loaded part stays usable if an adjacent request fails.
    } finally {
      setLoadingMore(false);
    }
  }, [fetchChunk, loadingMore, updateChunks]);

  const handleScroll = useCallback(() => {
    const viewer = viewerRef.current;
    const current = chunksRef.current;
    if (!viewer || current.length === 0 || loadingMore) return;
    if (viewer.scrollTop < 180) {
      void addChunk(current[0].start - CHUNK_SIZE, 'before');
    } else if (viewer.scrollTop + viewer.clientHeight > viewer.scrollHeight - 180) {
      const last = current[current.length - 1];
      void addChunk(last.start + last.digits.length, 'after');
    }
  }, [addChunk, loadingMore]);

  const returnToToday = () => {
    const viewer = viewerRef.current;
    const today = viewer?.querySelector<HTMLElement>('[data-today-in-pi]');
    if (viewer && today) viewer.scrollTo({ top: today.offsetTop - viewer.clientHeight / 2 + today.offsetHeight / 2, behavior: 'smooth' });
  };

  return (
    <main className="pi-page">
      <section className="pi-shell" aria-label="Today in pi">
        {loading ? (
          <div className="pi-loading" role="status"><span className="loading-dot" /> Locating today in π…</div>
        ) : error ? (
          <div className="pi-error" role="alert">{error} <button onClick={() => window.location.reload()}>Try again</button></div>
        ) : match ? (
          <>
            <div className="pi-viewer-wrap">
              <div ref={viewerRef} className="pi-viewer" onScroll={handleScroll} aria-label="Scrollable digits of pi">
                {chunks.map((chunk) => <PiChunkView key={chunk.start} chunk={chunk} date={match.date} datePosition={match.position} />)}
              </div>
            </div>
            <button className="today-button" onClick={returnToToday} aria-label={`Return to ${readableDate(match.date)} in pi`}>Today</button>
            {loadingMore && <span className="stream-status" aria-live="polite">Loading π…</span>}
          </>
        ) : null}
      </section>
    </main>
  );
}

function PiChunkView({ chunk, date, datePosition }: { chunk: PiChunk; date: string; datePosition: number }) {
  const lines = chunk.digits.match(new RegExp(`.{1,${DIGITS_PER_LINE}}`, 'g')) ?? [];
  return <>{lines.map((line, lineIndex) => {
    const lineStart = chunk.start + lineIndex * DIGITS_PER_LINE;
    return <div className="pi-line" key={lineStart}>
      <span className="digit-index">{lineStart.toLocaleString()}</span>
      <span className="digit-run">{line.split('').map((digit, index) => {
        const position = lineStart + index;
        const isToday = position >= datePosition && position < datePosition + date.length;
        return <span key={position} className={isToday ? 'today-digit' : undefined} data-today-in-pi={isToday || undefined}>{digit}</span>;
      })}</span>
    </div>;
  })}</>;
}
