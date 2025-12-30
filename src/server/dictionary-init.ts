/**
 * Dictionary preloading
 * Ensures dictionary is loaded when server starts
 */

let initPromise: Promise<void> | null = null;

export async function ensureDictionaryLoaded(): Promise<void> {
  if (!initPromise) {
    const { getDictionary } = require('./dictionary');
    initPromise = getDictionary().then(() => {
      console.log('Dictionary preloaded successfully');
    }).catch((error: Error) => {
      console.error('Failed to preload dictionary:', error);
      throw error;
    });
  }
  return initPromise;
}

/**
 * Check if dictionary is loaded
 */
export function isDictionaryLoaded(): boolean {
  const { getDictionaryStats } = require('./dictionary');
  const stats = getDictionaryStats();
  return stats.isLoaded;
}
