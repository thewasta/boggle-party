import { NextRequest } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { apiSuccess, apiError } from '@/server/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    const room = roomsManager.getRoom(code.toUpperCase());

    if (!room) {
      return apiError('Room not found', 404);
    }

    return apiSuccess({
      room: roomsManager.roomToDTO(room),
    });

  } catch (error) {
    console.error('Error getting room:', error);
    return apiError('Failed to get room', 500);
  }
}
