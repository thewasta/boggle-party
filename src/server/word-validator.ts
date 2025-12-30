/**
 * Calculate score based on word length
 * - 3-4 letters: 1 point
 * - 5 letters: 2 points
 * - 6 letters: 3 points
 * - 7+ letters: 5 points
 */
export function calculateScore(word: string): number {
  const length = word.length;

  if (length < 3) {
    return 0;
  }

  if (length <= 4) {
    return 1;
  }

  if (length === 5) {
    return 2;
  }

  if (length === 6) {
    return 3;
  }

  return 5; // 7+ letters
}
