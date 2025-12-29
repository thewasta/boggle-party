import { getPool } from '../connection';
import type { GameWordRow, CreateWordInput } from '../schema';

export class WordsRepository {
  /**
   * Create a new word record
   */
  async create(input: CreateWordInput): Promise<GameWordRow> {
    const pool = getPool();
    const query = `
      INSERT INTO game_words (id, game_id, player_id, word, score, is_unique, found_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      input.game_id,
      input.player_id,
      input.word,
      input.score,
      input.is_unique,
      input.found_at,
    ];

    const result = await pool.query<GameWordRow>(query, values);
    return result.rows[0];
  }

  /**
   * Find all words for a specific game
   */
  async findByGameId(gameId: string): Promise<GameWordRow[]> {
    const pool = getPool();
    const query = 'SELECT * FROM game_words WHERE game_id = $1 ORDER BY found_at ASC';
    const result = await pool.query<GameWordRow>(query, [gameId]);
    return result.rows;
  }

  /**
   * Find all words for a specific player in a game
   */
  async findByPlayerId(playerId: string): Promise<GameWordRow[]> {
    const pool = getPool();
    const query = 'SELECT * FROM game_words WHERE player_id = $1 ORDER BY found_at ASC';
    const result = await pool.query<GameWordRow>(query, [playerId]);
    return result.rows;
  }

  /**
   * Count unique words in a game (where is_unique = true)
   */
  async countUniqueWords(gameId: string): Promise<number> {
    const pool = getPool();
    const query = 'SELECT COUNT(*) as count FROM game_words WHERE game_id = $1 AND is_unique = true';
    const result = await pool.query<{ count: string }>(query, [gameId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if a word was found by any player in a game (case insensitive)
   */
  async wordExistsInGame(gameId: string, word: string): Promise<boolean> {
    const pool = getPool();
    const query = 'SELECT EXISTS(SELECT 1 FROM game_words WHERE game_id = $1 AND LOWER(word) = LOWER($2)) as exists';
    const result = await pool.query<{ exists: boolean }>(query, [gameId, word]);
    return result.rows[0].exists;
  }
}

/**
 * Singleton instance of the words repository
 */
export const wordsRepository = new WordsRepository();
