'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PI_DIGITS } from '@/lib/piDigits';

interface PiViewerProps {
  highlightStart?: number;
  highlightLength?: number;
  scrollToPosition?: number;
}

const DIGITS_PER_ROW = 100;
const ROWS_TO_RENDER = 50; // Render 50 rows at a time for performance

export default function PiViewer({
  highlightStart,
  highlightLength = 8,
  scrollToPosition,
}: PiViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleStart, setVisibleStart] = useState(0);

  useEffect(() => {
    if (scrollToPosition !== undefined && containerRef.current) {
      const targetRow = Math.floor(scrollToPosition / DIGITS_PER_ROW);
      const rowHeight = 32; // Approximate height of each row
      const scrollTop = targetRow * rowHeight - 200; // Offset to center

      containerRef.current.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth',
      });

      // Update visible start for virtualization
      setVisibleStart(Math.max(0, targetRow - 10) * DIGITS_PER_ROW);
    }
  }, [scrollToPosition]);

  const renderDigits = () => {
    const rows = [];
    const totalRows = Math.ceil(PI_DIGITS.length / DIGITS_PER_ROW);
    const startRow = Math.floor(visibleStart / DIGITS_PER_ROW);
    const endRow = Math.min(totalRows, startRow + ROWS_TO_RENDER);

    for (let row = startRow; row < endRow; row++) {
      const rowStart = row * DIGITS_PER_ROW;
      const rowEnd = Math.min(rowStart + DIGITS_PER_ROW, PI_DIGITS.length);
      const rowDigits = PI_DIGITS.substring(rowStart, rowEnd);

      rows.push(
        <div key={row} className="flex font-mono text-sm leading-relaxed">
          <span className="text-gray-400 mr-4 select-none w-20 text-right flex-shrink-0">
            {rowStart.toString().padStart(8, '0')}
          </span>
          <span className="flex-1">
            {rowDigits.split('').map((digit, idx) => {
              const globalIdx = rowStart + idx;
              const isHighlighted =
                highlightStart !== undefined &&
                globalIdx >= highlightStart &&
                globalIdx < highlightStart + highlightLength;

              return (
                <motion.span
                  key={globalIdx}
                  className={isHighlighted ? 'highlight-digit' : ''}
                  initial={isHighlighted ? { scale: 1 } : false}
                  animate={
                    isHighlighted
                      ? {
                          scale: [1, 1.2, 1],
                          backgroundColor: ['#dbeafe', '#3b82f6', '#dbeafe'],
                        }
                      : {}
                  }
                  transition={{ duration: 0.6, delay: idx * 0.05 }}
                  style={
                    isHighlighted
                      ? {
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          fontWeight: 'bold',
                          padding: '2px 1px',
                          borderRadius: '2px',
                        }
                      : {}
                  }
                >
                  {digit}
                </motion.span>
              );
            })}
          </span>
        </div>
      );
    }

    return rows;
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const rowHeight = 32;
      const currentRow = Math.floor(scrollTop / rowHeight);
      const newVisibleStart = Math.max(0, currentRow - 5) * DIGITS_PER_ROW;
      
      if (Math.abs(newVisibleStart - visibleStart) > DIGITS_PER_ROW * 10) {
        setVisibleStart(newVisibleStart);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="max-w-6xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            π = 3.
            <span className="text-gray-500 text-sm ml-2">
              ({PI_DIGITS.length.toLocaleString()} digits)
            </span>
          </h3>
        </div>
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="p-6 overflow-y-auto bg-gray-50"
          style={{ maxHeight: '600px' }}
        >
          <div className="space-y-1">{renderDigits()}</div>
        </div>
      </div>
    </motion.div>
  );
}
