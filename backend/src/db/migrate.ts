import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

export async function runMigrations(connectionString: string): Promise<void> {
  const pool = new Pool({ connectionString });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();

    for (const file of files) {
      const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
      if (applied.rowCount && applied.rowCount > 0) {
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}
