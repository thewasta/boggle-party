import { getPool } from '../connection';
import type { GameRow, CreateGameInput, GameStatus } from '../schema';

export class GamesRepository {
  /**
   * Create a new game record
   */
  async create(input: CreateGameInput): Promise<GameRow> {
    const pool = getPool();
    const query = `
      INSERT INTO games (id, room_code, grid_size, duration, status, created_at, host_id, board)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      input.room_code,
      input.grid_size,
      input.duration,
      input.status,
      input.created_at,
      input.host_id || null,
      input.board ? JSON.stringify(input.board) : null,
    ];

    const result = await pool.query<GameRow>(query, values);
    return result.rows[0];
  }

  /**
   * Find a game by its ID
   */
  async findById(id: string): Promise<GameRow | null> {
    const pool = getPool();
    const query = 'SELECT * FROM games WHERE id = $1';
    const result = await pool.query<GameRow>(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find a game by its room code
   */
  async findByRoomCode(roomCode: string): Promise<GameRow | null> {
    const pool = getPool();
    const query = 'SELECT * FROM games WHERE room_code = $1';
    const result = await pool.query<GameRow>(query, [roomCode]);
    return result.rows[0] || null;
  }

  /**
   * Check if a room code already exists in the database
   */
  async roomCodeExists(roomCode: string): Promise<boolean> {
    const pool = getPool();
    const query = 'SELECT 1 FROM games WHERE room_code = $1 LIMIT 1';
    const result = await pool.query(query, [roomCode]);
    return result.rows.length > 0;
  }

  /**
   * Update game status with optional timestamps
   */
  async updateStatus(
    id: string,
    status: GameStatus,
    timestamps?: { started_at?: Date; ended_at?: Date }
  ): Promise<GameRow> {
    const pool = getPool();
    let query = 'UPDATE games SET status = $1';
    const values: any[] = [status];
    let paramIndex = 2;

    if (timestamps?.started_at) {
      query += `, started_at = $${paramIndex}`;
      values.push(timestamps.started_at);
      paramIndex++;
    }

    if (timestamps?.ended_at) {
      query += `, ended_at = $${paramIndex}`;
      values.push(timestamps.ended_at);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);

    const result = await pool.query<GameRow>(query, values);
    return result.rows[0];
  }

  /**
   * Increment the total_words_found counter for a game
   */
  async incrementWordsFound(id: string): Promise<void> {
    const pool = getPool();
    const query = 'UPDATE games SET total_words_found = total_words_found + 1 WHERE id = $1';
    await pool.query(query, [id]);
  }

  /**
   * Set or update the host of a game
   */
  async setHost(gameId: string, hostId: string): Promise<GameRow> {
    const pool = getPool();
    const query = 'UPDATE games SET host_id = $1 WHERE id = $2 RETURNING *';
    const result = await pool.query<GameRow>(query, [hostId, gameId]);
    return result.rows[0];
  }

  /**
   * Get game with host information
   */
  async findWithHost(id: string): Promise<GameRow | null> {
    const pool = getPool();
    const query = `
      SELECT g.*, hp.player_name as host_name, hp.avatar as host_avatar
      FROM games g
      LEFT JOIN game_players hp ON g.host_id = hp.id
      WHERE g.id = $1
    `;
    const result = await pool.query<GameRow>(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Set or update the shared board for a game
   */
  async setBoard(gameId: string, board: string[][]): Promise<GameRow> {
    const pool = getPool();
    const result = await pool.query<GameRow>(
      'UPDATE games SET board = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(board), gameId]
    );
    return result.rows[0];
  }
}

/**
 * Singleton instance of the games repository
 */
export const gamesRepository = new GamesRepository();
