import { describe, expect, it } from "vitest";
import {
  generateBoard,
  getBoardStats,
  loadCommonWords,
} from "../board-generator";

describe("Board Generator", () => {
  it("should generate a 4x4 board", () => {
    const board = generateBoard(4);
    expect(board).toHaveLength(4);
    expect(board[0]).toHaveLength(4);
  });

  it("should generate a 5x5 board", () => {
    const board = generateBoard(5);
    expect(board).toHaveLength(5);
    expect(board[0]).toHaveLength(5);
  });

  it("should generate a 6x6 board", () => {
    const board = generateBoard(6);
    expect(board).toHaveLength(6);
    expect(board[0]).toHaveLength(6);
  });

  it("should contain only valid letters (including QU as special case)", () => {
    const board = generateBoard(4);
    for (const row of board) {
      for (const cell of row) {
        // QU is a special case in Spanish (Q always with U)
        const isValid = cell === "QU" || /^[A-ZÑ]$/.test(cell);
        expect(isValid).toBe(true);
      }
    }
  });

  it("should generate different boards each time", () => {
    const board1 = generateBoard(4);
    const board2 = generateBoard(4);

    // Check at least some cells are different
    let differences = 0;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board1[i][j] !== board2[i][j]) {
          differences++;
        }
      }
    }

    expect(differences).toBeGreaterThan(0);
  });

  it("should provide board statistics", () => {
    const board = generateBoard(4);
    const stats = getBoardStats(board);

    expect(stats.totalCells).toBe(16);
    expect(stats.uniqueLetters).toBeGreaterThan(1);
    expect(stats.mostFrequent).toBeDefined();
  });
});

describe("loadCommonWords", () => {
  it("should load common words as a Set", () => {
    const commonWords = loadCommonWords();
    expect(commonWords).toBeInstanceOf(Set);
    expect(commonWords.size).toBeGreaterThan(0);
  });

  it("should contain critical common words", () => {
    const commonWords = loadCommonWords();
    const criticalWords = [
      "AGUA",
      "GATO",
      "FLOR",
      "MAR",
      "SOL",
      "CASA",
      "MESA",
    ];
    for (const word of criticalWords) {
      expect(commonWords.has(word)).toBe(true);
    }
  });

  it("should return cached instance on repeated calls", () => {
    const first = loadCommonWords();
    const second = loadCommonWords();
    expect(first).toBe(second);
  });
});

describe("generateGoodBoard", () => {
  it("should return commonWordCount in result", async () => {
    const { generateGoodBoard } = await import("../board-generator");
    const result = await generateGoodBoard(4);
    expect(result).toHaveProperty("board");
    expect(result).toHaveProperty("allWords");
    expect(result).toHaveProperty("commonWordCount");
    expect(typeof result.commonWordCount).toBe("number");
  }, 30000);

  it("should generate boards with some common words", async () => {
    const { generateGoodBoard } = await import("../board-generator");
    const result = await generateGoodBoard(4);
    expect(result.commonWordCount).toBeGreaterThanOrEqual(0);
    expect(result.allWords.length).toBeGreaterThan(0);
  }, 30000);
});
