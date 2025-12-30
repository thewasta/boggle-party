import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { getDictionary } from '@/server/dictionary';
import { roomsManager } from '@/server/rooms-manager';
import type { Player } from '@/server/types';

describe('POST /api/games/[roomId]/words', () => {
  let roomId: string;
  let playerId: string;

  beforeAll(async () => {
    await getDictionary();
  });

  beforeEach(() => {
    roomsManager.clearAllRoomsForTesting();

    const host: Player = {
      id: crypto.randomUUID(),
      name: 'TestHost',
      avatar: '🎮',
      isHost: true,
      score: 0,
      foundWords: [],
      createdAt: new Date(),
    };

    const player2: Player = {
      id: crypto.randomUUID(),
      name: 'TestPlayer2',
      avatar: '🎲',
      isHost: false,
      score: 0,
      foundWords: [],
      createdAt: new Date(),
    };

    const room = roomsManager.createRoom(host, 4);
    roomsManager.joinRoom(room.code, player2);
    roomId = room.id;
    playerId = host.id;

    const board = [
      ['H', 'O', 'L', 'A'],
      ['C', 'A', 'S', 'A'],
      ['P', 'E', 'R', 'R'],
      ['O', 'G', 'A', 'T'],
    ];
    roomsManager.startGame(room.code, 120, board);
  });

  it('should accept valid word submission', async () => {
    const request = new NextRequest(`http://localhost:3000/api/games/${roomId}/words`, {
      method: 'POST',
      body: JSON.stringify({
        playerId,
        word: 'HOLA',
        path: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      }),
    });

    const response = await POST(request, { params: { roomId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.valid).toBe(true);
    expect(data.score).toBe(1);
  });

  it('should reject invalid word', async () => {
    const request = new NextRequest(`http://localhost:3000/api/games/${roomId}/words`, {
      method: 'POST',
      body: JSON.stringify({
        playerId,
        word: 'XXXX',
        path: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      }),
    });

    const response = await POST(request, { params: { roomId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Word not found in dictionary');
  });

  it('should reject duplicate submission', async () => {
    const request1 = new NextRequest(`http://localhost:3000/api/games/${roomId}/words`, {
      method: 'POST',
      body: JSON.stringify({
        playerId,
        word: 'HOLA',
        path: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      }),
    });

    await POST(request1, { params: { roomId } });

    const request2 = new NextRequest(`http://localhost:3000/api/games/${roomId}/words`, {
      method: 'POST',
      body: JSON.stringify({
        playerId,
        word: 'HOLA',
        path: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      }),
    });

    const response = await POST(request2, { params: { roomId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Word already submitted');
  });

  it('should reject invalid path', async () => {
    const request = new NextRequest(`http://localhost:3000/api/games/${roomId}/words`, {
      method: 'POST',
      body: JSON.stringify({
        playerId,
        word: 'HOLA',
        path: [
          { row: 0, col: 0 },
          { row: 0, col: 2 },
          { row: 0, col: 1 },
          { row: 0, col: 3 },
        ],
      }),
    });

    const response = await POST(request, { params: { roomId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid path');
  });

  it('should return 404 for non-existent room', async () => {
    const request = new NextRequest(`http://localhost:3000/api/games/non-existent-room-id/words`, {
      method: 'POST',
      body: JSON.stringify({
        playerId,
        word: 'HOLA',
        path: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      }),
    });

    const response = await POST(request, { params: { roomId: 'non-existent-room-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Room not found');
  });

  it('should return 400 for non-existent player', async () => {
    const request = new NextRequest(`http://localhost:3000/api/games/${roomId}/words`, {
      method: 'POST',
      body: JSON.stringify({
        playerId: crypto.randomUUID(),
        word: 'HOLA',
        path: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      }),
    });

    const response = await POST(request, { params: { roomId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Player not found in room');
  });

  it('should reject submission when game is not in progress', async () => {
    const host: Player = {
      id: crypto.randomUUID(),
      name: 'TestHost',
      avatar: '🎮',
      isHost: true,
      score: 0,
      foundWords: [],
      createdAt: new Date(),
    };

    const room = roomsManager.createRoom(host, 4);
    const roomWithoutGame = room.id;

    const request = new NextRequest(`http://localhost:3000/api/games/${roomWithoutGame}/words`, {
      method: 'POST',
      body: JSON.stringify({
        playerId: host.id,
        word: 'HOLA',
        path: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      }),
    });

    const response = await POST(request, { params: { roomId: roomWithoutGame } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Game is not in progress');
  });

  it('should validate request schema', async () => {
    const request = new NextRequest(`http://localhost:3000/api/games/${roomId}/words`, {
      method: 'POST',
      body: JSON.stringify({
        playerId: 'not-a-uuid',
        word: 'AB',
        path: [],
      }),
    });

    const response = await POST(request, { params: { roomId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid request');
  });
});
