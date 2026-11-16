import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { DarkModeToggle } from './DarkModeToggle';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export function Layout() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-bold">
            <span aria-hidden="true">🥜</span>
            <span>Snack Overflow</span>
          </NavLink>
          <nav className="flex items-center gap-1" aria-label="Primary">
            <NavLink to="/" end className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/snacks" className={linkClass}>
              Snacks
            </NavLink>
            {isAdmin && (
              <NavLink to="/activity" className={linkClass}>
                Activity
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">
              {user?.name}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
