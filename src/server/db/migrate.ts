import { getPool } from './connection';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Migration {
  version: string;
  appliedAt: Date;
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const pool = getPool();

  // Ensure migrations table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const result = await pool.query<Migration>('SELECT version FROM schema_migrations');
  return new Set(result.rows.map((row) => row.version));
}

async function runMigration(version: string, sql: string): Promise<void> {
  const pool = getPool();

  console.log(`Running migration: ${version}`);

  try {
    await pool.query('BEGIN');

    // Run migration SQL
    await pool.query(sql);

    // Record migration
    await pool.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);

    await pool.query('COMMIT');
    console.log(`✓ Migration ${version} completed`);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`✗ Migration ${version} failed:`, error);
    throw error;
  }
}

export async function runMigrations(): Promise<void> {
  console.log('Checking database migrations...');

  const appliedMigrations = await getAppliedMigrations();
  const migrationFiles = ['001_initial_schema', '002_add_missing_critical_fields', '003_move_board_to_games'];

  for (const version of migrationFiles) {
    if (appliedMigrations.has(version)) {
      console.log(`○ Migration ${version} already applied, skipping`);
      continue;
    }

    const sqlPath = join(__dirname, 'migrations', `${version}.sql`);
    const sql = readFileSync(sqlPath, 'utf-8');

    await runMigration(version, sql);
  }

  console.log('Migrations completed');
}

// CLI: Run migrations directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('All migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
