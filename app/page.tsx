'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ContinuousPiViewer from '@/components/ContinuousPiViewer';
import DatePickerPopup from '@/components/DatePickerPopup';
import { searchPiForDate } from '@/lib/piSearch';
import { dateToYYYYMMDD, parseYYYYMMDD, formatDateDisplay } from '@/lib/dateUtils';

interface HighlightState {
  dateString: string;
  displayDate: string;
  position: number;
  found: boolean;
  totalDigits: number;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [highlight, setHighlight] = useState<HighlightState | null>(null);
  const [scrollToPosition, setScrollToPosition] = useState<number | undefined>(undefined);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    // Check for date parameter in URL, otherwise use today
    const dateParam = searchParams.get('date');
    let targetDate: Date;
    let dateString: string;

    if (dateParam) {
      const parsed = parseYYYYMMDD(dateParam);
      if (parsed) {
        targetDate = parsed;
        dateString = dateParam;
      } else {
        targetDate = new Date();
        dateString = dateToYYYYMMDD(targetDate);
      }
    } else {
      targetDate = new Date();
      dateString = dateToYYYYMMDD(targetDate);
    }

    // Search for the date
    const result = searchPiForDate(dateString);
    
    setHighlight({
      dateString,
      displayDate: formatDateDisplay(targetDate),
      position: result.position,
      found: result.found,
      totalDigits: result.totalDigits,
    });

    // Trigger scroll after a brief delay to allow rendering
    setTimeout(() => {
      if (result.found) {
        setScrollToPosition(result.position);
      }
    }, 100);

    // Update URL if not already set
    if (!dateParam) {
      const url = new URL(window.location.href);
      url.searchParams.set('date', dateString);
      window.history.replaceState({}, '', url);
    }
  }, [searchParams]);

  const handleDateSelect = (date: Date) => {
    const dateString = dateToYYYYMMDD(date);
    const result = searchPiForDate(dateString);
    
    setHighlight({
      dateString,
      displayDate: formatDateDisplay(date),
      position: result.position,
      found: result.found,
      totalDigits: result.totalDigits,
    });

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('date', dateString);
    window.history.pushState({}, '', url);

    // Trigger scroll
    if (result.found) {
      setScrollToPosition(result.position);
    }

    setIsPopupOpen(false);
  };

  return (
    <>
      <ContinuousPiViewer
        highlightStart={highlight?.found ? highlight.position : undefined}
        highlightLength={8}
        scrollToPosition={scrollToPosition}
        highlightInfo={highlight}
      />
      
      <DatePickerPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onDateSelect={handleDateSelect}
        onToggle={() => setIsPopupOpen(!isPopupOpen)}
      />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading π...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
