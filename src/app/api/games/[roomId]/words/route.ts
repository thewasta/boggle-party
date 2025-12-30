import { NextRequest, NextResponse } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { validateWord } from '@/server/word-validator';
import { wordSubmissionSchema } from '@/server/validation';
import { RoomError } from '@/server/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;

    const body = await request.json();
    const validation = wordSubmissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { playerId, word, path } = validation.data;

    const room = roomsManager.getRoomById(roomId);

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    if (room.status !== 'playing') {
      return NextResponse.json(
        { success: false, error: 'Game is not in progress' },
        { status: 400 }
      );
    }

    const player = room.players.get(playerId);

    if (!player) {
      return NextResponse.json(
        { success: false, error: 'Player not found in room' },
        { status: 404 }
      );
    }

    const result = validateWord({
      word,
      path,
      foundWords: player.foundWords,
      gridSize: room.gridSize,
    });

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          error: result.reason,
        },
        { status: 400 }
      );
    }

    player.foundWords.push(word.toUpperCase());
    player.score += result.score;

    return NextResponse.json({
      success: true,
      valid: true,
      score: result.score,
      word: word.toUpperCase(),
    });
  } catch (error) {
    console.error('Word submission error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
