import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useToast } from '@/src/context/ToastContext';
import {
  api,
  getStoredToken,
  setStoredToken,
  UNAUTHORIZED_EVENT,
} from '@/src/lib/api';
import type { User } from '@/src/types/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getStoredToken()));

  const clearSession = useCallback(
    (notifyExpired = false) => {
      setStoredToken(null);
      setToken(null);
      setUser(null);
      queryClient.clear();
      if (notifyExpired) {
        showToast('Your session has expired. Please sign in again.', 'warning');
      }
    },
    [queryClient, showToast]
  );

  useEffect(() => {
    const onUnauthorized = () => {
      clearSession(true);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, [clearSession]);

  useEffect(() => {
    let active = true;
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    if (user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    api.auth
      .me()
      .then((res) => {
        if (!active) return;
        setUser(res.user);
      })
      .catch(() => {
        if (!active) return;
        setStoredToken(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, user]);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const res = await api.auth.login(email, password);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      queryClient.clear();
      return res.user;
    },
    [queryClient]
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<User> => {
      const res = await api.auth.register(name, email, password);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      queryClient.clear();
      return res.user;
    },
    [queryClient]
  );

  const logout = useCallback(() => {
    clearSession(false);
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [user, token, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
