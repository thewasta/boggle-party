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
        {/* Current word display area */}
        <div className="flex items-center justify-center gap-4 px-6 py-6 min-h-[100px]">
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
      </div>
    </div>
  );
}
