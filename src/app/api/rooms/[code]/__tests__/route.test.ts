import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../route';
import { POST } from '../../route';
import { NextRequest } from 'next/server';

vi.mock('@/server/pusher-client', () => ({
  triggerEvent: vi.fn(),
}));

describe('GET /api/rooms/[code]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return room state for valid code', async () => {
    const createRequest = new NextRequest('http://localhost:3000/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        playerName: 'Alice',
        avatar: '🎮',
      }),
    });

    const createResponse = await POST(createRequest);
    const createData = await createResponse.json();
    const code = createData.room.code;

    const getRequest = new NextRequest(`http://localhost:3000/api/rooms/${code}`);
    const response = await GET(getRequest, { params: Promise.resolve({ code }) });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.room.code).toBe(code);
  });

  it('should return 404 for non-existent room', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms/INVALID');
    const response = await GET(request, { params: Promise.resolve({ code: 'INVALID' }) });

    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });
});
