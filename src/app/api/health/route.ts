import { NextResponse } from 'next/server';
import { testConnection } from '@/server/db/connection';

export async function GET() {
  const dbHealthy = await testConnection();

  return NextResponse.json({
    status: dbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: dbHealthy ? 'up' : 'down',
    },
  }, {
    status: dbHealthy ? 200 : 503,
  });
}
