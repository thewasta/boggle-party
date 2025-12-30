import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/server/pusher-client', () => ({
  triggerEvent: vi.fn(),
}));

describe('POST /api/rooms/[code]/end', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 for non-existent room', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/INVALID/end', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request, { params: Promise.resolve({ code: 'INVALID' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('should return 400 for invalid room code format', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/AB/end', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request, { params: Promise.resolve({ code: 'AB' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });
});
