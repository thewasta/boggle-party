import { NextRequest } from 'next/server';
import { leaveRoomSchema } from '@/server/validation';
import { roomsManager } from '@/server/rooms-manager';
import { handleValidationError, apiSuccess, apiError, handleRoomError } from '@/server/api-utils';
import { emitPlayerLeft } from '@/server/event-emitter';
import type { RouteParams } from '@/server/types';

export async function POST(
  request: NextRequest,
  { params }: RouteParams<{ code: string }>
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const validatedData = leaveRoomSchema.parse({
      ...body,
      roomCode: code,
    });

    const room = roomsManager.getRoom(validatedData.roomCode);
    if (!room) {
      return apiError('Room not found', 404);
    }

    const player = room.players.get(validatedData.playerId);
    if (!player) {
      return apiError('Player not found in room', 404);
    }

    const playerName = player.name;
    const result = roomsManager.leaveRoom(validatedData.roomCode, validatedData.playerId);

    if (!result) {
      return apiSuccess({ message: 'Player left successfully' });
    }

    await emitPlayerLeft(result.id, validatedData.playerId, playerName, result.players.size);

    return apiSuccess({
      room: roomsManager.roomToDTO(result),
      playerId: validatedData.playerId,
    });

  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return handleValidationError(error);
    }

    return handleRoomError(error);
  }
}
