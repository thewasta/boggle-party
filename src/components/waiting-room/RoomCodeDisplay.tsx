"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/utils";

interface RoomCodeDisplayProps {
  roomCode: string;
}

export function RoomCodeDisplay({ roomCode }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(roomCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-indigo-700">
        Comparte este código con tus amigos
      </p>
      <div className="flex items-center gap-3">
        <code className="text-5xl font-mono font-black tracking-widest text-indigo-700 px-6 py-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border-2 border-indigo-300">
          {roomCode}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          aria-label="Copiar código"
        >
          {copied ? (
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-label="Copiado"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-label="Copiar"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      </div>
      {copied && (
        <p className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full">
          ¡Copiado!
        </p>
      )}
    </div>
  );
}
