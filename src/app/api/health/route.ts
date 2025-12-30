import { NextResponse } from 'next/server';
import { testConnection, getPool } from '@/server/db/connection';
import { roomsManager } from '@/server/rooms-manager';
import { getDictionaryStats } from '@/server/dictionary';
import { ensureDictionaryLoaded } from '@/server/dictionary-init';

export async function GET() {
  const health = {
    status: 'ok' as 'ok' | 'degraded' | 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown' as 'connected' | 'disconnected' | 'error',
      schema: 'unknown' as 'migrated' | 'not_migrated' | 'error',
      dictionary: 'unknown' as 'loaded' | 'not_loaded' | 'error',
    },
    metrics: {
      activeRooms: 0,
    },
  };

  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      health.services.database = 'disconnected';
      health.status = 'degraded';
      return NextResponse.json(health, { status: 503 });
    }

    health.services.database = 'connected';

    // Check if schema is migrated
    const pool = getPool();
    const schemaCheck = await pool.query(
      `SELECT EXISTS(
         SELECT FROM information_schema.tables
         WHERE table_name = 'games'
       )`
    );

    if (schemaCheck.rows[0].exists) {
      health.services.schema = 'migrated';
    } else {
      health.services.schema = 'not_migrated';
      health.status = 'degraded';
    }

    // Check dictionary status
    try {
      await ensureDictionaryLoaded();
      const dictStats = getDictionaryStats();

      if (dictStats.isLoaded) {
        health.services.dictionary = 'loaded';
      } else {
        health.services.dictionary = 'not_loaded';
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.dictionary = 'error';
      health.status = 'degraded';
    }

    // Get active room count
    health.metrics.activeRooms = roomsManager.getActiveRoomCount();

    return NextResponse.json(health, { status: health.status === 'ok' ? 200 : 503 });
  } catch (error) {
    health.status = 'error';

    return NextResponse.json(
      {
        ...health,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
