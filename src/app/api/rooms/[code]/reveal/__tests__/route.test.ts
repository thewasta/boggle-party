import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { roomsManager } from '@/server/rooms-manager';
import { emitRevealWord, emitResultsComplete } from '@/server/event-emitter';
import type { Room } from '@/server/types';

vi.mock('@/server/rooms-manager');
vi.mock('@/server/event-emitter');

describe('POST /api/rooms/[code]/reveal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts sequential word reveal', async () => {
    const mockRoom = {
      id: 'room-123',
      code: 'ABC123',
      status: 'finished' as const,
      host: { id: 'p1', name: 'Alice', avatar: '🎮', score: 10, foundWords: [], isHost: true, createdAt: new Date() },
      players: new Map([
        ['p1', { id: 'p1', name: 'Alice', avatar: '🎮', score: 10, foundWords: [{ word: 'HOLA', score: 4, timestamp: 1000 }] }],
      ]),
      gridSize: 4 as const,
      board: [['A', 'B'], ['C', 'D']] as string[][],
      duration: 90,
      createdAt: new Date(),
    };

    vi.mocked(roomsManager.getRoom).mockReturnValue(mockRoom as unknown as Room);

    const request = new Request('http://localhost:3000/api/rooms/ABC123/reveal', {
      method: 'POST',
      body: JSON.stringify({ revealSequence: [{ word: 'HOLA', playerId: 'p1', playerName: 'Alice', score: 1, isUnique: true }] }),
    });

    const response = await POST(request as any, { params: Promise.resolve({ code: 'ABC123' }) });

    expect(response.status).toBe(200);
    expect(emitRevealWord).toHaveBeenCalled();
  });
});
