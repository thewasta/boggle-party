'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePusherChannel } from '@/hooks/usePusherChannel';
import { ScoreStairs } from '@/components/results/ScoreStairs';
import { WordReveal } from '@/components/results/WordReveal';

export interface PlayerScore {
  id: string;
  name: string;
  avatar: string;
  score: number;
  position: number;
}

export interface RevealWord {
  word: string;
  player: { id: string; name: string; avatar: string };
  score: number;
  isUnique: boolean;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [revealedWords, setRevealedWords] = useState<RevealWord[]>([]);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [isRevealComplete, setIsRevealComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to Pusher events
  usePusherChannel(roomId, {
    onRevealWord: (data) => {
      setRevealedWords(prev => [...prev, data]);
      updatePlayerScore(data);
    },
    onResultsComplete: (data) => {
      setIsRevealComplete(true);
      setPlayerScores(data.finalRankings.map((p, i) => ({ ...p, position: i + 1 })));
    },
  });

  useEffect(() => {
    // Prepare and start reveal
    prepareResults();
  }, [roomId]);

  async function prepareResults() {
    try {
      const response = await fetch(`/api/rooms/${roomId}/results`, { method: 'POST' });
      if (!response.ok) {
        router.push('/');
        return;
      }

      const data = await response.json();

      // Initialize player scores at 0
      const response2 = await fetch(`/api/rooms/${roomId}`);
      const roomData = await response2.json();
      const initialScores = roomData.players.map((p: any) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: 0,
        position: 0,
      }));
      setPlayerScores(initialScores);

      // Start reveal
      await fetch(`/api/rooms/${roomId}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revealSequence: data.revealSequence }),
      });
    } catch (error) {
      console.error('Failed to prepare results:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }

  function updatePlayerScore(wordData: RevealWord) {
    setPlayerScores(prev =>
      prev.map(p =>
        p.id === wordData.player.id
          ? { ...p, score: p.score + wordData.score }
          : p
      )
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4" />
          <p className="text-indigo-900 text-lg">Preparando resultados...</p>
        </div>
      </div>
    );
  }

  if (isRevealComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <FinalRanking playerScores={playerScores} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 overflow-hidden">
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-4xl font-bold text-center text-indigo-900 mb-8">
          Revelando palabras
        </h1>

        <ScoreStairs playerScores={playerScores} />

        <div className="mt-8 space-y-3">
          {revealedWords.map((word, index) => (
            <WordReveal key={`${word.word}-${index}`} word={word} delay={index * 100} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Placeholder components - will be implemented in next tasks
function FinalRanking({ playerScores }: { playerScores: PlayerScore[] }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-indigo-900 mb-6">¡Resultados finales!</h2>
      {playerScores.map((p) => (
        <div key={p.id} className="py-2">{p.name}: {p.score}</div>
      ))}
    </div>
  );
}
