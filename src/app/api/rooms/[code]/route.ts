import { NextRequest } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { apiSuccess, apiError } from '@/server/api-utils';
import type { RouteParams } from '@/server/types';

export async function GET(
  request: NextRequest,
  { params }: RouteParams<{ code: string }>
) {
  try {
    const { code } = await params;

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
