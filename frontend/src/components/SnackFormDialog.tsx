import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import type { Snack, SnackCategory } from '../lib/types';

interface SnackFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: {
    name: string;
    category: SnackCategory;
    quantity: number;
    lowStockThreshold: number;
  }) => void;
  loading?: boolean;
  snack?: Snack | null;
}

const CATEGORIES: SnackCategory[] = ['sweet', 'savoury', 'drink', 'healthy-ish'];

export function SnackFormDialog({
  open,
  onClose,
  onSubmit,
  loading = false,
  snack,
}: SnackFormDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SnackCategory>('sweet');
  const [quantity, setQuantity] = useState(0);
  const [threshold, setThreshold] = useState(5);

  useEffect(() => {
    if (!open) return;
    setName(snack?.name ?? '');
    setCategory(snack?.category ?? 'sweet');
    setQuantity(snack?.quantity ?? 0);
    setThreshold(snack?.lowStockThreshold ?? 5);
  }, [open, snack]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ name: name.trim(), category, quantity, lowStockThreshold: threshold });
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

  return (
    <Modal open={open} onClose={onClose} title={snack ? 'Edit snack' : 'Add snack'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Name
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={120}
            autoFocus
          />
        </label>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Category
          <select
            className={inputClass}
            value={category}
            onChange={(event) => setCategory(event.target.value as SnackCategory)}
          >
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Quantity
            <input
              className={inputClass}
              type="number"
              min={0}
              step={1}
              value={quantity}
              onChange={(event) =>
                setQuantity(Math.max(0, Math.floor(Number(event.target.value) || 0)))
              }
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Low-stock threshold
            <input
              className={inputClass}
              type="number"
              min={0}
              step={1}
              value={threshold}
              onChange={(event) =>
                setThreshold(Math.max(0, Math.floor(Number(event.target.value) || 0)))
              }
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            disabled={loading || !name.trim()}
          >
            {loading ? 'Saving…' : snack ? 'Save changes' : 'Add snack'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
