/**
 * POST /api/rooms/[code]/start
 * Start game in room (host only)
 */

import { NextRequest } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { apiSuccess, apiError, handleRoomError } from '@/server/api-utils';
import { triggerEvent } from '@/server/pusher-client';
import type { GameStartedEvent } from '@/server/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const body = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return apiError('playerId is required', 400);
    }

    const room = roomsManager.getRoom(code.toUpperCase());

    if (!room) {
      return apiError('Room not found', 404);
    }

    if (room.host.id !== playerId) {
      return apiError('Only the host can start the game', 403);
    }

    const board = body.board || generateDefaultBoard(room.gridSize);

    const updatedRoom = roomsManager.startGame(code.toUpperCase(), room.duration, board);

    if (!updatedRoom) {
      return apiError('Failed to start game', 500);
    }

    await triggerEvent(`presence-game-${room.id}`, 'game-started', {
      startTime: updatedRoom.startTime!,
      duration: updatedRoom.duration,
      board: updatedRoom.board!,
    } satisfies GameStartedEvent);

    return apiSuccess({
      message: 'Game started',
      startTime: updatedRoom.startTime,
      duration: updatedRoom.duration,
      board: updatedRoom.board,
    });

  } catch (error) {
    return handleRoomError(error);
  }
}

function generateDefaultBoard(gridSize: number): string[][] {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
                   'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  const board: string[][] = [];
  for (let i = 0; i < gridSize; i++) {
    const row: string[] = [];
    for (let j = 0; j < gridSize; j++) {
      row.push(letters[Math.floor(Math.random() * letters.length)]);
    }
    board.push(row);
  }

  return board;
}
