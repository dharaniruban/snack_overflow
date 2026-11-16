import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { pool } from '../db/pool';
import { AppError } from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';
import type { Role } from '../types/auth';
import { userRepository } from '../modules/auth/repository';

interface JwtPayload {
  sub: string;
  role?: Role;
}

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('UNAUTHENTICATED', 'Missing bearer token');
  }

  const token = header.slice('Bearer '.length);
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    throw new AppError('UNAUTHENTICATED', 'Invalid or expired token');
  }

  // Re-read the user so role and existence always come from the DB, never
  // solely from the JWT claims.
  const user = await userRepository.findById(pool, payload.sub);
  if (!user) {
    throw new AppError('UNAUTHENTICATED', 'User no longer exists');
  }

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  next();
});

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('UNAUTHENTICATED', 'Authentication required'));
      return;
    }
    if (req.user.role !== role) {
      next(new AppError('FORBIDDEN', 'Admin access required'));
      return;
    }
    next();
  };
}
