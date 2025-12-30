/**
 * Found Words List - displays current player's found words
 * Scrollable, newest words at top, shows score per word
 */

"use client";

import type { FoundWord } from '@/types/game';

interface FoundWordsListProps {
  words: FoundWord[];
}

export function FoundWordsList({ words }: FoundWordsListProps) {
  // Sort by timestamp descending (newest first)
  const sortedWords = [...words].sort((a, b) => b.timestamp - a.timestamp);

  const totalScore = words.reduce((sum, w) => sum + w.score, 0);

  return (
    <div className="w-full max-w-xs">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-purple-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-purple-500 to-indigo-500">
          <h3 className="text-lg font-black text-white tracking-tight">
            TUS PALABRAS
          </h3>
        </div>

        {/* Empty state */}
        {sortedWords.length === 0 && (
          <div className="py-12 px-6 text-center">
            <div className="text-5xl mb-3 opacity-50">🎯</div>
            <p className="text-zinc-500 font-medium text-sm">
              Arrastra para formar palabras
            </p>
          </div>
        )}

        {/* Word list */}
        {sortedWords.length > 0 && (
          <div className="max-h-64 overflow-y-auto">
            {sortedWords.map((item, index) => (
              <div
                key={`${item.word}-${item.timestamp}`}
                className="group flex items-center justify-between px-4 py-3 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
                    {item.word}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-black text-white bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-sm">
                    +{item.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total score footer */}
        {words.length > 0 && (
          <div className="px-5 py-4 bg-zinc-50 border-t-2 border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-600 tracking-wide">PUNTUACIÓN</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 animate-pulse" />
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                  {totalScore}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
