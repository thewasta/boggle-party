import { describe, it, expect, beforeAll } from "vitest";
import { roomsManager } from "../../rooms-manager";
import { initPredefinedBoards } from "../../predefined-boards";
import { PREDEFINED_BOARDS_6X6 } from "../../predefined-boards-data";
import { validateWord } from "../../word-validator";

describe("Word validation on predefined board 6x6 #20", () => {
  beforeAll(async () => {
    await initPredefinedBoards();
  }, 30000);

  it("should validate CURA on board 6x6 #20 with natural path", async () => {
    const board = PREDEFINED_BOARDS_6X6[19]; // board #20

    // Create room and start game (simulating start/route.ts flow)
    const host = {
      id: "host-1",
      name: "Host",
      avatar: "🎮",
      isHost: true,
      score: 0,
      foundWords: [],
      createdAt: new Date(),
    };
    const room = await roomsManager.createRoom(host, 6);

    const player = {
      id: "db66a7af-e008-46eb-803e-8391d4eb1904",
      name: "Test",
      avatar: "🎯",
      isHost: false,
      score: 0,
      foundWords: [],
      createdAt: new Date(),
    };
    roomsManager.joinRoom(room.code, player);

    // Start game with predefined board #20
    const startedRoom = roomsManager.startGame(room.code, 240, board);
    if (!startedRoom) throw new Error("Failed to start game");

    // Verify board is correct
    expect(startedRoom.board).toEqual(board);

    // Now test ALL the problematic words with their natural paths
    const testCases = [
      {
        word: "CURA",
        path: [
          { row: 4, col: 3 },
          { row: 4, col: 4 },
          { row: 3, col: 3 },
          { row: 3, col: 2 },
        ],
      },
      {
        word: "PURA",
        path: [
          { row: 5, col: 4 },
          { row: 4, col: 4 },
          { row: 3, col: 3 },
          { row: 3, col: 2 },
        ],
      },
      {
        word: "ARCO",
        path: [
          { row: 3, col: 1 },
          { row: 4, col: 2 },
          { row: 4, col: 3 },
          { row: 5, col: 3 },
        ],
      },
      {
        word: "TARDE",
        path: [
          { row: 4, col: 1 },
          { row: 3, col: 2 },
          { row: 3, col: 3 },
          { row: 2, col: 3 },
          { row: 1, col: 4 },
        ],
      },
      {
        word: "LEO",
        path: [
          { row: 5, col: 1 },
          { row: 5, col: 2 },
          { row: 5, col: 3 },
        ],
      },
      {
        word: "REMO",
        path: [
          { row: 0, col: 4 },
          { row: 1, col: 4 },
          { row: 1, col: 3 },
          { row: 1, col: 2 },
        ],
      },
    ];

    for (const { word, path } of testCases) {
      const boardWord = path
        .map((c) => startedRoom.board![c.row][c.col])
        .join("");

      const result = await validateWord({
        word,
        path,
        foundWords: [],
        gridSize: 6,
        board: startedRoom.board!,
      });

      // Detailed output on failure
      if (!result.valid) {
        console.error(`FAIL: ${word}`);
        console.error(`  reason: ${result.reason}`);
        console.error(`  board word: ${boardWord} (expected: ${word})`);
        console.error(
          `  path: ${path.map((c) => `(${c.row},${c.col})`).join("→")}`,
        );
      }

      expect(result.valid).toBe(true);
      expect(boardWord).toBe(word);
    }
  }, 30000);
});
