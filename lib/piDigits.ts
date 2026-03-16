// Using pi-digits package which provides 1 million digits of Pi
const piDigitsModule = require('pi-digits');

// Get all available digits (up to 1 million) and join into a string
export const PI_DIGITS: string = piDigitsModule.digits.join('');

export function getPiDigitsCount(): number {
  return PI_DIGITS.length;
}

// Note: To expand the dataset, you can:
// 1. Download Pi digits from sources like:
//    - https://stuff.mit.edu/afs/sipb/contrib/pi/
//    - http://www.angio.net/pi/digits.html
// 2. Load from a file or API endpoint
// 3. Use chunked loading for very large datasets
