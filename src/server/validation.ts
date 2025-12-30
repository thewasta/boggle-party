import { z } from 'zod';
import type { GridSize } from '@/server/db/schema';

export const createRoomSchema = z.object({
  playerName: z.string()
    .min(1, 'Player name is required')
    .max(20, 'Player name must be 20 characters or less')
    .trim(),
  avatar: z.string().optional(),
  gridSize: z.enum(['4', '5', '6']).transform((val): GridSize => parseInt(val, 10) as GridSize).optional(),
});

export const joinRoomSchema = z.object({
  roomCode: z.string()
    .length(6, 'Room code must be 6 characters')
    .regex(/^[A-Z0-9]+$/i, 'Room code must contain only letters and numbers')
    .toUpperCase(),
  playerName: z.string()
    .min(1, 'Player name is required')
    .max(20, 'Player name must be 20 characters or less')
    .trim(),
  avatar: z.string().optional(),
});

export const leaveRoomSchema = z.object({
  roomCode: z.string()
    .length(6, 'Room code must be 6 characters')
    .toUpperCase(),
  playerId: z.string().uuid('Invalid player ID'),
});

export const startGameSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  gridSize: z.enum(['4', '5', '6']).transform((val): GridSize => parseInt(val, 10) as GridSize),
});

export const getRoomSchema = z.object({
  code: z.string()
    .length(6, 'Room code must be 6 characters')
    .toUpperCase(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type LeaveRoomInput = z.infer<typeof leaveRoomSchema>;
export type StartGameInput = z.infer<typeof startGameSchema>;
export type GetRoomInput = z.infer<typeof getRoomSchema>;

/**
 * Cell position schema
 */
export const cellSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
});

/**
 * Word submission request schema
 */
export const wordSubmissionSchema = z.object({
  playerId: z.string().uuid('Invalid player ID'),
  word: z.string().min(3, 'Word must be at least 3 characters'),
  path: z.array(cellSchema).min(2, 'Path must have at least 2 cells'),
});

export type WordSubmissionInput = z.infer<typeof wordSubmissionSchema>;
