'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { dateToYYYYMMDD, getRandomDate, validateDateString } from '@/lib/dateUtils';

interface DateInputProps {
  onSearch: (dateString: string, date: Date) => void;
}

export default function DateInput({ onSearch }: DateInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [datePickerValue, setDatePickerValue] = useState('');

  const handleSearch = (dateString: string, date: Date) => {
    if (!validateDateString(dateString)) {
      setError('Please enter a valid date in YYYYMMDD format');
      return;
    }
    setError('');
    onSearch(dateString, date);
  };

  const handleManualInput = () => {
    const dateString = inputValue.trim();
    const date = new Date(
      parseInt(dateString.substring(0, 4)),
      parseInt(dateString.substring(4, 6)) - 1,
      parseInt(dateString.substring(6, 8))
    );
    handleSearch(dateString, date);
  };

  const handleDatePicker = () => {
    if (!datePickerValue) {
      setError('Please select a date');
      return;
    }
    const date = new Date(datePickerValue);
    const dateString = dateToYYYYMMDD(date);
    handleSearch(dateString, date);
  };

  const handleToday = () => {
    const today = new Date();
    const dateString = dateToYYYYMMDD(today);
    setInputValue(dateString);
    handleSearch(dateString, today);
  };

  const handleRandom = () => {
    const randomDate = getRandomDate();
    const dateString = dateToYYYYMMDD(randomDate);
    setInputValue(dateString);
    handleSearch(dateString, randomDate);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="max-w-2xl mx-auto mb-12"
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="space-y-6">
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a date
            </label>
            <div className="flex gap-3">
              <input
                type="date"
                value={datePickerValue}
                onChange={(e) => setDatePickerValue(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              <button
                onClick={handleDatePicker}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Search
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Manual Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter date as YYYYMMDD
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError('');
                }}
                placeholder="20260314"
                maxLength={8}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono"
              />
              <button
                onClick={handleManualInput}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Search
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleToday}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Today
            </button>
            <button
              onClick={handleRandom}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Random Date
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-600 text-sm text-center"
            >
              {error}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
