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
    text: 'text-emerald-900 dark:text-emerald-200',
    bg: 'bg-emerald-100/95 border-emerald-300/80 dark:bg-emerald-950/85 dark:border-emerald-700/70',
    Icon: CheckCircle2,
  },
  running_low: {
    text: 'text-amber-950 dark:text-amber-200',
    bg: 'bg-amber-100/95 border-amber-300/90 dark:bg-amber-950/85 dark:border-amber-700/70',
    Icon: AlertTriangle,
  },
  gone: {
    text: 'text-red-900 dark:text-red-200',
    bg: 'bg-red-100/95 border-red-300/80 dark:bg-red-950/85 dark:border-red-700/70',
    Icon: XCircle,
  },
};

export function SnackStatusBadge({ status }: SnackStatusBadgeProps) {
  const { text, bg, Icon } = STATUS_STYLE[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase backdrop-blur-xs ${bg} ${text}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{formatStatusLabel(status)}</span>
    </span>
  );
}

export function LastPacketBadge() {
  return (
    <span
      role="status"
      className="inline-flex animate-pulse items-center gap-1 whitespace-nowrap rounded-md border border-[#d4b97e] bg-[#141517]/95 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#f3dfb0] uppercase motion-reduce:animate-none"
    >
      <Flame className="h-3 w-3 shrink-0 text-[#d4b97e]" aria-hidden="true" />
      <span>LAST PACKET!</span>
    </span>
  );
}
