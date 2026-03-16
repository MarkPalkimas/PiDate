'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Hero from '@/components/Hero';
import DateInput from '@/components/DateInput';
import ResultDisplay from '@/components/ResultDisplay';
import PiViewer from '@/components/PiViewer';
import { searchPiForDate } from '@/lib/piSearch';
import { parseYYYYMMDD } from '@/lib/dateUtils';

interface SearchState {
  dateString: string;
  date: Date;
  position: number;
  found: boolean;
  totalDigits: number;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [searchResult, setSearchResult] = useState<SearchState | null>(null);

  useEffect(() => {
    // Check for date parameter in URL
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const date = parseYYYYMMDD(dateParam);
      if (date) {
        handleSearch(dateParam, date);
      }
    }
  }, [searchParams]);

  const handleSearch = (dateString: string, date: Date) => {
    const result = searchPiForDate(dateString);
    
    setSearchResult({
      dateString,
      date,
      position: result.position,
      found: result.found,
      totalDigits: result.totalDigits,
    });

    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('date', dateString);
    window.history.pushState({}, '', url);

    // Scroll to viewer after a brief delay
    setTimeout(() => {
      const viewerElement = document.getElementById('pi-viewer');
      if (viewerElement) {
        viewerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <Hero />
        <DateInput onSearch={handleSearch} />
        
        {searchResult && (
          <>
            <ResultDisplay
              dateString={searchResult.dateString}
              date={searchResult.date}
              position={searchResult.position}
              found={searchResult.found}
              totalDigits={searchResult.totalDigits}
            />
            
            <div id="pi-viewer" className="scroll-mt-8">
              <PiViewer
                highlightStart={searchResult.found ? searchResult.position : undefined}
                highlightLength={8}
                scrollToPosition={searchResult.found ? searchResult.position : undefined}
              />
            </div>
          </>
        )}

        {!searchResult && (
          <div id="pi-viewer">
            <PiViewer />
          </div>
        )}

        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p className="mb-2">
            Built with Next.js, TypeScript, and Tailwind CSS
          </p>
          <p>
            Searching through {(10000).toLocaleString()}+ digits of π
          </p>
        </footer>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Hero />
          <div className="text-center text-gray-500">Loading...</div>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
