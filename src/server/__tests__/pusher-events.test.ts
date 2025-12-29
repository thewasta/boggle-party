import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/rooms/route';
import { NextRequest } from 'next/server';

// Mock Pusher client
vi.mock('@/server/pusher-client', () => ({
  triggerEvent: vi.fn(),
}));

import { triggerEvent } from '@/server/pusher-client';

describe('Pusher Events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should emit player-joined event when creating room', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        playerName: 'Alice',
        avatar: '🎮',
      }),
    });

    await POST(request);

    expect(triggerEvent).toHaveBeenCalledWith(
      expect.stringContaining('presence-game-'),
      'player-joined',
      expect.objectContaining({
        player: expect.objectContaining({ name: 'Alice' }),
        totalPlayers: 1,
      })
    );
  });
});
