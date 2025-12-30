import type { RevealWord } from "@/app/results/[roomId]/page";

interface WordRevealProps {
  word: RevealWord;
  delay: number;
  isLatest?: boolean;
}

export function WordReveal({ word, delay, isLatest }: WordRevealProps) {
  return (
    <div
      className={`relative rounded-2xl shadow-lg border-2 p-4 overflow-hidden transition-all duration-500 ${
        word.isUnique
          ? "bg-linear-to-r from-amber-50 via-yellow-50 to-orange-50 border-yellow-400 shadow-yellow-200/50 scale-100 opacity-100"
          : "bg-white border-gray-200 scale-95 opacity-70"
      } ${isLatest ? "scale-100 opacity-100" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {word.isUnique && (
        <div className="absolute inset-0 bg-linear-to-r from-yellow-300/10 via-amber-200/20 to-yellow-300/10 animate-pulse" />
      )}

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-md ${
              word.isUnique
                ? "bg-linear-to-br from-amber-400 to-yellow-500"
                : "bg-linear-to-br from-gray-200 to-gray-300"
            }`}
          >
            {word.player.avatar}
          </div>
          <div className="hidden sm:block min-w-0">
            <p className="text-xs font-semibold text-gray-600 truncate">
              {word.player.name}
            </p>
          </div>
        </div>

        <div className="flex-1 text-center px-2">
          <p
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              word.isUnique ? "text-yellow-800" : "text-gray-800"
            }`}
          >
            {word.word}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`px-3 py-1 rounded-full text-lg font-bold shadow-sm ${
              word.isUnique
                ? "bg-linear-to-r from-amber-500 to-yellow-500 text-yellow-900"
                : "bg-linear-to-r from-emerald-400 to-green-500 text-white"
            }`}
          >
            +{word.score}
          </div>

          {word.isUnique && (
            <span className="text-lg font-black text-yellow-700">×2</span>
          )}
        </div>
      </div>

      {word.isUnique && isLatest && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-sparkle" />
          <div
            className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-sparkle"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-orange-400 rounded-full animate-sparkle"
            style={{ animationDelay: "0.4s" }}
          />
        </>
      )}
    </div>
  );
}
