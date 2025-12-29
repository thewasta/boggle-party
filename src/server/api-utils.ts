import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type { RoomError } from './types';

export function apiError(
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status }
  );
}

export function handleValidationError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const errors = error.issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    return apiError('Validation failed', 400, errors);
  }

  return apiError('Invalid request', 400);
}

export function handleRoomError(error: unknown): NextResponse {
  if (error && typeof error === 'object' && 'code' in error) {
    const roomError = error as RoomError;

    switch (roomError.code) {
      case 'ROOM_NOT_FOUND':
        return apiError('Room not found', 404);
      case 'ROOM_FULL':
        return apiError('Room is full (max 8 players)', 400);
      case 'INVALID_CODE':
        return apiError(roomError.message, 400);
      case 'NOT_HOST':
        return apiError('Only the host can perform this action', 403);
      case 'GAME_ALREADY_STARTED':
        return apiError('Game already started', 400);
      default:
        return apiError('An error occurred', 500);
    }
  }

  return apiError('An error occurred', 500);
}

export function getDefaultAvatar(name: string): string {
  const avatars = ['🎮', '🚀', '🎯', '⭐', '🎪', '🎨', '🎭', '🎹', '🎸', '🎺'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatars[Math.abs(hash) % avatars.length];
}
