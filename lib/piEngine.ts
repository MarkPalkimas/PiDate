// Production Pi Engine - handles 1 billion digits efficiently with streaming chunks

export interface DateSearchResult {
  found: boolean;
  position: number;
  dateString: string;
  totalDigits: number;
}

interface PiChunk {
  start: number;
  end: number;
  data: string;
  loaded: boolean;
}

class PiEngine {
  private chunks: Map<number, PiChunk> = new Map();
  private readonly CHUNK_SIZE = 5_000_000; // 5MB chunks for efficient loading
  private readonly TOTAL_DIGITS = 100_000_000; // 100 million digits for deployment
  private readonly SEARCH_CHUNK_SIZE = 10_000_000; // 10MB chunks for searching
  private loadingPromises: Map<number, Promise<string>> = new Map();

  // Get the chunk index for a given position
  private getChunkIndex(position: number): number {
    return Math.floor(position / this.CHUNK_SIZE);
  }

  // Load a specific chunk from the pi file
  private async loadChunk(chunkIndex: number): Promise<string> {
    if (this.loadingPromises.has(chunkIndex)) {
      return this.loadingPromises.get(chunkIndex)!;
    }

    const loadPromise = this.fetchChunk(chunkIndex);
    this.loadingPromises.set(chunkIndex, loadPromise);
    
    try {
      const data = await loadPromise;
      this.chunks.set(chunkIndex, {
        start: chunkIndex * this.CHUNK_SIZE,
        end: (chunkIndex + 1) * this.CHUNK_SIZE,
        data,
        loaded: true
      });
      return data;
    } finally {
      this.loadingPromises.delete(chunkIndex);
    }
  }

  private async fetchChunk(chunkIndex: number): Promise<string> {
    const start = chunkIndex * this.CHUNK_SIZE;
    const end = Math.min(start + this.CHUNK_SIZE, this.TOTAL_DIGITS + 2); // +2 for "3."
    
    try {
      const response = await fetch('/pi-100m.txt', {
        headers: {
          'Range': `bytes=${start === 0 ? 0 : start + 2}-${end + 1}` // Skip "3." for non-first chunks
        }
      });

      if (!response.ok && response.status !== 206) {
        throw new Error(`Failed to load chunk ${chunkIndex}: ${response.status}`);
      }

      let text = await response.text();
      
      // Clean up the chunk
      if (chunkIndex === 0) {
        // First chunk: remove "3."
        text = text.replace(/^3\./, '');
      }
      
      // Remove any whitespace
      text = text.replace(/\s/g, '');
      
      console.log(`Loaded chunk ${chunkIndex}: ${text.length.toLocaleString()} digits`);
      return text;
    } catch (error) {
      console.error(`Failed to load chunk ${chunkIndex}:`, error);
      throw error;
    }
  }

  // Search for a date across multiple chunks if needed
  async searchForDate(dateString: string): Promise<DateSearchResult> {
    try {
      console.log(`Searching for ${dateString} in π...`);
      
      // Search in larger chunks for efficiency
      const searchChunkSize = this.SEARCH_CHUNK_SIZE;
      const totalSearchChunks = Math.ceil(this.TOTAL_DIGITS / searchChunkSize);
      
      for (let i = 0; i < totalSearchChunks; i++) {
        const start = i * searchChunkSize;
        const end = Math.min(start + searchChunkSize + 8, this.TOTAL_DIGITS); // +8 for overlap
        
        console.log(`Searching chunk ${i + 1}/${totalSearchChunks} (positions ${start.toLocaleString()}-${end.toLocaleString()})`);
        
        try {
          const response = await fetch('/pi-100m.txt', {
            headers: {
              'Range': `bytes=${start === 0 ? 0 : start + 2}-${end + 1}`
            }
          });

          if (!response.ok && response.status !== 206) {
            console.warn(`Failed to load search chunk ${i}: ${response.status}`);
            continue;
          }

          let chunkData = await response.text();
          
          if (i === 0) {
            chunkData = chunkData.replace(/^3\./, '');
          }
          chunkData = chunkData.replace(/\s/g, '');
          
          const position = chunkData.indexOf(dateString);
          if (position !== -1) {
            const globalPosition = start + position;
            console.log(`Found ${dateString} at position ${globalPosition.toLocaleString()}`);
            
            return {
              found: true,
              position: globalPosition,
              dateString,
              totalDigits: this.TOTAL_DIGITS,
            };
          }
        } catch (error) {
          console.warn(`Error searching chunk ${i}:`, error);
          continue;
        }
      }
      
      console.log(`${dateString} not found in π`);
      return {
        found: false,
        position: -1,
        dateString,
        totalDigits: this.TOTAL_DIGITS,
      };
    } catch (error) {
      console.error('Search failed:', error);
      return {
        found: false,
        position: -1,
        dateString,
        totalDigits: this.TOTAL_DIGITS,
      };
    }
  }

