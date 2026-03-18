'use client';

import { useState, useEffect } from 'react';

interface SearchResult {
  found: boolean;
  dateString: string;
  startDigit?: number;
  endDigit?: number;
  surroundingDigits?: string;
  highlightStart?: number;
  highlightLength?: number;
}

export default function Home() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Format date as YYYYMMDD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  // Search for date in pi
  const searchDate = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search-pi?date=${dateStr}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with today's date
  useEffect(() => {
    const today = formatDate(new Date());
    searchDate(today);
  }, []);

  // Handle date picker change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value.replace(/-/g, '');
    searchDate(dateStr);
  };

  // Render pi digits with highlighting
  const renderPiDigits = () => {
    if (!result?.found || !result.surroundingDigits) return null;

    const { surroundingDigits, highlightStart = 0, highlightLength = 8 } = result;
    const before = surroundingDigits.substring(0, highlightStart);
    const highlighted = surroundingDigits.substring(highlightStart, highlightStart + highlightLength);
    const after = surroundingDigits.substring(highlightStart + highlightLength);

    return (
      <div className="font-mono text-base text-gray-700 leading-relaxed">
        <span className="text-gray-400">...</span>
        {before}
        <span className="bg-amber-100 text-amber-900 font-semibold px-0.5">
          {highlighted}
        </span>
        {after}
        <span className="text-gray-400">...</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        
        {isLoading ? (
          <div className="text-center py-12 space-y-4">
            <div className="inline-block animate-spin w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full"></div>
            <p className="text-sm text-gray-600">Searching 1 billion digits of π...</p>
            <p className="text-xs text-gray-400">This may take a moment</p>
          </div>
        ) : result?.found ? (
          <>
            {/* Result Text */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-mono font-semibold">{result.dateString}</span>
                {' '}appears at digits{' '}
                <span className="font-mono font-semibold">{result.startDigit?.toLocaleString()}</span>
                –
                <span className="font-mono font-semibold">{result.endDigit?.toLocaleString()}</span>
                {' '}of π
              </p>
            </div>

            {/* Pi Digits Display */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {renderPiDigits()}
            </div>
          </>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-mono font-semibold">{result?.dateString}</span>
              {' '}not found in the first 1 billion digits of π
            </p>
            <p className="text-xs text-gray-400">Try another date</p>
          </div>
        )}

        {/* Date Picker */}
        <div className="text-center">
          <label className="inline-flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500">Pick a date</span>
            <input
              type="date"
              onChange={handleDateChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              min="1000-01-01"
              max="9999-12-31"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
