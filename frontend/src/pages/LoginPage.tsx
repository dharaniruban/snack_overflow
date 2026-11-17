import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { ApiError } from '@/src/lib/errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEMO_ACCOUNTS = [
  { label: 'Demo: Admin', email: 'admin@bpf.com', password: 'Admin@123' },
  { label: 'Demo: Member', email: 'member@bpf.com', password: 'Member@123' },
] as const;

const FLOATING_SNACKS = [
  { emoji: '🍿', className: 'top-[12%] left-[8%] text-3xl', delay: '0s', duration: '7s' },
  { emoji: '🥜', className: 'top-[20%] right-[10%] text-2xl', delay: '1.2s', duration: '8s' },
  { emoji: '🍫', className: 'bottom-[18%] left-[12%] text-2xl', delay: '0.6s', duration: '9s' },
  { emoji: '🥤', className: 'bottom-[24%] right-[14%] text-3xl', delay: '1.8s', duration: '7.5s' },
  { emoji: '🍪', className: 'top-[55%] left-[4%] text-xl', delay: '2.4s', duration: '8.5s' },
  { emoji: '🧀', className: 'top-[60%] right-[5%] text-xl', delay: '0.9s', duration: '7.2s' },
] as const;

type FieldName = 'email' | 'password';
type FieldErrors = Partial<Record<FieldName, string>>;

interface ZodFieldErrors {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
}

function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required.';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address.';
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return 'Password is required.';
  return null;
}

function getFieldError(name: FieldName, value: string): string | null {
  return name === 'email' ? validateEmail(value) : validatePassword(value);
}

function extractFieldErrors(details: unknown): { fields: FieldErrors; formMessage: string | null } {
  const fields: FieldErrors = {};
  let formMessage: string | null = null;

  if (details && typeof details === 'object') {
    const flattened = details as ZodFieldErrors;
    const emailErr = flattened.fieldErrors?.email?.[0];
    const passwordErr = flattened.fieldErrors?.password?.[0];
    if (emailErr) fields.email = emailErr;
    if (passwordErr) fields.password = passwordErr;
    formMessage = flattened.formErrors?.[0] ?? null;
  }

  return { fields, formMessage };
}

