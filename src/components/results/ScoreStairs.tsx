import { PlayerScore } from '@/app/results/[roomId]/page';

interface ScoreStairsProps {
  playerScores: PlayerScore[];
}

export function ScoreStairs({ playerScores }: ScoreStairsProps) {
  const maxScore = Math.max(...playerScores.map(p => p.score), 10);
  const leader = playerScores.sort((a, b) => b.score - a.score)[0];

  return (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-indigo-200 bg-gradient-to-b from-indigo-100/80 via-purple-50/60 to-amber-50/40">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(99, 102, 241, 0.1) 10px,
            rgba(99, 102, 241, 0.1) 20px
          )`
        }} />
      </div>

      {/* Stair steps */}
      <div className="absolute inset-0 flex flex-col-reverse justify-around p-4 py-6">
        {Array.from({ length: 10 }, (_, i) => {
          const stepValue = Math.round((maxScore / 10) * (9 - i));
          const isTopStep = i === 9;
          return (
            <div
              key={i}
              className="relative w-full"
              style={{ bottom: `${i * 10}%` }}
            >
              {/* Step line with depth effect */}
              <div className={`border-t-2 ${isTopStep ? 'border-indigo-400 border-b-2' : 'border-dashed border-indigo-200'} relative`}>
                {/* Score label */}
                <span className={`absolute -left-1 -top-3 text-xs font-bold ${
                  isTopStep ? 'text-indigo-600 text-base' : 'text-indigo-300'
                }`}>
                  {stepValue}
                </span>
                {/* 3D depth shadow for top step */}
                {isTopStep && (
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-200/30 to-transparent -bottom-1 left-0 right-0 h-2" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Player avatars on stairs */}
      <div className="absolute inset-0 pointer-events-none">
        {playerScores
          .sort((a, b) => b.score - a.score)
          .map((player, index) => {
            const heightPercent = Math.min((player.score / maxScore) * 85, 90);
            const isLeader = index === 0 && player.score > 0;

            return (
              <div
                key={player.id}
                className="absolute left-0 right-0 flex justify-center transition-all duration-700 ease-out"
                style={{
                  bottom: `${heightPercent}%`,
                  zIndex: 10 - index
                }}
              >
                <PlayerAvatar
                  avatar={player.avatar}
                  name={player.name}
                  score={player.score}
                  position={player.position}
                  isLeader={isLeader}
                  delay={index * 100}
                />
              </div>
            );
          })}
      </div>

      {/* Winner glow effect at top */}
      {leader && leader.score > 0 && (
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-400/20 via-yellow-200/10 to-transparent pointer-events-none animate-pulse" />
      )}
    </div>
  );
}

export interface PlayerAvatarProps {
  avatar: string;
  name: string;
  score: number;
  position: number;
  isLeader: boolean;
  delay: number;
}

export function PlayerAvatar({ avatar, name, score, position, isLeader, delay }: PlayerAvatarProps) {
  return (
    <div
      className="flex flex-col items-center animate-climb-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative">
        {/* Avatar container with elevation shadow */}
        <div className={`relative rounded-full flex items-center justify-center text-3xl shadow-xl ${
          isLeader
            ? 'w-20 h-20 bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 border-4 border-yellow-300'
            : 'w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-white'
        }`}>
          {avatar}

          {/* Crown for leader */}
          {isLeader && (
            <div className="absolute -top-5 -right-2 text-3xl animate-crown-bounce drop-shadow-lg">
              👑
            </div>
          )}

          {/* Score badge */}
          {score > 0 && (
            <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-sm font-bold shadow-md ${
              isLeader
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-yellow-900'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
            }`}>
              {score}
            </div>
          )}
        </div>

        {/* Ground shadow */}
        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/10 blur-sm ${
          isLeader ? 'w-16 h-3' : 'w-12 h-2'
        }`} />
      </div>

      {/* Player name */}
      <div className="mt-3 text-center">
        <p className={`text-sm font-bold ${
          isLeader ? 'text-amber-700' : 'text-indigo-900'
        }`}>
          {name}
        </p>
        {isLeader && score > 0 && (
          <p className="text-xs text-amber-600 font-semibold">¡Líder!</p>
        )}
      </div>
    </div>
  );
}
