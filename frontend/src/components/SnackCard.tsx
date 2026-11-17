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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.24,
        delay: Math.min(index * 0.04, 0.24),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group flex flex-col justify-between overflow-hidden rounded-xl border border-stone-300/80 bg-white/90 transition-colors hover:border-[#b5975a] dark:border-zinc-800 dark:bg-zinc-900/95 dark:hover:border-[#d4b97e]/60"
    >
      <div>
        {/* Real Snack Photography Header */}
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-stone-200 dark:border-zinc-800">
          <SnackImage
            name={snack.name}
            category={snack.category}
            imageUrl={snack.imageUrl}
            className="h-full w-full"
            imgClassName="group-hover:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-zinc-950/20" />

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
            className={`absolute right-3 bottom-3 inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold backdrop-blur-md transition-all duration-150 active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4b97e] disabled:cursor-not-allowed disabled:opacity-60 ${
              snack.hasVoted
                ? 'border-[#d4b97e] bg-[#d4b97e] text-zinc-950 shadow-sm hover:bg-[#e3ca92]'
                : 'border-white/30 bg-zinc-950/75 text-white hover:bg-zinc-950/90'
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
        <div className="p-4 pb-0">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-zinc-500 uppercase dark:text-zinc-400">
            <span>{formatCategoryLabel(snack.category)}</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span className="tabular-nums">Min {snack.lowStockThreshold}</span>
          </p>
          <h3 className="mt-1 truncate font-serif text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {snack.name}
          </h3>

          <div className="mt-3.5">
            <StockFuelGauge
              quantity={snack.quantity}
              lowStockThreshold={snack.lowStockThreshold}
              status={snack.status}
            />
          </div>
        </div>
      </div>

      {/* Interactive Footer */}
      <div className="mt-4 px-4 pb-4">
        <div className="border-t border-stone-200/80 pt-3.5 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex shrink-0 items-center rounded-lg border border-stone-300 bg-stone-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800"
              role="group"
              aria-label={`Quantity to grab for ${snack.name}`}
            >
              <button
                type="button"
                disabled={isOutOfStock || isConsuming || amount <= 1}
                onClick={() => setAmount((prev) => Math.max(1, prev - 1))}
                aria-label="Decrease consume amount"
                className="flex h-8 w-7 items-center justify-center rounded-md text-zinc-700 transition-colors hover:bg-white hover:text-zinc-950 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="min-w-[1.5rem] text-center font-mono text-xs font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {isOutOfStock ? 0 : amount}
              </span>
              <button
                type="button"
                disabled={isOutOfStock || isConsuming || amount >= snack.quantity}
                onClick={() => setAmount((prev) => Math.min(snack.quantity, prev + 1))}
                aria-label="Increase consume amount"
                className="flex h-8 w-7 items-center justify-center rounded-md text-zinc-700 transition-colors hover:bg-white hover:text-zinc-950 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              disabled={isOutOfStock || isConsuming}
              onClick={() => onConsume(snack, amount)}
              className="inline-flex min-h-[38px] min-w-[112px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[#1c1d20] px-3 py-2 text-[11px] font-bold tracking-wider text-[#f3dfb0] uppercase transition-all duration-150 hover:bg-[#2c2e33] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4b97e] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-zinc-500 dark:bg-[#d4b97e] dark:text-[#141517] dark:hover:bg-[#e3ca92] dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
            >
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{isConsuming ? 'Grabbing...' : isOutOfStock ? 'Empty' : 'Grab snack'}</span>
            </button>
          </div>

          {isAdmin && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-1 border-t border-stone-200/70 pt-2.5 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => onRestock(snack)}
                className="inline-flex min-h-[32px] items-center justify-center gap-1 rounded-md bg-stone-100 px-2 py-1 text-[11px] font-semibold text-zinc-800 whitespace-nowrap transition-colors hover:bg-[#d4b97e] hover:text-zinc-950 dark:bg-zinc-800 dark:text-[#d4b97e] dark:hover:bg-[#d4b97e] dark:hover:text-zinc-950"
              >
                <PackagePlus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Restock</span>
              </button>
              <button
                type="button"
                onClick={() => onEdit(snack)}
                className="inline-flex min-h-[32px] items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-zinc-600 whitespace-nowrap transition-colors hover:bg-stone-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(snack)}
                className="inline-flex min-h-[32px] items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-red-700 whitespace-nowrap transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
