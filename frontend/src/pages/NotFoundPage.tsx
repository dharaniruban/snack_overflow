import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-6xl" aria-hidden="true">
        🫙
      </div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">404: Snack not found</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">Even the pantry drawer came up empty.</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
