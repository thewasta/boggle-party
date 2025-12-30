import { readFileSync } from 'fs';
import { join } from 'path';

let dictionary: Set<string> | null = null;
let stats = { wordCount: 0, loadedAt: new Date() };

/**
 * Load Spanish dictionary into memory (singleton pattern)
 */
export async function getDictionary(): Promise<Set<string>> {
  if (dictionary) {
    return dictionary;
  }

  try {
    const dictionaryPath = join(process.cwd(), 'data', 'dictionary.json');
    const fileContent = readFileSync(dictionaryPath, 'utf-8');
    const words: string[] = JSON.parse(fileContent);

    // Store in Set for O(1) lookup
    dictionary = new Set(words.map((w) => w.toLowerCase()));

    stats = {
      wordCount: dictionary.size,
      loadedAt: new Date(),
    };

    console.log(`Dictionary loaded: ${stats.wordCount} words`);
    return dictionary;
  } catch (error) {
    console.error('Failed to load dictionary:', error);
    throw new Error('Dictionary file not found or invalid');
  }
}

/**
 * Check if a word is valid Spanish (case-insensitive)
 */
export function esValida(word: string): boolean {
  if (!dictionary) {
    throw new Error('Dictionary not loaded. Call getDictionary() first.');
  }

  if (!word || word.length < 3) {
    return false;
  }

  return dictionary.has(word.toLowerCase());
}

/**
 * Get dictionary statistics
 */
export function getDictionaryStats() {
  return {
    wordCount: stats.wordCount,
    loadedAt: stats.loadedAt,
    isLoaded: dictionary !== null,
  };
}

/**
 * Clear dictionary (for testing)
 */
export function clearDictionary(): void {
  dictionary = null;
  stats = { wordCount: 0, loadedAt: new Date() };
}
