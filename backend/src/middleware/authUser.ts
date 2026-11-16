import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import type { AuthUser } from '../types/auth';

export function requireAuthUser(req: Request): AuthUser {
  if (!req.user) {
    throw new AppError('UNAUTHENTICATED', 'Authentication required');
  }
  return req.user;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  // requireAuth is always installed before requireAuthUser consumers; this
  // helper exists so controllers never have to repeat the guard.
  if (!req.user) {
    next(new AppError('UNAUTHENTICATED', 'Authentication required'));
    return;
  }
  next();
}
