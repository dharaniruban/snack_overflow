import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError('NOT_FOUND', 'Route not found'));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
    return;
  }

  // Malformed JSON bodies are client errors, not server errors.
  if (error instanceof SyntaxError && 'status' in error && (error as { status?: number }).status === 400) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON body' } });
    return;
  }

  if (typeof error === 'object' && error !== null && (error as { type?: string }).type === 'entity.too.large') {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request body too large' } });
    return;
  }

  // Never leak stack traces, SQL, or internals to clients.
  console.error(error);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}
