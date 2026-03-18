'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { piAPI } from '@/lib/piAPI';

interface PiViewerProps {
  targetPosition?: number;
  highlightStart?: number;
  highlightLength?: number;
  onPositionChange?: (position: number) => void;
  dateResult?: any;
}

const DIGITS_PER_ROW = 80;
const ROW_HEIGHT = 32;
const BUFFER_ROWS = 30;

export default function PiViewer({
  targetPosition,
  highlightStart,
  highlightLength = 8,
  onPositionChange,
}: PiViewerProps) {
  const [piSegments, setPiSegments] = useState<Map<number, string>>(new Map());
  const [visibleStart, setVisibleStart] = useState(0);
  const [totalDigits, setTotalDigits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const hasAutoScrolled = useRef(false);

  const loadPiSegment = useCallback(async (start: number) => {
    const segmentSize = BUFFER_ROWS * 2 * DIGITS_PER_ROW;
    const segmentKey = Math.floor(start / segmentSize);
    
    setPiSegments(prev => {
      if (prev.has(segmentKey)) {
        return prev;
      }
      
      (async () => {
        try {
          const segment = await piAPI.getPiDigitsAt(segmentKey * segmentSize, segmentSize);
          setPiSegments(current => new Map(current).set(segmentKey, segment));
        } catch (error) {
          console.error('Failed to load Pi segment:', error);
        }
      })();
      
      return prev;
    });
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        setTotalDigits(1000000000);
        
        if (targetPosition !== undefined && !hasAutoScrolled.current) {
          const targetRow = Math.floor(targetPosition / DIGITS_PER_ROW);
          const startRow = Math.max(0, targetRow - BUFFER_ROWS);
          const newVisibleStart = startRow * DIGITS_PER_ROW;
          
          setVisibleStart(newVisibleStart);
          await loadPiSegment(newVisibleStart);
          
          setTimeout(() => {
            const scrollTop = targetRow * ROW_HEIGHT - window.innerHeight / 2;
            window.scrollTo({
              top: Math.max(0, scrollTop),
              behavior: 'smooth',
            });
            hasAutoScrolled.current = true;
          }, 500);
        } else {
          await loadPiSegment(0);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize Pi viewer:', error);
        setIsLoading(false);
      }
    };

    initialize();
  }, [targetPosition, loadPiSegment]);

  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(async () => {
      const scrollTop = window.scrollY;
      const currentRow = Math.floor(scrollTop / ROW_HEIGHT);
      const newVisibleStart = Math.max(0, currentRow - BUFFER_ROWS) * DIGITS_PER_ROW;
      
      if (Math.abs(newVisibleStart - visibleStart) > DIGITS_PER_ROW * 10) {
        setVisibleStart(newVisibleStart);
        await loadPiSegment(newVisibleStart);
      }

      const currentPosition = currentRow * DIGITS_PER_ROW;
      onPositionChange?.(currentPosition);
    }, 100);
  }, [visibleStart, onPositionChange, loadPiSegment]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  const renderRows = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading π...</div>
        </div>
      );
    }

    const rows = [];
    const startRow = Math.floor(visibleStart / DIGITS_PER_ROW);
    const endRow = startRow + BUFFER_ROWS * 4;

    for (let row = startRow; row < endRow; row++) {
      const rowStart = row * DIGITS_PER_ROW;
      const segmentSize = BUFFER_ROWS * 2 * DIGITS_PER_ROW;
      const segmentKey = Math.floor(rowStart / segmentSize);
      const segment = piSegments.get(segmentKey);
      
      if (!segment) {
        loadPiSegment(rowStart);
        continue;
      }

      const segmentOffset = rowStart % segmentSize;
      const rowDigits = segment.substring(segmentOffset, segmentOffset + DIGITS_PER_ROW);

      if (!rowDigits || rowDigits.length === 0) continue;

      rows.push(
        <div
          key={row}
          className="flex items-start font-mono text-[16px] leading-relaxed tracking-wide"
          style={{ height: \`\${ROW_HEIGHT}px\` }}
        >
          <span className="text-gray-400 mr-8 select-none w-32 text-right flex-shrink-0 text-sm pt-1">
            {(rowStart + 1).toLocaleString()}
          </span>
          <span className="flex-1 text-gray-800 leading-relaxed">
            {rowDigits.split('').map((digit: string, idx: number) => {
              const globalIdx = rowStart + idx;
              const isHighlighted =
                highlightStart !== undefined &&
                globalIdx >= highlightStart &&
                globalIdx < highlightStart + highlightLength;

              if (isHighlighted) {
                return (
                  <motion.span
                    key={globalIdx}
                    initial={{ scale: 1, backgroundColor: 'transparent' }}
                    animate={{
                      backgroundColor: ['#fef3c7', '#f59e0b', '#fef3c7'],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      delay: idx * 0.05,
                      ease: 'easeInOut',
                    }}
                    className="inline-block px-1 py-0.5 rounded-md font-bold text-amber-900 bg-amber-100 shadow-sm"
                  >
                    {digit}
                  </motion.span>
                );
              }

              return (
                <span key={globalIdx} className="text-gray-700">
                  {digit}
                </span>
              );
            })}
          </span>
        </div>
      );
    }

    return rows;
  };

  const estimatedHeight = Math.ceil(totalDigits / DIGITS_PER_ROW) * ROW_HEIGHT;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="sticky top-0 z-10 bg-gradient-to-b from-stone-50 via-stone-50/95 to-transparent backdrop-blur-sm pb-8 pt-16"
      >
        <div className="max-w-6xl mx-auto px-8">
          <h1 className="text-8xl font-extralight text-gray-900 tracking-tight mb-2">
            π = 3.
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Your date, hidden in π
          </p>
        </div>
      </motion.div>

      <div
        className="max-w-6xl mx-auto px-8 pb-32"
        style={{ minHeight: \`\${estimatedHeight}px\` }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-1"
        >
          {renderRows()}
        </motion.div>
      </div>

      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
          <p className="text-xs text-gray-500 font-medium">
            {totalDigits.toLocaleString()} digits of π
          </p>
        </div>
      </div>
    </div>
  );
}
