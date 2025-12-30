'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PlayAgainButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handlePlayAgain() {
    setIsLoading(true);
    router.push('/');
  }

  return (
    <div className="text-center pt-4">
      <button
        onClick={handlePlayAgain}
        disabled={isLoading}
        className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xl font-black rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

        {/* Loading spinner */}
        {isLoading ? (
          <span className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white" />
            <span>Cargando...</span>
          </span>
        ) : (
          <>
            <span className="text-2xl">🎮</span>
            <span>Jugar otra vez</span>
          </>
        )}
      </button>
    </div>
  );
}
