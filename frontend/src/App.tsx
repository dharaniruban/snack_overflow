import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/src/components/AppLayout';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { ToastProvider, useToast } from '@/src/context/ToastContext';
import { ApiError } from '@/src/lib/errors';
import { UNAUTHORIZED_EVENT } from '@/src/lib/api';
import { ActivityPage } from '@/src/pages/ActivityPage';
import { DashboardPage } from '@/src/pages/DashboardPage';
import { LoginPage } from '@/src/pages/LoginPage';
import { SnacksPage } from '@/src/pages/SnacksPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#141517]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-[#d4b97e]" />
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return <FullPageLoader />;
  }
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  return <>{children}</>;
}

function SessionExpiryRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onUnauthorized = () => {
      if (location.pathname === '/login') {
        return;
      }
      navigate('/login', {
        replace: true,
        state: { sessionExpired: true },
      });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, [navigate, location.pathname]);

  return null;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isLiveSession, isLoading } = useAuth();
  if (isLoading) {
    return <FullPageLoader />;
  }
  if (isLiveSession) {
    const from = (location.state as { from?: string } | null)?.from;
    const target = from && from.startsWith('/') && from !== '/login' ? from : '/';
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const toastedRef = useRef(false);

  useEffect(() => {
    if (!isAdmin && !toastedRef.current) {
      toastedRef.current = true;
      showToast("Admins only — you don't have permission to view this page.", 'warning');
    }
  }, [isAdmin, showToast]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <BrowserRouter>
                <SessionExpiryRedirect />
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route
                      index
                      element={
                        <RequireAuth>
                          <DashboardPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="snacks"
                      element={
                        <RequireAuth>
                          <SnacksPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="activity"
                      element={
                        <RequireAuth>
                          <RequireAdmin>
                            <ActivityPage />
                          </RequireAdmin>
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="login"
                      element={
                        <GuestOnly>
                          <LoginPage />
                        </GuestOnly>
                      }
                    />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}
