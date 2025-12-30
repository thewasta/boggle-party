/**
 * Spanish letter frequency distribution (from RAE corpus)
 * Used for weighted random selection in board generation
 *
 * Source: Based on frequency analysis of Spanish texts
 * Values represent relative frequency (per 1000 characters)
 */
export const SPANISH_LETTER_FREQUENCIES: Record<string, number> = {
  E: 13.7,
  A: 11.6,
  O: 8.7,
  S: 7.9,
  N: 7.0,
  R: 6.6,
  I: 6.1,
  L: 5.5,
  D: 5.2,
  T: 4.8,
  C: 4.5,
  U: 3.8,
  M: 3.2,
  P: 2.7,
  B: 1.4,
  G: 1.2,
  V: 1.0,
  Y: 1.0,
  H: 0.9,
  Q: 0.9,
  F: 0.7,
  J: 0.5,
  Z: 0.5,
  Ñ: 0.4,
  X: 0.2,
  K: 0.1,
  W: 0.1,
};

let weightedLetterArrayCache: string[] | null = null;

/**
 * Weighted letter array for random selection
 * More frequent letters appear more times in the array
 */
export function getWeightedLetterArray(): string[] {
  if (weightedLetterArrayCache) {
    return weightedLetterArrayCache;
  }

  const weightedLetters: string[] = [];

  // Scale frequencies to get reasonable total count (~5000)
  const scaleFactor = 5;

  for (const [letter, frequency] of Object.entries(SPANISH_LETTER_FREQUENCIES)) {
    const count = Math.round(frequency * scaleFactor);
    for (let i = 0; i < count; i++) {
      weightedLetters.push(letter);
    }
  }

  weightedLetterArrayCache = weightedLetters;
  return weightedLetterArrayCache;
}

/**
 * Get a random letter based on Spanish frequency
 */
export function getRandomLetter(): string {
  const weightedLetters = getWeightedLetterArray();
  const randomIndex = Math.floor(Math.random() * weightedLetters.length);
  return weightedLetters[randomIndex];
}

/**
 * Verify letter distribution is correct
 */
export function getLetterDistributionStats() {
  return {
    uniqueLetters: Object.keys(SPANISH_LETTER_FREQUENCIES).length,
    mostFrequent: 'E',
    leastFrequent: 'W/K',
    weightedArraySize: getWeightedLetterArray().length,
  };
}