export function LoginPage() {
  const showDemoLogin = import.meta.env.VITE_SHOW_DEMO_LOGIN === 'true';
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    email: false,
    password: false,
  });

  const alertRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (serverError) {
      alertRef.current?.focus();
    }
  }, [serverError]);

  const sessionExpired = Boolean(
    (location.state as { sessionExpired?: boolean } | null)?.sessionExpired
  );

  const setFieldError = (name: FieldName, value: string) => {
    setFieldErrors((prev) => ({ ...prev, [name]: getFieldError(name, value) ?? undefined }));
  };

  const handleBlur = (name: FieldName) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldError(name, name === 'email' ? email : password);
  };

  const focusFirstInvalid = (errors: FieldErrors) => {
    if (errors.email) {
      emailRef.current?.focus();
    } else if (errors.password) {
      passwordRef.current?.focus();
    }
  };

  const performLogin = async (emailValue: string, passwordValue: string) => {
    if (submitting) return;

    const trimmedEmail = emailValue.trim();
    const errors: FieldErrors = {
      email: validateEmail(trimmedEmail) ?? undefined,
      password: validatePassword(passwordValue) ?? undefined,
    };
    setTouched({ email: true, password: true });
    setFieldErrors(errors);
    setServerError(null);

    if (errors.email || errors.password) {
      focusFirstInvalid(errors);
      return;
    }

    setSubmitting(true);
    try {
      await login(trimmedEmail, passwordValue);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith('/') && from !== '/login' ? from : '/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.code === 'UNAUTHENTICATED') {
          setServerError('Incorrect email or password.');
        } else if (err.code === 'RATE_LIMITED' || err.status === 429) {
          setServerError('Too many attempts. Please wait a minute and try again.');
        } else if (err.code === 'VALIDATION_ERROR' || err.status === 400) {
          const { fields, formMessage } = extractFieldErrors(err.details);
          if (fields.email || fields.password) {
            setFieldErrors((prev) => ({ ...prev, ...fields }));
            focusFirstInvalid(fields);
          } else {
            setServerError(formMessage || 'Please check your input and try again.');
          }
        } else {
          setServerError('Something went wrong. Please try again.');
        }
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void performLogin(email, password);
  };

  const handleDemoLogin = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setFieldErrors({});
    setServerError(null);
    void performLogin(account.email, account.password);
  };

  const visibleEmailError = touched.email ? fieldErrors.email : undefined;
  const visiblePasswordError = touched.password ? fieldErrors.password : undefined;

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-10">
      {/* Soft gradient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 dark:from-[#121114] dark:via-[#16161a] dark:to-[#1d1a15]"
      />

      {/* Floating snack emoji decoration (CSS-only, disabled under reduced motion) */}
      {FLOATING_SNACKS.map((snack) => (
        <span
          key={snack.emoji}
          aria-hidden="true"
          className={`float-slow pointer-events-none absolute select-none opacity-40 dark:opacity-30 ${snack.className}`}
          style={{ animationDelay: snack.delay, animationDuration: snack.duration }}
        >
          {snack.emoji}
        </span>
      ))}

      <div className="relative w-full max-w-[400px] rounded-2xl border border-amber-200/70 bg-white/90 p-6 shadow-xl backdrop-blur-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/85">
        {/* Header */}
        <div className="text-center">
          <span aria-hidden="true" className="text-4xl">
            🥜
          </span>
          <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Snack Overflow
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Welcome back, snack hero.
          </p>
        </div>

        {sessionExpired && (
          <p
            role="status"
            className="mt-5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-200"
          >
            Your session expired. Please sign in again.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200"
            >
              Email
            </label>
            <input
              ref={emailRef}
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              disabled={submitting}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) setFieldError('email', e.target.value);
              }}
              onBlur={() => handleBlur('email')}
              aria-invalid={Boolean(visibleEmailError)}
              aria-describedby={visibleEmailError ? 'login-email-error' : undefined}
              placeholder="you@example.com"
              className="mt-1.5 block min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-2 focus:outline-amber-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            {visibleEmailError && (
              <p id="login-email-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {visibleEmailError}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200"
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                ref={passwordRef}
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={submitting}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) setFieldError('password', e.target.value);
                }}
                onBlur={() => handleBlur('password')}
                aria-invalid={Boolean(visiblePasswordError)}
                aria-describedby={visiblePasswordError ? 'login-password-error' : undefined}
                placeholder="••••••••"
                className="block min-h-[44px] w-full rounded-lg border border-zinc-300 bg-white px-3.5 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-2 focus:outline-amber-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={submitting}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-800 focus-visible:outline-2 focus-visible:outline-amber-500 disabled:opacity-60 dark:hover:text-zinc-200"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            {visiblePasswordError && (
              <p id="login-password-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                {visiblePasswordError}
              </p>
            )}
          </div>

          {/* Server / network error alert */}
          {serverError && (
            <div
              ref={alertRef}
              role="alert"
              tabIndex={-1}
              className="rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800 focus:outline-2 focus:outline-red-500/50 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200"
            >
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold tracking-wide text-zinc-950 uppercase transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-amber-400 dark:hover:bg-amber-300"
          >
            {submitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-950"
                />
                <span>Signing in…</span>
                <span className="sr-only">Loading</span>
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {showDemoLogin && (
          <div className="mt-6 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <p className="text-center text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Demo accounts
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  onClick={() => handleDemoLogin(account)}
                  disabled={submitting}
                  className="min-h-[40px] rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:border-amber-500 hover:text-amber-700 focus-visible:outline-2 focus-visible:outline-amber-500 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-amber-400 dark:hover:text-amber-300"
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
