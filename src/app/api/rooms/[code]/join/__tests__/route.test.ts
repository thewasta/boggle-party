import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/server/pusher-client', () => ({
  triggerEvent: vi.fn(),
}));

describe('POST /api/rooms/[code]/join', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate playerName is required', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/ABC123/join', {
      method: 'POST',
      body: JSON.stringify({
        roomCode: 'ABC123',
        playerName: '',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ code: 'ABC123' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 400 for invalid room code format', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/AB/join', {
      method: 'POST',
      body: JSON.stringify({
        roomCode: 'AB',
        playerName: 'Bob',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ code: 'AB' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
