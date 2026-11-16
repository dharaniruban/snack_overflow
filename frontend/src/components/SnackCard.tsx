import type { Snack } from '../lib/types';
import { categoryGradient, snackEmoji } from '../lib/snackVisual';
import { Confetti } from './Confetti';
import { FuelGauge } from './FuelGauge';
import { StatusBadge } from './StatusBadge';

interface SnackCardProps {
  snack: Snack;
  isAdmin: boolean;
  disabled?: boolean;
  showConfetti?: boolean;
  index?: number;
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
  index = 0,
  onConsume,
  onRestock,
  onVote,
  onEdit,
  onDelete,
}: SnackCardProps) {
  const isGone = snack.status === 'gone';
  const isLastPacket = snack.quantity === 1;
  const emoji = snackEmoji(snack);

  return (
    <article
      className={`animate-fade-up group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-black/30 ${
        isGone
          ? 'border-rose-200 dark:border-rose-900/60'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
      style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
    >
      {/* "Photo" tile: gradient + emoji, floats gently */}
      <div
        className={`relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br ${categoryGradient(snack.category)}`}
      >
        <div
          className="absolute inset-0 bg-white/10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.25), transparent 40%)',
          }}
        />
        <span className="animate-float text-6xl drop-shadow-sm" aria-hidden="true">
          {emoji}
        </span>
        {isLastPacket && (
          <span className="absolute right-3 top-3 animate-pulse rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
            Last packet!
          </span>
        )}
        {isGone && (
          <span className="absolute left-3 top-3 rounded-full bg-slate-900/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
            Out of stock
          </span>
        )}
        <Confetti active={showConfetti} />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight text-slate-900 dark:text-slate-100">
            {snack.name}
          </h3>
          <div className="text-right">
            <p
              className="text-2xl font-bold leading-none text-slate-900 dark:text-slate-100"
              aria-label={`${snack.quantity} in stock`}
            >
              {snack.quantity}
            </p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              left
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <StatusBadge status={snack.status} />
        </div>

        <div className="mt-3">
          <FuelGauge
            quantity={snack.quantity}
            lowStockThreshold={snack.lowStockThreshold}
            status={snack.status}
          />
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            Runs low at {snack.lowStockThreshold}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onVote(snack)}
            disabled={disabled}
            aria-pressed={snack.hasVoted}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
              snack.hasVoted
                ? 'bg-brand-500 text-white shadow-sm hover:bg-brand-600'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {snack.hasVoted ? 'Voted' : 'Vote'} · {snack.voteCount}
          </button>

          <button
            type="button"
            onClick={() => onConsume(snack)}
            disabled={disabled || isGone}
            className="rounded-lg bg-gradient-to-r from-brand-500 to-orange-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Consume
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => onRestock(snack)}
                disabled={disabled}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
              >
                Restock
              </button>
              <button
                type="button"
                onClick={() => onEdit(snack)}
                disabled={disabled}
                className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-300 active:scale-95 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(snack)}
                disabled={disabled}
                className="rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-200 active:scale-95 disabled:opacity-50 dark:bg-rose-900/40 dark:text-rose-200 dark:hover:bg-rose-900/60"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
