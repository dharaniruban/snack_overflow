import type { SnackStatus } from '@/src/types/api';

interface StockFuelGaugeProps {
  quantity: number;
  lowStockThreshold: number;
  status: SnackStatus;
  compact?: boolean;
}

const FILL_COLOR: Record<SnackStatus, string> = {
  stocked: 'bg-emerald-600 dark:bg-emerald-500',
  running_low: 'bg-amber-500 dark:bg-amber-400',
  gone: 'bg-red-500 dark:bg-red-500',
};

export function StockFuelGauge({
  quantity,
  lowStockThreshold,
  status,
  compact = false,
}: StockFuelGaugeProps) {
  const safeThreshold = Math.max(1, lowStockThreshold);
  const maxScale = Math.max(safeThreshold * 3, quantity, 10);
  const fillPct = Math.min(100, Math.max(0, (quantity / maxScale) * 100));
  const thresholdPct = Math.min(92, Math.max(8, (safeThreshold / maxScale) * 100));

  return (
    <div className="w-full">
      {!compact && (
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">Stock gauge</span>
          <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
            <strong className="font-semibold text-slate-900 dark:text-slate-100">{quantity}</strong> left · min {lowStockThreshold}
          </span>
        </div>
      )}
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={quantity}
        aria-valuemin={0}
        aria-valuemax={maxScale}
        aria-label={`Stock level ${quantity}, low stock threshold ${lowStockThreshold}`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${FILL_COLOR[status]}`}
          style={{ width: `${fillPct}%` }}
        />
        <div
          title={`Low stock threshold: ${lowStockThreshold}`}
          className="absolute top-0 bottom-0 w-0.5 bg-slate-900/35 dark:bg-white/45"
          style={{ left: `${thresholdPct}%` }}
        />
      </div>
    </div>
  );
}
