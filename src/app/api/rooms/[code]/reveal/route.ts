import { NextRequest, NextResponse } from 'next/server';
import { roomsManager } from '@/server/rooms-manager';
import { emitRevealWord, emitResultsComplete } from '@/server/event-emitter';
import type { RevealWordData } from '@/server/word-unique-calculator';

const REVEAL_DELAY_MS = 2500;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = roomsManager.getRoom(code);

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  if (room.status !== 'finished') {
    return NextResponse.json({ error: 'Game not finished' }, { status: 400 });
  }

  const body = await request.json();
  const revealSequence: RevealWordData[] = body.revealSequence || [];

  // Start sequential reveal
  startRevealSequence(room.code, revealSequence);

  return NextResponse.json({ started: true });
}

async function startRevealSequence(roomCode: string, words: RevealWordData[]) {
  const room = roomsManager.getRoom(roomCode);
  if (!room) return;

  for (const wordData of words) {
    const player = room.players.get(wordData.playerId);
    if (!player) continue;

    await emitRevealWord(
      roomCode,
      wordData.word,
      {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
      },
      wordData.isUnique ? wordData.score * 2 : wordData.score,
      wordData.isUnique
    );

    await new Promise(resolve => setTimeout(resolve, REVEAL_DELAY_MS));
  }

  // Emit results complete event
  const finalRankings = Array.from(room.players.values())
    .map(p => ({ id: p.id, name: p.name, avatar: p.avatar, score: p.score }))
    .sort((a, b) => b.score - a.score);

  await emitResultsComplete(roomCode, finalRankings);
}
