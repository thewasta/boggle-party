import { Server, type Socket } from 'socket.io';
import { createServer } from 'http';
import { getCorsOrigin } from './config.js';

let io: Server | null = null;

export interface SocketServerConfig {
  port: number;
  corsOrigin: string;
}

/**
 * Get the Socket.io server instance
 * @throws Error if server not initialized
 */
export function getIo(): Server {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
}

/**
 * Create and configure the WebSocket server
 */
export function createWebSocketServer(port: number): ReturnType<typeof createServer> {
  const httpServer = createServer();
  const corsOrigin = getCorsOrigin();

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Handle client connections
  io.on('connection', (socket: Socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    // Join a game room
    socket.on('join-room', (roomCode: string) => {
      const roomName = `game-${roomCode}`;
      socket.join(roomName);
      console.log(`[WS] Socket ${socket.id} joined room: ${roomName}`);
    });

    // Leave a game room
    socket.on('leave-room', (roomCode: string) => {
      const roomName = `game-${roomCode}`;
      socket.leave(roomName);
      console.log(`[WS] Socket ${socket.id} left room: ${roomName}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
    });
  });

  return httpServer;
}
