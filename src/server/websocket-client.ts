/**
 * WebSocket server HTTP client
 * Allows Next.js API routes to emit events via the WebSocket server
 */

const WS_HTTP_URL = process.env.WS_HTTP_URL ?? 'http://localhost:3001';

interface EmitResponse {
  success: true;
  deliveredTo: number;
}

/**
 * Emit an event to a room/channel via the WebSocket server
 * @param channel - Room/channel name (e.g., 'game-ABC123')
 * @param event - Event name (e.g., 'player-joined')
 * @param data - Event payload
 * @returns Response with number of clients the event was delivered to
 */
export async function emitEvent(
  channel: string,
  event: string,
  data: unknown
): Promise<EmitResponse> {
  const response = await fetch(`${WS_HTTP_URL}/emit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, event, data }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to emit event: ${response.statusText} - ${text}`);
  }

  return response.json() as Promise<EmitResponse>;
}
