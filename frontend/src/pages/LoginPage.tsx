import { Cookie, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useToast } from '@/src/context/ToastContext';
import { ApiError, getFriendlyErrorMessage } from '@/src/lib/errors';

const LOGIN_HERO_IMAGE = '/src/assets/images/pantry_login_hero_1794826279876.jpg';

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
  const [imgFailed, setImgFailed] = useState(false);

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
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-12 dark:bg-slate-950">
      {/* Left Form Panel */}
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:col-span-5 lg:px-14">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Cookie className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-display">Snack Overflow</span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="mx-auto my-12 w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {mode === 'login' ? 'Sign in to the pantry' : 'Create member account'}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {mode === 'login'
              ? 'Check live stock levels, grab snacks, and vote on next week’s order.'
              : 'Join your office pantry to log snacks and upvote your favorites.'}
          </p>

          <div
            role="tablist"
            aria-label="Authentication mode"
            className="mt-6 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`min-h-[38px] rounded-md text-xs font-semibold transition-colors ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`min-h-[38px] rounded-md text-xs font-semibold transition-colors ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Full name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Work email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-10 pl-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-emerald-500"
            >
              {submitting
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-500">
          Snack Overflow · Office pantry inventory & live stock tracking
        </p>
      </div>

      {/* Right Visual Showcase */}
      <div className="relative hidden overflow-hidden bg-slate-900 lg:col-span-7 lg:block">
        {!imgFailed ? (
          <img
            src={LOGIN_HERO_IMAGE}
            alt="Sunlit modern office pantry stocked with kettle chips, craft chocolate, sparkling drinks, and roasted nuts"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
        <div className="absolute right-12 bottom-12 left-12 max-w-xl">
          <p className="text-sm font-medium text-emerald-300">Real-time pantry telemetry</p>
          <h2 className="mt-2 font-display text-4xl leading-tight font-bold text-white text-balance">
            Keep the team fueled, minus the guesswork.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">
            Track live inventory from your desk, spot the last packet before someone beats you to it, and upvote your favorites for Friday’s restock.
          </p>
        </div>
      </div>
    </div>
  );
}
