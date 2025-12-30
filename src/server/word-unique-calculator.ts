export interface FoundWordData {
  playerId: string;
  playerName: string;
  word: string;
  score: number;
}

export interface RevealWordData extends FoundWordData {
  isUnique: boolean;
}

/**
 * Analyzes all found words and marks unique words (found by only one player)
 * Unique words get ×2 bonus in scoring
 */
export function calculateUniqueWords(foundWords: FoundWordData[]): RevealWordData[] {
  const wordCounts = new Map<string, number>();

  foundWords.forEach(({ word }) => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });

  return foundWords.map(word => ({
    ...word,
    isUnique: wordCounts.get(word.word) === 1,
  }));
}

/**
 * Sorts words for dramatic reveal sequence
 * Higher scoring words revealed first for more impact
 */
export function prepareRevealSequence(words: RevealWordData[]): RevealWordData[] {
  return [...words].sort((a, b) => {
    return b.score - a.score;
  });
}
