interface FuelGaugeProps {
  quantity: number;
  lowStockThreshold: number;
  status: 'stocked' | 'running_low' | 'gone';
}

export function FuelGauge({ quantity, lowStockThreshold, status }: FuelGaugeProps) {
  const percent =
    quantity <= 0
      ? 0
      : lowStockThreshold <= 0
        ? 100
        : Math.min(100, Math.round((quantity / lowStockThreshold) * 100));

  const barColor =
    status === 'gone'
      ? 'bg-rose-500'
      : status === 'running_low'
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
      role="img"
      aria-label={`Stock level ${percent}%`}
    >
      <div
        className={`h-full rounded-full transition-all ${barColor}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
