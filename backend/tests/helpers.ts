import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../src/db/pool';
import type { Role } from '../src/types/auth';

export interface TestUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  token: string;
}

export async function createUser(options: {
  email: string;
  name?: string;
  role?: Role;
  password?: string;
}): Promise<TestUser> {
  const role = options.role ?? 'member';
  const password = options.password ?? 'password123';
  const name = options.name ?? options.email.split('@')[0] ?? 'Test User';
  // Cost 4 keeps the suite fast; bcrypt.compare still validates the hash.
  const passwordHash = await bcrypt.hash(password, 4);

  const result = await pool.query<{ id: string; name: string; email: string; role: Role }>(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
    [name, options.email, passwordHash, role],
  );
  const user = result.rows[0] as TestUser;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET must be set for tests');
  }
  user.token = jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '1h' });
  return user;
}

export async function createSnack(options: {
  name: string;
  category?: string;
  quantity?: number;
  lowStockThreshold?: number;
}): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO snacks (name, category, quantity, low_stock_threshold)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [
      options.name,
      options.category ?? 'sweet',
      options.quantity ?? 10,
      options.lowStockThreshold ?? 5,
    ],
  );
  return (result.rows[0] as { id: string }).id;
}

export function authHeaders(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export async function getSnackQuantity(snackId: string): Promise<number> {
  const result = await pool.query<{ quantity: number }>('SELECT quantity FROM snacks WHERE id = $1', [snackId]);
  return (result.rows[0] as { quantity: number }).quantity;
}

export async function countRows(table: 'activity' | 'votes', snackId?: string): Promise<number> {
  const result = snackId
    ? await pool.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM ${table} WHERE snack_id = $1`, [snackId])
    : await pool.query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM ${table}`);
  return (result.rows[0] as { count: number }).count;
}
