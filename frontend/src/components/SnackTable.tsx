import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Heart,
  Minus,
  PackagePlus,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { SnackImage } from '@/src/components/SnackImage';
import { LastPacketBadge, SnackStatusBadge } from '@/src/components/SnackStatusBadge';
import { StockFuelGauge } from '@/src/components/StockFuelGauge';
import { formatCategoryLabel } from '@/src/lib/snackDisplay';
import type { Snack, SnackSortField, SortOrder } from '@/src/types/api';

interface SnackTableProps {
  snacks: Snack[];
  isAdmin: boolean;
  sort: SnackSortField;
  order: SortOrder;
  pendingVoteId: string | null;
  pendingConsumeId: string | null;
  onSortChange: (field: SnackSortField) => void;
  onVote: (snack: Snack, anchorEl: HTMLElement | null) => void;
  onConsume: (snack: Snack, amount: number) => void;
  onRestock: (snack: Snack) => void;
  onEdit: (snack: Snack) => void;
  onDelete: (snack: Snack) => void;
}

function SortIcon({
  field,
  activeSort,
  order,
}: {
  field: SnackSortField;
  activeSort: SnackSortField;
  order: SortOrder;
}) {
  if (field !== activeSort) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />;
  }
  return order === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-yellow-500 dark:text-yellow-400" aria-hidden="true" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-yellow-500 dark:text-yellow-400" aria-hidden="true" />
  );
}

function TableRow({
  snack,
  index,
  isAdmin,
  isVoting,
  isConsuming,
  onVote,
  onConsume,
  onRestock,
  onEdit,
  onDelete,
}: {
  snack: Snack;
  index: number;
  isAdmin: boolean;
  isVoting: boolean;
  isConsuming: boolean;
  onVote: (snack: Snack, anchorEl: HTMLElement | null) => void;
  onConsume: (snack: Snack, amount: number) => void;
  onRestock: (snack: Snack) => void;
  onEdit: (snack: Snack) => void;
  onDelete: (snack: Snack) => void;
}) {
  const [amount, setAmount] = useState(1);
  const clampedAmount = snack.quantity <= 0 ? 1 : Math.min(amount, snack.quantity);
  const isOutOfStock = snack.quantity <= 0;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.2) }}
      className="border-b border-zinc-100 transition-colors last:border-b-0 hover:bg-zinc-50/80 dark:border-zinc-800/80 dark:hover:bg-zinc-800/40"
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <SnackImage
            name={snack.name}
            category={snack.category}
            imageUrl={snack.imageUrl}
            className="h-10 w-12 shrink-0 rounded-lg border border-zinc-200/80 dark:border-zinc-700"
            iconSizeClass="h-4 w-4"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-bold text-zinc-950 dark:text-zinc-100">
                {snack.name}
              </span>
              {snack.quantity === 1 && <LastPacketBadge />}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatCategoryLabel(snack.category)}
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="tabular-nums">Min {snack.lowStockThreshold}</span>
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <SnackStatusBadge status={snack.status} />
      </td>

      <td className="px-4 py-3.5">
        <div className="flex min-w-[140px] items-center gap-3">
          <span className="w-8 text-right font-mono text-sm font-bold tabular-nums text-zinc-950 dark:text-zinc-100">
            {snack.quantity}
          </span>
          <div className="w-24">
            <StockFuelGauge
              quantity={snack.quantity}
              lowStockThreshold={snack.lowStockThreshold}
              status={snack.status}
              compact
            />
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5 text-right">
        <button
          type="button"
          disabled={isVoting}
          onClick={(e) => onVote(snack, e.currentTarget)}
          aria-pressed={snack.hasVoted}
          aria-label={`${snack.hasVoted ? 'Remove vote for' : 'Vote for'} ${snack.name}`}
          className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-all duration-150 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-yellow-400 disabled:opacity-60 ${
            snack.hasVoted
              ? 'border-yellow-400 bg-yellow-400 text-zinc-950'
              : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          <Heart
            className={`h-3.5 w-3.5 ${
              snack.hasVoted ? 'fill-zinc-950 text-zinc-950' : ''
            }`}
            aria-hidden="true"
          />
          <span className="font-mono tabular-nums">{snack.voteCount}</span>
        </button>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-2">
          <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
            <button
              type="button"
              disabled={isOutOfStock || isConsuming || clampedAmount <= 1}
              onClick={() => setAmount((prev) => Math.max(1, prev - 1))}
              aria-label="Decrease consume amount"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-700 hover:bg-white disabled:opacity-35 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <Minus className="h-3 w-3" aria-hidden="true" />
            </button>
            <span className="min-w-[1.6rem] text-center font-mono text-xs font-bold tabular-nums text-zinc-950 dark:text-zinc-100">
              {isOutOfStock ? 0 : clampedAmount}
            </span>
            <button
              type="button"
              disabled={isOutOfStock || isConsuming || clampedAmount >= snack.quantity}
              onClick={() => setAmount((prev) => Math.min(snack.quantity, prev + 1))}
              aria-label="Increase consume amount"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-700 hover:bg-white disabled:opacity-35 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            disabled={isOutOfStock || isConsuming}
            onClick={() => onConsume(snack, clampedAmount)}
            className="inline-flex min-h-[34px] items-center justify-center whitespace-nowrap rounded-xl bg-yellow-400 px-3.5 py-1.5 text-xs font-bold text-zinc-950 transition-all duration-150 hover:bg-yellow-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
          >
            {isConsuming ? 'Grabbing...' : isOutOfStock ? 'Empty' : 'Grab'}
          </button>
        </div>
      </td>

      {isAdmin && (
        <td className="px-4 py-3.5 text-right">
          <div className="inline-flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onRestock(snack)}
              title="Restock"
              aria-label={`Restock ${snack.name}`}
              className="rounded-lg p-2 text-zinc-700 transition-colors hover:bg-yellow-400 hover:text-zinc-950 dark:text-yellow-400 dark:hover:bg-yellow-400 dark:hover:text-zinc-950"
            >
              <PackagePlus className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(snack)}
              title="Edit"
              aria-label={`Edit ${snack.name}`}
              className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(snack)}
              title="Delete"
              aria-label={`Delete ${snack.name}`}
              className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </td>
      )}
    </motion.tr>
  );
}

export function SnackTable({
  snacks,
  isAdmin,
  sort,
  order,
  pendingVoteId,
  pendingConsumeId,
  onSortChange,
  onVote,
  onConsume,
  onRestock,
  onEdit,
  onDelete,
}: SnackTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onSortChange('name')}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-zinc-950 dark:hover:text-white"
                >
                  <span>Snack</span>
                  <SortIcon field="name" activeSort={sort} order={order} />
                </button>
              </th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onSortChange('quantity')}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-zinc-950 dark:hover:text-white"
                >
                  <span>Quantity</span>
                  <SortIcon field="quantity" activeSort={sort} order={order} />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onSortChange('votes')}
                  className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap hover:text-zinc-950 dark:hover:text-white"
                >
                  <span>Votes</span>
                  <SortIcon field="votes" activeSort={sort} order={order} />
                </button>
              </th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Consume</th>
              {isAdmin && <th className="px-4 py-3 text-right whitespace-nowrap">Manage</th>}
            </tr>
          </thead>
          <tbody>
            {snacks.map((snack, index) => (
              <TableRow
                key={snack.id}
                snack={snack}
                index={index}
                isAdmin={isAdmin}
                isVoting={pendingVoteId === snack.id}
                isConsuming={pendingConsumeId === snack.id}
                onVote={onVote}
                onConsume={onConsume}
                onRestock={onRestock}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
