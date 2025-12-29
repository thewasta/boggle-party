import { NextResponse } from 'next/server';
import { runMigrations } from '@/server/db/migrate';

export async function POST() {
  try {
    await runMigrations();

    return NextResponse.json(
      { success: true, message: 'Migrations completed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Migration failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Migration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
