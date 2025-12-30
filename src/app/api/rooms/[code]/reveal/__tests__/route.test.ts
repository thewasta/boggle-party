import { POST } from '../route';
import { roomsManager } from '@/server/rooms-manager';
import { emitRevealWord, emitResultsComplete } from '@/server/event-emitter';

vi.mock('@/server/rooms-manager');
vi.mock('@/server/event-emitter');

describe('POST /api/rooms/[code]/reveal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts sequential word reveal', async () => {
    const mockRoom = {
      code: 'ABC123',
      status: 'finished' as const,
      players: new Map([
        ['p1', { id: 'p1', name: 'Alice', avatar: '🎮', score: 10, foundWords: ['HOLA'] }],
      ]),
    };

    vi.mocked(roomsManager.getRoom).mockReturnValue(mockRoom);

    const request = new Request('http://localhost:3000/api/rooms/ABC123/reveal', {
      method: 'POST',
      body: JSON.stringify({ revealSequence: [{ word: 'HOLA', playerId: 'p1', playerName: 'Alice', score: 1, isUnique: true }] }),
    });

    const response = await POST(request, { params: { code: 'ABC123' } });

    expect(response.status).toBe(200);
    expect(emitRevealWord).toHaveBeenCalled();
  });
});
