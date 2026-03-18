'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { formatDigitRange } from '@/lib/piEngine';

interface DateIndicatorProps {
  dateString: string;
  displayDate: string;
  position: number;
  found: boolean;
  source: string;
  context?: string;
}

export default function DateIndicator({
  dateString,
  displayDate,
  position,
  found,
  source,
  context,
}: DateIndicatorProps) {
  if (!found) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-24 right-8 z-20 max-w-sm"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🔍</div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Date not found
              </h3>
              <p className="text-sm text-gray-600">
                <span className="font-mono font-semibold">{dateString}</span> was not found in π
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="fixed top-24 right-8 z-20 max-w-sm"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-200 px-6 py-4">
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.4, type: 'spring', stiffness: 200 }}
              className="text-2xl"
            >
              ✨
            </motion.div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {displayDate}
              </h3>
              <p className="text-sm text-gray-700 mb-1">
                <span className="font-mono font-bold text-amber-700">
                  {dateString}
                </span> at position{' '}
                <span className="font-mono font-bold text-amber-700">
                  {(position + 1).toLocaleString()}
                </span>
              </p>
              {context && (
                <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded px-2 py-1 mt-2">
                  ...{context}...
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {source === 'precomputed' ? '⚡ Pre-computed' : 
                 source === 'api' ? '🔍 Live search' : 
                 source === 'calculated' ? '🧮 Calculated' : source}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}