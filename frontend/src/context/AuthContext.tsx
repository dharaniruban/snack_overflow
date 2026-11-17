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
  FORBIDDEN_EVENT,
  getStoredToken,
  setStoredToken,
  UNAUTHORIZED_EVENT,
} from '@/src/lib/api';
import {
  getLocalGuestUser,
  getLocalUserRole,
  setLocalUserRole,
} from '@/src/lib/pantryStore';
import type { User, UserRole } from '@/src/types/api';

interface AuthContextValue {
  user: User;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLiveSession: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  switchPreviewRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [liveUser, setLiveUser] = useState<User | null>(null);
  const [previewRole, setPreviewRole] = useState<UserRole>(() => getLocalUserRole());
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getStoredToken()));

  const clearLiveSession = useCallback(
    (notifyExpired = false) => {
      setStoredToken(null);
      setToken(null);
      setLiveUser(null);
      queryClient.invalidateQueries();
      if (notifyExpired) {
        showToast('Your session has expired. Please sign in again.', 'warning');
      }
    },
    [queryClient, showToast]
  );

  useEffect(() => {
    const onUnauthorized = () => {
      clearLiveSession(true);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, [clearLiveSession]);

  // A 403 means the server rejected our role — refresh /me so the UI role
  // always comes from the server, never from stale local state.
  useEffect(() => {
    const onForbidden = () => {
      api.auth
        .me()
        .then((res) => setLiveUser(res))
        .catch(() => {
          // 401s are handled by the UNAUTHORIZED_EVENT listener.
        });
    };
    window.addEventListener(FORBIDDEN_EVENT, onForbidden);
    return () => {
      window.removeEventListener(FORBIDDEN_EVENT, onForbidden);
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!token) {
      setLiveUser(null);
      setIsLoading(false);
      return;
    }

    if (liveUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    api.auth
      .me()
      .then((res) => {
        if (!active) return;
        setLiveUser(res);
      })
      .catch(() => {
        if (!active) return;
        setStoredToken(null);
        setToken(null);
        setLiveUser(null);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, liveUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const res = await api.auth.login(email, password);
      setStoredToken(res.token);
      setToken(res.token);
      setLiveUser(res.user);
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
      setLiveUser(res.user);
      queryClient.clear();
      return res.user;
    },
    [queryClient]
  );

  const switchPreviewRole = useCallback(
    (role: UserRole) => {
      setLocalUserRole(role);
      setPreviewRole(role);
      showToast(
        role === 'admin' ? 'Switched to Pantry Admin view.' : 'Switched to Member view.',
        'info'
      );
    },
    [showToast]
  );

  const logout = useCallback(() => {
    clearLiveSession(false);
  }, [clearLiveSession]);

  const activeUser = liveUser ?? getLocalGuestUser(previewRole);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: activeUser,
      token,
      isLoading,
      isAuthenticated: Boolean(liveUser),
      isLiveSession: Boolean(token && liveUser),
      isAdmin: activeUser.role === 'admin',
      login,
      register,
      switchPreviewRole,
      logout,
    }),
    [activeUser, token, isLoading, liveUser, login, register, switchPreviewRole, logout]
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
