export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const FRIENDLY_CODE_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHENTICATED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: 'That item could not be found in the pantry.',
  INSUFFICIENT_STOCK: 'Someone beat you to the last packet!',
  ALREADY_VOTED: 'You have already voted for this snack.',
  DUPLICATE_NAME: 'A snack with this name is already in the pantry.',
  RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
  INTERNAL_ERROR: 'Something went wrong in the kitchen. Please try again.',
  NETWORK_ERROR: 'Unable to reach the pantry server. Check your connection and retry.',
  BACKEND_UNREACHABLE:
    'No Snack Overflow backend responded at the configured API URL. Start your backend or set VITE_API_URL in your environment.',
};

export function getFriendlyErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof ApiError) {
    if (error.code === 'INSUFFICIENT_STOCK') {
      return 'Someone beat you to the last packet!';
    }
    if (error.code === 'RATE_LIMITED') {
      return error.message || FRIENDLY_CODE_MESSAGES.RATE_LIMITED;
    }
    if (error.code === 'VALIDATION_ERROR' && error.message) {
      return error.message;
    }
    return FRIENDLY_CODE_MESSAGES[error.code] ?? (error.message || fallback || FRIENDLY_CODE_MESSAGES.INTERNAL_ERROR);
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback || 'An unexpected error occurred.';
}
