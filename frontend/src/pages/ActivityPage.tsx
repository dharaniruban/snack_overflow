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
    <div>
      <section className="charcoal-bar border-b border-zinc-800/90 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold tracking-[0.26em] text-[#d4b97e] uppercase">
            Admin Audit Ledger
          </p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Pantry Activity
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">
            Chronological record of every snack consumed and restocked across the office.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="parchment-panel rounded-xl border border-zinc-800 p-6 text-zinc-900 shadow-2xl sm:p-8 dark:text-zinc-100">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-14 animate-pulse rounded-xl border border-stone-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 bg-white/90 p-8 text-center dark:border-red-900/60 dark:bg-zinc-900">
              <XCircle className="mx-auto h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
              <h2 className="mt-3 font-serif text-lg font-semibold text-zinc-950 dark:text-white">
                Could not load activity feed
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {getFriendlyErrorMessage(error)}
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#1c1d20] px-4 py-2 text-xs font-bold tracking-wider text-[#f3dfb0] uppercase hover:bg-[#2c2e33]"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-stone-300/70 bg-white/80 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <Clock className="mx-auto h-8 w-8 text-zinc-400" aria-hidden="true" />
              <h2 className="mt-3 font-serif text-lg font-semibold text-zinc-950 dark:text-white">
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
                      className="rounded-xl border border-stone-300/80 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-serif text-base font-semibold text-zinc-950 dark:text-zinc-100">
                            {entry.snackName}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                            {entry.userName} · {formatActivityDate(entry.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase ${
                            isRestock
                              ? 'border-[#b5975a]/50 bg-[#d4b97e]/20 text-[#7d6026] dark:border-[#d4b97e]/40 dark:bg-[#d4b97e]/15 dark:text-[#d4b97e]'
                              : 'border-stone-300 bg-stone-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          {isRestock ? (
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>{entry.action}</span>
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-2.5 font-mono text-xs tabular-nums dark:border-zinc-800">
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
              <div className="hidden overflow-hidden rounded-xl border border-stone-300/80 bg-white/90 md:block dark:border-zinc-800 dark:bg-zinc-900">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-100/80 text-[11px] font-bold tracking-wider text-zinc-600 uppercase dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300">
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
                          className="border-b border-stone-200/70 last:border-b-0 hover:bg-stone-100/60 dark:border-zinc-800/80 dark:hover:bg-zinc-800/40"
                        >
                          <td
                            className="px-4 py-3 text-xs text-zinc-500 tabular-nums dark:text-zinc-400"
                            title={new Date(entry.createdAt).toLocaleString()}
                          >
                            {formatActivityDate(entry.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                            {entry.userName}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase ${
                                isRestock
                                  ? 'border-[#b5975a]/50 bg-[#d4b97e]/20 text-[#7d6026] dark:border-[#d4b97e]/40 dark:bg-[#d4b97e]/15 dark:text-[#d4b97e]'
                                  : 'border-stone-300 bg-stone-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                              }`}
                            >
                              {isRestock ? (
                                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                              ) : (
                                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                              <span>{entry.action}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 font-serif text-base font-semibold text-zinc-950 dark:text-zinc-100">
                            {entry.snackName}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono font-bold tabular-nums ${
                              isRestock
                                ? 'text-[#8f7134] dark:text-[#d4b97e]'
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
                <div className="mt-6 flex items-center justify-between border-t border-stone-300/80 pt-4 dark:border-zinc-800">
                  <span className="font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                    Page {pagination.page} of {Math.max(1, pagination.totalPages)} · {pagination.total}{' '}
                    events
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pagination.page <= 1}
                      onClick={() => setPage(pagination.page - 1)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 transition-all hover:bg-stone-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Previous</span>
                    </button>
                    <button
                      type="button"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPage(pagination.page + 1)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 transition-all hover:bg-stone-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
