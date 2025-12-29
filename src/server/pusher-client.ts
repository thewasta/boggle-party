/**
 * Pusher server client singleton
 * Initializes Pusher with environment variables
 */

const Pusher = require('pusher');

let pusherInstance: any = null;

/**
 * Get or create Pusher client instance
 */
export function getPusherClient(): any {
  if (!pusherInstance) {
    const requiredEnvVars = {
      PUSHER_APP_ID: process.env.PUSHER_APP_ID,
      PUSHER_KEY: process.env.PUSHER_KEY,
      PUSHER_SECRET: process.env.PUSHER_SECRET,
      PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,
    };

    // Validate environment variables
    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    pusherInstance = new Pusher({
      appId: requiredEnvVars.PUSHER_APP_ID!,
      key: requiredEnvVars.PUSHER_KEY!,
      secret: requiredEnvVars.PUSHER_SECRET!,
      cluster: requiredEnvVars.PUSHER_CLUSTER!,
      useTLS: process.env.PUSHER_USE_TLS === 'true',
    });
  }

  return pusherInstance;
}

/**
 * Trigger an event on a Pusher channel
 */
export async function triggerEvent(
  channel: string,
  eventName: string,
  data: unknown
): Promise<void> {
  const pusher = getPusherClient();

  try {
    await pusher.trigger(channel, eventName, data);
  } catch (error) {
    console.error(`Failed to trigger Pusher event ${eventName} on ${channel}:`, error);
    throw new Error(`Pusher event failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
