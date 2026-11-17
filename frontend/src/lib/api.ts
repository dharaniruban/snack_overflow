import { ApiError } from '@/src/lib/errors';
import { getLocalGuestUser, localPantryStore } from '@/src/lib/pantryStore';
import type {
  ActivityListResponse,
  AuthResponse,
  CreateSnackInput,
  Snack,
  SnackQueryParams,
  SnacksListResponse,
  SnacksSummaryResponse,
  UpdateSnackInput,
  User,
} from '@/src/types/api';

export const TOKEN_STORAGE_KEY = 'snack_overflow_token';
export const UNAUTHORIZED_EVENT = 'snack-overflow:unauthorized';
export const FORBIDDEN_EVENT = 'snack-overflow:forbidden';

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL as string | undefined;
  if (!configured || configured.trim() === '') {
    return '/api';
  }
  return configured.replace(/\/+$/, '');
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface RequestOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuthRedirect = false, headers: customHeaders, ...init } = options;
  const baseUrl = getApiBaseUrl();
  const token = getStoredToken();

  const headers = new Headers(customHeaders);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to connect to the server.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let payload: unknown = null;
  if (isJson) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errorBody = (payload as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    if (!isJson || !errorBody) {
      if (response.status === 401 && !skipAuthRedirect) {
        setStoredToken(null);
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
      }
      if (!isJson) {
        throw new ApiError(
          response.status,
          'BACKEND_UNREACHABLE',
          `No API JSON response from ${baseUrl}${path} (HTTP ${response.status}).`
        );
      }
    }

    const code =
      errorBody?.code ||
      (response.status === 401
        ? 'UNAUTHENTICATED'
        : response.status === 404
          ? 'NOT_FOUND'
          : response.status === 429
            ? 'RATE_LIMITED'
            : 'INTERNAL_ERROR');
    const message = errorBody?.message || response.statusText || 'Request failed';

    if (response.status === 401 && !skipAuthRedirect) {
      setStoredToken(null);
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    if (response.status === 403) {
      // Role may have changed server-side; let AuthContext refresh /me.
      window.dispatchEvent(new CustomEvent(FORBIDDEN_EVENT));
    }

    throw new ApiError(response.status, code, message, errorBody?.details);
  }

  if (!isJson) {
    throw new ApiError(
      response.status,
      'BACKEND_UNREACHABLE',
      `Expected JSON from ${baseUrl}${path}, received ${contentType || 'non-JSON'}.`
    );
  }

  return payload as T;
}

function isBackendUnavailable(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === 'BACKEND_UNREACHABLE' || error.code === 'NETWORK_ERROR')
  );
}

async function withPantryFallback<T>(
  liveCall: () => Promise<T>,
  fallbackCall: () => T
): Promise<T> {
  if (!getStoredToken()) {
    return fallbackCall();
  }
  try {
    return await liveCall();
  } catch (err) {
    if (isBackendUnavailable(err)) {
      return fallbackCall();
    }
    throw err;
  }
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      sp.set(key, String(value));
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  auth: {
    login(email: string, password: string): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuthRedirect: true,
      });
    },
    register(name: string, email: string, password: string): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
        skipAuthRedirect: true,
      });
    },
    me(): Promise<{ user: User }> {
      return request<{ user: User }>('/auth/me');
    },
  },

  snacks: {
    list(params: SnackQueryParams = {}): Promise<SnacksListResponse> {
      const qs = buildQueryString({
        category: params.category,
        status: params.status,
        q: params.q,
        page: params.page,
        pageSize: params.pageSize,
        sort: params.sort,
        order: params.order,
      });
      return withPantryFallback(
        () => request<SnacksListResponse>(`/snacks${qs}`),
        () => localPantryStore.listSnacks(params)
      );
    },
    summary(): Promise<SnacksSummaryResponse> {
      return withPantryFallback(
        () => request<SnacksSummaryResponse>('/snacks/summary'),
        () => localPantryStore.summary()
      );
    },
    get(id: string): Promise<Snack> {
      return withPantryFallback(
        () => request<Snack>(`/snacks/${encodeURIComponent(id)}`),
        () => localPantryStore.getSnack(id)
      );
    },
    create(input: CreateSnackInput): Promise<Snack> {
      return withPantryFallback(
        () =>
          request<Snack>('/snacks', {
            method: 'POST',
            body: JSON.stringify(input),
          }),
        () => localPantryStore.createSnack(input)
      );
    },
    update(id: string, input: UpdateSnackInput): Promise<Snack> {
      return withPantryFallback(
        () =>
          request<Snack>(`/snacks/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(input),
          }),
        () => localPantryStore.updateSnack(id, input)
      );
    },
    remove(id: string): Promise<void> {
      return withPantryFallback(
        () =>
          request<void>(`/snacks/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          }),
        () => localPantryStore.removeSnack(id)
      );
    },
    consume(id: string, amount: number, idempotencyKey: string): Promise<Snack> {
      return withPantryFallback(
        () =>
          request<Snack>(`/snacks/${encodeURIComponent(id)}/consume`, {
            method: 'POST',
            headers: {
              'Idempotency-Key': idempotencyKey,
            },
            body: JSON.stringify({ amount }),
          }),
        () => localPantryStore.consumeSnack(id, amount, getLocalGuestUser().name)
      );
    },
    restock(id: string, amount: number): Promise<Snack> {
      return withPantryFallback(
        () =>
          request<Snack>(`/snacks/${encodeURIComponent(id)}/restock`, {
            method: 'POST',
            body: JSON.stringify({ amount }),
          }),
        () => localPantryStore.restockSnack(id, amount, getLocalGuestUser().name)
      );
    },
    vote(id: string): Promise<Snack> {
      return withPantryFallback(
        () =>
          request<Snack>(`/snacks/${encodeURIComponent(id)}/vote`, {
            method: 'POST',
          }),
        () => localPantryStore.voteSnack(id)
      );
    },
    unvote(id: string): Promise<void> {
      return withPantryFallback(
        () =>
          request<void>(`/snacks/${encodeURIComponent(id)}/vote`, {
            method: 'DELETE',
          }),
        () => localPantryStore.unvoteSnack(id)
      );
    },
  },

  activity: {
    list(params: { page?: number; pageSize?: number } = {}): Promise<ActivityListResponse> {
      const qs = buildQueryString({
        page: params.page,
        pageSize: params.pageSize,
      });
      return withPantryFallback(
        () => request<ActivityListResponse>(`/activity${qs}`),
        () => localPantryStore.listActivity(params)
      );
    },
  },
};
