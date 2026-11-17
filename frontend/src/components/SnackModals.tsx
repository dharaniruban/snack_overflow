import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { SnackImage } from '@/src/components/SnackImage';
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <h2 id="modal-heading" className="font-display text-lg font-bold text-zinc-950 dark:text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
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
  const [imageUrl, setImageUrl] = useState(initialSnack?.imageUrl ?? '');
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

    const trimmedImageUrl = imageUrl.trim();
    if (trimmedImageUrl && !isValidHttpUrl(trimmedImageUrl)) {
      setValidationError('Enter a valid image URL (https://…) or leave it blank.');
      return;
    }

    try {
      if (mode === 'create') {
        await onSubmitCreate({
          name: trimmedName,
          category,
          quantity: parsedQty,
          lowStockThreshold: parsedThreshold,
          imageUrl: trimmedImageUrl || undefined,
        });
      } else if (initialSnack) {
        await onSubmitEdit(initialSnack.id, {
          name: trimmedName,
          category,
          quantity: parsedQty,
          lowStockThreshold: parsedThreshold,
          imageUrl: trimmedImageUrl || null,
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
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
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
            className="mt-1.5 block min-h-[42px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="snack-category"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            Category
          </label>
          <select
            id="snack-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as SnackCategory)}
            className="mt-1.5 block min-h-[42px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-950 focus:border-yellow-400 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
              className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
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
              className="mt-1.5 block min-h-[42px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 font-mono text-sm tabular-nums text-zinc-950 focus:border-yellow-400 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div>
            <label
              htmlFor="snack-threshold"
              className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
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
              className="mt-1.5 block min-h-[42px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 font-mono text-sm tabular-nums text-zinc-950 focus:border-yellow-400 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="snack-image-url"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            Image URL <span className="font-normal text-zinc-400 dark:text-zinc-500">(optional)</span>
          </label>
          <input
            id="snack-image-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/snack.png"
            className="mt-1.5 block min-h-[42px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          {imageUrl.trim() !== '' && (
            <div className="mt-2 h-20 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
              <SnackImage
                name={name.trim() || 'Snack preview'}
                category={category}
                imageUrl={imageUrl.trim()}
                className="h-full w-full"
              />
            </div>
          )}
        </div>

        {validationError && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{validationError}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="min-h-[40px] rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="min-h-[40px] rounded-lg bg-[#1c1d20] px-4 py-2 text-sm font-bold text-[#f3dfb0] transition-all hover:bg-[#2c2e33] active:scale-[0.98] disabled:opacity-60 dark:bg-[#d4b97e] dark:text-[#141517] dark:hover:bg-[#e3ca92]"
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
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Current stock:{' '}
          <span className="font-mono font-bold tabular-nums text-zinc-950 dark:text-white">
            {snack.quantity}
          </span>
        </p>

        <div className="flex items-center gap-2">
          {[5, 10, 20, 30].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className={`min-h-[38px] flex-1 rounded-lg border px-2 py-1.5 font-mono text-xs font-bold tabular-nums transition-all active:scale-[0.97] ${
                amount === String(preset)
                  ? 'border-[#d4b97e] bg-[#d4b97e] text-zinc-950'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              +{preset}
            </button>
          ))}
        </div>

        <div>
          <label
            htmlFor="restock-amount"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
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
            className="mt-1.5 block min-h-[42px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 font-mono text-sm tabular-nums text-zinc-950 focus:border-[#d4b97e] focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
            className="min-h-[40px] rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="min-h-[40px] rounded-lg bg-[#1c1d20] px-4 py-2 text-sm font-bold text-[#f3dfb0] transition-all hover:bg-[#2c2e33] active:scale-[0.98] disabled:opacity-60 dark:bg-[#d4b97e] dark:text-[#141517] dark:hover:bg-[#e3ca92]"
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
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        Are you sure you want to remove{' '}
        <strong className="font-bold text-zinc-950 dark:text-white">{snack.name}</strong> from
        the pantry? This action cannot be undone.
      </p>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={onClose}
          className="min-h-[40px] rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleConfirm}
          className="min-h-[40px] rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
        >
          {isPending ? 'Removing...' : 'Delete snack'}
        </button>
      </div>
    </ModalShell>
  );
}
