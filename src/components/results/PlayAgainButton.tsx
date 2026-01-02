"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface PlayAgainButtonProps {
  roomCode: string;
  playerId: string;
  isHost: boolean;
}

export function PlayAgainButton({ roomCode, playerId, isHost }: PlayAgainButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handlePlayAgain() {
    if (!isHost) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/rooms/${roomCode}/rematch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterPlayerId: playerId }),
      });

      if (!response.ok) {
        console.error("Failed to request rematch");
        setIsLoading(false);
        return;
      }

      router.push(`/room/${roomCode}?playerId=${playerId}`);
    } catch (error) {
      console.error("Rematch error:", error);
      setIsLoading(false);
    }
  }

  return (
    <div className="text-center pt-4">
      <button
        type="button"
        onClick={handlePlayAgain}
        disabled={isLoading || !isHost}
        className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xl font-black rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

        {/* Loading spinner */}
        {isLoading ? (
          <span className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white" />
            <span>{isHost ? "Preparando revancha..." : "Esperando al anfitrión..."}</span>
          </span>
        ) : (
          <>
            <span className="text-2xl">🎮</span>
            <span>{isHost ? "Jugar otra vez" : "Esperando al anfitrión"}</span>
          </>
        )}
      </button>
    </div>
  );
}
