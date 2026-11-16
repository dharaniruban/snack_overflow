import type { Queryable } from '../../db/pool';
import type { Role } from '../../types/auth';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: Date;
}

export interface SafeUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: Date;
}

export const userRepository = {
  async findByEmail(db: Queryable, email: string): Promise<UserRow | undefined> {
    const result = await db.query<UserRow>(
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE lower(email) = lower($1)',
      [email],
    );
    return result.rows[0];
  },

  async findById(db: Queryable, id: string): Promise<SafeUserRow | undefined> {
    const result = await db.query<SafeUserRow>(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [id],
    );
    return result.rows[0];
  },

  async create(
    db: Queryable,
    input: { name: string; email: string; passwordHash: string; role: Role },
  ): Promise<SafeUserRow> {
    const result = await db.query<SafeUserRow>(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [input.name, input.email, input.passwordHash, input.role],
    );
    return result.rows[0] as SafeUserRow;
  },
};
