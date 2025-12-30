import { NextRequest } from 'next/server';
import { leaveRoomSchema } from '@/server/validation';
import { roomsManager } from '@/server/rooms-manager';
import { handleValidationError, apiSuccess, apiError, handleRoomError } from '@/server/api-utils';
import { emitPlayerLeft } from '@/server/event-emitter';
import { triggerEvent } from '@/server/pusher-client';
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
    const isHost = room.host.id === validatedData.playerId;
    const result = roomsManager.leaveRoom(validatedData.roomCode, validatedData.playerId);

    if (!result) {
      // Room was deleted (no players left)
      return apiSuccess({ message: 'Room closed' });
    }

    // If host left, close the room for everyone
    if (isHost) {
      await triggerEvent(`game-${room.id}`, 'room-closed', {
        reason: 'host-left',
        message: 'El anfitrión abandonó la sala',
      });
      // Delete the room
      roomsManager.deleteRoom(validatedData.roomCode);
      return apiSuccess({ message: 'Host left, room closed' });
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
