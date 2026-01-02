import { NextRequest, NextResponse } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { emitRematchRequested } from '@/server/event-emitter';
import { RoomError } from '@/server/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { requesterPlayerId } = body;

    if (!requesterPlayerId) {
      return NextResponse.json(
        { success: false, error: 'requesterPlayerId is required' },
        { status: 400 }
      );
    }

    // Reset room for rematch
    const room = roomsManager.rematchRoom(code, requesterPlayerId);

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Notify all players to return to waiting room
    await emitRematchRequested(room.id, {
      id: room.host.id,
      name: room.host.name,
    });

    return NextResponse.json({
      success: true,
      room: roomsManager.roomToDTO(room),
    });
  } catch (error) {
    if (error instanceof RoomError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error('Rematch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
