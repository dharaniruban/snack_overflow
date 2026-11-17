export const SNACK_CATEGORIES = ['sweet', 'savoury', 'drink', 'healthy-ish'] as const;
export type SnackCategory = (typeof SNACK_CATEGORIES)[number];

export const SNACK_STATUSES = ['stocked', 'running_low', 'gone'] as const;
export type SnackStatus = (typeof SNACK_STATUSES)[number];

export interface SnackResponse {
  id: string;
  name: string;
  category: SnackCategory;
  quantity: number;
  lowStockThreshold: number;
  status: SnackStatus;
  voteCount: number;
  hasVoted: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSnackInput {
  name: string;
  category: SnackCategory;
  quantity?: number;
  lowStockThreshold?: number;
  imageUrl?: string | null;
}

export interface UpdateSnackInput {
  name?: string;
  category?: SnackCategory;
  quantity?: number;
  lowStockThreshold?: number;
  imageUrl?: string | null;
}
