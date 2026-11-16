export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type SnackCategory = 'sweet' | 'savoury' | 'drink' | 'healthy-ish';
export type SnackStatus = 'stocked' | 'running_low' | 'gone';
export type SnackSortField = 'name' | 'quantity' | 'votes';
export type SortOrder = 'asc' | 'desc';

export interface Snack {
  id: string;
  name: string;
  category: SnackCategory;
  quantity: number;
  lowStockThreshold: number;
  status: SnackStatus;
  voteCount: number;
  hasVoted: boolean;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SnacksListResponse {
  data: Snack[];
  pagination: PaginationMeta;
}

export interface SnacksSummaryResponse {
  counts: {
    stocked: number;
    runningLow: number;
    gone: number;
  };
  snackOfTheWeek: Snack | null;
}

export interface SnackQueryParams {
  category?: SnackCategory | '';
  status?: SnackStatus | '';
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: SnackSortField;
  order?: SortOrder;
}

export interface CreateSnackInput {
  name: string;
  category: SnackCategory;
  quantity?: number;
  lowStockThreshold?: number;
}

export interface UpdateSnackInput {
  name?: string;
  category?: SnackCategory;
  quantity?: number;
  lowStockThreshold?: number;
}

export type ActivityAction = 'consumed' | 'restocked';

export interface ActivityItem {
  id: string;
  snackId?: string;
  snackName: string;
  action: ActivityAction;
  amount: number;
  quantityBefore: number;
  quantityAfter: number;
  userName: string;
  createdAt: string;
}

export interface ActivityListResponse {
  data: ActivityItem[];
  pagination: PaginationMeta;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface SnackSseEvent {
  type: 'consumed' | 'restocked' | 'updated';
  snackId: string;
}
