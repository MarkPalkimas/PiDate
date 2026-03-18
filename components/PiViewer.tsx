'use client';

import { useEffect, useState, useRef } from 'react';
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
const ROWS_TO_SHOW = 100;

export default function PiViewer({ targetPosition, highlightStart, highlightLength = 8 }: PiViewerProps) {
  const [piDigits, setPiDigits] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [displayStart, setDisplayStart] = useState(0);
  const hasScrolled = useRef(false);

  useEffect(() => {
    const loadPiDigits = async () => {
      try {
        setIsLoading(true);
        let startPosition = 0;
        if (targetPosition !== undefined) {
          startPosition = Math.max(0, targetPosition - 2000);
        }
        setDisplayStart(startPosition);
        const totalDigitsToLoad = DIGITS_PER_ROW * ROWS_TO_SHOW;
        const digits = await piAPI.getPiDigitsAt(startPosition, totalDigitsToLoad);
        setPiDigits(digits);
        setIsLoading(false);
        if (targetPosition !== undefined && !hasScrolled.current) {
          setTimeout(() => {
            const targetRow = Math.floor((targetPosition - startPosition) / DIGITS_PER_ROW);
            const element = document.getElementById('row-' + targetRow);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              hasScrolled.current = true;
            }
          }, 500);
        }
      } catch (error) {
        console.error('Failed to load pi digits:', error);
        setIsLoading(false);
      }
    };
    loadPiDigits();
  }, [targetPosition]);

  const renderPiDigits = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center py-20"><div className="text-gray-500">Loading π digits...</div></div>;
    }
    if (!piDigits) {
      return <div className="flex items-center justify-center py-20"><div className="text-gray-500">No pi digits available</div></div>;
    }
    const rows = [];
    for (let i = 0; i < piDigits.length; i += DIGITS_PER_ROW) {
      const rowDigits = piDigits.substring(i, i + DIGITS_PER_ROW);
      const rowNumber = Math.floor(i / DIGITS_PER_ROW);
      const globalPosition = displayStart + i;
      rows.push(
        <div key={rowNumber} id={'row-' + rowNumber} className="flex items-start font-mono text-base leading-relaxed">
          <span className="text-gray-400 mr-6 w-32 text-right text-sm pt-0.5 select-none">{(globalPosition + 1).toLocaleString()}</span>
          <span className="flex-1 text-gray-700">
            {rowDigits.split('').map((digit, idx) => {
              const globalIdx = globalPosition + idx;
              const isHighlighted = highlightStart !== undefined && globalIdx >= highlightStart && globalIdx < highlightStart + highlightLength;
              if (isHighlighted) {
                return <motion.span key={globalIdx} initial={{ scale: 1, backgroundColor: 'transparent' }} animate={{ backgroundColor: ['#fef3c7', '#f59e0b', '#fef3c7'], scale: [1, 1.15, 1] }} transition={{ duration: 2, delay: idx * 0.05, ease: 'easeInOut' }} className="inline-block px-1 py-0.5 rounded font-bold text-amber-900 bg-amber-100">{digit}</motion.span>;
              }
              return <span key={globalIdx}>{digit}</span>;
            })}
          </span>
        </div>
      );
    }
    return rows;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="sticky top-0 z-10 bg-gradient-to-b from-stone-50 via-stone-50/95 to-transparent backdrop-blur-sm pb-8 pt-16">
        <div className="max-w-6xl mx-auto px-8">
          <h1 className="text-7xl font-extralight text-gray-900 tracking-tight mb-2">π = 3.</h1>
          <p className="text-lg text-gray-600 font-light">Your date, hidden in π</p>
        </div>
      </motion.div>
      <div className="max-w-6xl mx-auto px-8 pb-32">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="space-y-2">{renderPiDigits()}</motion.div>
      </div>
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
          <p className="text-xs text-gray-500 font-medium">1,000,000,000 digits of π</p>
        </div>
      </div>
    </div>
  );
}
