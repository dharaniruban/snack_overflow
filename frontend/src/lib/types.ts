export type SnackCategory = 'sweet' | 'savoury' | 'drink' | 'healthy-ish';
export type SnackStatus = 'stocked' | 'running_low' | 'gone';
export type Role = 'admin' | 'member';

export interface Snack {
  id: string;
  name: string;
  category: SnackCategory;
  quantity: number;
  lowStockThreshold: number;
  status: SnackStatus;
  voteCount: number;
  hasVoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SnackListResponse {
  data: Snack[];
  pagination: Pagination;
}

export interface SummaryResponse {
  counts: { stocked: number; runningLow: number; gone: number };
  snackOfWeek: Snack | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface ActivityItem {
  id: string;
  snackName: string;
  action: 'consumed' | 'restocked';
  amount: number;
  quantityBefore: number;
  quantityAfter: number;
  userName: string;
  userEmail: string;
  createdAt: string;
}

export interface ActivityListResponse {
  data: ActivityItem[];
  pagination: Pagination;
}
