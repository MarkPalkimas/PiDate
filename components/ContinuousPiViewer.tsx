'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PI_DIGITS } from '@/lib/piDigits';

interface ContinuousPiViewerProps {
  highlightStart?: number;
  highlightLength?: number;
  scrollToPosition?: number;
  highlightInfo?: {
    dateString: string;
    displayDate: string;
    position: number;
    found: boolean;
    totalDigits: number;
  } | null;
}

const DIGITS_PER_ROW = 100;
const ROW_HEIGHT = 28;
const BUFFER_ROWS = 20;

export default function ContinuousPiViewer({
  highlightStart,
  highlightLength = 8,
  scrollToPosition,
  highlightInfo,
}: ContinuousPiViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleStart, setVisibleStart] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to position on mount or when position changes
  useEffect(() => {
    if (scrollToPosition !== undefined && containerRef.current && !hasScrolled) {
      const targetRow = Math.floor(scrollToPosition / DIGITS_PER_ROW);
      const scrollTop = targetRow * ROW_HEIGHT - window.innerHeight / 3;

      setTimeout(() => {
        window.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth',
        });
        setHasScrolled(true);
      }, 300);
    }
  }, [scrollToPosition, hasScrolled]);

  // Handle scroll for virtualization
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const scrollTop = window.scrollY;
      const currentRow = Math.floor(scrollTop / ROW_HEIGHT);
      const newVisibleStart = Math.max(0, currentRow - BUFFER_ROWS) * DIGITS_PER_ROW;
      
      if (Math.abs(newVisibleStart - visibleStart) > DIGITS_PER_ROW * 5) {
        setVisibleStart(newVisibleStart);
      }
    }, 50);
  }, [visibleStart]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  const renderDigits = () => {
    const rows = [];
    const totalRows = Math.ceil(PI_DIGITS.length / DIGITS_PER_ROW);
    const startRow = Math.floor(visibleStart / DIGITS_PER_ROW);
    const endRow = Math.min(totalRows, startRow + BUFFER_ROWS * 2);

    for (let row = startRow; row < endRow; row++) {
      const rowStart = row * DIGITS_PER_ROW;
      const rowEnd = Math.min(rowStart + DIGITS_PER_ROW, PI_DIGITS.length);
      const rowDigits = PI_DIGITS.substring(rowStart, rowEnd);

      rows.push(
        <div
          key={row}
          className="flex items-start font-mono text-[15px] leading-relaxed tracking-wide"
          style={{ height: `${ROW_HEIGHT}px` }}
        >
          <span className="text-gray-400 mr-6 select-none w-24 text-right flex-shrink-0 text-xs pt-1">
            {(rowStart + 1).toLocaleString()}
          </span>
          <span className="flex-1 text-gray-700">
            {rowDigits.split('').map((digit, idx) => {
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
                      backgroundColor: ['#dbeafe', '#93c5fd', '#dbeafe'],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: idx * 0.03,
                      repeat: 0,
                    }}
                    className="inline-block px-0.5 py-0.5 rounded-sm font-semibold text-blue-900"
                    style={{
                      backgroundColor: '#dbeafe',
                      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
                    }}
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

  const totalHeight = Math.ceil(PI_DIGITS.length / DIGITS_PER_ROW) * ROW_HEIGHT;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Floating info overlay */}
      <AnimatePresence>
        {highlightInfo && highlightInfo.found && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 px-6 py-4 max-w-2xl">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">
                  {highlightInfo.displayDate} is written in π
                </p>
                <p className="text-xs text-gray-500">
                  Digits {(highlightInfo.position + 1).toLocaleString()}–
                  {(highlightInfo.position + highlightLength).toLocaleString()} match{' '}
                  <span className="font-mono font-semibold text-blue-600">
                    {highlightInfo.dateString}
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Not found message */}
      <AnimatePresence>
        {highlightInfo && !highlightInfo.found && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 px-6 py-4 max-w-2xl">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">
                  {highlightInfo.displayDate} not found
                </p>
                <p className="text-xs text-gray-500">
                  Not found within the first {highlightInfo.totalDigits.toLocaleString()} digits of π
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pi header - shows 3.14... */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="sticky top-0 z-5 bg-gradient-to-b from-gray-50 via-gray-50 to-transparent pb-8 pt-12"
      >
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-7xl font-light text-gray-800 tracking-tight">
            π = 3.
          </h1>
        </div>
      </motion.div>

      {/* Continuous digits */}
      <div
        ref={containerRef}
        className="max-w-5xl mx-auto px-6 pb-32"
        style={{ minHeight: `${totalHeight}px` }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-0"
        >
          {renderDigits()}
        </motion.div>
      </div>

      {/* Subtle footer */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-5 pointer-events-none">
        <p className="text-xs text-gray-400">
          {PI_DIGITS.length.toLocaleString()} digits of π
        </p>
      </div>
    </div>
  );
}
