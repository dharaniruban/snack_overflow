import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { AppError } from '../../utils/errors';
import type { LoginResponse } from '../../types/auth';
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
};
