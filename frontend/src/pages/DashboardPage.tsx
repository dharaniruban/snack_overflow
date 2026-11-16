import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSnackEvents } from '../hooks/useSnackEvents';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth';
import { friendlyError } from '../lib/errors';
import type { SummaryResponse } from '../lib/types';
import { StatusBadge } from '../components/StatusBadge';

export function DashboardPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  useSnackEvents(token, () => {
    void queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
  });

  const summaryQuery = useQuery({
    queryKey: ['snack-summary'],
    queryFn: () => apiFetch<SummaryResponse>('/snacks/summary', { token }),
    enabled: Boolean(token),
    staleTime: 30_000,
  });

  if (summaryQuery.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
    );
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/30">
        <p className="text-rose-700 dark:text-rose-300">{friendlyError(summaryQuery.error)}</p>
        <button
          type="button"
          onClick={() => summaryQuery.refetch()}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { counts, snackOfWeek } = summaryQuery.data;
  const total = counts.stocked + counts.runningLow + counts.gone;
  const health = total === 0 ? 100 : Math.round((counts.stocked / total) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Pantry dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {user?.name}. The biscuits are watching you.
          </p>
        </div>
        <Link
          to="/snacks"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Browse snacks
        </Link>
      </div>

      <section
        aria-label="Pantry health"
        className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600 dark:text-slate-300">Pantry health</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{health}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full rounded-full transition-all ${health >= 70 ? 'bg-emerald-500' : health >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${health}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {counts.stocked} of {total} snacks fully stocked
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Stocked"
          value={counts.stocked}
          classes="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
          valueClass="text-emerald-700 dark:text-emerald-300"
        />
        <SummaryCard
          label="Running low"
          value={counts.runningLow}
          classes="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
          valueClass="text-amber-700 dark:text-amber-300"
        />
        <SummaryCard
          label="Gone"
          value={counts.gone}
          classes="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30"
          valueClass="text-rose-700 dark:text-rose-300"
        />
      </section>

      {snackOfWeek ? (
        <section
          aria-label="Snack of the week"
          className="relative overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-amber-50 p-6 dark:border-brand-900 dark:from-brand-950/40 dark:to-amber-950/30"
        >
          <div className="absolute -right-4 -top-4 text-7xl opacity-20" aria-hidden="true">
            👑
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-300">
            Snack of the Week
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {snackOfWeek.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {snackOfWeek.voteCount} vote{snackOfWeek.voteCount === 1 ? '' : 's'} and climbing — the
            office has spoken.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge status={snackOfWeek.status} />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {snackOfWeek.quantity} left · threshold {snackOfWeek.lowStockThreshold}
            </span>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <div className="text-4xl" aria-hidden="true">
            🗳️
          </div>
          <p className="mt-2 font-medium text-slate-700 dark:text-slate-200">
            No Snack of the Week yet
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cast your first vote to crown a champion.
          </p>
        </section>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  classes,
  valueClass,
}: {
  label: string;
  value: number;
  classes: string;
  valueClass: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${classes}`}>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}
