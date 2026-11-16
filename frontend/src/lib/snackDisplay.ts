import type { SnackCategory, SnackStatus } from '@/src/types/api';

export const SNACK_CATEGORIES: ReadonlyArray<{ value: SnackCategory; label: string }> = [
  { value: 'sweet', label: 'Sweet' },
  { value: 'savoury', label: 'Savoury' },
  { value: 'drink', label: 'Drink' },
  { value: 'healthy-ish', label: 'Healthy-ish' },
];

export const SNACK_STATUSES: ReadonlyArray<{ value: SnackStatus; label: string }> = [
  { value: 'stocked', label: 'Stocked' },
  { value: 'running_low', label: 'Running low' },
  { value: 'gone', label: 'Gone' },
];

export function formatCategoryLabel(category: SnackCategory): string {
  const match = SNACK_CATEGORIES.find((c) => c.value === category);
  return match ? match.label : category;
}

export function formatStatusLabel(status: SnackStatus): string {
  switch (status) {
    case 'stocked':
      return 'Stocked';
    case 'running_low':
      return 'Running low';
    case 'gone':
      return 'Gone';
  }
}

export function formatActivityDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const now = Date.now();
  const diffSeconds = Math.floor((now - date.getTime()) / 1000);

  if (diffSeconds >= 0 && diffSeconds < 60) {
    return 'Just now';
  }
  if (diffSeconds >= 60 && diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    return `${mins}m ago`;
  }
  if (diffSeconds >= 3600 && diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
