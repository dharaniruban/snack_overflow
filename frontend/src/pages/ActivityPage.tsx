import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useActivityFeed } from '@/src/hooks/useSnacksQuery';
import { getFriendlyErrorMessage } from '@/src/lib/errors';
import { formatActivityDate } from '@/src/lib/snackDisplay';

export function ActivityPage() {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawPage = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const pageSize = 20;

  const { data, isLoading, isError, error, refetch } = useActivityFeed(page, pageSize, isAdmin);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const setPage = (nextPage: number) => {
    setSearchParams({ page: String(nextPage) });
  };

  const items = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Pantry Activity
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Admin audit feed of every snack consumed and restocked across the office.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-14 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center dark:border-red-900/60 dark:bg-slate-900">
          <XCircle className="mx-auto h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-semibold text-slate-900 dark:text-white">
            Could not load activity feed
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {getFriendlyErrorMessage(error)}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Clock className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-semibold text-slate-900 dark:text-white">
            No pantry activity yet
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Consumptions and restocks will appear here as soon as they happen.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {items.map((entry) => {
              const isRestock = entry.action === 'restocked';
              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {entry.snackName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {entry.userName} · {formatActivityDate(entry.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${
                        isRestock
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}
                    >
                      {isRestock ? (
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span className="capitalize">{entry.action}</span>
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 font-mono text-xs tabular-nums dark:border-slate-800">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {isRestock ? `+${entry.amount}` : `-${entry.amount}`} units
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {entry.quantityBefore} → {entry.quantityAfter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Snack</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Stock change</th>
                </tr>
              </thead>
              <tbody>
                {items.map((entry) => {
                  const isRestock = entry.action === 'restocked';
                  return (
                    <tr
                      key={entry.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 dark:border-slate-800/80 dark:hover:bg-slate-800/40"
                    >
                      <td
                        className="px-4 py-3 text-xs text-slate-500 tabular-nums dark:text-slate-400"
                        title={new Date(entry.createdAt).toLocaleString()}
                      >
                        {formatActivityDate(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {entry.userName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${
                            isRestock
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                          }`}
                        >
                          {isRestock ? (
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span className="capitalize">{entry.action}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                        {entry.snackName}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-semibold tabular-nums ${
                          isRestock
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {isRestock ? `+${entry.amount}` : `-${entry.amount}`}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300">
                        {entry.quantityBefore} → {entry.quantityAfter}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
              <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                Page {pagination.page} of {Math.max(1, pagination.totalPages)} · {pagination.total}{' '}
                events
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage(pagination.page - 1)}
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage(pagination.page + 1)}
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
