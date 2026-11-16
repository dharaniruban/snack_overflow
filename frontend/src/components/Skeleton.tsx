export function SnackCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="skeleton-shimmer h-28 w-full" />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="skeleton-shimmer h-4 w-32 rounded" />
          <div className="skeleton-shimmer h-7 w-10 rounded" />
        </div>
        <div className="skeleton-shimmer h-5 w-24 rounded-full" />
        <div className="skeleton-shimmer h-2 w-full rounded-full" />
        <div className="flex gap-2 pt-1">
          <div className="skeleton-shimmer h-8 w-20 rounded-lg" />
          <div className="skeleton-shimmer h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
