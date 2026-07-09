import express, { type Request, type Response } from 'express';
import { getIo } from './websocket.js';
import {
  EmitRequestSchema,
  PlayerJoinedEventSchema,
  PlayerLeftEventSchema,
  GameStartedEventSchema,
  GameEndedEventSchema,
  WordFoundEventSchema,
  RevealWordEventSchema,
  ResultsCompleteEventSchema,
  RematchRequestedEventSchema,
  RoomClosedEventSchema,
  SOCKET_EVENTS,
} from './types.js';

const app = express();

// Parse JSON body
app.use(express.json());

/**
 * POST /emit - Emit an event to a room/channel
 * Called by Next.js to broadcast events to connected clients
 */
app.post('/emit', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = EmitRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      });
    }

    const { channel, event, data } = result.data;
    const io = getIo();

    // Validate event data based on event type
    try {
      switch (event) {
        case SOCKET_EVENTS.PLAYER_JOINED:
          PlayerJoinedEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.PLAYER_LEFT:
          PlayerLeftEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.GAME_STARTED:
          GameStartedEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.GAME_ENDED:
          GameEndedEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.WORD_FOUND:
          WordFoundEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.REVEAL_WORD:
          RevealWordEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.RESULTS_COMPLETE:
          ResultsCompleteEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.REMATCH_REQUESTED:
          RematchRequestedEventSchema.parse(data);
          break;
        case SOCKET_EVENTS.ROOM_CLOSED:
          RoomClosedEventSchema.parse(data);
          break;
        default:
          console.warn(`[WS] Unknown event type: ${event}`);
      }
    } catch (validationError) {
      console.error(`[WS] Event validation failed for ${event}:`, validationError);
      return res.status(400).json({
        success: false,
        error: 'Event data validation failed',
      });
    }

    // Get room size
    const room = io.sockets.adapter.rooms.get(channel);
    const roomSize = room?.size ?? 0;

    // Emit event to all clients in the room
    io.to(channel).emit(event, data);

    console.log(`[WS] Emitted "${event}" to "${channel}" (${roomSize} clients)`);

    // Return success with client count
    res.json({
      success: true,
      deliveredTo: roomSize,
    });
  } catch (error) {
    console.error('[WS] Error emitting event:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /health - Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  const io = getIo();
  const roomCount = io.sockets.adapter.rooms.size;
  const clientCount = io.sockets.sockets.size;

  res.json({
    status: 'healthy',
    rooms: roomCount,
    clients: clientCount,
    timestamp: Date.now(),
  });
});

/**
 * Create and configure the Express HTTP server
 */
export function createHttpServer() {
  return app;
}
