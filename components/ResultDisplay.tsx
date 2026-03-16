'use client';

import { motion } from 'framer-motion';
import { formatDateDisplay } from '@/lib/dateUtils';
import { formatPosition } from '@/lib/piSearch';
import { useState } from 'react';

interface ResultDisplayProps {
  dateString: string;
  date: Date;
  position: number;
  found: boolean;
  totalDigits: number;
}

export default function ResultDisplay({
  dateString,
  date,
  position,
  found,
  totalDigits,
}: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = `${dateString} appears at the ${formatPosition(position)}th decimal place of π\n\nFind yours at ${window.location.origin}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!found) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl mx-auto mb-12"
      >
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-semibold mb-2 text-gray-800">
            Not Found
          </h3>
          <p className="text-gray-600">
            {formatDateDisplay(date)} ({dateString}) was not found within the first{' '}
            {formatPosition(totalDigits)} digits of π.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Try another date or check back when we expand our dataset!
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto mb-12"
    >
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 p-8">
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-6xl mb-4"
          >
            ✨
          </motion.div>
          <h3 className="text-3xl font-bold mb-3 text-gray-800">
            Found it!
          </h3>
          <p className="text-lg text-gray-700 leading-relaxed">
            <span className="font-semibold">{formatDateDisplay(date)}</span>
            <span className="text-gray-500"> ({dateString})</span>
            <br />
            appears at the{' '}
            <span className="font-bold text-blue-600">
              {formatPosition(position)}th
            </span>{' '}
            decimal place of π
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleShare}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
          >
            {copied ? (
              <>
                <span>✓</span>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Share Result</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
