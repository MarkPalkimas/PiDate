'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dateToMMDDYYYY, validateDateString, getRandomDate } from '@/lib/dateUtils';

interface DateControlProps {
  onDateSelect: (date: Date) => void;
}

export default function DateControl({ onDateSelect }: DateControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateValue, setDateValue] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');

  const handleDatePicker = () => {
    if (!dateValue) {
      setError('Please select a date');
      return;
    }
    const date = new Date(dateValue);
    setError('');
    onDateSelect(date);
    setIsOpen(false);
  };

  const handleManualInput = () => {
    const dateString = manualInput.trim();
    if (!validateDateString(dateString)) {
      setError('Invalid date format (use MMDDYYYY)');
      return;
    }
    const month = parseInt(dateString.substring(0, 2));
    const day = parseInt(dateString.substring(2, 4));
    const year = parseInt(dateString.substring(4, 8));
    const date = new Date(year, month - 1, day);
    setError('');
    onDateSelect(date);
    setIsOpen(false);
  };

  const handleToday = () => {
    onDateSelect(new Date());
    setIsOpen(false);
  };

  const handleRandom = () => {
    onDateSelect(getRandomDate());
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed top-8 right-8 z-50 bg-white/95 hover:bg-white text-gray-700 hover:text-gray-900 px-4 py-2.5 rounded-full shadow-lg border border-gray-200/50 backdrop-blur-sm transition-all hover:shadow-xl hover:scale-105 flex items-center gap-2 text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Pick a date
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="fixed top-24 right-8 z-50 w-96 bg-white rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-8 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      Jump to a date
                    </h3>
                    <p className="text-sm text-gray-600">
                      Find where any date appears in π
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition p-1"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select a date
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="date"
                      value={dateValue}
                      onChange={(e) => {
                        setDateValue(e.target.value);
                        setError('');
                      }}
                      className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                    />
                    <button
                      onClick={handleDatePicker}
                      className="px-6 py-3 bg-amber-600 text-white text-sm rounded-xl hover:bg-amber-700 transition font-medium shadow-sm"
                    >
                      Go
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">OR</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Manual Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Enter MMDDYYYY
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(e) => {
                        setManualInput(e.target.value);
                        setError('');
                      }}
                      placeholder="03152026"
                      maxLength={8}
                      className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition font-mono"
                    />
                    <button
                      onClick={handleManualInput}
                      className="px-6 py-3 bg-amber-600 text-white text-sm rounded-xl hover:bg-amber-700 transition font-medium shadow-sm"
                    >
                      Go
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleToday}
                    className="px-4 py-3 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 transition font-medium"
                  >
                    Today
                  </button>
                  <button
                    onClick={handleRandom}
                    className="px-4 py-3 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 transition font-medium"
                  >
                    Random
                  </button>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-red-600 text-center bg-red-50 rounded-xl p-3"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}