import { getPool } from '../connection';
import { GamePlayerRow, CreatePlayerInput } from '../schema';

export class PlayersRepository {
  /**
   * Add a player to a game
   */
  async create(input: CreatePlayerInput): Promise<GamePlayerRow> {
    const pool = getPool();

    const result = await pool.query<GamePlayerRow>(
      `INSERT INTO game_players (game_id, player_name, avatar)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.game_id, input.player_name, input.avatar]
    );

    return result.rows[0];
  }

  /**
   * Find player by ID
   */
  async findById(id: string): Promise<GamePlayerRow | null> {
    const pool = getPool();

    const result = await pool.query<GamePlayerRow>(
      'SELECT * FROM game_players WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all players for a game
   */
  async findByGameId(gameId: string): Promise<GamePlayerRow[]> {
    const pool = getPool();

    const result = await pool.query<GamePlayerRow>(
      'SELECT * FROM game_players WHERE game_id = $1 ORDER BY joined_at',
      [gameId]
    );

    return result.rows;
  }

  /**
   * Update player's final score
   */
  async updateScore(
    playerId: string,
    finalScore: number,
    wordsFound: number,
    uniqueWordsFound: number
  ): Promise<GamePlayerRow> {
    const pool = getPool();

    const result = await pool.query<GamePlayerRow>(
      `UPDATE game_players
       SET final_score = $2, words_found = $3, unique_words_found = $4
       WHERE id = $1
       RETURNING *`,
      [playerId, finalScore, wordsFound, uniqueWordsFound]
    );

    return result.rows[0];
  }
}

// Export singleton instance
export const playersRepository = new PlayersRepository();
