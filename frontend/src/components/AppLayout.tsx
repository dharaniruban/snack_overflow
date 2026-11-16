import {
  Activity,
  Cookie,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useSnackEvents } from '@/src/hooks/useSnackEvents';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

export function AppLayout({ headerAction }: { headerAction?: ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Subscribe to real-time SSE updates across authenticated views
  useSnackEvents();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.search]);

  // Global "/" keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      e.preventDefault();
      const searchEl = document.getElementById('pantry-search-input') as HTMLInputElement | null;
      if (searchEl) {
        searchEl.focus();
        searchEl.select();
      } else {
        navigate('/snacks', { state: { focusSearch: true } });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const navItems: NavItem[] = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/snacks', label: 'Pantry', icon: Cookie },
    ...(isAdmin ? [{ to: '/activity', label: 'Activity', icon: Activity }] : []),
  ];

  const pageTitle = (() => {
    if (location.pathname.startsWith('/snacks')) return 'Pantry Inventory';
    if (location.pathname.startsWith('/activity')) return 'Activity Log';
    return 'Dashboard';
  })();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-slate-200 bg-white px-4 py-6 lg:flex dark:border-slate-800 dark:bg-slate-900">
        <div>
          <NavLink
            to="/"
            className="flex items-center gap-2.5 px-2.5 text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap dark:text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Cookie className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-display">Snack Overflow</span>
          </NavLink>

          <nav aria-label="Main navigation" className="mt-8 space-y-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-[42px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          {user && (
            <div className="px-2.5">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user.email}
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span className="capitalize">{user.role}</span>
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex min-h-[38px] flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Dark</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-red-900 dark:hover:bg-red-950/50 dark:hover:text-red-300"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar (strict single-row, compact on mobile) */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileNavOpen}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="font-display font-bold text-slate-900 lg:hidden dark:text-white">
                Snack Overflow
              </span>
              <span className="text-slate-300 lg:hidden dark:text-slate-700" aria-hidden="true">
                /
              </span>
              <span className="truncate font-semibold text-slate-700 lg:text-base lg:text-slate-900 dark:text-slate-200 lg:dark:text-slate-100">
                {pageTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {headerAction}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 lg:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Slide-down Navigation */}
        {mobileNavOpen && (
          <div className="border-b border-slate-200 bg-white px-4 py-4 lg:hidden dark:border-slate-800 dark:bg-slate-900">
            <nav aria-label="Mobile navigation" className="space-y-1">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              {user && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {user.email} · <span className="capitalize">{user.role}</span>
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/50"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
