import { ApiError } from './api';

const FRIENDLY: Record<string, string> = {
  INSUFFICIENT_STOCK: 'Someone beat you to the last packet!',
  ALREADY_VOTED: 'You already voted for this one',
  DUPLICATE_NAME: 'A snack with that name already exists',
  FORBIDDEN: 'You need admin powers for that',
  UNAUTHENTICATED: 'Please log in again',
  RATE_LIMITED: 'Too many attempts, slow down',
  NOT_FOUND: 'That snack vanished into the pantry void',
  VALIDATION_ERROR: 'Check the highlighted fields',
};

export function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    return FRIENDLY[error.code] ?? error.message ?? 'Something went wrong';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
