import { NextRequest, NextResponse } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { generateBoard } from '@/server/board-generator';
import { startGameSchema } from '@/server/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const roomCode = params.code;

    // Parse request body
    const body = await request.json();
    const validation = startGameSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          // Zod v4 expone los detalles de validación en `issues`, no en `errors`
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { gridSize } = validation.data;

    // Get room
    const room = roomsManager.getRoom(roomCode);

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Generate board
    const board = generateBoard(gridSize);

    // Calculate duration
    const duration = roomsManager.getDefaultDuration(gridSize);

    // Start game
    const updatedRoom = roomsManager.startGame(roomCode, duration, board);

    if (!updatedRoom) {
      return NextResponse.json(
        { success: false, error: 'Failed to start game' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Game started',
      startTime: updatedRoom.startTime!,
      duration,
      board,
    });
  } catch (error) {
    console.error('Start game error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
