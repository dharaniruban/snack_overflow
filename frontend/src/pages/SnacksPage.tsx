import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth';
import { friendlyError } from '../lib/errors';
import type { Snack, SnackCategory, SnackListResponse, SnackStatus } from '../lib/types';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useToast } from '../components/Toast';
import { SnackCard } from '../components/SnackCard';
import { SnackCardSkeleton } from '../components/Skeleton';
import { AmountDialog } from '../components/AmountDialog';
import { SnackFormDialog } from '../components/SnackFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';

const PAGE_SIZE = 12;
const CATEGORIES: Array<SnackCategory | ''> = ['', 'sweet', 'savoury', 'drink', 'healthy-ish'];
const STATUSES: Array<SnackStatus | ''> = ['', 'stocked', 'running_low', 'gone'];

export function SnacksPage() {
  const { token, isAdmin } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const category = (searchParams.get('category') ?? '') as SnackCategory | '';
  const status = (searchParams.get('status') ?? '') as SnackStatus | '';
  const qParam = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const [searchInput, setSearchInput] = useState(qParam);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const searchRef = useRef<HTMLInputElement>(null);

  const [consumeTarget, setConsumeTarget] = useState<Snack | null>(null);
  const [restockTarget, setRestockTarget] = useState<Snack | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSnack, setEditingSnack] = useState<Snack | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Snack | null>(null);
  const [confettiSnackId, setConfettiSnackId] = useState<string | null>(null);

  // Keep the search box in sync when the URL changes (back/forward, clear).
  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  useEffect(() => {
    if (debouncedSearch === qParam) return;
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (debouncedSearch) next.set('q', debouncedSearch);
        else next.delete('q');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  }, [debouncedSearch, qParam, setSearchParams]);

  // "/" focuses search from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    if (category) params.set('category', category);
    if (status) params.set('status', status);
    if (qParam) params.set('q', qParam);
    return params.toString();
  }, [page, category, status, qParam]);

  const snacksQuery = useQuery({
    queryKey: ['snacks', queryString],
    queryFn: () => apiFetch<SnackListResponse>(`/snacks?${queryString}`, { token }),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['snacks'] });
    void queryClient.invalidateQueries({ queryKey: ['snack-summary'] });
  };

  const consumeMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      apiFetch<Snack>(`/snacks/${id}/consume`, { method: 'POST', body: { amount }, token }),
    onSuccess: () => {
      push('success', 'Crunch logged. Stay hydrated.');
      invalidate();
    },
    onError: (error) => {
      push('error', friendlyError(error));
      invalidate();
    },
    onSettled: () => setConsumeTarget(null),
  });

  const restockMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      apiFetch<Snack>(`/snacks/${id}/restock`, { method: 'POST', body: { amount }, token }),
    onSuccess: () => {
      push('success', 'Back on the shelf. The office rejoices.');
      invalidate();
    },
    onError: (error) => {
      push('error', friendlyError(error));
      invalidate();
    },
    onSettled: () => setRestockTarget(null),
  });

  const voteMutation = useMutation<Snack | undefined, Error, { snack: Snack; action: 'vote' | 'unvote' }>({
    mutationFn: async ({ snack, action }) => {
      if (action === 'vote') {
        return apiFetch<Snack>(`/snacks/${snack.id}/vote`, { method: 'POST', token });
      }
      await apiFetch<void>(`/snacks/${snack.id}/vote`, { method: 'DELETE', token });
      return snack;
    },
    onSuccess: (_data, variables) => {
      if (variables.action === 'vote') {
        push('success', 'Vote counted! Democracy is delicious.');
        setConfettiSnackId(variables.snack.id);
        window.setTimeout(() => setConfettiSnackId(null), 900);
      } else {
        push('info', 'Vote removed. No hard feelings.');
      }
      invalidate();
    },
    onError: (error) => {
      push('error', friendlyError(error));
      invalidate();
    },
  });

  const saveMutation = useMutation({
    mutationFn: (values: { name: string; category: SnackCategory; quantity: number; lowStockThreshold: number }) => {
      if (editingSnack) {
        return apiFetch<Snack>(`/snacks/${editingSnack.id}`, { method: 'PATCH', body: values, token });
      }
      return apiFetch<Snack>('/snacks', { method: 'POST', body: values, token });
    },
    onSuccess: () => {
      push('success', editingSnack ? 'Snack updated.' : 'Snack added to the pantry.');
      setFormOpen(false);
      setEditingSnack(null);
      invalidate();
    },
    onError: (error) => {
      push('error', friendlyError(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/snacks/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      push('success', 'Snack removed. It lived a full life.');
      setDeleteTarget(null);
      invalidate();
    },
    onError: (error) => {
      push('error', friendlyError(error));
    },
  });

  const busy =
    consumeMutation.isPending ||
    restockMutation.isPending ||
    voteMutation.isPending ||
    saveMutation.isPending ||
    deleteMutation.isPending;

  const snacks = snacksQuery.data?.data ?? [];
  const pagination = snacksQuery.data?.pagination;
  const hasFilters = Boolean(category || status || qParam);

  const updateParam = (key: string, value: string) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const setPage = (nextPage: number) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (nextPage <= 1) next.delete('page');
        else next.set('page', String(nextPage));
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pantry snacks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Vote, consume, and keep the office fed.</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setEditingSnack(null);
              setFormOpen(true);
            }}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Add snack
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            ref={searchRef}
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search snacks… (press /)"
            aria-label="Search snacks"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-12 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
            /
          </kbd>
        </div>
        <select
          value={category}
          onChange={(event) => updateParam('category', event.target.value)}
          aria-label="Filter by category"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">All categories</option>
          {CATEGORIES.filter(Boolean).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => updateParam('status', event.target.value)}
          aria-label="Filter by status"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">All statuses</option>
          {STATUSES.filter(Boolean).map((value) => (
            <option key={value} value={value}>
              {value.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {snacksQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SnackCardSkeleton key={index} />
          ))}
        </div>
      ) : snacksQuery.isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/30">
          <p className="text-rose-700 dark:text-rose-300">{friendlyError(snacksQuery.error)}</p>
          <button
            type="button"
            onClick={() => snacksQuery.refetch()}
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Retry
          </button>
        </div>
      ) : snacks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <div className="text-5xl" aria-hidden="true">🍪</div>
          <p className="mt-3 font-medium text-slate-700 dark:text-slate-200">
            {hasFilters ? 'No snacks match those filters.' : 'The pantry is bare. Someone call the biscuit fairy.'}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => setSearchParams({}, { replace: true })}
              className="mt-4 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {snacks.map((snack) => (
            <SnackCard
              key={snack.id}
              snack={snack}
              isAdmin={isAdmin}
              disabled={busy}
              showConfetti={confettiSnackId === snack.id}
              onConsume={setConsumeTarget}
              onRestock={setRestockTarget}
              onVote={(target) => voteMutation.mutate({ snack: target, action: target.hasVoted ? 'unvote' : 'vote' })}
              onEdit={(target) => {
                setEditingSnack(target);
                setFormOpen(true);
              }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <nav className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900" aria-label="Pagination">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} snacks
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || snacksQuery.isFetching}
              className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages || snacksQuery.isFetching}
              className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Next
            </button>
          </div>
        </nav>
      )}

      <AmountDialog
        open={consumeTarget !== null}
        onClose={() => setConsumeTarget(null)}
        onConfirm={(amount) => consumeTarget && consumeMutation.mutate({ id: consumeTarget.id, amount })}
        loading={consumeMutation.isPending}
        mode="consume"
        snackName={consumeTarget?.name ?? ''}
      />
      <AmountDialog
        open={restockTarget !== null}
        onClose={() => setRestockTarget(null)}
        onConfirm={(amount) => restockTarget && restockMutation.mutate({ id: restockTarget.id, amount })}
        loading={restockMutation.isPending}
        mode="restock"
        snackName={restockTarget?.name ?? ''}
      />
      <SnackFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingSnack(null);
        }}
        onSubmit={(values) => saveMutation.mutate(values)}
        loading={saveMutation.isPending}
        snack={editingSnack}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Delete snack?"
        message={`"${deleteTarget?.name ?? ''}" will be removed from the pantry. Past activity is kept as history.`}
      />
    </div>
  );
}
