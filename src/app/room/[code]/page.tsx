import { redirect } from 'next/navigation';
import type { RouteParams } from '@/server/types';

interface WaitingRoomPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ playerId?: string }>;
}

export default async function WaitingRoomPage({
  params,
  searchParams,
}: WaitingRoomPageProps) {
  const { code } = await params;
  const { playerId } = await searchParams;

  if (!playerId) {
    redirect('/');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/rooms/${code}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    redirect('/');
  }

  const data = await response.json();

  return (
    <WaitingRoomClient
      roomCode={code}
      roomId={data.room.id}
      initialPlayers={data.room.players}
      initialHost={data.room.host}
      initialGridSize={data.room.gridSize}
      initialStatus={data.room.status}
      currentPlayerId={playerId}
    />
  );
}

function WaitingRoomClient(props: {
  roomCode: string;
  roomId: string;
  initialPlayers: Array<{ id: string; name: string; avatar: string; isHost: boolean; score: number; foundWords: string[] }>;
  initialHost: { id: string };
  initialGridSize: number;
  initialStatus: string;
  currentPlayerId: string;
}) {
  return <div>Waiting Room: {props.roomCode}</div>;
}
