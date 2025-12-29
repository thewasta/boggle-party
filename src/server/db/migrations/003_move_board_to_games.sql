-- Migration: 003_move_board_to_games
-- Description: Move board from game_players to games (shared board per room)
-- Created: 2025-12-29
-- Reason: Boggle Party uses shared boards (traditional Boggle rules)
--          All players in a room see the same board and compete to find words

-- Add board column to games table
ALTER TABLE games ADD COLUMN board JSONB;

-- Remove board column from game_players (no longer needed)
ALTER TABLE game_players DROP COLUMN IF EXISTS board;

-- Add index for board queries (future analytics)
CREATE INDEX IF NOT EXISTS idx_games_board ON games USING GIN (board);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('003_move_board_to_games');
