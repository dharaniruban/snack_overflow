import { X } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { SNACK_CATEGORIES } from '@/src/lib/snackDisplay';
import type { CreateSnackInput, Snack, SnackCategory, UpdateSnackInput } from '@/src/types/api';

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 id="modal-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

interface SnackFormModalProps {
  mode: 'create' | 'edit';
  initialSnack?: Snack | null;
  isPending: boolean;
  onClose: () => void;
  onSubmitCreate: (input: CreateSnackInput) => Promise<void>;
  onSubmitEdit: (id: string, input: UpdateSnackInput) => Promise<void>;
}

export function SnackFormModal({
  mode,
  initialSnack,
  isPending,
  onClose,
  onSubmitCreate,
  onSubmitEdit,
}: SnackFormModalProps) {
  const [name, setName] = useState(initialSnack?.name ?? '');
  const [category, setCategory] = useState<SnackCategory>(initialSnack?.category ?? 'savoury');
  const [quantity, setQuantity] = useState(String(initialSnack?.quantity ?? 12));
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(initialSnack?.lowStockThreshold ?? 4)
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Please enter a snack name.');
      return;
    }

    const parsedQty = Number.parseInt(quantity, 10);
    const parsedThreshold = Number.parseInt(lowStockThreshold, 10);

    if (Number.isNaN(parsedQty) || parsedQty < 0) {
      setValidationError('Quantity must be 0 or greater.');
      return;
    }
    if (Number.isNaN(parsedThreshold) || parsedThreshold < 0) {
      setValidationError('Low-stock threshold must be 0 or greater.');
      return;
    }

    try {
      if (mode === 'create') {
        await onSubmitCreate({
          name: trimmedName,
          category,
          quantity: parsedQty,
          lowStockThreshold: parsedThreshold,
        });
      } else if (initialSnack) {
        await onSubmitEdit(initialSnack.id, {
          name: trimmedName,
          category,
          quantity: parsedQty,
          lowStockThreshold: parsedThreshold,
        });
      }
      onClose();
    } catch {
      // Toast is handled by mutation hook
    }
  };

  return (
    <ModalShell
      title={mode === 'create' ? 'Add a new snack' : `Edit ${initialSnack?.name ?? 'snack'}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="snack-name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Snack name
          </label>
          <input
            id="snack-name"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sea Salt Kettle Chips"
            className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="snack-category"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Category
          </label>
          <select
            id="snack-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as SnackCategory)}
            className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {SNACK_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="snack-quantity"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Quantity
            </label>
            <input
              id="snack-quantity"
              type="number"
              min={0}
              step={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label
              htmlFor="snack-threshold"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Low-stock threshold
            </label>
            <input
              id="snack-threshold"
              type="number"
              min={0}
              step={1}
              required
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {validationError && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{validationError}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="min-h-[40px] rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="min-h-[40px] rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 dark:hover:bg-emerald-500"
          >
            {isPending ? 'Saving...' : mode === 'create' ? 'Add snack' : 'Save changes'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

interface RestockModalProps {
  snack: Snack;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (snackId: string, amount: number) => Promise<void>;
}

export function RestockModal({ snack, isPending, onClose, onSubmit }: RestockModalProps) {
  const [amount, setAmount] = useState('10');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const parsed = Number.parseInt(amount, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      setValidationError('Enter a restock amount of at least 1.');
      return;
    }
    try {
      await onSubmit(snack.id, parsed);
      onClose();
    } catch {
      // Toast handled in mutation
    }
  };

  return (
    <ModalShell title={`Restock ${snack.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Current stock:{' '}
          <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {snack.quantity}
          </span>
        </p>

        <div className="flex items-center gap-2">
          {[5, 10, 20, 30].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className={`min-h-[36px] flex-1 rounded-lg border px-2 py-1.5 font-mono text-xs font-semibold tabular-nums transition-colors ${
                amount === String(preset)
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              +{preset}
            </button>
          ))}
        </div>

        <div>
          <label
            htmlFor="restock-amount"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Units to add
          </label>
          <input
            id="restock-amount"
            type="number"
            min={1}
            step={1}
            required
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {validationError && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{validationError}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="min-h-[40px] rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="min-h-[40px] rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 dark:hover:bg-emerald-500"
          >
            {isPending ? 'Restocking...' : 'Confirm restock'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

interface DeleteSnackModalProps {
  snack: Snack;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (snack: Snack) => Promise<void>;
}

export function DeleteSnackModal({
  snack,
  isPending,
  onClose,
  onConfirm,
}: DeleteSnackModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm(snack);
      onClose();
    } catch {
      // Toast handled in mutation
    }
  };

  return (
    <ModalShell title="Remove snack" onClose={onClose}>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        Are you sure you want to remove{' '}
        <strong className="font-semibold text-slate-900 dark:text-slate-100">{snack.name}</strong>{' '}
        from the pantry? This action cannot be undone.
      </p>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={onClose}
          className="min-h-[40px] rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleConfirm}
          className="min-h-[40px] rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {isPending ? 'Removing...' : 'Delete snack'}
        </button>
      </div>
    </ModalShell>
  );
}
