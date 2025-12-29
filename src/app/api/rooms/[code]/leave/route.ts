import { NextRequest } from 'next/server';
import { leaveRoomSchema } from '@/server/validation';
import { roomsManager } from '@/server/rooms-manager';
import { handleValidationError, apiSuccess, handleRoomError } from '@/server/api-utils';
import { triggerEvent } from '@/server/pusher-client';
import type { PlayerLeftEvent } from '@/server/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const body = await request.json();
    const validatedData = leaveRoomSchema.parse({
      ...body,
      roomCode: code,
    });

    const result = roomsManager.leaveRoom(validatedData.roomCode, validatedData.playerId);

    if (!result) {
      return apiSuccess({ message: 'Player left successfully' });
    }

    await triggerEvent(`presence-game-${result.room.id}`, 'player-left', {
      playerId: validatedData.playerId,
      totalPlayers: result.room.players.size,
    } satisfies PlayerLeftEvent);

    return apiSuccess({
      room: roomsManager.roomToDTO(result.room),
      playerId: validatedData.playerId,
    });

  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return handleValidationError(error);
    }

    return handleRoomError(error);
  }
}
