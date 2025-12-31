import { NextRequest, NextResponse } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { apiError } from '@/server/api-utils';
import type { RouteParams, FoundWord } from '@/server/types';

interface PlayerStateResponse {
  startTime: number;
  duration: number;
  board: string[][];
  gridSize: number;
  foundWords: FoundWord[];
  score: number;
  elapsed: number; // Seconds elapsed since game started
  remaining: number; // Seconds remaining
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams<{ code: string }>
) {
  try {
    const { code } = await params;
    const searchParams = request.nextUrl.searchParams;
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return apiError('playerId is required', 400);
    }

    const room = roomsManager.getRoom(code);

    if (!room) {
      return apiError('Room not found', 404);
    }

    if (room.status !== 'playing') {
      return apiError('Game is not in progress', 400);
    }

    const player = room.players.get(playerId);

    if (!player) {
      return apiError('Player not found in room', 404);
    }

    const response: PlayerStateResponse = {
      startTime: room.startTime!,
      duration: room.duration,
      board: room.board!,
      gridSize: room.gridSize,
      foundWords: player.foundWords,
      score: player.score,
      // Calculate elapsed and remaining time on the server
      elapsed: Math.floor((Date.now() - room.startTime!) / 1000),
      remaining: Math.max(0, room.duration - Math.floor((Date.now() - room.startTime!) / 1000)),
    };

    return NextResponse.json({ success: true, playerState: response });
  } catch (error) {
    console.error('Error getting player state:', error);
    return apiError('Failed to get player state', 500);
  }
}
