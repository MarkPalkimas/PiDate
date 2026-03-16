import { PI_DIGITS } from './piDigits';

export interface SearchResult {
  found: boolean;
  position: number;
  dateString: string;
  totalDigits: number;
}

export async function searchPiForDate(dateString: string): Promise<SearchResult> {
  // First, search in local 1M digits
  const localPosition = PI_DIGITS.indexOf(dateString);
  
  if (localPosition !== -1) {
    return {
      found: true,
      position: localPosition,
      dateString,
      totalDigits: PI_DIGITS.length,
    };
  }

  // If not found locally, search using Pi API (up to 200M digits)
  try {
    const response = await fetch(
      `https://api.pi.delivery/v1/pi?start=0&numberOfDigits=200000000&radix=10`
    );
    
    if (response.ok) {
      const data = await response.json();
      const piDigits = data.content;
      const position = piDigits.indexOf(dateString);
      
      return {
        found: position !== -1,
        position: position,
        dateString,
        totalDigits: piDigits.length,
      };
    }
  } catch (error) {
    console.error('API search failed:', error);
  }

  // If API fails, return not found
  return {
    found: false,
    position: -1,
    dateString,
    totalDigits: PI_DIGITS.length,
  };
}

export function formatPosition(position: number): string {
  return new Intl.NumberFormat('en-US').format(position);
}

export function getPiDigitAt(index: number): string {
  return PI_DIGITS[index] || '';
}

export function getPiDigitsRange(start: number, length: number): string {
  return PI_DIGITS.substring(start, start + length);
}
