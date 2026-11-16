import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Plus,
  RefreshCw,
  Search,
  Table2,
  X,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { SnackCard } from '@/src/components/SnackCard';
import { DeleteSnackModal, RestockModal, SnackFormModal } from '@/src/components/SnackModals';
import { SnackTable } from '@/src/components/SnackTable';
import { useAuth } from '@/src/context/AuthContext';
import { useDebouncedValue } from '@/src/hooks/useDebounce';
import {
  useConsumeMutation,
  useCreateSnackMutation,
  useDeleteSnackMutation,
  useRestockMutation,
  useUpdateSnackMutation,
  useVoteMutation,
} from '@/src/hooks/useSnackMutations';
import { useSnacksList } from '@/src/hooks/useSnacksQuery';
import { getFriendlyErrorMessage } from '@/src/lib/errors';
import { SNACK_CATEGORIES, SNACK_STATUSES } from '@/src/lib/snackDisplay';
import type {
  Snack,
  SnackCategory,
  SnackSortField,
  SnackStatus,
  SortOrder,
} from '@/src/types/api';

const EMPTY_PANTRY_IMAGE = '/src/assets/images/empty_pantry_jar_1794826280565.jpg';
const VALID_CATEGORIES = new Set<string>(SNACK_CATEGORIES.map((c) => c.value));
const VALID_STATUSES = new Set<string>(SNACK_STATUSES.map((s) => s.value));
const VALID_SORTS = new Set<string>(['name', 'quantity', 'votes']);

