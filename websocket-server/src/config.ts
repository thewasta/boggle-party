/**
 * Get CORS origin from environment variable
 * Defaults to wildcard for development
 */
export function getCorsOrigin(): string {
  const origin = process.env.CORS_ORIGIN;
  if (origin) {
    return origin;
  }
  // Default: allow all origins in development
  return '*';
}

/**
 * Get HTTP port for internal API
 */
export function getHttpPort(): number {
  return parseInt(process.env.HTTP_PORT ?? '3001', 10);
}

/**
 * Get WebSocket port for public connections
 */
export function getWsPort(): number {
  return parseInt(process.env.PORT ?? '3002', 10);
}