  // Get a segment of pi digits for display
  async getPiSegment(start: number, length: number): Promise<string> {
    const end = start + length;
    const startChunk = this.getChunkIndex(start);
    const endChunk = this.getChunkIndex(end - 1);
    
    let result = '';
    
    for (let chunkIndex = startChunk; chunkIndex <= endChunk; chunkIndex++) {
      let chunkData: string;
      
      // Check if chunk is already loaded
      const existingChunk = this.chunks.get(chunkIndex);
      if (existingChunk && existingChunk.loaded) {
        chunkData = existingChunk.data;
      } else {
        chunkData = await this.loadChunk(chunkIndex);
      }
      
      // Calculate the portion of this chunk we need
      const chunkStart = chunkIndex * this.CHUNK_SIZE;
      const chunkEnd = chunkStart + chunkData.length;
      
      const segmentStart = Math.max(0, start - chunkStart);
      const segmentEnd = Math.min(chunkData.length, end - chunkStart);
      
      if (segmentStart < segmentEnd) {
        result += chunkData.substring(segmentStart, segmentEnd);
      }
    }
    
    return result;
  }

  async getTotalDigits(): Promise<number> {
    return this.TOTAL_DIGITS;
  }

  // Preload chunks around a position for smooth scrolling
  async preloadAroundPosition(position: number, radius: number = 2): Promise<void> {
    const centerChunk = this.getChunkIndex(position);
    const promises: Promise<string>[] = [];
    
    for (let i = Math.max(0, centerChunk - radius); i <= centerChunk + radius; i++) {
      if (!this.chunks.has(i) || !this.chunks.get(i)!.loaded) {
        promises.push(this.loadChunk(i));
      }
    }
    
    if (promises.length > 0) {
      console.log(`Preloading ${promises.length} chunks around position ${position.toLocaleString()}`);
      await Promise.all(promises);
    }
  }

  // Clear old chunks to manage memory
  clearDistantChunks(currentPosition: number, keepRadius: number = 5): void {
    const currentChunk = this.getChunkIndex(currentPosition);
    const chunksToRemove: number[] = [];
    
    for (const [chunkIndex] of this.chunks) {
      if (Math.abs(chunkIndex - currentChunk) > keepRadius) {
        chunksToRemove.push(chunkIndex);
      }
    }
    
    chunksToRemove.forEach(chunkIndex => {
      this.chunks.delete(chunkIndex);
    });
    
    if (chunksToRemove.length > 0) {
      console.log(`Cleared ${chunksToRemove.length} distant chunks`);
    }
  }
}

// Singleton instance
export const piEngine = new PiEngine();

// Utility functions
export function formatPosition(position: number): string {
  return new Intl.NumberFormat('en-US').format(position + 1); // +1 for 1-indexed display
}

export function formatDigitRange(start: number, length: number): string {
  const startPos = start + 1; // 1-indexed
  const endPos = start + length;
  return `${formatPosition(start)}–${formatPosition(endPos - 1)}`;
}