export function SnacksPage() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const urlQ = searchParams.get('q') ?? '';
  const urlCategory = (
    VALID_CATEGORIES.has(searchParams.get('category') ?? '')
      ? searchParams.get('category')
      : ''
  ) as SnackCategory | '';
  const urlStatus = (
    VALID_STATUSES.has(searchParams.get('status') ?? '')
      ? searchParams.get('status')
      : ''
  ) as SnackStatus | '';
  const urlSort = (
    VALID_SORTS.has(searchParams.get('sort') ?? '')
      ? searchParams.get('sort')
      : 'name'
  ) as SnackSortField;
  const urlOrder = (searchParams.get('order') === 'desc' ? 'desc' : 'asc') as SortOrder;
  const rawPage = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const urlPage = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const rawPageSize = Number.parseInt(searchParams.get('pageSize') ?? '10', 10);
  const urlPageSize = [10, 20, 50].includes(rawPageSize) ? rawPageSize : 10;

  const [searchInput, setSearchInput] = useState(urlQ);
  const debouncedSearch = useDebouncedValue(searchInput, 280);

  useEffect(() => {
    setSearchInput(urlQ);
  }, [urlQ]);

  useEffect(() => {
    const state = location.state as { focusSearch?: boolean } | null;
    if (state?.focusSearch) {
      searchInputRef.current?.focus();
    }
  }, [location.state]);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === urlQ) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (trimmed) {
          next.set('q', trimmed);
        } else {
          next.delete('q');
        }
        next.set('page', '1');
        return next;
      },
      { replace: true }
    );
  }, [debouncedSearch, urlQ, setSearchParams]);

  const queryParams = useMemo(
    () => ({
      q: urlQ || undefined,
      category: urlCategory || undefined,
      status: urlStatus || undefined,
      sort: urlSort,
      order: urlOrder,
      page: urlPage,
      pageSize: urlPageSize,
    }),
    [urlQ, urlCategory, urlStatus, urlSort, urlOrder, urlPage, urlPageSize]
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useSnacksList(queryParams);

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [emptyImgFailed, setEmptyImgFailed] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingSnack, setEditingSnack] = useState<Snack | null>(null);
  const [restockingSnack, setRestockingSnack] = useState<Snack | null>(null);
  const [deletingSnack, setDeletingSnack] = useState<Snack | null>(null);

  const voteMutation = useVoteMutation();
  const consumeMutation = useConsumeMutation();
  const createMutation = useCreateSnackMutation();
  const updateMutation = useUpdateSnackMutation();
  const restockMutation = useRestockMutation();
  const deleteMutation = useDeleteSnackMutation();

  const pendingVoteId = voteMutation.isPending ? voteMutation.variables?.snack.id ?? null : null;
  const pendingConsumeId = consumeMutation.isPending
    ? consumeMutation.variables?.snackId ?? null
    : null;

  const updateFilterParam = (key: string, value: string, resetPage = true) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (resetPage) {
        next.set('page', '1');
      }
      return next;
    });
  };

  const handleSortChange = (field: SnackSortField) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (urlSort === field) {
        next.set('order', urlOrder === 'asc' ? 'desc' : 'asc');
      } else {
        next.set('sort', field);
        next.set('order', field === 'name' ? 'asc' : 'desc');
      }
      next.set('page', '1');
      return next;
    });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(urlQ || urlCategory || urlStatus);
  const snacks = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
            Office Pantry
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Browse snacks, log what you grab, and vote on favorites for the next restock.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Desktop View Toggle */}
          <div
            role="group"
            aria-label="View layout"
            className="hidden items-center rounded-xl border border-zinc-200 bg-white p-1 md:inline-flex dark:border-zinc-800 dark:bg-zinc-900"
          >
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              aria-pressed={viewMode === 'cards'}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                viewMode === 'cards'
                  ? 'bg-yellow-400 text-zinc-950'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                viewMode === 'table'
                  ? 'bg-yellow-400 text-zinc-950'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Table</span>
            </button>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950 whitespace-nowrap shadow-[0_1px_0_0_rgba(255,255,255,0.45)_inset] transition-all duration-150 hover:bg-yellow-300 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Add snack</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search Input with "/" hint */}
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <input
              id="pantry-search-input"
              ref={searchInputRef}
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search snacks by name..."
              aria-label="Search snacks"
              className="block min-h-[42px] w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pr-14 pl-10 text-sm text-zinc-950 placeholder:text-zinc-400 transition-colors focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-950"
            />
            <div className="absolute inset-y-0 right-2.5 flex items-center gap-1">
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  aria-label="Clear search"
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ) : (
                <kbd
                  aria-hidden="true"
                  className="hidden rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[11px] font-medium text-zinc-400 sm:inline-block dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Sort & Status Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filter by stock status"
              value={urlStatus}
              onChange={(e) => updateFilterParam('status', e.target.value)}
              className="min-h-[42px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 focus:border-yellow-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
            >
              <option value="">All statuses</option>
              {SNACK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
              <select
                aria-label="Sort snacks by"
                value={urlSort}
                onChange={(e) => updateFilterParam('sort', e.target.value)}
                className="min-h-[40px] rounded-l-xl bg-transparent py-2 pr-2 pl-3 text-sm font-medium text-zinc-800 focus:outline-none dark:text-zinc-200"
              >
                <option value="name">Sort: Name</option>
                <option value="quantity">Sort: Quantity</option>
                <option value="votes">Sort: Votes</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  updateFilterParam('order', urlOrder === 'asc' ? 'desc' : 'asc')
                }
                aria-label={`Sort direction: ${urlOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                className="flex min-h-[40px] items-center gap-1 rounded-r-xl border-l border-zinc-200 px-3 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-yellow-400 dark:hover:bg-zinc-800"
              >
                <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="uppercase">{urlOrder}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div
            role="tablist"
            aria-label="Filter by snack category"
            className="flex flex-wrap items-center gap-1.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={urlCategory === ''}
              onClick={() => updateFilterParam('category', '')}
              className={`min-h-[36px] rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all active:scale-[0.97] ${
                urlCategory === ''
                  ? 'bg-yellow-400 text-zinc-950'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white'
              }`}
            >
              All
            </button>
            {SNACK_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                role="tab"
                aria-selected={urlCategory === cat.value}
                onClick={() => updateFilterParam('category', cat.value)}
                className={`min-h-[36px] rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all active:scale-[0.97] ${
                  urlCategory === cat.value
                    ? 'bg-yellow-400 text-zinc-950'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-bold text-yellow-600 hover:underline dark:text-yellow-400"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Data Region */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="flex h-80 animate-pulse flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="h-40 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-2.5">
                <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-5 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="h-10 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-900/60 dark:bg-zinc-900">
          <XCircle className="mx-auto h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-bold text-zinc-950 dark:text-white">
            Could not load snacks
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
      ) : snacks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900"
        >
          {!emptyImgFailed && (
            <img
              src={EMPTY_PANTRY_IMAGE}
              alt="Empty glass biscuit jar with toasted crumbs"
              referrerPolicy="no-referrer"
              onError={() => setEmptyImgFailed(true)}
              className="mx-auto h-36 w-36 rounded-2xl border border-zinc-100 object-cover dark:border-zinc-800"
            />
          )}
          <h2 className="mt-5 font-display text-xl font-bold text-zinc-950 dark:text-white">
            The pantry is bare. Someone call the biscuit fairy.
          </h2>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            {hasActiveFilters
              ? 'No snacks match your current search or filters.'
              : 'There are no snacks in the pantry yet.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="min-h-[40px] rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Clear filters
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-yellow-300"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Add first snack</span>
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className={isFetching ? 'opacity-80 transition-opacity' : ''}>
          {viewMode === 'table' ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {snacks.map((snack, index) => (
                  <SnackCard
                    key={snack.id}
                    snack={snack}
                    index={index}
                    isAdmin={isAdmin}
                    isVoting={pendingVoteId === snack.id}
                    isConsuming={pendingConsumeId === snack.id}
                    onVote={(s, el) => voteMutation.mutate({ snack: s, anchorEl: el })}
                    onConsume={(s, amount) =>
                      consumeMutation.mutate({ snackId: s.id, snackName: s.name, amount })
                    }
                    onRestock={setRestockingSnack}
                    onEdit={setEditingSnack}
                    onDelete={setDeletingSnack}
                  />
                ))}
              </div>
              <div className="hidden md:block">
                <SnackTable
                  snacks={snacks}
                  isAdmin={isAdmin}
                  sort={urlSort}
                  order={urlOrder}
                  pendingVoteId={pendingVoteId}
                  pendingConsumeId={pendingConsumeId}
                  onSortChange={handleSortChange}
                  onVote={(s, el) => voteMutation.mutate({ snack: s, anchorEl: el })}
                  onConsume={(s, amount) =>
                    consumeMutation.mutate({ snackId: s.id, snackName: s.name, amount })
                  }
                  onRestock={setRestockingSnack}
                  onEdit={setEditingSnack}
                  onDelete={setDeletingSnack}
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {snacks.map((snack, index) => (
                <SnackCard
                  key={snack.id}
                  snack={snack}
                  index={index}
                  isAdmin={isAdmin}
                  isVoting={pendingVoteId === snack.id}
                  isConsuming={pendingConsumeId === snack.id}
                  onVote={(s, el) => voteMutation.mutate({ snack: s, anchorEl: el })}
                  onConsume={(s, amount) =>
                    consumeMutation.mutate({ snackId: s.id, snackName: s.name, amount })
                  }
                  onRestock={setRestockingSnack}
                  onEdit={setEditingSnack}
                  onDelete={setDeletingSnack}
                />
              ))}
            </div>
          )}

          {pagination && (
            <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-4 sm:flex-row dark:border-zinc-800">
              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-mono tabular-nums">
                  Page {pagination.page} of {Math.max(1, pagination.totalPages)} · {pagination.total}{' '}
                  {pagination.total === 1 ? 'snack' : 'snacks'}
                </span>
                <select
                  aria-label="Snacks per page"
                  value={urlPageSize}
                  onChange={(e) => updateFilterParam('pageSize', e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => updateFilterParam('page', String(pagination.page - 1), false)}
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-800 transition-all hover:bg-zinc-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => updateFilterParam('page', String(pagination.page + 1), false)}
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-800 transition-all hover:bg-zinc-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Modals */}
      {isAdmin && createOpen && (
        <SnackFormModal
          mode="create"
          isPending={createMutation.isPending}
          onClose={() => setCreateOpen(false)}
          onSubmitCreate={async (input) => {
            await createMutation.mutateAsync(input);
          }}
          onSubmitEdit={async () => {}}
        />
      )}

      {isAdmin && editingSnack && (
        <SnackFormModal
          mode="edit"
          initialSnack={editingSnack}
          isPending={updateMutation.isPending}
          onClose={() => setEditingSnack(null)}
          onSubmitCreate={async () => {}}
          onSubmitEdit={async (id, input) => {
            await updateMutation.mutateAsync({ id, input });
          }}
        />
      )}

      {isAdmin && restockingSnack && (
        <RestockModal
          snack={restockingSnack}
          isPending={restockMutation.isPending}
          onClose={() => setRestockingSnack(null)}
          onSubmit={async (snackId, amount) => {
            await restockMutation.mutateAsync({ snackId, amount });
          }}
        />
      )}

      {isAdmin && deletingSnack && (
        <DeleteSnackModal
          snack={deletingSnack}
          isPending={deleteMutation.isPending}
          onClose={() => setDeletingSnack(null)}
          onConfirm={async (snack) => {
            await deleteMutation.mutateAsync({ id: snack.id, name: snack.name });
          }}
        />
      )}
    </div>
  );
}
