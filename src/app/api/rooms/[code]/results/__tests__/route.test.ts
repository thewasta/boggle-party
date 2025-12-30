import { POST } from '../route';
import { roomsManager } from '@/server/rooms-manager';
import { gamesRepository, playersRepository, wordsRepository } from '@/server/db/repositories';

vi.mock('@/server/rooms-manager');
vi.mock('@/server/db/repositories');

describe('POST /api/rooms/[code]/results', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prepares results with unique word calculation', async () => {
    const mockRoom = {
      code: 'ABC123',
      status: 'finished' as const,
      players: new Map([
        ['p1', { id: 'p1', name: 'Alice', avatar: '🎮', score: 10, foundWords: ['HOLA', 'CASA'] }],
        ['p2', { id: 'p2', name: 'Bob', avatar: '🎯', score: 8, foundWords: ['HOLA'] }],
      ]),
      gridSize: 4 as const,
      board: [['A', 'B'], ['C', 'D']],
    };

    vi.mocked(roomsManager.getRoom).mockReturnValue(mockRoom);

    const request = new Request('http://localhost:3000/api/rooms/ABC123/results', {
      method: 'POST',
    });

    const response = await POST(request, { params: { code: 'ABC123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.revealSequence).toBeDefined();
    expect(data.revealSequence.length).toBeGreaterThan(0);
  });

  it('returns 404 for non-existent room', async () => {
    vi.mocked(roomsManager.getRoom).mockReturnValue(undefined);

    const request = new Request('http://localhost:3000/api/rooms/INVALID/results', {
      method: 'POST',
    });

    const response = await POST(request, { params: { code: 'INVALID' } });

    expect(response.status).toBe(404);
  });

  it('returns 400 if game not finished', async () => {
    const mockRoom = {
      code: 'ABC123',
      status: 'playing' as const,
      players: new Map(),
      gridSize: 4 as const,
    };

    vi.mocked(roomsManager.getRoom).mockReturnValue(mockRoom);

    const request = new Request('http://localhost:3000/api/rooms/ABC123/results', {
      method: 'POST',
    });

    const response = await POST(request, { params: { code: 'ABC123' } });

    expect(response.status).toBe(400);
  });
});
