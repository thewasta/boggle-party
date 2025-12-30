import type { PlayerScore } from "@/app/results/[roomId]/page";

interface ScoreStairsProps {
  playerScores: PlayerScore[];
}

export function ScoreStairs({ playerScores }: ScoreStairsProps) {
  const maxScore = Math.max(...playerScores.map((p) => p.score), 1);
  const sortedPlayers = [...playerScores].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      {sortedPlayers.map((player, index) => {
        const scorePercent = (player.score / maxScore) * 100;
        const isLeader = index === 0 && player.score > 0;

        return (
          <div key={player.id} className="relative">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 flex-shrink-0">
                <div
                  className={`w-full h-full rounded-2xl flex items-center justify-center text-2xl shadow-lg ${
                    isLeader
                      ? "bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 border-3 border-yellow-300"
                      : "bg-gradient-to-br from-coral-400 to-rose-500 border-2 border-rose-200"
                  }`}
                >
                  {player.avatar}
                </div>
                {isLeader && (
                  <div className="absolute -top-3 -right-1 text-2xl animate-crown-bounce">
                    👑
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1">
                  <span
                    className={`text-sm font-bold truncate ${
                      isLeader ? "text-amber-700" : "text-gray-700"
                    }`}
                  >
                    {player.name}
                  </span>
                  <span
                    className={`text-xl font-black tabular-nums ${
                      isLeader ? "text-amber-600" : "text-rose-600"
                    }`}
                  >
                    {player.score}
                  </span>
                </div>

                <div className="h-10 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${
                      isLeader
                        ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500"
                        : "bg-gradient-to-r from-coral-400 via-rose-400 to-pink-500"
                    }`}
                    style={{ width: `${scorePercent}%` }}
                  >
                    <div className="h-full w-full bg-gradient-to-b from-white/30 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// PlayerAvatar component removed - now integrated directly into ScoreStairs
