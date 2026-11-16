import { ArrowRight, Cookie, Eye, EyeOff, Lock, Mail, Moon, Sun, User as UserIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useToast } from '@/src/context/ToastContext';
import { ApiError, getFriendlyErrorMessage } from '@/src/lib/errors';
import { SNACK_ILLUSTRATIONS } from '@/src/lib/snackPlaceholders';

const SHOWCASE_TILES = [
  { label: 'Savoury crisps', src: SNACK_ILLUSTRATIONS.savoury },
  { label: 'Artisan sweets', src: SNACK_ILLUSTRATIONS.sweet },
  { label: 'Chilled drinks', src: SNACK_ILLUSTRATIONS.drink },
  { label: 'Healthy-ish picks', src: SNACK_ILLUSTRATIONS['healthy-ish'] },
] as const;

export function LoginPage() {
  const { isAuthenticated, isLoading, login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const redirectTarget = from?.pathname ? `${from.pathname}${from.search ?? ''}` : '/';

  if (!isLoading && isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const loggedUser = await login(email.trim(), password);
        showToast(`Welcome back, ${loggedUser.name}.`, 'success');
      } else {
        const createdUser = await register(name.trim(), email.trim(), password);
        showToast(`Welcome to Snack Overflow, ${createdUser.name}!`, 'success');
      }
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'RATE_LIMITED') {
        const msg = 'Too many sign-in attempts. Please pause a moment and try again.';
        setErrorMessage(msg);
        showToast(msg, 'warning');
      } else if (err instanceof ApiError && err.status === 401) {
        setErrorMessage('Invalid email or password. Please check your credentials.');
      } else {
        const msg = getFriendlyErrorMessage(err, 'Unable to sign in.');
        setErrorMessage(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-zinc-50 text-zinc-950 lg:grid-cols-12 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Left Auth Stage */}
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:col-span-5 lg:px-14">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 text-zinc-950 shadow-xs">
              <Cookie className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-display">Snack Overflow</span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-all duration-150 hover:bg-zinc-100 active:scale-[0.96] dark:border-zinc-800 dark:bg-zinc-900 dark:text-yellow-400 dark:hover:bg-zinc-800"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto my-10 w-full max-w-sm"
        >
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900/90">
            <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-950 text-balance sm:text-3xl dark:text-white">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              {mode === 'login'
                ? 'Sign in to check live pantry stock and vote for favorites.'
                : 'Join your office pantry to log snacks and upvote restocks.'}
            </p>

            {/* Sliding Segmented Mode Switcher */}
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="relative mt-6 grid grid-cols-2 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-950"
            >
              {(['login', 'register'] as const).map((tab) => {
                const active = mode === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setMode(tab);
                      setErrorMessage(null);
                    }}
                    className={`relative z-10 min-h-[38px] rounded-lg text-xs font-bold transition-colors duration-150 ${
                      active
                        ? 'text-zinc-950'
                        : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="auth-mode-indicator"
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 -z-10 rounded-lg bg-yellow-400 shadow-xs"
                      />
                    )}
                    {tab === 'login' ? 'Sign in' : 'Register'}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <AnimatePresence initial={false}>
                {mode === 'register' && (
                  <motion.div
                    key="register-name"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                  >
                    <label
                      htmlFor="auth-name"
                      className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                    >
                      Full name
                    </label>
                    <div className="relative mt-1.5">
                      <UserIcon
                        className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400"
                        aria-hidden="true"
                      />
                      <input
                        id="auth-name"
                        type="text"
                        required
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="block min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pr-3.5 pl-10 text-sm text-zinc-950 placeholder:text-zinc-400 transition-colors focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-950"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Work email
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="block min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pr-3.5 pl-10 text-sm text-zinc-950 placeholder:text-zinc-400 transition-colors focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-950"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Password
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pr-10 pl-10 text-sm text-zinc-950 placeholder:text-zinc-400 transition-colors focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-950"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300"
                  >
                    {errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={submitting}
                className="group flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-zinc-950 shadow-[0_1px_0_0_rgba(255,255,255,0.45)_inset,0_10px_24px_-10px_rgba(250,204,21,0.55)] transition-all duration-150 hover:bg-yellow-300 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  {submitting
                    ? mode === 'login'
                      ? 'Signing in...'
                      : 'Creating account...'
                    : mode === 'login'
                      ? 'Sign in to pantry'
                      : 'Create member account'}
                </span>
                {!submitting && (
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                )}
              </button>
            </form>
          </div>
        </motion.div>

        <p className="text-xs text-zinc-500">
          Snack Overflow · Office pantry inventory & live stock tracking
        </p>
      </div>

      {/* Right Black & Yellow Editorial Showcase */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-l border-zinc-200 bg-zinc-950 p-12 text-white lg:col-span-7 lg:flex dark:border-zinc-800/80">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(250,204,21,0.16),transparent_55%)]"
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-xl"
        >
          <p className="text-xs font-semibold tracking-wide text-yellow-400 uppercase">
            Live Pantry Inventory
          </p>
          <h2 className="mt-3 font-display text-4xl leading-[1.1] font-bold tracking-tight text-white text-balance">
            Every packet tracked in real time.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Spot the last bag of crisps before someone beats you to it, grab snacks with a single tap, and vote on next week’s restock.
          </p>
        </motion.div>

        {/* 2x2 Illustrated Snack Grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 my-8 grid grid-cols-2 gap-4"
        >
          {SHOWCASE_TILES.map((tile) => (
            <div
              key={tile.label}
              className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-yellow-400/50"
            >
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img
                  src={tile.src}
                  alt={tile.label}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800 px-3.5 py-2.5">
                <span className="text-xs font-semibold text-zinc-200">{tile.label}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden="true" />
              </div>
            </div>
          ))}
        </motion.div>

        <div className="relative z-10 flex items-center gap-6 text-xs text-zinc-400">
          <span>Real-time stock alerts</span>
          <span aria-hidden="true">·</span>
          <span>Team snack voting</span>
          <span aria-hidden="true">·</span>
          <span>Admin restock feed</span>
        </div>
      </div>
    </div>
  );
}
