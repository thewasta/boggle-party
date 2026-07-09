import type { NextRequest } from "next/server";
import { createRoomSchema } from "@/server/validation";
import { roomsManager } from "@/server/rooms-manager";
import {
  handleValidationError,
  apiSuccess,
  apiError,
  getDefaultAvatar,
} from "@/server/api-utils";
import type { Player } from "@/server/types";
import { emitPlayerJoined } from "@/server/event-emitter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createRoomSchema.parse(body);

    const player: Player = {
      id: crypto.randomUUID(),
      name: validatedData.playerName.trim(),
      avatar:
        validatedData.avatar || getDefaultAvatar(validatedData.playerName),
      isHost: true,
      score: 0,
      foundWords: [],
      createdAt: new Date(),
    };

    const room = await roomsManager.createRoom(
      player,
      validatedData.gridSize || 4,
    );

    await emitPlayerJoined(room.code, room.host, room.players.size);

    return apiSuccess({
      room: roomsManager.roomToDTO(room),
      playerId: player.id,
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return handleValidationError(error);
    }

    console.error("Error creating room:", error);
    return apiError("Failed to create room", 500);
  }
}
