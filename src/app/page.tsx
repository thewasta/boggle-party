'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDF8F3] relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-8xl font-bold text-indigo-900 rotate-12">B</div>
        <div className="absolute top-40 right-20 text-6xl font-bold text-purple-900 -rotate-6">O</div>
        <div className="absolute bottom-32 left-1/4 text-7xl font-bold text-indigo-800 rotate-3">G</div>
        <div className="absolute bottom-20 right-1/3 text-5xl font-bold text-purple-800 -rotate-12">L</div>
        <div className="absolute top-1/3 right-10 text-6xl font-bold text-indigo-900 rotate-6">E</div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Logo/Title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl">🎮</span>
            <h1 className="text-6xl md:text-7xl font-black tracking-tight" style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Boggle Party
            </h1>
            <span className="text-5xl">🎲</span>
          </div>
          <p className="text-xl text-zinc-600 font-medium max-w-md mx-auto">
            ¡Encuentra las palabras ocultas antes de que se acabe el tiempo!
          </p>
        </div>

        {/* Cards container */}
        <div className="w-full max-w-2xl grid md:grid-cols-2 gap-6">
          {/* Create Room Card */}
          <CreateRoomCard />

          {/* Join Room Card */}
          <JoinRoomCard />
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center text-zinc-500 text-sm flex items-center gap-6">
          <span className="flex items-center gap-2">
            <span>📝</span>
            <span>Juego en español</span>
          </span>
          <span className="flex items-center gap-2">
            <span>⏱️</span>
            <span>2-6 minutos por partida</span>
          </span>
          <span className="flex items-center gap-2">
            <span>👥</span>
            <span>2-8 jugadores</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function CreateRoomCard() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!playerName.trim()) {
      setError('Ingresa tu nombre');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Error al crear sala');
          return;
        }

        router.push(`/room/${data.room.code}?playerId=${data.playerId}`);
      } catch {
        setError('Error de conexión');
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-100 p-8 hover:shadow-2xl hover:border-indigo-200 transition-all duration-300">
      <div className="text-center mb-6">
        <span className="text-4xl mb-3 block">✨</span>
        <h2 className="text-2xl font-bold text-zinc-900">Crear Sala</h2>
        <p className="text-zinc-500 mt-2">Inicia una nueva partida</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Tu nombre"
            maxLength={20}
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors disabled:opacity-50"
          />
        </div>
        {error && (
          <p className="text-sm text-red-500 font-medium px-1">{error}</p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creando...
            </span>
          ) : '¡Crear Sala!'}
        </button>
      </form>
    </div>
  );
}

function JoinRoomCard() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('Código de sala inválido');
      return;
    }

    if (!playerName.trim()) {
      setError('Ingresa tu nombre');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/rooms/${roomCode.toUpperCase()}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Error al unirse');
          return;
        }

        router.push(`/room/${roomCode.toUpperCase()}?playerId=${data.playerId}`);
      } catch {
        setError('Error de conexión');
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-100 p-8 hover:shadow-2xl hover:border-purple-200 transition-all duration-300">
      <div className="text-center mb-6">
        <span className="text-4xl mb-3 block">🚀</span>
        <h2 className="text-2xl font-bold text-zinc-900">Unirse a Sala</h2>
        <p className="text-zinc-500 mt-2">Ingresa con un código</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => {
              const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
              setRoomCode(val);
            }}
            placeholder="CÓDIGO"
            maxLength={6}
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-purple-400 focus:bg-white transition-colors disabled:opacity-50 text-center text-2xl font-mono tracking-[0.3em] uppercase"
          />
        </div>
        <div>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Tu nombre"
            maxLength={20}
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-purple-400 focus:bg-white transition-colors disabled:opacity-50"
          />
        </div>
        {error && (
          <p className="text-sm text-red-500 font-medium px-1">{error}</p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Uniéndose...
            </span>
          ) : '¡Unirse!'}
        </button>
      </form>
    </div>
  );
}
