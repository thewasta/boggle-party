/**
 * POST /api/rooms/[code]/end
 * End game in room (host only or automatic when timer ends)
 */

import { NextRequest } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { apiSuccess, apiError } from '@/server/api-utils';
import { emitGameEnded } from '@/server/event-emitter';
import type { RouteParams } from '@/server/types';

export async function POST(
  request: NextRequest,
  { params }: RouteParams<{ code: string }>
) {
  try {
    const { code } = await params;

    const room = roomsManager.getRoom(code.toUpperCase());

    if (!room) {
      return apiError('Room not found', 404);
    }

    const updatedRoom = roomsManager.endGame(code.toUpperCase());

    if (!updatedRoom) {
      return apiError('Failed to end game', 500);
    }

    await emitGameEnded(room.id, updatedRoom.endTime!);

    return apiSuccess({
      message: 'Game ended',
      endTime: updatedRoom.endTime,
    });

  } catch (error) {
    console.error('Error ending game:', error);
    return apiError('Failed to end game', 500);
  }
}
