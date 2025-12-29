-- Migration: 002_add_missing_critical_fields
-- Description: Add missing critical fields for Boggle Party requirements
-- Created: 2025-12-29
-- Issues fixed:
--   - Add host_id to games (room ownership)
--   - Add is_host to game_players (identify host)
--   - Add board to game_players (unique board per player)
--   - Add word_length to game_words (scoring analytics)
--   - Add path to game_words (word submission path for validation)

-- Add host identification to games table
ALTER TABLE games ADD COLUMN host_id UUID REFERENCES game_players(id);

-- Add host flag and board to game_players table
ALTER TABLE game_players ADD COLUMN is_host BOOLEAN DEFAULT false;
ALTER TABLE game_players ADD COLUMN board JSONB;

-- Add word length and path to game_words table
ALTER TABLE game_words ADD COLUMN word_length INTEGER NOT NULL DEFAULT 0;
ALTER TABLE game_words ADD COLUMN path JSONB;

-- Create index for word_length (scoring analytics)
CREATE INDEX IF NOT EXISTS idx_game_words_length ON game_words(word_length);

-- Create composite index for game + host lookups (optimizes host queries)
CREATE INDEX IF NOT EXISTS idx_game_players_game_host ON game_players(game_id, is_host);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('002_add_missing_critical_fields');
