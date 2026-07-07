import { loadCommonWords } from "@/server/board-generator";
import type { GridSize } from "@/server/db/schema";
import { getTrie } from "@/server/dictionary";
import { solveBoard } from "@/server/solver";
import {
  PREDEFINED_BOARDS_4X4,
  PREDEFINED_BOARDS_5X5,
  PREDEFINED_BOARDS_6X6,
} from "./predefined-boards-data";

// ── Types ──────────────────────────────────────────────────

export interface PredefinedBoardResult {
  board: string[][];
  allWords: string[];
  commonWordCount: number;
}

// ── State ──────────────────────────────────────────────────

const cache: Map<GridSize, PredefinedBoardResult[]> = new Map();
let available = false;

// ── Initialization ─────────────────────────────────────────

const BOARDS_BY_SIZE: Record<GridSize, string[][][]> = {
  4: PREDEFINED_BOARDS_4X4,
  5: PREDEFINED_BOARDS_5X5,
  6: PREDEFINED_BOARDS_6X6,
};

export async function initPredefinedBoards(): Promise<void> {
  try {
    const trieRoot = await getTrie();
    const commonWords = loadCommonWords();

    for (const size of [4, 5, 6] as GridSize[]) {
      const boards = BOARDS_BY_SIZE[size];
      const results: PredefinedBoardResult[] = [];

      for (const board of boards) {
        const solved = solveBoard(board, trieRoot);
        const commonCount = solved.words.filter((w) =>
          commonWords.has(w),
        ).length;
        results.push({
          board,
          allWords: solved.words,
          commonWordCount: commonCount,
        });
      }

      cache.set(size, results);
      const totalWords = results.reduce((sum, r) => sum + r.allWords.length, 0);
      console.log(
        `[predefined-boards] ${size}×${size}: ${results.length} tableros cargados ` +
          `(${totalWords} palabras totales)`,
      );
    }

    available = true;
  } catch (error) {
    console.warn(
      "[predefined-boards] Error al inicializar tableros predefinidos:",
      error,
    );
    console.warn("[predefined-boards] Degradando a generación 100% aleatoria.");
    available = false;
  }
}

// ── Public API ─────────────────────────────────────────────

export function arePredefinedBoardsAvailable(): boolean {
  return available;
}

export function getPredefinedBoard(gridSize: GridSize): PredefinedBoardResult {
  const boards = cache.get(gridSize);
  if (!boards || boards.length === 0) {
    throw new Error(`No predefined boards available for grid size ${gridSize}`);
  }
  const index = Math.floor(Math.random() * boards.length);
  return boards[index];
}
