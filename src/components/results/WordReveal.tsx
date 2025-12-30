import { RevealWord } from '@/app/results/[roomId]/page';

interface WordRevealProps {
  word: RevealWord;
  delay: number;
}

export function WordReveal({ word, delay }: WordRevealProps) {
  return (
    <div
      className={`relative rounded-xl shadow-lg border-2 p-4 animate-word-reveal overflow-hidden ${
        word.isUnique
          ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-yellow-400 shadow-yellow-200/70'
          : 'bg-white border-indigo-200'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Unique word glow effect */}
      {word.isUnique && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 via-amber-200/30 to-yellow-300/20 animate-pulse" />
          <div className="absolute inset-0 border-2 border-yellow-400/30 rounded-xl animate-unique-glow" />
        </>
      )}

      {/* Main content */}
      <div className="relative flex items-center justify-between gap-4">
        {/* Player info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0 ${
              word.isUnique
                ? 'bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 border-2 border-yellow-300'
                : 'bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-indigo-300'
            }`}
          >
            {word.player.avatar}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-700 truncate">{word.player.name}</p>
            <p className="text-xs text-gray-500">encontró</p>
          </div>
        </div>

        {/* Word - Center stage */}
        <div className="flex-1 text-center px-4">
          <div
            className={`inline-block px-6 py-2 rounded-lg ${
              word.isUnique
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 shadow-lg shadow-yellow-200'
                : 'bg-gradient-to-r from-indigo-50 to-purple-50'
            }`}
          >
            <p
              className={`text-3xl md:text-4xl font-black tracking-tight ${
                word.isUnique ? 'text-yellow-900' : 'text-indigo-900'
              }`}
            >
              {word.word}
            </p>
          </div>
        </div>

        {/* Score and badges */}
        <div className="flex flex-col items-end gap-2 min-w-0">
          <div
            className={`px-4 py-2 rounded-full text-2xl font-black shadow-md ${
              word.isUnique
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-yellow-900 shadow-yellow-200'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
            }`}
          >
            +{word.score}
          </div>

          {word.isUnique && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-extrabold bg-yellow-400 text-yellow-900 shadow-sm">
                ¡ÚNICA!
              </span>
              <span className="text-lg font-black text-yellow-700">
                ×2
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sparkle decorations for unique words */}
      {word.isUnique && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full animate-sparkle-1" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-sparkle-2" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-orange-400 rounded-full animate-sparkle-3" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-sparkle-4" />
        </>
      )}
    </div>
  );
}
