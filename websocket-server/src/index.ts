import { createHttpServer } from './http.js';
import { createWebSocketServer, getIo } from './websocket.js';

const HTTP_PORT = parseInt(process.env.HTTP_PORT ?? '3001', 10);
const WS_PORT = parseInt(process.env.PORT ?? '3002', 10);

// Start HTTP API server (internal, for Next.js)
const httpServer = createHttpServer();
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`HTTP API listening on port ${HTTP_PORT}`);
});

// Start WebSocket server (public, for clients)
const wsServer = createWebSocketServer(WS_PORT);
wsServer.listen(WS_PORT, '0.0.0.0', () => {
  console.log(`WebSocket server listening on port ${WS_PORT}`);
});

// Export io instance for HTTP server to use
export { getIo };
