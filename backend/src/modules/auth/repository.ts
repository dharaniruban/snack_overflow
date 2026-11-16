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
};
