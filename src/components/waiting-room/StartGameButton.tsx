'use client';

interface StartGameButtonProps {
  playerCount: number;
  onStartGame: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function StartGameButton({
  playerCount,
  onStartGame,
  disabled,
  isLoading,
}: StartGameButtonProps) {
  const minPlayers = 2;
  const cantStartReason = playerCount < minPlayers
    ? `Mínimo ${minPlayers} jugadores`
    : null;

  return (
    <button
      onClick={onStartGame}
      disabled={disabled || isLoading || !!cantStartReason}
      className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 disabled:bg-zinc-400 dark:disabled:bg-zinc-700 text-white font-bold text-lg rounded-lg transition-colors disabled:cursor-not-allowed"
    >
      {isLoading ? 'Iniciando...' : cantStartReason || '¡Empezar Juego!'}
    </button>
  );
}
