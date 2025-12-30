import { NextResponse } from 'next/server';
import { getDictionaryStats, getDictionary } from '@/server/dictionary';

export async function GET() {
  const stats = getDictionaryStats();

  if (!stats.isLoaded) {
    try {
      await getDictionary();
      return NextResponse.json({
        status: 'loaded',
        ...getDictionaryStats(),
      });
    } catch (error) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Failed to load dictionary',
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    status: 'ok',
    ...stats,
  });
}
