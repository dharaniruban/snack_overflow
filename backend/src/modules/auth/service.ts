import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { AppError } from '../../utils/errors';
import { isUniqueViolation } from '../../utils/pgErrors';
import type { LoginResponse, SafeUserRow } from '../../types/auth';
import { userRepository } from './repository';

// Precomputed once so unknown-email logins pay the same bcrypt cost as
// known-email logins, reducing timing side channels.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', env.BCRYPT_COST);

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await userRepository.findByEmail(pool, email);

    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      throw new AppError('UNAUTHENTICATED', 'Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      throw new AppError('UNAUTHENTICATED', 'Invalid email or password');
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async register(name: string, email: string, password: string): Promise<SafeUserRow> {
    const passwordHash = await bcrypt.hash(password, env.BCRYPT_COST);
    try {
      const user = await userRepository.create(pool, {
        name,
        email,
        passwordHash,
        // Self-registration can only ever create members; admins are seeded.
        role: 'member',
      });
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError('DUPLICATE_NAME', 'An account with that email already exists');
      }
      throw error;
    }
  },
};
