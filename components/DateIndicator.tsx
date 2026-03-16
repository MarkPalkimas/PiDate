'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { formatDigitRange } from '@/lib/piEngine';

interface DateIndicatorProps {
  dateString: string;
  displayDate: string;
  position: number;
  found: boolean;
  totalDigits: number;
}

export default function DateIndicator({
  dateString,
  displayDate,
  position,
  found,
  totalDigits,
}: DateIndicatorProps) {
  if (!found) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-32 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 px-8 py-6 max-w-lg">
          <div className="text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Date not found
            </h3>
            <p className="text-gray-600 text-sm">
              <span className="font-mono font-semibold">{dateString}</span> was not found within the first{' '}
              <span className="font-semibold">{totalDigits.toLocaleString()}</span> digits of π
            </p>
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
        className="fixed top-32 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-200 px-8 py-6 max-w-2xl">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.4, type: 'spring', stiffness: 200 }}
              className="text-4xl mb-4"
            >
              ✨
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {displayDate} is written in π
            </h3>
            <div className="space-y-2">
              <p className="text-gray-700">
                Digits <span className="font-mono font-bold text-amber-700">
                  {formatDigitRange(position, 8)}
                </span> match{' '}
                <span className="font-mono font-bold text-amber-700">
                  {dateString}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                Found at position {(position + 1).toLocaleString()} in the infinite sequence
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}