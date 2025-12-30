import { PlayerScore } from '@/app/results/[roomId]/page';
import { PlayAgainButton } from './PlayAgainButton';

interface FinalRankingProps {
  playerScores: PlayerScore[];
}

export function FinalRanking({ playerScores }: FinalRankingProps) {
  const winner = playerScores[0];
  const topThree = playerScores.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Winner celebration */}
      {winner && (
        <div className="text-center animate-celebrate">
          <div className="text-7xl md:text-8xl mb-4 animate-trophy-bounce">🏆</div>
          <h2 className="text-4xl md:text-5xl font-black text-indigo-900 mb-2">
            ¡{winner.name} gana!
          </h2>
          <p className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600">
            {winner.score} puntos
          </p>
        </div>
      )}

      {/* Podium for top 3 */}
      <div className="flex items-end justify-center gap-4 md:gap-8 py-8">
        {topThree.map((player, index) => {
          const medals = ['🥇', '🥈', '🥉'];
          const medalColors = [
            'from-yellow-400 to-amber-500',
            'from-gray-300 to-gray-400',
            'from-orange-400 to-amber-600'
          ];
          const podiumHeights = ['h-32 md:h-40', 'h-24 md:h-32', 'h-20 md:h-28'];
          const delays = ['delay-100', 'delay-200', 'delay-300'];

          return (
            <div
              key={player.id}
              className={`flex flex-col items-center ${delays[index]} animate-podium-appear`}
            >
              {/* Medal */}
              <div className={`text-5xl md:text-6xl mb-3 animate-medal-float ${
                index === 0 ? 'animate-medal-glow' : ''
              }`}>
                {medals[index]}
              </div>

              {/* Avatar */}
              <div
                className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl shadow-xl border-4 bg-gradient-to-br ${medalColors[index]} ${
                  index === 0 ? 'border-yellow-300' : index === 1 ? 'border-gray-200' : 'border-orange-300'
                }`}
              >
                {player.avatar}
              </div>

              {/* Name and score */}
              <div className="mt-3 text-center">
                <p className={`font-bold text-sm md:text-base ${
                  index === 0 ? 'text-amber-700' : index === 1 ? 'text-gray-700' : 'text-orange-700'
                }`}>
                  {player.name}
                </p>
                <p className={`text-xl md:text-2xl font-black ${
                  index === 0 ? 'text-amber-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'
                }`}>
                  {player.score}
                </p>
              </div>

              {/* Podium base */}
              <div
                className={`w-20 md:w-24 mt-4 rounded-t-lg bg-gradient-to-b ${medalColors[index]} ${podiumHeights[index]} opacity-80`}
              />
            </div>
          );
        })}
      </div>

      {/* Full ranking table */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h3 className="text-xl md:text-2xl font-bold text-white text-center">
            🎯 Clasificación Final
          </h3>
        </div>

        <table className="w-full">
          <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-bold text-indigo-900">#</th>
              <th className="py-3 px-4 text-left text-sm font-bold text-indigo-900">Jugador</th>
              <th className="py-3 px-4 text-right text-sm font-bold text-indigo-900">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {playerScores.map((player, index) => (
              <tr
                key={player.id}
                className={`border-b border-gray-100 transition-all duration-200 hover:bg-indigo-50 hover:scale-[1.01] ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100' : ''
                }`}
              >
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${
                    index === 0
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900'
                      : index === 1
                      ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700'
                      : index === 2
                      ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-orange-900'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {player.position}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 ${
                      index === 0
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300'
                        : 'bg-gradient-to-br from-indigo-400 to-purple-500 border-indigo-300'
                    }`}>
                      {player.avatar}
                    </div>
                    <span className="font-semibold text-gray-800">{player.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className={`text-xl font-black ${
                    index === 0 ? 'text-amber-600' : 'text-indigo-600'
                  }`}>
                    {player.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Play again button */}
      <PlayAgainButton />
    </div>
  );
}
