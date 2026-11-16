import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
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
        <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
          Pantry Activity
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Admin audit feed of every snack consumed and restocked across the office.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-14 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-900/60 dark:bg-zinc-900">
          <XCircle className="mx-auto h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-bold text-zinc-950 dark:text-white">
            Could not load activity feed
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {getFriendlyErrorMessage(error)}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950 transition-all hover:bg-yellow-300 active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Clock className="mx-auto h-8 w-8 text-zinc-400" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-bold text-zinc-950 dark:text-white">
            No pantry activity yet
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Consumptions and restocks will appear here as soon as they happen.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {items.map((entry, index) => {
              const isRestock = entry.action === 'restocked';
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-zinc-950 dark:text-zinc-100">
                        {entry.snackName}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {entry.userName} · {formatActivityDate(entry.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-bold ${
                        isRestock
                          ? 'border-yellow-300 bg-yellow-400/20 text-yellow-800 dark:border-yellow-500/40 dark:bg-yellow-400/15 dark:text-yellow-300'
                          : 'border-zinc-200 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
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

                  <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 font-mono text-xs tabular-nums dark:border-zinc-800">
                    <span className="font-bold text-zinc-950 dark:text-zinc-100">
                      {isRestock ? `+${entry.amount}` : `-${entry.amount}`} units
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {entry.quantityBefore} → {entry.quantityAfter}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white md:block dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Snack</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Stock change</th>
                </tr>
              </thead>
              <tbody>
                {items.map((entry, index) => {
                  const isRestock = entry.action === 'restocked';
                  return (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.16, delay: Math.min(index * 0.025, 0.2) }}
                      className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/70 dark:border-zinc-800/80 dark:hover:bg-zinc-800/40"
                    >
                      <td
                        className="px-4 py-3 text-xs text-zinc-500 tabular-nums dark:text-zinc-400"
                        title={new Date(entry.createdAt).toLocaleString()}
                      >
                        {formatActivityDate(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-950 dark:text-zinc-100">
                        {entry.userName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-bold ${
                            isRestock
                              ? 'border-yellow-300 bg-yellow-400/20 text-yellow-800 dark:border-yellow-500/40 dark:bg-yellow-400/15 dark:text-yellow-300'
                              : 'border-zinc-200 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
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
                      <td className="px-4 py-3 font-bold text-zinc-950 dark:text-zinc-100">
                        {entry.snackName}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold tabular-nums ${
                          isRestock
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {isRestock ? `+${entry.amount}` : `-${entry.amount}`}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
                        {entry.quantityBefore} → {entry.quantityAfter}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <span className="font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                Page {pagination.page} of {Math.max(1, pagination.totalPages)} · {pagination.total}{' '}
                events
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage(pagination.page - 1)}
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-800 transition-all hover:bg-zinc-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage(pagination.page + 1)}
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-800 transition-all hover:bg-zinc-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
