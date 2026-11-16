import type { SnackCategory } from '../lib/types';

const CATEGORY_META: Record<SnackCategory, { label: string; emoji: string; classes: string }> = {
  sweet: { label: 'Sweet', emoji: '🍬', classes: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200' },
  savoury: { label: 'Savoury', emoji: '🥨', classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
  drink: { label: 'Drink', emoji: '🥤', classes: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200' },
  'healthy-ish': { label: 'Healthy-ish', emoji: '🥗', classes: 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200' },
};

export function CategoryBadge({ category }: { category: SnackCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.classes}`}>
      <span aria-hidden="true">{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  );
}
