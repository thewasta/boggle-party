"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FinalRanking } from "@/components/results/FinalRanking";
import { ScoreStairs } from "@/components/results/ScoreStairs";
import { WordReveal } from "@/components/results/WordReveal";
import { usePusherChannel } from "@/hooks/usePusherChannel";

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
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const playerId = searchParams.get("playerId") || "";
  const roomId = params.roomId as string;

  const [revealedWords, setRevealedWords] = useState<RevealWord[]>([]);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [isRevealComplete, setIsRevealComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const updatePlayerScore = useCallback((wordData: RevealWord) => {
    setPlayerScores((prev) =>
      prev.map((p) =>
        p.id === wordData.player.id
          ? { ...p, score: p.score + wordData.score }
          : p,
      ),
    );
  }, []);

  usePusherChannel(roomId, {
    onRevealWord: (data) => {
      setRevealedWords((prev) => [...prev, data]);
      updatePlayerScore(data);
    },
    onResultsComplete: (data) => {
      setIsRevealComplete(true);
      setPlayerScores(
        data.finalRankings.map((p, i) => ({ ...p, position: i + 1 })),
      );
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run on mount
  useEffect(() => {
    prepareResults();
  }, [roomId]);

  async function prepareResults() {
    try {
      const response = await fetch(`/api/rooms/${roomId}/results`, {
        method: "POST",
      });
      if (!response.ok) {
        router.push("/");
        return;
      }

      const data = await response.json();
      setPlayerScores(data.initialScores);

      // Only host should call the reveal endpoint to avoid duplicate events
      if (playerId === data.hostId) {
        await fetch(`/api/rooms/${roomId}/reveal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revealSequence: data.revealSequence }),
        });
      }
    } catch (error) {
      console.error("Failed to prepare results:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-rose-500 mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-semibold">
            Preparando resultados...
          </p>
        </div>
      </div>
    );
  }

  if (isRevealComplete) {
    return (
      <div className="h-screen bg-[#FDF8F3] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <FinalRanking playerScores={playerScores} />
        </div>
      </div>
    );
  }

  const latestWords = revealedWords.slice(-2);

  return (
    <div className="h-screen bg-[#FDF8F3] flex flex-col p-4 overflow-hidden">
      <div className="w-full max-w-lg mx-auto flex flex-col h-full">
        <h1 className="text-2xl font-black text-center text-gray-900 mb-4">
          Revelando palabras
        </h1>

        <div className="shrink-0 mb-4">
          <ScoreStairs playerScores={playerScores} />
        </div>

        <div className="flex-1 flex flex-col justify-center gap-2 overflow-hidden">
          {latestWords.length === 0 ? (
            <p className="text-center text-gray-400">
              Esperando primera palabra...
            </p>
          ) : (
            latestWords.map((word, i) => (
              <WordReveal
                key={`${word.word}-${revealedWords.indexOf(word)}`}
                word={word}
                delay={i * 100}
                isLatest={i === latestWords.length - 1}
              />
            ))
          )}
        </div>

        <div className="text-center py-2">
          <p className="text-sm font-semibold text-gray-500">
            {revealedWords.length} palabra
            {revealedWords.length !== 1 ? "s" : ""} revelada
            {revealedWords.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
