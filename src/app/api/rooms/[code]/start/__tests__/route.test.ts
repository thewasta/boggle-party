import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/server/pusher-client', () => ({
  triggerEvent: vi.fn(),
}));

describe('POST /api/rooms/[code]/start', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate playerId is required', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/ABC123/start', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request, { params: { code: 'ABC123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 404 for non-existent room', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/INVALID/start', {
      method: 'POST',
      body: JSON.stringify({
        playerId: '123e4567-e89b-12d3-a456-426614174000',
      }),
    });

    const response = await POST(request, { params: { code: 'INVALID' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });
});
