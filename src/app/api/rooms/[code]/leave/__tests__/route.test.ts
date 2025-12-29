import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/server/pusher-client', () => ({
  triggerEvent: vi.fn(),
}));

describe('POST /api/rooms/[code]/leave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate playerId is required', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/ABC123/leave', {
      method: 'POST',
      body: JSON.stringify({
        playerId: '',
      }),
    });

    const response = await POST(request, { params: { code: 'ABC123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should validate playerId is a valid UUID', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/ABC123/leave', {
      method: 'POST',
      body: JSON.stringify({
        playerId: 'invalid-uuid',
      }),
    });

    const response = await POST(request, { params: { code: 'ABC123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 400 for invalid room code format', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/AB/leave', {
      method: 'POST',
      body: JSON.stringify({
        playerId: '123e4567-e89b-12d3-a456-426614174000',
      }),
    });

    const response = await POST(request, { params: { code: 'AB' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
