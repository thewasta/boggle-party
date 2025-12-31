import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/rooms/[code]/player-state/route';
import { roomsManager } from '@/server/rooms-manager';
import type { Player } from '@/server/types';
import { NextRequest } from 'next/server';

// Helper to create a mock NextRequest with proper nextUrl
function createMockNextRequest(url: string): NextRequest {
  const urlObj = new URL(url);
  return {
    nextUrl: urlObj,
    url: url,
    json: async () => ({}),
    text: async () => '',
    blob: async () => new Blob(),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    headers: new Headers(),
    clone: () => createMockNextRequest(url),
    body: null,
    bodyUsed: false,
    cache: 'default',
    credentials: 'same-origin',
    destination: 'document',
    integrity: '',
    keepalive: false,
    method: 'GET',
    mode: 'cors',
    redirect: 'follow',
    referrer: '',
    referrerPolicy: '',
    signal: new AbortController().signal,
  } as unknown as NextRequest;
}

describe('GET /api/rooms/[code]/player-state', () => {
  beforeEach(async () => {
    roomsManager.clearAllRoomsForTesting();
  });

  it('should return player state with found words', async () => {
    const host: Player = {
      id: 'host-1',
      name: 'Alice',
      avatar: '🎮',
      isHost: true,
      score: 15,
      foundWords: [
        { word: 'HOLA', score: 4, timestamp: 1000 },
        { word: 'CASA', score: 4, timestamp: 2000 },
        { word: 'PERRO', score: 5, timestamp: 3000 },
      ],
      createdAt: new Date(),
    };

    const player2: Player = {
      id: 'player-2',
      name: 'Bob',
      avatar: '🎯',
      isHost: false,
      score: 4,
      foundWords: [{ word: 'CASA', score: 4, timestamp: 1500 }],
      createdAt: new Date(),
    };

    const room = await roomsManager.createRoom(host, 4);
    roomsManager.joinRoom(room.code, player2);
    roomsManager.startGame(room.code, 90, [
      ['A', 'B', 'C', 'D'],
      ['E', 'F', 'G', 'H'],
      ['I', 'J', 'K', 'L'],
      ['M', 'N', 'O', 'P'],
    ]);

    const request = createMockNextRequest(
      `http://localhost:3000/api/rooms/${room.code}/player-state?playerId=host-1`
    );

    const response = await GET(request, {
      params: Promise.resolve({ code: room.code }),
    });

    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.playerState.foundWords).toEqual([
      { word: 'HOLA', score: 4, timestamp: 1000 },
      { word: 'CASA', score: 4, timestamp: 2000 },
      { word: 'PERRO', score: 5, timestamp: 3000 },
    ]);
    expect(data.playerState.score).toBe(15);
    expect(data.playerState.startTime).toBeDefined();
    expect(data.playerState.duration).toBe(90);
    expect(data.playerState.elapsed).toBeGreaterThanOrEqual(0);
    expect(data.playerState.remaining).toBeLessThanOrEqual(90);
  });

  it('should return 404 if room not found', async () => {
    const request = createMockNextRequest(
      'http://localhost:3000/api/rooms/NOTFOUND/player-state?playerId=some-id'
    );

    const response = await GET(request, {
      params: Promise.resolve({ code: 'NOTFOUND' }),
    });

    expect(response.status).toBe(404);
  });

  it('should return 400 if playerId is missing', async () => {
    const request = createMockNextRequest(
      'http://localhost:3000/api/rooms/ABC123/player-state'
    );

    const response = await GET(request, {
      params: Promise.resolve({ code: 'ABC123' }),
    });

    expect(response.status).toBe(400);
  });

  it('should return 400 if game is not in progress', async () => {
    const host: Player = {
      id: 'host-1',
      name: 'Alice',
      avatar: '🎮',
      isHost: true,
      score: 0,
      foundWords: [],
      createdAt: new Date(),
    };

    const room = await roomsManager.createRoom(host, 4);

    const request = createMockNextRequest(
      `http://localhost:3000/api/rooms/${room.code}/player-state?playerId=host-1`
    );

    const response = await GET(request, {
      params: Promise.resolve({ code: room.code }),
    });

    expect(response.status).toBe(400);
  });
});
