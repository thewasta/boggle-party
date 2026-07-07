import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { GridSize } from "./db/schema";
import { getTrie } from "./dictionary";
import { type SolveResult, solveBoard } from "./solver";

export interface BoardStats {
  totalCells: number;
  uniqueLetters: number;
  letterCounts: Record<string, number>;
  mostFrequent: string;
}

// Dados para 4x4 (16 dados)
export const SPANISH_BOGGLE_DICE_4x4 = [
  ["A", "E", "O", "I", "U", "N"],
  ["R", "L", "S", "T", "D", "N"],
  ["A", "B", "C", "D", "E", "L"],
  ["E", "I", "O", "S", "T", "R"],
  ["A", "M", "O", "R", "S", "E"],
  ["P", "A", "R", "T", "E", "S"],
  ["C", "O", "N", "T", "R", "A"],
  ["D", "E", "L", "M", "N", "O"],
  ["E", "S", "T", "A", "R", "L"],
  ["I", "N", "O", "S", "T", "V"],
  ["L", "A", "S", "E", "R", "I"],
  ["M", "E", "N", "T", "O", "S"],
  ["QU", "E", "I", "A", "O", "U"],
  ["R", "A", "S", "E", "I", "O"],
  ["T", "I", "E", "N", "D", "A"],
  ["V", "E", "R", "D", "A", "O"],
];

// Dados para 5x5 (25 dados)
export const SPANISH_BOGGLE_DICE_5x5 = [
  ["A", "E", "O", "I", "U", "N"],
  ["R", "L", "S", "T", "D", "N"],
  ["A", "B", "C", "D", "E", "L"],
  ["E", "I", "O", "S", "T", "R"],
  ["A", "M", "O", "R", "S", "E"],
  ["P", "A", "R", "T", "E", "S"],
  ["C", "O", "N", "T", "R", "A"],
  ["D", "E", "L", "M", "N", "O"],
  ["E", "S", "T", "A", "R", "L"],
  ["I", "N", "O", "S", "T", "V"],
  ["L", "A", "S", "E", "R", "I"],
  ["M", "E", "N", "T", "O", "S"],
  ["A", "D", "O", "R", "E", "S"],
  ["Ñ", "O", "A", "E", "I", "U"],
  ["P", "U", "E", "D", "O", "S"],
  ["QU", "E", "I", "A", "O", "U"],
  ["R", "A", "S", "E", "I", "O"],
  ["S", "A", "L", "T", "E", "R"],
  ["T", "I", "E", "N", "D", "A"],
  ["V", "E", "R", "D", "A", "O"],
  ["A", "G", "O", "U", "H", "I"],
  ["B", "I", "E", "N", "O", "A"],
  ["C", "A", "S", "O", "I", "E"],
  ["F", "U", "E", "R", "A", "O"],
  ["G", "A", "T", "O", "S", "E"],
];

// Dados para 6x6 (36 dados)
export const SPANISH_BOGGLE_DICE_6x6 = [
  ["A", "E", "O", "I", "U", "N"],
  ["R", "L", "S", "T", "D", "N"],
  ["A", "B", "C", "D", "E", "L"],
  ["E", "I", "O", "S", "T", "R"],
  ["A", "M", "O", "R", "S", "E"],
  ["P", "A", "R", "T", "E", "S"],
  ["C", "O", "N", "T", "R", "A"],
  ["D", "E", "L", "M", "N", "O"],
  ["E", "S", "T", "A", "R", "L"],
  ["I", "N", "O", "S", "T", "V"],
  ["L", "A", "S", "E", "R", "I"],
  ["M", "E", "N", "T", "O", "S"],
  ["A", "D", "O", "R", "E", "S"],
  ["Ñ", "O", "A", "E", "I", "U"],
  ["P", "U", "E", "D", "O", "S"],
  ["QU", "E", "I", "A", "O", "U"],
  ["R", "A", "S", "E", "I", "O"],
  ["S", "A", "L", "T", "E", "R"],
  ["T", "I", "E", "N", "D", "A"],
  ["V", "E", "R", "D", "A", "O"],
  ["A", "G", "O", "U", "H", "I"],
  ["B", "I", "E", "N", "O", "A"],
  ["C", "A", "S", "O", "I", "E"],
  ["F", "U", "E", "R", "A", "O"],
  ["G", "A", "T", "O", "S", "E"],
  ["H", "U", "E", "V", "O", "S"],
  ["B", "R", "A", "Z", "O", "S"],
  ["P", "L", "A", "N", "A", "S"],
  ["F", "I", "E", "S", "T", "A"],
  ["G", "L", "O", "B", "O", "S"],
  ["C", "H", "I", "C", "O", "S"],
  ["M", "U", "C", "H", "O", "S"],
  ["X", "E", "N", "O", "N", "A"], // Una X para dar juego
  ["K", "I", "L", "O", "S", "A"], // Una K
  ["Y", "O", "G", "U", "R", "T"],
  ["Z", "O", "R", "R", "O", "S"],
];

/**
 * Load the common words whitelist for board quality validation.
 * Uses a singleton cache to avoid repeated file reads.
 */
