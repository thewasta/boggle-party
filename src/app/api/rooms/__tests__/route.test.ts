import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/server/pusher-client', () => ({
  triggerEvent: vi.fn(),
}));

describe('POST /api/rooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a room with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        playerName: 'Alice',
        avatar: '🎮',
        gridSize: '4',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.room).toBeDefined();
    expect(data.room.code).toHaveLength(6);
    expect(data.room.host.name).toBe('Alice');
  });

  it('should validate playerName is required', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        playerName: '',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should assign default avatar if not provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        playerName: 'Bob',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.room.host.avatar).toBeDefined();
    expect(data.room.host.avatar).toMatch(/^[\u{1F300}-\u{1F9FF}]/u);
  });
});
