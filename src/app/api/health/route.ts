import { NextResponse } from 'next/server';
import { testConnection, getPool } from '@/server/db/connection';
import { roomsManager } from '@/server/rooms-manager';

export async function GET() {
  const health = {
    status: 'ok' as 'ok' | 'degraded' | 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown' as 'up' | 'down' | 'error',
      schema: 'unknown' as 'migrated' | 'not_migrated' | 'error',
      rooms: {
        active: roomsManager.getRoomCount(),
      },
    },
  };

  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      health.services.database = 'down';
      health.status = 'degraded';
      return NextResponse.json(health, { status: 503 });
    }

    health.services.database = 'up';

    // Check if schema is migrated
    const pool = getPool();
    const schemaCheck = await pool.query(
      `SELECT EXISTS(
         SELECT FROM information_schema.tables
         WHERE table_name = 'games'
       ) as exists`
    );

    if (schemaCheck.rows[0].exists) {
      health.services.schema = 'migrated';
    } else {
      health.services.schema = 'not_migrated';
      health.status = 'degraded';
    }

    return NextResponse.json(health, { status: health.status === 'ok' ? 200 : 503 });
  } catch (error) {
    health.status = 'error';
    health.services.database = 'error';

    return NextResponse.json(
      {
        ...health,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
