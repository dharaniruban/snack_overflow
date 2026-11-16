import type { SnackStatus } from '../lib/types';

const STATUS_META: Record<SnackStatus, { label: string; icon: string; classes: string }> = {
  stocked: {
    label: 'Stocked',
    icon: '✓',
    classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  },
  running_low: {
    label: 'Running low',
    icon: '!',
    classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  },
  gone: {
    label: 'Gone',
    icon: '✕',
    classes: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
  },
};

export function StatusBadge({ status }: { status: SnackStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.classes}`}
    >
      <span aria-hidden="true">{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}
