import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth';
import { friendlyError } from '../lib/errors';
import type { ActivityListResponse } from '../lib/types';

const PAGE_SIZE = 20;

export function ActivityPage() {
  const { token, isAdmin } = useAuth();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['activity', page],
    queryFn: () =>
      apiFetch<ActivityListResponse>(`/activity?page=${page}&pageSize=${PAGE_SIZE}`, { token }),
    enabled: Boolean(token) && isAdmin,
    placeholderData: keepPreviousData,
  });

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="font-medium text-slate-700 dark:text-slate-200">Admins only</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The activity log is a VIP lounge.
        </p>
      </div>
    );
  }

  const items = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pantry activity</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Who ate what, and when the cupboard was refilled.
        </p>
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : query.isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/30">
          <p className="text-rose-700 dark:text-rose-300">{friendlyError(query.error)}</p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <p className="font-medium text-slate-700 dark:text-slate-200">No activity yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Consume or restock a snack to start the log.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Snack</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Qty before → after</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {item.userName}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {item.snackName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          item.action === 'consumed'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                        }`}
                      >
                        {item.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{item.amount}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {item.quantityBefore} → {item.quantityAfter}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <nav
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
              aria-label="Pagination"
            >
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page <= 1 || query.isFetching}
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((value) => value + 1)}
                  disabled={page >= pagination.totalPages || query.isFetching}
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
