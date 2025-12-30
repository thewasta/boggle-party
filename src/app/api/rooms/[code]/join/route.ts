import { NextRequest } from 'next/server';
import { joinRoomSchema } from '@/server/validation';
import { roomsManager } from '@/server/rooms-manager';
import { handleValidationError, apiSuccess, apiError, getDefaultAvatar, handleRoomError } from '@/server/api-utils';
import type { Player } from '@/server/types';
import { emitPlayerJoined } from '@/server/event-emitter';
import type { RouteParams } from '@/server/types';

export async function POST(
  request: NextRequest,
  { params }: RouteParams<{ code: string }>
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const validatedData = joinRoomSchema.parse({
      ...body,
      roomCode: code,
    });

    const player: Player = {
      id: crypto.randomUUID(),
      name: validatedData.playerName.trim(),
      avatar: validatedData.avatar || getDefaultAvatar(validatedData.playerName),
      isHost: false,
      score: 0,
      foundWords: [],
      createdAt: new Date(),
    };

    const room = roomsManager.joinRoom(validatedData.roomCode, player);

    if (!room) {
      return apiError('Room not found', 404);
    }

    await emitPlayerJoined(room.id, player, room.players.size);

    return apiSuccess({
      room: roomsManager.roomToDTO(room),
      playerId: player.id,
    });

  } catch (error) {
    console.error(error);
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return handleValidationError(error);
    }

    return handleRoomError(error);
  }
}
