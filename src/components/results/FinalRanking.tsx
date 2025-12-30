import type { PlayerScore } from "@/app/results/[roomId]/page";
import { PlayAgainButton } from "./PlayAgainButton";

interface FinalRankingProps {
  playerScores: PlayerScore[];
}

export function FinalRanking({ playerScores }: FinalRankingProps) {
  const winner = playerScores[0];
  const topThree = playerScores.slice(0, 3);

  return (
    <div className="space-y-6">
      {winner && (
        <div className="text-center">
          <div className="text-6xl mb-3 animate-trophy-bounce">🏆</div>
          <h2 className="text-3xl font-black text-gray-900 mb-1">
            ¡{winner.name} gana!
          </h2>
          <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500">
            {winner.score} puntos
          </p>
        </div>
      )}

      <div className="flex items-end justify-center gap-3 sm:gap-6 py-4">
        {topThree.map((player, index) => {
          const medals = ["🥇", "🥈", "🥉"];
          const medalColors = [
            "from-yellow-400 to-amber-500",
            "from-gray-300 to-gray-400",
            "from-orange-400 to-amber-600",
          ];
          const podiumHeights = [
            "h-28 sm:h-36",
            "h-20 sm:h-28",
            "h-16 sm:h-24",
          ];
          const avatarSizes = [
            "w-14 h-14 sm:w-16 sm:h-16 text-2xl sm:text-3xl",
            "w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl",
            "w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl",
          ];

          return (
            <div key={player.id} className="flex flex-col items-center">
              <div className="text-4xl sm:text-5xl mb-2 animate-medal-float">
                {medals[index]}
              </div>

              <div
                className={`rounded-xl flex items-center justify-center shadow-lg border-3 bg-gradient-to-br ${medalColors[index]} ${avatarSizes[index]} ${
                  index === 0
                    ? "border-yellow-300"
                    : index === 1
                      ? "border-gray-200"
                      : "border-orange-300"
                }`}
              >
                {player.avatar}
              </div>

              <div className="mt-2 text-center">
                <p
                  className={`text-xs sm:text-sm font-bold ${
                    index === 0
                      ? "text-amber-700"
                      : index === 1
                        ? "text-gray-700"
                        : "text-orange-700"
                  }`}
                >
                  {player.name}
                </p>
                <p
                  className={`text-lg sm:text-xl font-black ${
                    index === 0
                      ? "text-amber-600"
                      : index === 1
                        ? "text-gray-600"
                        : "text-orange-600"
                  }`}
                >
                  {player.score}
                </p>
              </div>

              <div
                className={`w-14 sm:w-20 mt-2 rounded-t-lg bg-gradient-to-b ${medalColors[index]} ${podiumHeights[index]} opacity-80`}
              />
            </div>
          );
        })}
      </div>

      <PlayAgainButton />
    </div>
  );
}
