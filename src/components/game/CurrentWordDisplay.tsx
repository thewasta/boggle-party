/**
 * Current Word Display (HUD)
 * Shows the word being formed with validation feedback
 */

"use client";

import type { WordValidationStatus } from '@/types/game';

interface CurrentWordDisplayProps {
  currentWord: string;
  validationStatus: WordValidationStatus;
  wordCount: number;
}

export function CurrentWordDisplay({
  currentWord,
  validationStatus,
  wordCount,
}: CurrentWordDisplayProps) {
  const getStatusIndicator = () => {
    switch (validationStatus) {
      case 'valid':
        return (
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center animate-check-bounce">
            <span className="text-green-600 text-2xl">✓</span>
          </div>
        );
      case 'invalid':
        return (
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center animate-shake">
            <span className="text-red-600 text-2xl">✗</span>
          </div>
        );
      case 'duplicate':
        return (
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-amber-600 text-2xl">⚠</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (validationStatus) {
      case 'invalid':
        return <span className="text-red-600 font-bold">No válida</span>;
      case 'duplicate':
        return <span className="text-amber-700 font-bold">Ya encontrada</span>;
      default:
        return null;
    }
  };

  const getWordStyles = () => {
    const baseStyles = "font-black tracking-wider min-h-[48px] transition-all duration-200 ";
    if (currentWord.length === 0) {
      return baseStyles + "text-zinc-300 text-4xl";
    }
    switch (validationStatus) {
      case 'valid':
        return baseStyles + "text-green-700 text-5xl scale-105";
      case 'invalid':
        return baseStyles + "text-red-700 text-5xl";
      case 'duplicate':
        return baseStyles + "text-amber-700 text-5xl";
      default:
        return baseStyles + "text-indigo-900 text-5xl";
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-indigo-200 overflow-hidden">
        {/* Header with word count badge */}
        <div className="flex justify-end px-5 pt-4 pb-2">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-md">
            <span className="text-white/90 text-xs font-bold tracking-wider">ENCONTRADAS</span>
            <span className="text-white text-lg font-black">{wordCount}</span>
          </div>
        </div>

        {/* Current word display area */}
        <div className="flex items-center justify-center gap-4 px-6 py-6 min-h-[100px]">
          {/* Empty state placeholder */}
          {currentWord.length === 0 && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-zinc-300 text-4xl">—</span>
              <span className="text-zinc-400 text-sm font-medium">
                Arrastra para formar palabras
              </span>
            </div>
          )}

          {/* Active word display */}
          {currentWord.length > 0 && (
            <>
              <div className={getWordStyles()}>
                {currentWord}
              </div>
              {getStatusIndicator()}
            </>
          )}
        </div>

        {/* Status message footer */}
        {getStatusMessage() && (
          <div className="px-6 pb-4">
            <div className="text-center py-2 px-4 rounded-xl bg-zinc-50">
              {getStatusMessage()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
