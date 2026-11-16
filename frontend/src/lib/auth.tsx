import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UNAUTHORIZED_EVENT,
  clearSession,
  fetchMe,
  loginRequest,
  readStoredSession,
  storeSession,
} from './api';
import type { AuthUser } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const reset = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const { token: storedToken, user: storedUser } = readStoredSession();
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    setUser(storedUser);

    fetchMe(storedToken)
      .then((freshUser) => {
        setUser(freshUser);
        storeSession(storedToken, freshUser);
      })
      .catch(() => {
        reset();
      })
      .finally(() => setIsLoading(false));
  }, [reset]);

  useEffect(() => {
    const handler = () => {
      reset();
      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [navigate, reset]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    storeSession(result.token, result.user);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    reset();
    navigate('/login', { replace: true });
  }, [navigate, reset]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, isAdmin: user?.role === 'admin', login, logout }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
