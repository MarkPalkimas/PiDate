'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dateToYYYYMMDD, validateDateString, getRandomDate } from '@/lib/dateUtils';

interface DatePickerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  onToggle: () => void;
}

export default function DatePickerPopup({
  isOpen,
  onClose,
  onDateSelect,
  onToggle,
}: DatePickerPopupProps) {
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
  };

  const handleManualInput = () => {
    const dateString = manualInput.trim();
    if (!validateDateString(dateString)) {
      setError('Invalid date format (use YYYYMMDD)');
      return;
    }
    const date = new Date(
      parseInt(dateString.substring(0, 4)),
      parseInt(dateString.substring(4, 6)) - 1,
      parseInt(dateString.substring(6, 8))
    );
    setError('');
    onDateSelect(date);
  };

  const handleToday = () => {
    onDateSelect(new Date());
  };

  const handleRandom = () => {
    onDateSelect(getRandomDate());
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        onClick={onToggle}
        className="fixed top-6 right-6 z-50 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-full shadow-lg border border-gray-200 transition-all hover:shadow-xl flex items-center gap-2 text-sm font-medium"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Pick a date
      </motion.button>

      {/* Popup panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="fixed top-20 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Find a date in π
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Select date
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateValue}
                      onChange={(e) => {
                        setDateValue(e.target.value);
                        setError('');
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <button
                      onClick={handleDatePicker}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Go
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Manual Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Enter YYYYMMDD
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(e) => {
                        setManualInput(e.target.value);
                        setError('');
                      }}
                      placeholder="20260314"
                      maxLength={8}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono"
                    />
                    <button
                      onClick={handleManualInput}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Go
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleToday}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    Today
                  </button>
                  <button
                    onClick={handleRandom}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    Random
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
