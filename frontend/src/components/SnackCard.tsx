import { Heart, Minus, PackagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LastPacketBadge, SnackStatusBadge } from '@/src/components/SnackStatusBadge';
import { StockFuelGauge } from '@/src/components/StockFuelGauge';
import { formatCategoryLabel } from '@/src/lib/snackDisplay';
import type { Snack } from '@/src/types/api';

interface SnackCardProps {
  snack: Snack;
  isAdmin: boolean;
  isVoting: boolean;
  isConsuming: boolean;
  onVote: (snack: Snack, anchorEl: HTMLElement | null) => void;
  onConsume: (snack: Snack, amount: number) => void;
  onRestock: (snack: Snack) => void;
  onEdit: (snack: Snack) => void;
  onDelete: (snack: Snack) => void;
}

export function SnackCard({
  snack,
  isAdmin,
  isVoting,
  isConsuming,
  onVote,
  onConsume,
  onRestock,
  onEdit,
  onDelete,
}: SnackCardProps) {
  const [amount, setAmount] = useState(1);
  const voteBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (snack.quantity <= 0) {
      setAmount(1);
    } else if (amount > snack.quantity) {
      setAmount(snack.quantity);
    }
  }, [snack.quantity, amount]);

  const isOutOfStock = snack.quantity <= 0;

  return (
    <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{formatCategoryLabel(snack.category)}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="tabular-nums">Min {snack.lowStockThreshold}</span>
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {snack.name}
            </h3>
          </div>

          <button
            ref={voteBtnRef}
            type="button"
            disabled={isVoting}
            onClick={() => onVote(snack, voteBtnRef.current)}
            aria-pressed={snack.hasVoted}
            aria-label={`${snack.hasVoted ? 'Remove vote for' : 'Vote for'} ${snack.name} (${snack.voteCount} votes)`}
            className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 ${
              snack.hasVoted
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800'
            }`}
          >
            <Heart
              className={`h-4 w-4 shrink-0 transition-transform duration-150 ${
                snack.hasVoted ? 'fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400' : ''
              }`}
              aria-hidden="true"
            />
            <span className="font-mono tabular-nums">{snack.voteCount}</span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <SnackStatusBadge status={snack.status} />
          {snack.quantity === 1 && <LastPacketBadge />}
        </div>

        <div className="mt-4">
          <StockFuelGauge
            quantity={snack.quantity}
            lowStockThreshold={snack.lowStockThreshold}
            status={snack.status}
          />
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800/80">
        <div className="flex items-center justify-between gap-2.5">
          <div
            className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80"
            role="group"
            aria-label={`Quantity to grab for ${snack.name}`}
          >
            <button
              type="button"
              disabled={isOutOfStock || isConsuming || amount <= 1}
              onClick={() => setAmount((prev) => Math.max(1, prev - 1))}
              aria-label="Decrease consume amount"
              className="flex h-10 w-9 items-center justify-center rounded-l-lg text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="min-w-[2.25rem] text-center font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {isOutOfStock ? 0 : amount}
            </span>
            <button
              type="button"
              disabled={isOutOfStock || isConsuming || amount >= snack.quantity}
              onClick={() => setAmount((prev) => Math.min(snack.quantity, prev + 1))}
              aria-label="Increase consume amount"
              className="flex h-10 w-9 items-center justify-center rounded-r-lg text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            disabled={isOutOfStock || isConsuming}
            onClick={() => onConsume(snack, amount)}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
          >
            {isConsuming ? 'Grabbing...' : isOutOfStock ? 'Out of stock' : 'Grab snack'}
          </button>
        </div>

        {isAdmin && (
          <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => onRestock(snack)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-950/60"
            >
              <PackagePlus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Restock</span>
            </button>
            <button
              type="button"
              onClick={() => onEdit(snack)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(snack)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
