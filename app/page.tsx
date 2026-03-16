'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PiViewer from '@/components/PiViewer';
import DateControl from '@/components/DateControl';
import DateIndicator from '@/components/DateIndicator';
import { piAPI } from '@/lib/piAPI';
import { parseMMDDYYYY, formatDateDisplay } from '@/lib/dateUtils';

interface DateResult {
  dateString: string;
  displayDate: string;
  position: number;
  found: boolean;
  context?: string;
  source: string;
}

function PidateApp() {
  const searchParams = useSearchParams();
  const [dateResult, setDateResult] = useState<DateResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      setIsInitialLoad(true);
      
      // Get date from URL or use today
      const dateParam = searchParams.get('date');
      let targetDate: Date;
      let dateString: string;

      if (dateParam && parseMMDDYYYY(dateParam)) {
        targetDate = parseMMDDYYYY(dateParam)!;
        dateString = dateParam;
        
        // Search for the specific date
        setIsSearching(true);
        try {
          const result = await piAPI.searchDate(dateString);
          setDateResult({
            dateString,
            displayDate: formatDateDisplay(targetDate),
            position: result.position,
            found: result.found,
            context: result.context,
            source: result.source,
          });
        } catch (error) {
          console.error('Failed to search for date:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        // Get today's date instantly (pre-computed)
        try {
          const todayResult = await piAPI.getTodaysPosition();
          const today = new Date();
          
          setDateResult({
            dateString: todayResult.dateString,
            displayDate: formatDateDisplay(today),
            position: todayResult.position,
            found: todayResult.found,
            context: todayResult.context,
            source: todayResult.source,
          });

          // Update URL if needed
          if (!dateParam) {
            const url = new URL(window.location.href);
            url.searchParams.set('date', todayResult.dateString);
            window.history.replaceState({}, '', url);
          }
        } catch (error) {
          console.error('Failed to get today\'s position:', error);
        }
      }
      
      setIsInitialLoad(false);
    };

    initializeApp();
  }, [searchParams]);

  const handleDateSelect = async (date: Date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const dateString = month + day + year;
    
    setIsSearching(true);

    try {
      const result = await piAPI.searchDate(dateString);
      
      setDateResult({
        dateString,
        displayDate: formatDateDisplay(date),
        position: result.position,
        found: result.found,
        context: result.context,
        source: result.source,
      });

      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('date', dateString);
      window.history.pushState({}, '', url);
    } catch (error) {
      console.error('Failed to search for date:', error);
    } finally {
      setIsSearching(false);
    }
  };

  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-2 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Finding today's date in π...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PiViewer
        targetPosition={dateResult?.found ? dateResult.position : undefined}
        highlightStart={dateResult?.found ? dateResult.position : undefined}
        highlightLength={8}
        dateResult={dateResult}
      />
      
      <DateControl onDateSelect={handleDateSelect} />
      
      {dateResult && !isSearching && (
        <DateIndicator
          dateString={dateResult.dateString}
          displayDate={dateResult.displayDate}
          position={dateResult.position}
          found={dateResult.found}
          source={dateResult.source}
          context={dateResult.context}
        />
      )}

      {isSearching && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 px-8 py-6">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Searching through π...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-2 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Pidate...</p>
        </div>
      </div>
    }>
      <PidateApp />
    </Suspense>
  );
}
