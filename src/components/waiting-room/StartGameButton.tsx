"use client";

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
  const cantStartReason =
    playerCount < minPlayers ? `Mínimo ${minPlayers} jugadores` : null;

  return (
    <button
      type="button"
      onClick={onStartGame}
      disabled={disabled || isLoading || !!cantStartReason}
      className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-zinc-400 disabled:to-zinc-500 text-white font-black text-lg rounded-xl transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-md"
    >
      {isLoading ? "Iniciando..." : cantStartReason || "🎮 ¡Empezar Juego!"}
    </button>
  );
}
