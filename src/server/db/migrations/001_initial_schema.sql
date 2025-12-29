-- Migration: 001_initial_schema
-- Description: Create initial tables for games, players, and words
-- Created: 2025-12-29

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Games table (for analytics/statistics)
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(6) NOT NULL UNIQUE,
  grid_size INTEGER NOT NULL CHECK (grid_size IN (4, 5, 6)),
  duration INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  total_words_found INTEGER DEFAULT 0
);

-- Game players table
CREATE TABLE IF NOT EXISTS game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_name VARCHAR(50) NOT NULL,
  avatar VARCHAR(100) NOT NULL,
  final_score INTEGER DEFAULT 0,
  words_found INTEGER DEFAULT 0,
  unique_words_found INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, player_name)
);

-- Game words table (for history/analytics)
CREATE TABLE IF NOT EXISTS game_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  word VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  is_unique BOOLEAN DEFAULT false,
  found_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_room_code ON games(room_code);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_words_game_id ON game_words(game_id);
CREATE INDEX IF NOT EXISTS idx_game_words_player_id ON game_words(player_id);

-- Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT NOW()
);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('001_initial_schema');
