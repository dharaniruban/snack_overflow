import { Heart, Minus, PackagePlus, Pencil, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { SnackImage } from '@/src/components/SnackImage';
import { LastPacketBadge, SnackStatusBadge } from '@/src/components/SnackStatusBadge';
import { StockFuelGauge } from '@/src/components/StockFuelGauge';
import { formatCategoryLabel } from '@/src/lib/snackDisplay';
import type { Snack } from '@/src/types/api';

interface SnackCardProps {
  snack: Snack;
  index?: number;
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
  index = 0,
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
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.24,
        delay: Math.min(index * 0.04, 0.24),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div>
        {/* Illustrated Snack Placeholder Header */}
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-zinc-100 dark:border-zinc-800">
          <SnackImage
            name={snack.name}
            category={snack.category}
            imageUrl={snack.imageUrl}
            className="h-full w-full"
            imgClassName="group-hover:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-zinc-950/15" />

          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
            <SnackStatusBadge status={snack.status} />
            {snack.quantity === 1 && <LastPacketBadge />}
          </div>

          <button
            ref={voteBtnRef}
            type="button"
            disabled={isVoting}
            onClick={() => onVote(snack, voteBtnRef.current)}
            aria-pressed={snack.hasVoted}
            aria-label={`${snack.hasVoted ? 'Remove vote for' : 'Vote for'} ${snack.name} (${snack.voteCount} votes)`}
            className={`absolute right-3 bottom-3 inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold backdrop-blur-md transition-all duration-150 active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400 disabled:cursor-not-allowed disabled:opacity-60 ${
              snack.hasVoted
                ? 'border-yellow-300 bg-yellow-400 text-zinc-950 shadow-sm hover:bg-yellow-300'
                : 'border-white/25 bg-zinc-950/75 text-white hover:bg-zinc-950/90'
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${
                snack.hasVoted ? 'fill-zinc-950 text-zinc-950 scale-110' : ''
              }`}
              aria-hidden="true"
            />
            <span className="font-mono tabular-nums">{snack.voteCount}</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="p-5 pb-0">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>{formatCategoryLabel(snack.category)}</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span className="tabular-nums">Min {snack.lowStockThreshold}</span>
          </p>
          <h3 className="mt-1 truncate text-lg font-bold tracking-tight text-zinc-950 dark:text-white">
            {snack.name}
          </h3>

          <div className="mt-4">
            <StockFuelGauge
              quantity={snack.quantity}
              lowStockThreshold={snack.lowStockThreshold}
              status={snack.status}
            />
          </div>
        </div>
      </div>

      {/* Interactive Footer */}
      <div className="mt-5 px-5 pb-5">
        <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
          <div className="flex items-center justify-between gap-2.5">
            <div
              className="inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800"
              role="group"
              aria-label={`Quantity to grab for ${snack.name}`}
            >
              <button
                type="button"
                disabled={isOutOfStock || isConsuming || amount <= 1}
                onClick={() => setAmount((prev) => Math.max(1, prev - 1))}
                aria-label="Decrease consume amount"
                className="flex h-9 w-8 items-center justify-center rounded-lg text-zinc-700 transition-all hover:bg-white hover:text-zinc-950 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="min-w-[2rem] text-center font-mono text-sm font-bold tabular-nums text-zinc-950 dark:text-zinc-50">
                {isOutOfStock ? 0 : amount}
              </span>
              <button
                type="button"
                disabled={isOutOfStock || isConsuming || amount >= snack.quantity}
                onClick={() => setAmount((prev) => Math.min(snack.quantity, prev + 1))}
                aria-label="Increase consume amount"
                className="flex h-9 w-8 items-center justify-center rounded-lg text-zinc-700 transition-all hover:bg-white hover:text-zinc-950 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              disabled={isOutOfStock || isConsuming}
              onClick={() => onConsume(snack, amount)}
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950 shadow-[0_1px_0_0_rgba(255,255,255,0.45)_inset] transition-all duration-150 hover:bg-yellow-300 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
            >
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{isConsuming ? 'Grabbing...' : isOutOfStock ? 'Out of stock' : 'Grab snack'}</span>
            </button>
          </div>

          {isAdmin && (
            <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={() => onRestock(snack)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-semibold text-zinc-900 transition-all hover:bg-yellow-400 hover:text-zinc-950 active:scale-[0.97] dark:bg-zinc-800 dark:text-yellow-300 dark:hover:bg-yellow-400 dark:hover:text-zinc-950"
              >
                <PackagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Restock</span>
              </button>
              <button
                type="button"
                onClick={() => onEdit(snack)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-600 transition-all hover:bg-zinc-100 hover:text-zinc-950 active:scale-[0.97] dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(snack)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-[0.97] dark:text-red-400 dark:hover:bg-red-950/50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
