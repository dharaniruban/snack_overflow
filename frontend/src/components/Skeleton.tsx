export function SnackCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-5 w-40 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-8 w-10 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-20 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-8 w-20 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}
