import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { getPool } from '../connection';
import { gamesRepository, playersRepository, wordsRepository } from '../repositories';

describe('Database Repositories Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database connection
    const pool = getPool();
    await pool.query('SELECT 1');
  });

  afterEach(async () => {
    // Clean up test data
    const pool = getPool();
    await pool.query('DELETE FROM game_words');
    await pool.query('DELETE FROM game_players');
    await pool.query('DELETE FROM games');
  });

  describe('GamesRepository', () => {
    it('should create a new game', async () => {
      const game = await gamesRepository.create({
        room_code: 'ABC123',
        grid_size: 4,
        duration: 120,
        status: 'waiting',
      });

      expect(game).toBeDefined();
      expect(game.id).toBeDefined();
      expect(game.room_code).toBe('ABC123');
      expect(game.grid_size).toBe(4);
      expect(game.duration).toBe(120);
      expect(game.status).toBe('waiting');
    });

    it('should find game by room code', async () => {
      const created = await gamesRepository.create({
        room_code: 'XYZ789',
        grid_size: 5,
        duration: 180,
        status: 'waiting',
      });

      const found = await gamesRepository.findByRoomCode('XYZ789');

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.room_code).toBe('XYZ789');
    });

    it('should update game status', async () => {
      const game = await gamesRepository.create({
        room_code: 'STATUS',
        grid_size: 4,
        duration: 120,
        status: 'waiting',
      });

      const updated = await gamesRepository.updateStatus(
        game.id,
        'playing',
        { started_at: new Date() }
      );

      expect(updated.status).toBe('playing');
      expect(updated.started_at).toBeDefined();
    });

    it('should detect existing room codes', async () => {
      // Create a game with a specific room code
      await gamesRepository.create({
        room_code: 'UNIQUE1',
        grid_size: 4,
        duration: 120,
        status: 'finished',
      });

      // Check that the code exists
      const exists = await gamesRepository.roomCodeExists('UNIQUE1');
      expect(exists).toBe(true);

      // Check that a different code does not exist
      const notExists = await gamesRepository.roomCodeExists('NOTREAL');
      expect(notExists).toBe(false);
    });
  });

  describe('PlayersRepository', () => {
    it('should create a player', async () => {
      const game = await gamesRepository.create({
        room_code: 'PLAYER',
        grid_size: 4,
        duration: 120,
        status: 'waiting',
      });

      const player = await playersRepository.create({
        game_id: game.id,
        player_name: 'Alice',
        avatar: '🎮',
      });

      expect(player).toBeDefined();
      expect(player.id).toBeDefined();
      expect(player.player_name).toBe('Alice');
      expect(player.avatar).toBe('🎮');
    });

    it('should get all players for a game', async () => {
      const game = await gamesRepository.create({
        room_code: 'MULTI',
        grid_size: 4,
        duration: 120,
        status: 'waiting',
      });

      await playersRepository.create({
        game_id: game.id,
        player_name: 'Alice',
        avatar: '🎮',
      });

      await playersRepository.create({
        game_id: game.id,
        player_name: 'Bob',
        avatar: '🎲',
      });

      const players = await playersRepository.findByGameId(game.id);

      expect(players).toHaveLength(2);
      expect(players[0].player_name).toBe('Alice');
      expect(players[1].player_name).toBe('Bob');
    });
  });

  describe('WordsRepository', () => {
    it('should record a found word', async () => {
      const game = await gamesRepository.create({
        room_code: 'WORDS',
        grid_size: 4,
        duration: 120,
        status: 'playing',
      });

      const player = await playersRepository.create({
        game_id: game.id,
        player_name: 'Charlie',
        avatar: '🎯',
      });

      const word = await wordsRepository.create({
        game_id: game.id,
        player_id: player.id,
        word: 'HOLA',
        word_length: 4,
        path: [{row: 0, col: 0}, {row: 0, col: 1}, {row: 1, col: 1}, {row: 1, col: 2}],
        score: 4,
        is_unique: true,
        found_at: new Date(),
      });

      expect(word).toBeDefined();
      expect(word.word).toBe('HOLA');
      expect(word.score).toBe(4);
      expect(word.is_unique).toBe(true);
    });

    it('should get all words for a player', async () => {
      const game = await gamesRepository.create({
        room_code: 'LIST',
        grid_size: 4,
        duration: 120,
        status: 'playing',
      });

      const player = await playersRepository.create({
        game_id: game.id,
        player_name: 'Diana',
        avatar: '🎪',
      });

      await wordsRepository.create({
        game_id: game.id,
        player_id: player.id,
        word: 'CASA',
        word_length: 4,
        path: [{row: 0, col: 0}, {row: 1, col: 0}, {row: 2, col: 0}, {row: 2, col: 1}],
        score: 4,
        is_unique: true,
        found_at: new Date(),
      });

      await wordsRepository.create({
        game_id: game.id,
        player_id: player.id,
        word: 'PERRO',
        word_length: 5,
        path: [{row: 0, col: 0}, {row: 0, col: 1}, {row: 1, col: 1}, {row: 2, col: 1}, {row: 2, col: 2}],
        score: 5,
        is_unique: false,
        found_at: new Date(),
      });

      const words = await wordsRepository.findByPlayerId(player.id);

      expect(words).toHaveLength(2);
      expect(words[0].word).toBe('CASA');
      expect(words[1].word).toBe('PERRO');
    });

    it('should check if word exists in game (case insensitive)', async () => {
      const game = await gamesRepository.create({
        room_code: 'CHECK',
        grid_size: 4,
        duration: 120,
        status: 'playing',
      });

      const player = await playersRepository.create({
        game_id: game.id,
        player_name: 'Eve',
        avatar: '🎭',
      });

      await wordsRepository.create({
        game_id: game.id,
        player_id: player.id,
        word: 'GATO',
        word_length: 4,
        path: [{row: 0, col: 0}, {row: 1, col: 0}, {row: 2, col: 0}, {row: 2, col: 1}],
        score: 4,
        is_unique: true,
        found_at: new Date(),
      });

      const existsLower = await wordsRepository.wordExistsInGame(game.id, 'gato');
      const existsUpper = await wordsRepository.wordExistsInGame(game.id, 'GATO');
      const notExists = await wordsRepository.wordExistsInGame(game.id, 'PERRO');

      expect(existsLower).toBe(true);
      expect(existsUpper).toBe(true);
      expect(notExists).toBe(false);
    });
  });
});
