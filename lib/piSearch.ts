import { PI_DIGITS } from './piDigits';

export interface SearchResult {
  found: boolean;
  position: number;
  dateString: string;
  totalDigits: number;
}

export function searchPiForDate(dateString: string): SearchResult {
  const position = PI_DIGITS.indexOf(dateString);
  
  return {
    found: position !== -1,
    position: position,
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
