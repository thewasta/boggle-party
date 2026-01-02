import { type NextRequest, NextResponse } from "next/server";
import {
  gamesRepository,
  playersRepository,
  wordsRepository,
} from "@/server/db/repositories";
import { roomsManager } from "@/server/rooms-manager";
import {
  calculateUniqueWords,
  prepareRevealSequence,
} from "@/server/word-unique-calculator";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = roomsManager.getRoom(code);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.status !== "finished") {
    return NextResponse.json({ error: "Game not finished" }, { status: 400 });
  }

  // Collect all found words from all players
  const allFoundWords: Array<{
    playerId: string;
    playerName: string;
    word: string;
    score: number;
  }> = [];

  for (const [playerId, player] of room.players) {
    for (const { word, score } of player.foundWords) {
      allFoundWords.push({
        playerId,
        playerName: player.name,
        word,
        score,
      });
    }
  }

  // Calculate unique words and prepare reveal sequence
  const wordsWithUniqueness = calculateUniqueWords(allFoundWords);
  const revealSequence = prepareRevealSequence(wordsWithUniqueness);

  // Save game to database
  try {
    const game = await gamesRepository.create({
      room_code: room.code,
      grid_size: room.gridSize,
      duration: room.duration,
      status: "finished",
      board: room.board,
    });

    // Save players
    const playerIds = new Map<string, string>();
    for (const [id, player] of room.players) {
      const dbPlayer = await playersRepository.create({
        game_id: game.id,
        player_name: player.name,
        avatar: player.avatar,
        final_score: player.score,
        words_found: player.foundWords.length,
        unique_words_found: 0,
        is_host: id === room.host.id,
      });
      playerIds.set(id, dbPlayer.id);
    }

    // Save words with uniqueness info
    for (const wordData of wordsWithUniqueness) {
      const dbPlayerId = playerIds.get(wordData.playerId);
      if (dbPlayerId) {
        await wordsRepository.create({
          game_id: game.id,
          player_id: dbPlayerId,
          word: wordData.word,
          score: wordData.isUnique ? wordData.score * 2 : wordData.score,
          is_unique: wordData.isUnique,
          word_length: wordData.word.length,
          path: [],
        });
      }
    }
  } catch (error) {
    console.error("Failed to save game to database:", error);
  }

  // Prepare initial player scores (all start at 0)
  const initialScores = Array.from(room.players.values()).map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    score: 0,
    position: 0,
  }));

  return NextResponse.json({
    revealSequence,
    totalWords: allFoundWords.length,
    initialScores,
    hostId: room.host.id,
    roomCode: room.code,
  });
}

function calculateWordScore(word: string): number {
  const length = word.length;
  if (length <= 4) return 1;
  if (length === 5) return 2;
  if (length === 6) return 3;
  return 5;
}
