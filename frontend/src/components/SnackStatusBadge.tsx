import { AlertTriangle, CheckCircle2, Flame, XCircle } from 'lucide-react';
import { formatStatusLabel } from '@/src/lib/snackDisplay';
import type { SnackStatus } from '@/src/types/api';

interface SnackStatusBadgeProps {
  status: SnackStatus;
}

const STATUS_STYLE: Record<
  SnackStatus,
  { text: string; bg: string; Icon: typeof CheckCircle2 }
> = {
  stocked: {
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 border-emerald-200/80 dark:bg-emerald-950/50 dark:border-emerald-800/70',
    Icon: CheckCircle2,
  },
  running_low: {
    text: 'text-amber-800 dark:text-amber-300',
    bg: 'bg-amber-50 border-amber-200/80 dark:bg-amber-950/50 dark:border-amber-800/70',
    Icon: AlertTriangle,
  },
  gone: {
    text: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 border-red-200/80 dark:bg-red-950/50 dark:border-red-800/70',
    Icon: XCircle,
  },
};

export function SnackStatusBadge({ status }: SnackStatusBadgeProps) {
  const { text, bg, Icon } = STATUS_STYLE[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold ${bg} ${text}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{formatStatusLabel(status)}</span>
    </span>
  );
}

export function LastPacketBadge() {
  return (
    <span
      role="status"
      className="inline-flex animate-pulse items-center gap-1 whitespace-nowrap rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-bold tracking-wide text-amber-900 uppercase motion-reduce:animate-none dark:border-amber-700 dark:bg-amber-900/60 dark:text-amber-200"
    >
      <Flame className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
      <span>LAST PACKET!</span>
    </span>
  );
}