let commonWordsCache: Set<string> | null = null;

export function loadCommonWords(): Set<string> {
  if (commonWordsCache) return commonWordsCache;
  try {
    const path = join(process.cwd(), "data", "common_words.json");
    const words: string[] = JSON.parse(readFileSync(path, "utf-8"));
    commonWordsCache = new Set(words.map((w) => w.toUpperCase()));
    return commonWordsCache;
  } catch {
    console.warn(
      "common_words.json not found, common word validation disabled",
    );
    return new Set();
  }
}

/**
 * Generate a random Boggle board with Spanish letter frequencies
 */
export function generateBoard(gridSize: GridSize): string[][] {
  const board: string[][] = [];
  let diceSet: string[][];
  switch (gridSize) {
    case 4:
      diceSet = SPANISH_BOGGLE_DICE_4x4;
      break;
    case 5:
      diceSet = SPANISH_BOGGLE_DICE_5x5;
      break;
    case 6:
      diceSet = SPANISH_BOGGLE_DICE_6x6;
      break;
    default:
      throw new Error(`Unsupported grid size: ${gridSize}`);
  }
  const shuffledDice = [...diceSet];
  for (let i = shuffledDice.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledDice[i], shuffledDice[j]] = [shuffledDice[j], shuffledDice[i]];
  }
  let diceIndex = 0;
  for (let row = 0; row < gridSize; row++) {
    const boardRow: string[] = [];
    for (let col = 0; col < gridSize; col++) {
      // Escoger una cara aleatoria del dado actual
      const die = shuffledDice[diceIndex];
      const randomFace = die[Math.floor(Math.random() * die.length)];
      boardRow.push(randomFace);
      diceIndex++;
    }
    board.push(boardRow);
  }
  return board;
}

export async function generateGoodBoard(gridSize: GridSize) {
  const trieRoot = await getTrie();
  const commonWords = loadCommonWords();

  let board: string[][] = undefined as unknown as string[][];
  let results: SolveResult = { words: [], maxLen: 0 };
  let attempts = 0;
  let bestCommonCount = 0;
  let bestBoard: string[][] = undefined as unknown as string[][];
  let bestResults: SolveResult = { words: [], maxLen: 0 };

  const thresholds = {
    4: { minWords: 15, minCommon: 6, minLen: 5 },
    5: { minWords: 30, minCommon: 12, minLen: 7 },
    6: { minWords: 50, minCommon: 20, minLen: 8 },
  };
  const currentThreshold =
    gridSize in thresholds
      ? { ...thresholds[gridSize as keyof typeof thresholds] }
      : { ...thresholds[4] };

  do {
    board = generateBoard(gridSize);
    results = solveBoard(board, trieRoot);
    attempts++;

    const commonCount =
      commonWords.size > 0
        ? results.words.filter((w) => commonWords.has(w)).length
        : 0;

    // Track best board as fallback
    if (commonCount > bestCommonCount) {
      bestCommonCount = commonCount;
      bestBoard = board;
      bestResults = results;
    }

    const totalOk = results.words.length >= currentThreshold.minWords;
    const commonOk =
      commonWords.size === 0 || commonCount >= currentThreshold.minCommon;
    const lenOk = results.maxLen >= currentThreshold.minLen;

    if (totalOk && commonOk && lenOk) {
      console.log(
        `Tablero ${gridSize}x${gridSize} generado en ${attempts} intentos ` +
          `(${commonCount} palabras comunes de ${results.words.length} totales).`,
      );
      return { board, allWords: results.words, commonWordCount: commonCount };
    }

    if (attempts === 50) {
      currentThreshold.minWords = Math.floor(currentThreshold.minWords * 0.7);
      currentThreshold.minCommon = Math.max(
        3,
        Math.floor(currentThreshold.minCommon * 0.7),
      );
    }
  } while (attempts < 100);

  // Fallback: return best board found
  console.log(
    `Tablero ${gridSize}x${gridSize} generado en ${attempts} intentos (fallback) ` +
      `(${bestCommonCount} palabras comunes de ${bestResults.words.length} totales).`,
  );
  return {
    board: bestBoard || board,
    allWords: bestResults.words,
    commonWordCount: bestCommonCount,
  };
}

/**
 * Get statistics about a board
 */
export function getBoardStats(board: string[][]): BoardStats {
  const letterCounts: Record<string, number> = {};
  let totalCells = 0;

  for (const row of board) {
    for (const letter of row) {
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;
      totalCells++;
    }
  }

  const uniqueLetters = Object.keys(letterCounts).length;
  const mostFrequent = Object.entries(letterCounts).sort(
    (a, b) => b[1] - a[1],
  )[0][0];

  return {
    totalCells,
    uniqueLetters,
    letterCounts,
    mostFrequent,
  };
}

/**
 * Validate board structure
 */
export function isValidBoard(board: string[][]): boolean {
  if (!board || board.length === 0) return false;

  const size = board.length;

  for (const row of board) {
    if (!row || row.length !== size) return false;

    for (const cell of row) {
      if (!cell || !/^(QU|[A-ZÑ])$/i.test(cell)) {
        return false;
      }
    }
  }

  return true;
}
