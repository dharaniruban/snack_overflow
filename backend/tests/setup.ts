import { afterAll, beforeAll, beforeEach } from 'vitest';
import { runMigrations } from '../src/db/migrate';
import { pool } from '../src/db/pool';

beforeAll(async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set for tests');
  }
  await runMigrations(databaseUrl);
});

beforeEach(async () => {
  await pool.query(
    'TRUNCATE TABLE activity, votes, snacks, users, idempotency_keys RESTART IDENTITY CASCADE',
  );
});

afterAll(async () => {
  await pool.end();
});
