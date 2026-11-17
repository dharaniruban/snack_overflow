import { LogIn, LogOut, Menu, Moon, Shield, Sun, User as UserIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useSnackEvents } from '@/src/hooks/useSnackEvents';

interface TopNavItem {
  to: string;
  label: string;
  end?: boolean;
}

export function AppLayout() {
  const { user, isAdmin, isLiveSession, switchPreviewRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useSnackEvents();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.search]);

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
        searchEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        navigate('/snacks', { state: { focusSearch: true } });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const navItems: TopNavItem[] = [
    { to: '/', label: 'HOME', end: true },
    { to: '/snacks', label: 'MENU' },
    ...(isAdmin ? [{ to: '/activity', label: 'ACTIVITY' }] : []),
    { to: '/login', label: isLiveSession ? 'ACCOUNT' : 'SIGN IN' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#141517] text-zinc-100">
      {/* Brushed Dark Charcoal Top Navigation Bar (matches reference header) */}
      <header className="charcoal-bar sticky top-0 z-40 border-b border-zinc-800/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left: Mobile Menu Button + Brand Mark */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileNavOpen}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-white/5 hover:text-white md:hidden"
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            <NavLink
              to="/"
              className="font-serif text-xl font-semibold italic tracking-tight text-white whitespace-nowrap transition-opacity hover:opacity-90"
            >
              Snack Overflow
            </NavLink>
          </div>

          {/* Center: Uppercase Tracked Nav Links with Top Gold Bar Indicator */}
          <nav aria-label="Primary navigation" className="hidden h-full items-center gap-8 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex h-full items-center px-1 text-xs font-medium tracking-[0.18em] whitespace-nowrap transition-colors duration-150 ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-[#d4b97e]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="topbar-active-line"
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-0 right-0 left-0 h-0.5 bg-[#d4b97e]"
                      />
                    )}
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right: Role badge + Sign out / preview switcher + Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {isLiveSession && (
              <span className="hidden items-center gap-1.5 rounded-lg border border-[#d4b97e]/40 bg-zinc-900/70 px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-[#d4b97e] uppercase whitespace-nowrap sm:inline-flex">
                {isAdmin ? (
                  <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{user.role}</span>
              </span>
            )}
            {!isLiveSession ? (
              <button
                type="button"
                onClick={() => switchPreviewRole(isAdmin ? 'member' : 'admin')}
                title="Switch between Admin and Member view"
                className="hidden items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-[#d4b97e] uppercase whitespace-nowrap transition-colors hover:border-[#d4b97e]/60 hover:bg-zinc-800 sm:inline-flex"
              >
                {isAdmin ? (
                  <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{user.role}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={logout}
                aria-label="Sign out"
                className="hidden items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-zinc-300 uppercase whitespace-nowrap transition-colors hover:border-red-500/60 hover:text-red-300 sm:inline-flex"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'parchment light' : 'charcoal dark'} menu theme`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900/70 text-[#d4b97e] transition-colors hover:border-[#d4b97e]/60 hover:bg-zinc-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-zinc-800 bg-[#141517] px-4 py-4 md:hidden"
            >
              <nav aria-label="Mobile navigation" className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex min-h-[44px] items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold tracking-[0.16em] uppercase ${
                        isActive
                          ? 'bg-white/10 text-[#d4b97e]'
                          : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
                <span className="text-xs text-zinc-400">
                  {user.name} · <span className="capitalize text-[#d4b97e]">{user.role}</span>
                </span>
                {!isLiveSession ? (
                  <button
                    type="button"
                    onClick={() => switchPreviewRole(isAdmin ? 'member' : 'admin')}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1 text-xs font-semibold text-[#d4b97e]"
                  >
                    <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Switch to {isAdmin ? 'Member' : 'Admin'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1 text-xs font-semibold text-red-300"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Sign out</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Editorial Dark Charcoal Footer */}
      <footer className="charcoal-bar border-t border-zinc-800/90 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-[11px] tracking-[0.14em] text-zinc-400 uppercase sm:flex-row sm:px-6 lg:px-8">
          <span>Snack Overflow · Office Pantry Collective</span>
          <span>Live Stock · Team Voting · Admin Restock</span>
        </div>
      </footer>
    </div>
  );
}
