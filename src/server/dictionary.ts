import { readFileSync } from 'fs';
import { join } from 'path';

let dictionary: Set<string> | null = null;
let stats = { wordCount: 0, loadedAt: new Date() };

export class TrieNode {
  children: Record<string, TrieNode> = {};
  isWord: boolean = false;
}

export function buildTrie(words: Iterable<string>): TrieNode {
  const root = new TrieNode();
  for (const word of words) {
    let node = root;
    for (const char of word.toUpperCase()) {
      if (!node.children[char]) node.children[char] = new TrieNode();
      node = node.children[char];
    }
    node.isWord = true;
  }
  return root;
}

let trieCache: TrieNode | null = null;

export async function getTrie(): Promise<TrieNode> {
  if (trieCache) return trieCache;
  
  const words = await getDictionary();
  trieCache = buildTrie(words);
  return trieCache;
}

/**
 * Load Spanish dictionary into memory (singleton pattern)
 */
export async function getDictionary(): Promise<Set<string>> {
  if (dictionary) {
    return dictionary;
  }

  try {
    const dictionaryPath = join(process.cwd(), 'data', 'dictionary_clean.json');
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
 * Auto-initializes dictionary if not loaded
 */
export async function esValida(word: string): Promise<boolean> {
  if (!word || word.length < 3) {
    return false;
  }

  const dict = dictionary || await getDictionary();
  return dict.has(word.toLowerCase());
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
