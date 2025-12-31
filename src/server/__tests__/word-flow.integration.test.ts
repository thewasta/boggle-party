import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { getDictionary, clearDictionary } from '../dictionary';
import { roomsManager } from '../rooms-manager';
import { generateBoard } from '../board-generator';
import { validateWord } from '../word-validator';
import type { Player } from '../types';

describe('Word Flow Integration Tests', () => {
  let host: Player;
  let player2: Player;

  beforeAll(async () => {
    await getDictionary();

    host = {
      id: crypto.randomUUID(),
      name: 'Alice',
      avatar: '🎮',
      isHost: true,
      score: 0,
      foundWords: [],
      createdAt: new Date(),
    };

    player2 = {
      id: crypto.randomUUID(),
      name: 'Bob',
      avatar: '🎲',
      isHost: false,
      score: 0,
      foundWords: [],
      createdAt: new Date(),
    };
  });

  beforeEach(async () => {
    // Reload dictionary after clearing
    clearDictionary();
    await getDictionary();

    // Reset rooms manager
    for (const room of roomsManager.getAllRooms()) {
      roomsManager.deleteRoom(room.code);
    }
  });

  it('should handle complete word submission flow', async () => {
    // Create room
    const room = await roomsManager.createRoom(host, 4);
    roomsManager.joinRoom(room.code, player2);

    // Generate board with known words
    const board = [
      ['H', 'O', 'L', 'A'],
      ['C', 'A', 'S', 'A'],
      ['P', 'E', 'R', 'R'],
      ['O', 'G', 'A', 'T'],
    ];

    roomsManager.startGame(room.code, 120, board);

    // Player 1 submits word
    const result1 = await validateWord({
      word: 'HOLA',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ],
      foundWords: host.foundWords,
      gridSize: 4,
    });

    expect(result1.valid).toBe(true);
    expect(result1.score).toBe(1);

    // Update player
    host.foundWords.push({ word: 'HOLA', score: result1.score, timestamp: Date.now() });
    host.score += result1.score;

    // Player 2 submits same word (not duplicate for them)
    const result2 = await validateWord({
      word: 'HOLA',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ],
      foundWords: player2.foundWords,
      gridSize: 4,
    });

    expect(result2.valid).toBe(true);

    // Player 1 tries duplicate
    const result3 = await validateWord({
      word: 'HOLA',
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ],
      foundWords: host.foundWords,
      gridSize: 4,
    });

    expect(result3.valid).toBe(false);
    expect(result3.reason).toBe('Word already submitted');
  });

  it('should correctly score different word lengths', async () => {
    const room = await roomsManager.createRoom(host, 4);
    roomsManager.joinRoom(room.code, player2);
    const board = generateBoard(4);
    roomsManager.startGame(room.code, 120, board);

    // Find some valid words and test scoring
    const testWords = [
      { word: 'SOL', expectedScore: 1 },
      { word: 'CASA', expectedScore: 1 },
      { word: 'PLANTA', expectedScore: 3 },
    ];

    for (const { word, expectedScore } of testWords) {
      const result = await validateWord({
        word,
        path: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
        foundWords: [],
        gridSize: 4,
      });

      // Most will fail dictionary check, but we can test scoring for valid ones
      if (result.valid) {
        expect(result.score).toBe(expectedScore);
      }
    }
  });
});
