import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { ApiError, getFriendlyErrorMessage } from '@/src/lib/errors';
import { SNACK_REAL_IMAGES } from '@/src/lib/snackPlaceholders';

const SHOWCASE_TILES = [
  { label: 'Savoury Crisps', src: SNACK_REAL_IMAGES.savoury },
  { label: 'Artisan Sweets', src: SNACK_REAL_IMAGES.sweet },
  { label: 'Craft Drinks', src: SNACK_REAL_IMAGES.drink },
  { label: 'Roasted Nuts', src: SNACK_REAL_IMAGES['healthy-ish'] },
] as const;

export function LoginPage() {
  const { user, isAdmin, isLiveSession, login, register, switchPreviewRole, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'RATE_LIMITED') {
        const msg = 'Too many sign-in attempts. Please pause a moment and try again.';
        setErrorMessage(msg);
        showToast(msg, 'warning');
      } else if (err instanceof ApiError && err.status === 401) {
        setErrorMessage('Invalid email or password. Please check your credentials.');
      } else if (err instanceof ApiError && err.code === 'BACKEND_UNREACHABLE') {
        setErrorMessage(
          'No live API server is connected right now. You can browse and test every feature immediately using Pantry Preview Mode.'
        );
      } else {
        setErrorMessage(getFriendlyErrorMessage(err, 'Unable to sign in.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <section className="charcoal-bar border-b border-zinc-800/90 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold tracking-[0.26em] text-[#d4b97e] uppercase">
            Pantry Access &amp; Roles
          </p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {isLiveSession ? 'Your Pantry Account' : 'Sign In or Preview'}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">
            Connect to a live Snack Overflow backend or switch preview roles while exploring the pantry.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-zinc-800 shadow-2xl lg:grid-cols-12">
          {/* Left Dark Charcoal Account / Auth Panel */}
          <div className="bg-[#1c1d20] p-6 text-zinc-100 sm:p-8 lg:col-span-5">
            {isLiveSession ? (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-[#d4b97e] uppercase">
                    Active Backend Session
                  </p>
                  <h2 className="mt-1.5 font-serif text-2xl font-semibold text-white">
                    {user.name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">{user.email}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-[#d4b97e]/40 bg-[#d4b97e]/10 px-2.5 py-1 text-xs font-bold tracking-wider text-[#d4b97e] uppercase">
                    {isAdmin ? (
                      <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>{user.role}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-zinc-800 pt-5">
                  <Link
                    to="/"
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#d4b97e] px-4 py-2 text-xs font-bold tracking-wider text-zinc-950 uppercase transition-colors hover:bg-[#e3ca92]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Return to Pantry</span>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-xs font-bold tracking-wider text-zinc-200 uppercase transition-colors hover:border-red-500/60 hover:text-red-300"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Instant Preview Role Switcher */}
                <div className="rounded-xl border border-zinc-800 bg-[#141517] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold tracking-[0.18em] text-[#d4b97e] uppercase">
                      Instant Preview Mode
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400 uppercase">
                      {user.role}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                    The full pantry runs immediately in your browser. Switch roles below to test Admin restocking vs Member access.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => switchPreviewRole('admin')}
                      className={`inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors ${
                        isAdmin
                          ? 'border-[#d4b97e] bg-[#d4b97e] text-zinc-950'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => switchPreviewRole('member')}
                      className={`inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors ${
                        !isAdmin
                          ? 'border-[#d4b97e] bg-[#d4b97e] text-zinc-950'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Member</span>
                    </button>
                  </div>
                  <Link
                    to="/"
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-700 py-2 text-xs font-semibold tracking-wider text-zinc-200 uppercase transition-colors hover:border-[#d4b97e] hover:text-[#d4b97e]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Open Full Pantry</span>
                  </Link>
                </div>

                {/* Live Backend Auth Form */}
                <div className="mt-7 border-t border-zinc-800 pt-6">
                  <h2 className="font-serif text-xl font-semibold text-white">
                    {mode === 'login' ? 'Sign in to Backend API' : 'Register Member Account'}
                  </h2>

                  <div
                    role="tablist"
                    aria-label="Authentication mode"
                    className="relative mt-4 grid grid-cols-2 rounded-lg border border-zinc-800 bg-[#141517] p-1"
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
                          className={`relative z-10 min-h-[36px] rounded-md text-xs font-bold tracking-wider uppercase transition-colors ${
                            active ? 'text-zinc-950' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="auth-mode-indicator"
                              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                              className="absolute inset-0 -z-10 rounded-md bg-[#d4b97e]"
                            />
                          )}
                          {tab === 'login' ? 'Sign in' : 'Register'}
                        </button>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
                            className="block text-[11px] font-semibold tracking-wider text-zinc-300 uppercase"
                          >
                            Full name
                          </label>
                          <div className="relative mt-1.5">
                            <UserIcon
                              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500"
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
                              className="block min-h-[42px] w-full rounded-lg border border-zinc-700 bg-[#141517] py-2 pr-3.5 pl-10 text-sm text-white placeholder:text-zinc-500 focus:border-[#d4b97e] focus:outline-none"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div>
                      <label
                        htmlFor="auth-email"
                        className="block text-[11px] font-semibold tracking-wider text-zinc-300 uppercase"
                      >
                        Work email
                      </label>
                      <div className="relative mt-1.5">
                        <Mail
                          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500"
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
                          className="block min-h-[42px] w-full rounded-lg border border-zinc-700 bg-[#141517] py-2 pr-3.5 pl-10 text-sm text-white placeholder:text-zinc-500 focus:border-[#d4b97e] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="auth-password"
                        className="block text-[11px] font-semibold tracking-wider text-zinc-300 uppercase"
                      >
                        Password
                      </label>
                      <div className="relative mt-1.5">
                        <Lock
                          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500"
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
                          className="block min-h-[42px] w-full rounded-lg border border-zinc-700 bg-[#141517] py-2 pr-10 pl-10 text-sm text-white placeholder:text-zinc-500 focus:border-[#d4b97e] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 hover:text-white"
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
                          className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-3.5 py-2.5 text-xs leading-relaxed font-medium text-amber-200"
                        >
                          {errorMessage}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="group flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#d4b97e] px-4 py-2 text-xs font-bold tracking-wider text-zinc-950 uppercase transition-all hover:bg-[#e3ca92] active:scale-[0.98] disabled:opacity-60"
                    >
                      <span>
                        {submitting
                          ? mode === 'login'
                            ? 'Signing in...'
                            : 'Creating account...'
                          : mode === 'login'
                            ? 'Sign in to API'
                            : 'Create account'}
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
              </div>
            )}
          </div>

          {/* Right Warm Parchment Real Photography Showcase */}
          <div className="parchment-panel flex flex-col justify-between p-6 text-zinc-900 sm:p-8 lg:col-span-7 dark:text-zinc-100">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-[#8f7134] uppercase dark:text-[#d4b97e]">
                Curated Pantry Photography
              </p>
              <h2 className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
                Every snack tracked with live stock gauges.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Spot the final packet before it vanishes, grab items in one tap, and vote on next week’s restock.
              </p>
            </div>

            <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {SHOWCASE_TILES.map((tile) => (
                <div
                  key={tile.label}
                  className="group overflow-hidden rounded-xl border border-stone-300/80 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={tile.src}
                      alt={tile.label}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-stone-200 px-3.5 py-2.5 dark:border-zinc-800">
                    <span className="font-serif text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {tile.label}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d4b97e]" aria-hidden="true" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-stone-300/80 pt-4 text-[11px] font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:border-zinc-800 dark:text-zinc-400">
              <span>Live Stock Gauges</span>
              <span aria-hidden="true">·</span>
              <span>Optimistic Voting</span>
              <span aria-hidden="true">·</span>
              <span>Admin Restock Controls</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
