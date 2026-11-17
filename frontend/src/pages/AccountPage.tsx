import { LogOut, Mail, Shield, Shuffle, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';

const SHOW_DEMO_LOGIN = import.meta.env.VITE_SHOW_DEMO_LOGIN === 'true';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@bpf.com', password: 'Admin@123', role: 'admin' as const },
  { label: 'Member', email: 'member@bpf.com', password: 'Member@123', role: 'member' as const },
];

export function AccountPage() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSwitch = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    if (account.role === user.role) return;
    logout();
    navigate('/login', { replace: true });
  };

  const initial = user.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div>
      <section className="charcoal-bar border-b border-zinc-800/90 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold tracking-[0.26em] text-[#d4b97e] uppercase">
            Pantry Account
          </p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Your Account
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">
            Manage your pantry profile and session.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl sm:p-8">
          {/* Profile summary */}
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#d4b97e] font-serif text-2xl font-bold text-zinc-950"
            >
              {initial}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-serif text-2xl font-semibold text-white">
                {user.name}
              </h2>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-zinc-400 sm:justify-start">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="truncate">{user.email}</span>
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-[#d4b97e]/40 bg-[#d4b97e]/10 px-2.5 py-1 text-[11px] font-bold tracking-wider text-[#d4b97e] uppercase">
                {isAdmin ? (
                  <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{isAdmin ? 'Admin' : 'Member'}</span>
              </p>
            </div>
          </div>

          {/* Account details */}
          <dl className="mt-8 grid grid-cols-1 gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                Role
              </dt>
              <dd className="mt-1 font-medium text-zinc-200">
                {isAdmin
                  ? 'Admin — can restock, edit, and view activity'
                  : 'Member — can browse, grab, and vote'}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                User ID
              </dt>
              <dd className="mt-1 truncate font-mono text-xs text-zinc-400">{user.id}</dd>
            </div>
          </dl>

          {/* Switch account (demo) */}
          {SHOW_DEMO_LOGIN && (
            <div className="mt-8 border-t border-zinc-800 pt-6">
              <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-zinc-400 uppercase">
                <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                Switch account
              </p>
              <p className="mt-1.5 text-sm text-zinc-400">
                Jump between the seeded demo accounts without signing out.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DEMO_ACCOUNTS.map((account) => {
                  const isCurrent = account.role === user.role;
                  return (
                    <button
                      key={account.role}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => void handleSwitch(account)}
                      className="min-h-[44px] rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-[#d4b97e]/60 hover:text-[#d4b97e] focus-visible:outline-2 focus-visible:outline-[#d4b97e] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCurrent
                        ? `Current: ${account.label}`
                        : `Switch to ${account.label}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sign out */}
          <div className="mt-8 flex justify-end border-t border-zinc-800 pt-6">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-red-900/70 px-4 py-2 text-xs font-bold tracking-wider text-red-300 uppercase transition-colors hover:border-red-500/70 hover:bg-red-950/40"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
