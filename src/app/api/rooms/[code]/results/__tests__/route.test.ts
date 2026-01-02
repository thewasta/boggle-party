import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { gamesRepository, playersRepository, wordsRepository } from '@/server/db/repositories';
import type { Room } from '@/server/types';

vi.mock('@/server/rooms-manager');
vi.mock('@/server/db/repositories');

describe('POST /api/rooms/[code]/results', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prepares results with unique word calculation', async () => {
    const mockRoom = {
      id: 'room-123',
      code: 'ABC123',
      status: 'finished' as const,
      host: { id: 'p1', name: 'Alice', avatar: '🎮', score: 10, foundWords: [], isHost: true, createdAt: new Date() },
      players: new Map([
        ['p1', { id: 'p1', name: 'Alice', avatar: '🎮', score: 10, foundWords: [{ word: 'HOLA', score: 4, timestamp: 1000 }, { word: 'CASA', score: 4, timestamp: 2000 }] }],
        ['p2', { id: 'p2', name: 'Bob', avatar: '🎯', score: 4, foundWords: [{ word: 'HOLA', score: 4, timestamp: 1500 }] }],
      ]),
      gridSize: 4 as const,
      board: [['A', 'B'], ['C', 'D']],
      duration: 90,
      createdAt: new Date(),
    };

    vi.mocked(roomsManager.getRoom).mockReturnValue(mockRoom as unknown as Room);
    vi.mocked(gamesRepository.create).mockResolvedValue({ id: 'game-123' });
    vi.mocked(playersRepository.create).mockResolvedValue({ id: 'player-db-1' });
    vi.mocked(wordsRepository.create).mockResolvedValue({});

    const request = new Request('http://localhost:3000/api/rooms/ABC123/results', {
      method: 'POST',
    });

    const response = await POST(request as any, { params: Promise.resolve({ code: 'ABC123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.revealSequence).toBeDefined();
    expect(data.revealSequence.length).toBeGreaterThan(0);
  });

  it('returns 404 for non-existent room', async () => {
    vi.mocked(roomsManager.getRoom).mockReturnValue(null as any);

    const request = new NextRequest('http://localhost:3000/api/rooms/INVALID/results', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ code: 'INVALID' }) });

    expect(response.status).toBe(404);
  });

  it('returns 400 if game not finished', async () => {
    const mockRoom = {
      id: 'room-456',
      code: 'ABC123',
      status: 'playing' as const,
      host: { id: 'host', name: 'Host', avatar: '🎮', score: 0, foundWords: [], isHost: true, createdAt: new Date() },
      players: new Map(),
      gridSize: 4 as const,
      board: [['A', 'B'], ['C', 'D']] as string[][],
      duration: 90,
      createdAt: new Date(),
    };

    vi.mocked(roomsManager.getRoom).mockReturnValue(mockRoom as unknown as Room);

    const request = new Request('http://localhost:3000/api/rooms/ABC123/results', {
      method: 'POST',
    });

    const response = await POST(request as any, { params: Promise.resolve({ code: 'ABC123' }) });

    expect(response.status).toBe(400);
  });
});
