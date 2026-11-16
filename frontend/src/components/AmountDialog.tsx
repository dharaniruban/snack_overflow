import { useState } from 'react';
import { Modal } from './Modal';

interface AmountDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  loading?: boolean;
  mode: 'consume' | 'restock';
  snackName: string;
}

export function AmountDialog({ open, onClose, onConfirm, loading = false, mode, snackName }: AmountDialogProps) {
  const [amount, setAmount] = useState(1);

  const title = mode === 'consume' ? 'Consume snack' : 'Restock snack';
  const actionLabel = mode === 'consume' ? 'Consume' : 'Restock';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        {mode === 'consume' ? 'How many did you eat?' : 'How many are you adding back?'}{' '}
        <span className="font-medium text-slate-900 dark:text-slate-100">{snackName}</span>
      </p>
      <div className="mb-5 flex items-center justify-center gap-4">
        <button
          type="button"
          className="h-10 w-10 rounded-lg bg-slate-200 text-xl font-bold text-slate-800 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
          onClick={() => setAmount((value) => Math.max(1, value - 1))}
          disabled={loading}
          aria-label="Decrease amount"
        >
          −
        </button>
        <span className="w-12 text-center text-2xl font-bold text-slate-900 dark:text-slate-100" aria-live="polite">
          {amount}
        </span>
        <button
          type="button"
          className="h-10 w-10 rounded-lg bg-slate-200 text-xl font-bold text-slate-800 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
          onClick={() => setAmount((value) => Math.min(99, value + 1))}
          disabled={loading}
          aria-label="Increase amount"
        >
          +
        </button>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          onClick={() => onConfirm(amount)}
          disabled={loading}
        >
          {loading ? 'Working…' : actionLabel}
        </button>
      </div>
    </Modal>
  );
}
