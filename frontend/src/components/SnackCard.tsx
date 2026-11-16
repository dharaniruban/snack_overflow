import type { Snack } from '../lib/types';
import { CategoryBadge } from './CategoryBadge';
import { Confetti } from './Confetti';
import { FuelGauge } from './FuelGauge';
import { StatusBadge } from './StatusBadge';

interface SnackCardProps {
  snack: Snack;
  isAdmin: boolean;
  disabled?: boolean;
  showConfetti?: boolean;
  onConsume: (snack: Snack) => void;
  onRestock: (snack: Snack) => void;
  onVote: (snack: Snack) => void;
  onEdit: (snack: Snack) => void;
  onDelete: (snack: Snack) => void;
}

export function SnackCard({
  snack,
  isAdmin,
  disabled = false,
  showConfetti = false,
  onConsume,
  onRestock,
  onVote,
  onEdit,
  onDelete,
}: SnackCardProps) {
  const isGone = snack.status === 'gone';
  const isLastPacket = snack.quantity === 1;

  return (
    <article
      className={`relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition dark:border-slate-700 dark:bg-slate-900 ${
        isGone ? 'border-rose-200 dark:border-rose-900' : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <Confetti active={showConfetti} />
      {isLastPacket && (
        <span className="absolute right-3 top-3 animate-pulse rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Last packet!
        </span>
      )}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {snack.name}
          </h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <CategoryBadge category={snack.category} />
            <StatusBadge status={snack.status} />
          </div>
        </div>
        <div className="text-right">
          <p
            className="text-2xl font-bold text-slate-900 dark:text-slate-100"
            aria-label={`${snack.quantity} in stock`}
          >
            {snack.quantity}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">in stock</p>
        </div>
      </div>

      <div className="mt-3">
        <FuelGauge
          quantity={snack.quantity}
          lowStockThreshold={snack.lowStockThreshold}
          status={snack.status}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Low-stock threshold: {snack.lowStockThreshold}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onVote(snack)}
          disabled={disabled}
          aria-pressed={snack.hasVoted}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            snack.hasVoted
              ? 'bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-900/40 dark:text-brand-200 dark:hover:bg-brand-900/60'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {snack.hasVoted ? 'Unvote' : 'Vote'} · {snack.voteCount}
        </button>

        <button
          type="button"
          onClick={() => onConsume(snack)}
          disabled={disabled || isGone}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Consume
        </button>

        {isAdmin && (
          <>
            <button
              type="button"
              onClick={() => onRestock(snack)}
              disabled={disabled}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Restock
            </button>
            <button
              type="button"
              onClick={() => onEdit(snack)}
              disabled={disabled}
              className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(snack)}
              disabled={disabled}
              className="rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-200 disabled:opacity-50 dark:bg-rose-900/40 dark:text-rose-200 dark:hover:bg-rose-900/60"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}
