import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomsManager } from '../rooms-manager';
import type { Player } from '../types';
import type { GridSize } from '@/server/db/schema';
import { gamesRepository } from '../db/repositories';

vi.mock('../db/repositories', () => ({
  gamesRepository: {
    roomCodeExists: vi.fn(),
  },
}));

describe('RoomsManager - Room Code Uniqueness', () => {
  let roomsManager: RoomsManager;
  let mockPlayer: Player;

  beforeEach(() => {
    roomsManager = new RoomsManager();
    mockPlayer = {
      id: 'player-1',
      name: 'Test Player',
      avatar: '🎮',
      isHost: true,
      score: 0,
      foundWords: [],
      createdAt: new Date(),
    };

    roomsManager.clearAllRoomsForTesting();
    vi.clearAllMocks();
  });

  it('should reject when code exists in database', async () => {
    vi.mocked(gamesRepository.roomCodeExists).mockResolvedValue(true);

    await expect(roomsManager.createRoom(mockPlayer, 4))
      .rejects.toThrow('Failed to generate unique room code');
  });

  it('should succeed when code is unique in both memory and database', async () => {
    vi.mocked(gamesRepository.roomCodeExists).mockResolvedValue(false);

    const room = await roomsManager.createRoom(mockPlayer, 4);

    expect(room.code).toBeDefined();
    expect(room.code.length).toBe(6);
    expect(room.host.id).toBe(mockPlayer.id);
  });

  it('should retry when initial code exists in database', async () => {
    vi.mocked(gamesRepository.roomCodeExists)
      .mockResolvedValueOnce(true)
      .mockResolvedValue(false);

    const room = await roomsManager.createRoom(mockPlayer, 4);

    expect(room.code).toBeDefined();
    expect(gamesRepository.roomCodeExists).toHaveBeenCalled();
  });

  it('should reject after max attempts if all codes exist', async () => {
    vi.mocked(gamesRepository.roomCodeExists).mockResolvedValue(true);

    await expect(roomsManager.createRoom(mockPlayer, 4))
      .rejects.toThrow('Failed to generate unique room code');
  });
});
