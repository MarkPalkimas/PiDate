import { format, isValid, parse } from 'date-fns';

export function dateToMMDDYYYY(date: Date): string {
  return format(date, 'MMddyyyy');
}

export function formatDateDisplay(date: Date): string {
  return format(date, 'MMMM d, yyyy');
}

export function validateDateString(dateString: string): boolean {
  if (!/^\d{8}$/.test(dateString)) {
    return false;
  }
  
  const month = parseInt(dateString.substring(0, 2));
  const day = parseInt(dateString.substring(2, 4));
  const year = parseInt(dateString.substring(4, 8));
  
  if (year < 1000 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  const date = new Date(year, month - 1, day);
  return isValid(date) && 
         date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
}

export function parseMMDDYYYY(dateString: string): Date | null {
  if (!validateDateString(dateString)) {
    return null;
  }
  
  const month = parseInt(dateString.substring(0, 2));
  const day = parseInt(dateString.substring(2, 4));
  const year = parseInt(dateString.substring(4, 8));
  
  return new Date(year, month - 1, day);
}

export function getRandomDate(): Date {
  const start = new Date(1900, 0, 1);
  const end = new Date(2099, 11, 31);
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime);
}
