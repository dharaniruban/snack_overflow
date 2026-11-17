import {
  ArrowUpDown,
  Award,
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutGrid,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Table2,
  X,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { SnackCard } from '@/src/components/SnackCard';
import { SnackImage } from '@/src/components/SnackImage';
import { DeleteSnackModal, RestockModal, SnackFormModal } from '@/src/components/SnackModals';
import { LastPacketBadge, SnackStatusBadge } from '@/src/components/SnackStatusBadge';
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
import { formatCategoryLabel, SNACK_CATEGORIES, SNACK_STATUSES } from '@/src/lib/snackDisplay';
import type {
  Snack,
  SnackCategory,
  SnackSortField,
  SnackStatus,
  SortOrder,
} from '@/src/types/api';

const EMPTY_PANTRY_IMAGE = '/src/assets/images/empty_pantry_jar_1794826280565.jpg';

export interface PantryMenuFilterState {
  q: string;
  category: SnackCategory | '';
  status: SnackStatus | '';
  sort: SnackSortField;
  order: SortOrder;
  page: number;
  pageSize: number;
}

interface PantryMenuSectionProps {
  filters: PantryMenuFilterState;
  onUpdateFilter: (key: keyof PantryMenuFilterState, value: string, resetPage?: boolean) => void;
  onSortChange: (field: SnackSortField) => void;
  onClearAll: () => void;
  focusSearchTrigger?: boolean;
  snackOfTheWeek?: Snack | null;
  sectionId?: string;
}

export function PantryMenuSection({
  filters,
  onUpdateFilter,
  onSortChange,
  onClearAll,
  focusSearchTrigger = false,
  snackOfTheWeek = null,
  sectionId = 'pantry-menu',
}: PantryMenuSectionProps) {
  const { isAdmin } = useAuth();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const heroVoteBtnRef = useRef<HTMLButtonElement | null>(null);

  const [searchInput, setSearchInput] = useState(filters.q);
  const debouncedSearch = useDebouncedValue(searchInput, 260);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [emptyImgFailed, setEmptyImgFailed] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingSnack, setEditingSnack] = useState<Snack | null>(null);
  const [restockingSnack, setRestockingSnack] = useState<Snack | null>(null);
  const [deletingSnack, setDeletingSnack] = useState<Snack | null>(null);

  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  useEffect(() => {
    if (focusSearchTrigger) {
      searchInputRef.current?.focus();
    }
  }, [focusSearchTrigger]);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === filters.q) return;
    onUpdateFilter('q', trimmed, true);
  }, [debouncedSearch, filters.q, onUpdateFilter]);

  const { data, isLoading, isFetching, isError, error, refetch } = useSnacksList({
    q: filters.q || undefined,
    category: filters.category || undefined,
    status: filters.status || undefined,
    sort: filters.sort,
    order: filters.order,
    page: filters.page,
    pageSize: filters.pageSize,
  });

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

  const hasActiveFilters = Boolean(filters.q || filters.category || filters.status);
  const snacks = data?.data ?? [];
  const pagination = data?.pagination;

  const activeCategoryLabel = filters.category
    ? formatCategoryLabel(filters.category)
    : 'All Pantry Selections';

  return (
    <section
      id={sectionId}
      aria-labelledby="editorial-menu-heading"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-zinc-800 shadow-2xl lg:grid-cols-12">
        {/* LEFT DARK CHARCOAL MENU SIDEBAR (matches reference MENU column) */}
        <aside className="flex flex-col justify-between bg-[#1c1d20] px-6 py-8 text-center lg:col-span-4 xl:col-span-3">
          <div>
            <h2
              id="editorial-menu-heading"
              className="font-serif text-xl font-medium tracking-[0.26em] text-[#d4b97e] uppercase"
            >
              MENU
            </h2>
            <div className="mx-auto mt-3 h-px w-12 bg-[#d4b97e]/40" />

            {/* Category Links (centered tracked uppercase like reference) */}
            <nav aria-label="Snack categories" className="mt-7 space-y-1.5">
              <button
                type="button"
                onClick={() => onUpdateFilter('category', '')}
                aria-current={filters.category === '' ? 'true' : undefined}
                className={`block w-full rounded-lg px-3 py-2 text-xs font-semibold tracking-[0.2em] uppercase transition-colors ${
                  filters.category === ''
                    ? 'bg-white/10 text-[#d4b97e]'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                All
              </button>
              {SNACK_CATEGORIES.map((cat) => {
                const active = filters.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => onUpdateFilter('category', cat.value)}
                    aria-current={active ? 'true' : undefined}
                    className={`block w-full rounded-lg px-3 py-2 text-xs font-semibold tracking-[0.2em] uppercase transition-colors ${
                      active
                        ? 'bg-white/10 text-[#d4b97e]'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </nav>

            {/* Stock Status Filters */}
            <div className="mt-8 border-t border-zinc-800 pt-6">
              <p className="text-[10px] font-semibold tracking-[0.22em] text-zinc-400 uppercase">
                Stock Level
              </p>
              <div className="mt-3 space-y-1">
                <button
                  type="button"
                  onClick={() => onUpdateFilter('status', '')}
                  className={`block w-full rounded-lg px-3 py-1.5 text-[11px] font-medium tracking-[0.16em] uppercase transition-colors ${
                    filters.status === ''
                      ? 'text-[#d4b97e]'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  All Statuses
                </button>
                {SNACK_STATUSES.map((s) => {
                  const active = filters.status === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => onUpdateFilter('status', s.value)}
                      className={`block w-full rounded-lg px-3 py-1.5 text-[11px] font-medium tracking-[0.16em] uppercase transition-colors ${
                        active ? 'text-[#d4b97e]' : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Search + Sort Controls inside Sidebar */}
          <div className="mt-8 space-y-3 border-t border-zinc-800 pt-6 text-left">
            <div>
              <label
                htmlFor="pantry-search-input"
                className="block text-[10px] font-semibold tracking-[0.2em] text-zinc-400 uppercase"
              >
                Search Pantry
              </label>
              <div className="relative mt-2">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
                  aria-hidden="true"
                />
                <input
                  id="pantry-search-input"
                  ref={searchInputRef}
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Find a snack..."
                  aria-label="Search snacks"
                  className="block min-h-[40px] w-full rounded-lg border border-zinc-700 bg-[#141517] py-2 pr-10 pl-9 text-xs text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-[#d4b97e] focus:outline-none"
                />
                <div className="absolute inset-y-0 right-2 flex items-center">
                  {searchInput ? (
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      aria-label="Clear search"
                      className="rounded p-1 text-zinc-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  ) : (
                    <kbd
                      aria-hidden="true"
                      className="hidden rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 sm:inline-block"
                    >
                      /
                    </kbd>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="pantry-sort-select"
                className="block text-[10px] font-semibold tracking-[0.2em] text-zinc-400 uppercase"
              >
                Sort By
              </label>
              <div className="mt-2 flex items-center rounded-lg border border-zinc-700 bg-[#141517]">
                <select
                  id="pantry-sort-select"
                  value={filters.sort}
                  onChange={(e) => onUpdateFilter('sort', e.target.value)}
                  className="min-h-[38px] flex-1 bg-transparent px-3 text-xs font-medium text-zinc-200 focus:outline-none"
                >
                  <option value="name" className="bg-[#141517]">
                    Name
                  </option>
                  <option value="quantity" className="bg-[#141517]">
                    Quantity
                  </option>
                  <option value="votes" className="bg-[#141517]">
                    Votes
                  </option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateFilter('order', filters.order === 'asc' ? 'desc' : 'asc')
                  }
                  aria-label={`Sort direction: ${filters.order === 'asc' ? 'Ascending' : 'Descending'}`}
                  className="flex min-h-[38px] items-center gap-1 border-l border-zinc-700 px-2.5 text-[11px] font-bold text-[#d4b97e] uppercase hover:bg-white/5"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{filters.order}</span>
                </button>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  onClearAll();
                }}
                className="w-full rounded-lg border border-zinc-700 py-2 text-[11px] font-semibold tracking-[0.14em] text-[#d4b97e] uppercase transition-colors hover:border-[#d4b97e] hover:bg-white/5"
              >
                Reset all filters
              </button>
            )}
          </div>
        </aside>

        {/* RIGHT WARM PARCHMENT MENU SHEET */}
        <div className="parchment-panel flex flex-col justify-between p-6 text-zinc-900 sm:p-8 lg:col-span-8 xl:col-span-9 dark:text-zinc-100">
          <div>
            {/* Parchment Header */}
            <div className="flex flex-col justify-between gap-4 border-b border-stone-300/80 pb-5 sm:flex-row sm:items-end dark:border-zinc-800">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.2em] text-[#8f7134] uppercase dark:text-[#d4b97e]">
                  Curated Office Inventory
                </p>
                <h3 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
                  {activeCategoryLabel}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div
                  role="group"
                  aria-label="View layout"
                  className="hidden items-center rounded-lg border border-stone-300 bg-white/80 p-1 md:inline-flex dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    aria-pressed={viewMode === 'cards'}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                      viewMode === 'cards'
                        ? 'bg-[#1c1d20] text-[#f3dfb0] dark:bg-[#d4b97e] dark:text-[#141517]'
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
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                      viewMode === 'table'
                        ? 'bg-[#1c1d20] text-[#f3dfb0] dark:bg-[#d4b97e] dark:text-[#141517]'
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
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#1c1d20] px-4 py-2 text-xs font-bold tracking-wider text-[#f3dfb0] uppercase whitespace-nowrap transition-all hover:bg-[#2c2e33] active:scale-[0.98] dark:bg-[#d4b97e] dark:text-[#141517] dark:hover:bg-[#e3ca92]"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Add snack</span>
                  </button>
                )}
              </div>
            </div>

            {/* Optional Snack of the Week Editorial Spotlight Strip */}
            {snackOfTheWeek && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 flex flex-col justify-between gap-4 rounded-xl border border-[#b5975a]/45 bg-white/80 p-4 sm:flex-row sm:items-center dark:border-[#d4b97e]/35 dark:bg-zinc-900/80"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <SnackImage
                    name={snackOfTheWeek.name}
                    category={snackOfTheWeek.category}
                    imageUrl={snackOfTheWeek.imageUrl}
                    className="h-16 w-20 shrink-0 rounded-lg border border-stone-200 dark:border-zinc-700"
                    iconSizeClass="h-5 w-5"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.18em] text-[#8f7134] uppercase dark:text-[#d4b97e]">
                        <Award className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Snack of the Week</span>
                      </span>
                      <SnackStatusBadge status={snackOfTheWeek.status} />
                      {snackOfTheWeek.quantity === 1 && <LastPacketBadge />}
                    </div>
                    <h4 className="mt-1 truncate font-serif text-lg font-semibold text-zinc-950 dark:text-white">
                      {snackOfTheWeek.name}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      <span>{formatCategoryLabel(snackOfTheWeek.category)}</span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span className="font-mono tabular-nums">{snackOfTheWeek.quantity} left</span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span className="font-mono tabular-nums">{snackOfTheWeek.voteCount} votes</span>
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    ref={heroVoteBtnRef}
                    type="button"
                    disabled={voteMutation.isPending}
                    onClick={() =>
                      voteMutation.mutate({
                        snack: snackOfTheWeek,
                        anchorEl: heroVoteBtnRef.current,
                      })
                    }
                    aria-pressed={snackOfTheWeek.hasVoted}
                    className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.97] ${
                      snackOfTheWeek.hasVoted
                        ? 'border-[#d4b97e] bg-[#d4b97e] text-zinc-950'
                        : 'border-stone-300 bg-white text-zinc-800 hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'
                    }`}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 ${
                        snackOfTheWeek.hasVoted ? 'fill-zinc-950 text-zinc-950' : ''
                      }`}
                      aria-hidden="true"
                    />
                    <span className="font-mono tabular-nums">{snackOfTheWeek.voteCount}</span>
                  </button>

                  <button
                    type="button"
                    disabled={snackOfTheWeek.quantity <= 0 || consumeMutation.isPending}
                    onClick={() =>
                      consumeMutation.mutate({
                        snackId: snackOfTheWeek.id,
                        snackName: snackOfTheWeek.name,
                        amount: 1,
                      })
                    }
                    className="inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#1c1d20] px-3.5 py-1.5 text-xs font-bold tracking-wider text-[#f3dfb0] uppercase transition-all hover:bg-[#2c2e33] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-zinc-500 dark:bg-[#d4b97e] dark:text-[#141517] dark:hover:bg-[#e3ca92] dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{snackOfTheWeek.quantity <= 0 ? 'Empty' : 'Grab one'}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Snacks Content */}
            <div className="mt-6">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex h-72 animate-pulse flex-col justify-between rounded-xl border border-stone-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="h-36 w-full rounded-lg bg-stone-200 dark:bg-zinc-800" />
                      <div className="space-y-2">
                        <div className="h-3 w-24 rounded bg-stone-200 dark:bg-zinc-800" />
                        <div className="h-5 w-40 rounded bg-stone-200 dark:bg-zinc-800" />
                      </div>
                      <div className="h-9 w-full rounded-lg bg-stone-200 dark:bg-zinc-800" />
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="rounded-xl border border-red-200 bg-white/90 p-8 text-center dark:border-red-900/60 dark:bg-zinc-900">
                  <XCircle className="mx-auto h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
                  <h4 className="mt-3 font-serif text-lg font-semibold text-zinc-950 dark:text-white">
                    Could not load pantry items
                  </h4>
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
              ) : snacks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-xl border border-stone-300/70 bg-white/80 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {!emptyImgFailed && (
                    <img
                      src={EMPTY_PANTRY_IMAGE}
                      alt="Empty glass biscuit jar with toasted crumbs"
                      referrerPolicy="no-referrer"
                      onError={() => setEmptyImgFailed(true)}
                      className="mx-auto h-36 w-36 rounded-xl border border-stone-200 object-cover dark:border-zinc-800"
                    />
                  )}
                  <h4 className="mt-5 font-serif text-xl font-semibold text-zinc-950 dark:text-white">
                    The pantry is bare. Someone call the biscuit fairy.
                  </h4>
                  <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    {hasActiveFilters
                      ? 'No snacks match your current search or category filters.'
                      : 'There are no snacks in the pantry yet.'}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput('');
                          onClearAll();
                        }}
                        className="min-h-[38px] rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold tracking-wider text-zinc-800 uppercase hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        Clear filters
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#1c1d20] px-4 py-2 text-xs font-bold tracking-wider text-[#f3dfb0] uppercase hover:bg-[#2c2e33] dark:bg-[#d4b97e] dark:text-[#141517]"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
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
                          sort={filters.sort}
                          order={filters.order}
                          pendingVoteId={pendingVoteId}
                          pendingConsumeId={pendingConsumeId}
                          onSortChange={onSortChange}
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                </div>
              )}
            </div>
          </div>

          {/* Pagination Footer */}
          {pagination && snacks.length > 0 && (
            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-stone-300/80 pt-4 sm:flex-row dark:border-zinc-800">
              <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="font-mono tabular-nums">
                  Page {pagination.page} of {Math.max(1, pagination.totalPages)} · {pagination.total}{' '}
                  {pagination.total === 1 ? 'snack' : 'snacks'}
                </span>
                <select
                  aria-label="Snacks per page"
                  value={filters.pageSize}
                  onChange={(e) => onUpdateFilter('pageSize', e.target.value)}
                  className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
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
                  onClick={() => onUpdateFilter('page', String(pagination.page - 1), false)}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 transition-all hover:bg-stone-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => onUpdateFilter('page', String(pagination.page + 1), false)}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 transition-all hover:bg-stone-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin CRUD Modals */}
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
    </section>
  );
}
