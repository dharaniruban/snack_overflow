import { useCallback, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  PantryMenuSection,
  type PantryMenuFilterState,
} from '@/src/components/PantryMenuSection';
import { useSnacksSummary } from '@/src/hooks/useSnacksQuery';
import { SNACK_CATEGORIES, SNACK_STATUSES } from '@/src/lib/snackDisplay';
import type { SnackCategory, SnackSortField, SnackStatus, SortOrder } from '@/src/types/api';

const VALID_CATEGORIES = new Set<string>(SNACK_CATEGORIES.map((c) => c.value));
const VALID_STATUSES = new Set<string>(SNACK_STATUSES.map((s) => s.value));
const VALID_SORTS = new Set<string>(['name', 'quantity', 'votes']);

export function SnacksPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: summary } = useSnacksSummary();

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

  const filters = useMemo<PantryMenuFilterState>(
    () => ({
      q: urlQ,
      category: urlCategory,
      status: urlStatus,
      sort: urlSort,
      order: urlOrder,
      page: urlPage,
      pageSize: urlPageSize,
    }),
    [urlQ, urlCategory, urlStatus, urlSort, urlOrder, urlPage, urlPageSize]
  );

  const updateFilterParam = useCallback(
    (key: keyof PantryMenuFilterState, value: string, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
          if (resetPage && key !== 'page') {
            next.set('page', '1');
          }
          return next;
        },
        { replace: key === 'q' }
      );
    },
    [setSearchParams]
  );

  const handleSortChange = useCallback(
    (field: SnackSortField) => {
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
    },
    [setSearchParams, urlSort, urlOrder]
  );

  const clearAllFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const focusSearchTrigger = Boolean(
    (location.state as { focusSearch?: boolean } | null)?.focusSearch
  );

  return (
    <div>
      <section className="charcoal-bar border-b border-zinc-800/90 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold tracking-[0.26em] text-[#d4b97e] uppercase">
            Shareable Pantry View
          </p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            The Pantry Menu
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">
            Filter by category or stock status, search live inventory, and upvote snacks for the next office restock.
          </p>
        </div>
      </section>

      <PantryMenuSection
        filters={filters}
        onUpdateFilter={updateFilterParam}
        onSortChange={handleSortChange}
        onClearAll={clearAllFilters}
        focusSearchTrigger={focusSearchTrigger}
        snackOfTheWeek={summary?.snackOfTheWeek ?? null}
      />
    </div>
  );
}
