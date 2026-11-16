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
import { useState } from 'react';
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
    return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />;
  }
  return order === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
  );
}

function TableRow({
  snack,
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
    <tr className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/40">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
                {snack.name}
              </span>
              {snack.quantity === 1 && <LastPacketBadge />}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
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
          <span className="w-8 text-right font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
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
          className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:opacity-60 ${
            snack.hasVoted
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700/80 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Heart
            className={`h-3.5 w-3.5 ${
              snack.hasVoted ? 'fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400' : ''
            }`}
            aria-hidden="true"
          />
          <span className="font-mono tabular-nums">{snack.voteCount}</span>
        </button>
      </td>

      <td className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-2">
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              disabled={isOutOfStock || isConsuming || clampedAmount <= 1}
              onClick={() => setAmount((prev) => Math.max(1, prev - 1))}
              aria-label="Decrease consume amount"
              className="flex h-8 w-7 items-center justify-center rounded-l-lg text-slate-600 hover:bg-slate-200/70 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Minus className="h-3 w-3" aria-hidden="true" />
            </button>
            <span className="min-w-[1.75rem] text-center font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {isOutOfStock ? 0 : clampedAmount}
            </span>
            <button
              type="button"
              disabled={isOutOfStock || isConsuming || clampedAmount >= snack.quantity}
              onClick={() => setAmount((prev) => Math.min(snack.quantity, prev + 1))}
              aria-label="Increase consume amount"
              className="flex h-8 w-7 items-center justify-center rounded-r-lg text-slate-600 hover:bg-slate-200/70 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            disabled={isOutOfStock || isConsuming}
            onClick={() => onConsume(snack, clampedAmount)}
            className="inline-flex min-h-[34px] items-center justify-center whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:hover:bg-emerald-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
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
              className="rounded-lg p-2 text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/60"
            >
              <PackagePlus className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(snack)}
              title="Edit"
              aria-label={`Edit ${snack.name}`}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
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
    </tr>
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onSortChange('name')}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-slate-900 dark:hover:text-white"
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
                  className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-slate-900 dark:hover:text-white"
                >
                  <span>Quantity</span>
                  <SortIcon field="quantity" activeSort={sort} order={order} />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onSortChange('votes')}
                  className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap hover:text-slate-900 dark:hover:text-white"
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
            {snacks.map((snack) => (
              <TableRow
                key={snack.id}
                snack={snack}
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
