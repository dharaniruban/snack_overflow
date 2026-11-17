import { ApiError } from '@/src/lib/errors';
import type {
  ActivityItem,
  ActivityListResponse,
  CreateSnackInput,
  Snack,
  SnackQueryParams,
  SnacksListResponse,
  SnacksSummaryResponse,
  SnackStatus,
  UpdateSnackInput,
  User,
  UserRole,
} from '@/src/types/api';

const STORAGE_SNACKS_KEY = 'snack_overflow_local_snacks_v2';
const STORAGE_ACTIVITY_KEY = 'snack_overflow_local_activity_v2';
const STORAGE_ROLE_KEY = 'snack_overflow_local_role_v1';

function computeStatus(quantity: number, lowStockThreshold: number): SnackStatus {
  if (quantity <= 0) return 'gone';
  if (quantity <= lowStockThreshold) return 'running_low';
  return 'stocked';
}

const INITIAL_SNACKS: Snack[] = [
  {
    id: 'snk-potato-chips',
    name: 'Potato Chips',
    category: 'savoury',
    quantity: 14,
    lowStockThreshold: 5,
    status: 'stocked',
    voteCount: 24,
    hasVoted: true,
    imageUrl: '/src/assets/images/snack_savoury_crisps_1794829395933.jpg',
  },
  {
    id: 'snk-cookies',
    name: 'Chocolate Chip Cookies',
    category: 'sweet',
    quantity: 9,
    lowStockThreshold: 4,
    status: 'stocked',
    voteCount: 31,
    hasVoted: false,
    imageUrl: '/src/assets/images/snack_sweet_artisan_1794829395733.jpg',
  },
  {
    id: 'snk-iced-coffee',
    name: 'Iced Coffee',
    category: 'drink',
    quantity: 1,
    lowStockThreshold: 4,
    status: 'running_low',
    voteCount: 19,
    hasVoted: false,
    imageUrl: '/src/assets/images/snack_drink_craft_1794829396196.jpg',
  },
  {
    id: 'snk-roasted-almonds',
    name: 'Roasted Almonds',
    category: 'healthy-ish',
    quantity: 11,
    lowStockThreshold: 4,
    status: 'stocked',
    voteCount: 15,
    hasVoted: false,
    imageUrl: '/src/assets/images/snack_healthy_nuts_1794829397016.jpg',
  },
  {
    id: 'snk-chocolate-bar',
    name: 'Dark Chocolate Bar',
    category: 'sweet',
    quantity: 3,
    lowStockThreshold: 5,
    status: 'running_low',
    voteCount: 17,
    hasVoted: true,
    imageUrl: '/src/assets/images/snack_chocolate_bar_1794902614897.jpg',
  },
  {
    id: 'snk-sparkling-water',
    name: 'Sparkling Water',
    category: 'drink',
    quantity: 16,
    lowStockThreshold: 6,
    status: 'stocked',
    voteCount: 22,
    hasVoted: false,
    imageUrl: '/src/assets/images/snack_sparkling_water_1794902614831.jpg',
  },
  {
    id: 'snk-salted-pretzels',
    name: 'Salted Pretzels',
    category: 'savoury',
    quantity: 2,
    lowStockThreshold: 4,
    status: 'running_low',
    voteCount: 11,
    hasVoted: false,
    imageUrl: '/src/assets/images/snack_pretzels_1794902612998.jpg',
  },
  {
    id: 'snk-granola-bar',
    name: 'Granola Bar',
    category: 'healthy-ish',
    quantity: 0,
    lowStockThreshold: 4,
    status: 'gone',
    voteCount: 13,
    hasVoted: false,
    imageUrl: '/src/assets/images/snack_granola_bar_1794902615711.jpg',
  },
  {
    id: 'snk-green-tea',
    name: 'Iced Green Tea',
    category: 'drink',
    quantity: 8,
    lowStockThreshold: 3,
    status: 'stocked',
    voteCount: 14,
    hasVoted: false,
    imageUrl: '/src/assets/images/snack_green_tea_1794902615358.jpg',
  },
  {
    id: 'snk-butter-popcorn',
    name: 'Butter Popcorn',
    category: 'savoury',
    quantity: 10,
    lowStockThreshold: 4,
    status: 'stocked',
    voteCount: 16,
    hasVoted: false,
    imageUrl: '/src/assets/images/snack_popcorn_1794902614894.jpg',
  },
];

const now = Date.now();
const INITIAL_ACTIVITY: ActivityItem[] = [
  {
    id: 'act-1',
    snackId: 'snk-iced-coffee',
    snackName: 'Iced Coffee',
    action: 'consumed',
    amount: 1,
    quantityBefore: 2,
    quantityAfter: 1,
    userName: 'Maya Lin',
    createdAt: new Date(now - 7 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-2',
    snackId: 'snk-sparkling-water',
    snackName: 'Sparkling Water',
    action: 'restocked',
    amount: 12,
    quantityBefore: 4,
    quantityAfter: 16,
    userName: 'Jordan Vance',
    createdAt: new Date(now - 38 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-3',
    snackId: 'snk-granola-bar',
    snackName: 'Granola Bar',
    action: 'consumed',
    amount: 2,
    quantityBefore: 2,
    quantityAfter: 0,
    userName: 'Priya Nair',
    createdAt: new Date(now - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'act-4',
    snackId: 'snk-cookies',
    snackName: 'Chocolate Chip Cookies',
    action: 'restocked',
    amount: 10,
    quantityBefore: 1,
    quantityAfter: 11,
    userName: 'Jordan Vance',
    createdAt: new Date(now - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'act-5',
    snackId: 'snk-potato-chips',
    snackName: 'Potato Chips',
    action: 'consumed',
    amount: 1,
    quantityBefore: 15,
    quantityAfter: 14,
    userName: 'Samira Patel',
    createdAt: new Date(now - 8 * 3600 * 1000).toISOString(),
  },
];

function readSnacks(): Snack[] {
  try {
    const raw = localStorage.getItem(STORAGE_SNACKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Snack[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to defaults
  }
  return INITIAL_SNACKS;
}

function writeSnacks(snacks: Snack[]): void {
  try {
    localStorage.setItem(STORAGE_SNACKS_KEY, JSON.stringify(snacks));
  } catch {
    // Ignore storage errors
  }
}

function readActivity(): ActivityItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ActivityItem[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to defaults
  }
  return INITIAL_ACTIVITY;
}

function writeActivity(items: ActivityItem[]): void {
  try {
    localStorage.setItem(STORAGE_ACTIVITY_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
}

export function getLocalUserRole(): UserRole {
  try {
    const saved = localStorage.getItem(STORAGE_ROLE_KEY);
    if (saved === 'member' || saved === 'admin') return saved;
  } catch {
    // Ignore
  }
  return 'admin';
}

export function setLocalUserRole(role: UserRole): void {
  try {
    localStorage.setItem(STORAGE_ROLE_KEY, role);
  } catch {
    // Ignore
  }
}

export function getLocalGuestUser(role: UserRole = getLocalUserRole()): User {
  return role === 'admin'
    ? { id: 'local-admin', name: 'Jordan Vance', email: 'pantry@snackoverflow.io', role: 'admin' }
    : { id: 'local-member', name: 'Alex Rivera', email: 'alex@snackoverflow.io', role: 'member' };
}

export const localPantryStore = {
  listSnacks(params: SnackQueryParams = {}): SnacksListResponse {
    const all = readSnacks();
    let filtered = all;

    if (params.category) {
      filtered = filtered.filter((s) => s.category === params.category);
    }
    if (params.status) {
      filtered = filtered.filter((s) => s.status === params.status);
    }
    if (params.q && params.q.trim()) {
      const needle = params.q.trim().toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(needle));
    }

    const sortField = params.sort ?? 'name';
    const order = params.order ?? 'asc';
    const dir = order === 'desc' ? -1 : 1;

    filtered = [...filtered].sort((a, b) => {
      if (sortField === 'quantity') return (a.quantity - b.quantity) * dir;
      if (sortField === 'votes') return (a.voteCount - b.voteCount) * dir;
      return a.name.localeCompare(b.name) * dir;
    });

    const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 10));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(totalPages, Math.max(1, params.page ?? 1));
    const start = (page - 1) * pageSize;

    return {
      data: filtered.slice(start, start + pageSize),
      pagination: { page, pageSize, total, totalPages },
    };
  },

  summary(): SnacksSummaryResponse {
    const all = readSnacks();
    const counts = {
      stocked: all.filter((s) => s.status === 'stocked').length,
      runningLow: all.filter((s) => s.status === 'running_low').length,
      gone: all.filter((s) => s.status === 'gone').length,
    };
    const sortedByVotes = [...all].sort((a, b) => b.voteCount - a.voteCount);
    return {
      counts,
      snackOfTheWeek: sortedByVotes[0] ?? null,
    };
  },

  getSnack(id: string): Snack {
    const found = readSnacks().find((s) => s.id === id);
    if (!found) {
      throw new ApiError(404, 'NOT_FOUND', 'Snack not found.');
    }
    return found;
  },

  createSnack(input: CreateSnackInput): Snack {
    const all = readSnacks();
    if (all.some((s) => s.name.trim().toLowerCase() === input.name.trim().toLowerCase())) {
      throw new ApiError(409, 'DUPLICATE_NAME', 'A snack with this name already exists.');
    }
    const quantity = Math.max(0, input.quantity ?? 10);
    const lowStockThreshold = Math.max(0, input.lowStockThreshold ?? 4);
    const created: Snack = {
      id: `snk-${Date.now()}`,
      name: input.name.trim(),
      category: input.category,
      quantity,
      lowStockThreshold,
      status: computeStatus(quantity, lowStockThreshold),
      voteCount: 0,
      hasVoted: false,
    };
    writeSnacks([created, ...all]);
    return created;
  },

  updateSnack(id: string, input: UpdateSnackInput): Snack {
    const all = readSnacks();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new ApiError(404, 'NOT_FOUND', 'Snack not found.');
    }
    const current = all[idx];
    const nextName = input.name !== undefined ? input.name.trim() : current.name;
    if (
      all.some((s) => s.id !== id && s.name.trim().toLowerCase() === nextName.toLowerCase())
    ) {
      throw new ApiError(409, 'DUPLICATE_NAME', 'A snack with this name already exists.');
    }
    const quantity = input.quantity !== undefined ? Math.max(0, input.quantity) : current.quantity;
    const lowStockThreshold =
      input.lowStockThreshold !== undefined
        ? Math.max(0, input.lowStockThreshold)
        : current.lowStockThreshold;

    const updated: Snack = {
      ...current,
      name: nextName,
      category: input.category ?? current.category,
      quantity,
      lowStockThreshold,
      status: computeStatus(quantity, lowStockThreshold),
    };
    const next = [...all];
    next[idx] = updated;
    writeSnacks(next);
    return updated;
  },

  removeSnack(id: string): void {
    const all = readSnacks();
    if (!all.some((s) => s.id === id)) {
      throw new ApiError(404, 'NOT_FOUND', 'Snack not found.');
    }
    writeSnacks(all.filter((s) => s.id !== id));
  },

  consumeSnack(id: string, amount: number, actorName: string): Snack {
    const all = readSnacks();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new ApiError(404, 'NOT_FOUND', 'Snack not found.');
    }
    const current = all[idx];
    if (amount < 1) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Amount must be at least 1.');
    }
    if (current.quantity < amount) {
      throw new ApiError(409, 'INSUFFICIENT_STOCK', 'Not enough stock left.');
    }
    const quantityAfter = current.quantity - amount;
    const updated: Snack = {
      ...current,
      quantity: quantityAfter,
      status: computeStatus(quantityAfter, current.lowStockThreshold),
    };
    const next = [...all];
    next[idx] = updated;
    writeSnacks(next);

    const activity = readActivity();
    writeActivity([
      {
        id: `act-${Date.now()}`,
        snackId: updated.id,
        snackName: updated.name,
        action: 'consumed',
        amount,
        quantityBefore: current.quantity,
        quantityAfter,
        userName: actorName,
        createdAt: new Date().toISOString(),
      },
      ...activity,
    ]);
    return updated;
  },

  restockSnack(id: string, amount: number, actorName: string): Snack {
    const all = readSnacks();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new ApiError(404, 'NOT_FOUND', 'Snack not found.');
    }
    const current = all[idx];
    if (amount < 1) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Amount must be at least 1.');
    }
    const quantityAfter = current.quantity + amount;
    const updated: Snack = {
      ...current,
      quantity: quantityAfter,
      status: computeStatus(quantityAfter, current.lowStockThreshold),
    };
    const next = [...all];
    next[idx] = updated;
    writeSnacks(next);

    const activity = readActivity();
    writeActivity([
      {
        id: `act-${Date.now()}`,
        snackId: updated.id,
        snackName: updated.name,
        action: 'restocked',
        amount,
        quantityBefore: current.quantity,
        quantityAfter,
        userName: actorName,
        createdAt: new Date().toISOString(),
      },
      ...activity,
    ]);
    return updated;
  },

  voteSnack(id: string): Snack {
    const all = readSnacks();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new ApiError(404, 'NOT_FOUND', 'Snack not found.');
    }
    const current = all[idx];
    if (current.hasVoted) {
      throw new ApiError(409, 'ALREADY_VOTED', 'Already voted.');
    }
    const updated: Snack = {
      ...current,
      hasVoted: true,
      voteCount: current.voteCount + 1,
    };
    const next = [...all];
    next[idx] = updated;
    writeSnacks(next);
    return updated;
  },

  unvoteSnack(id: string): void {
    const all = readSnacks();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new ApiError(404, 'NOT_FOUND', 'Snack not found.');
    }
    const current = all[idx];
    if (!current.hasVoted) {
      throw new ApiError(404, 'NOT_FOUND', 'Vote not found.');
    }
    const next = [...all];
    next[idx] = {
      ...current,
      hasVoted: false,
      voteCount: Math.max(0, current.voteCount - 1),
    };
    writeSnacks(next);
  },

  listActivity(params: { page?: number; pageSize?: number } = {}): ActivityListResponse {
    const all = readActivity();
    const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20));
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(totalPages, Math.max(1, params.page ?? 1));
    const start = (page - 1) * pageSize;
    return {
      data: all.slice(start, start + pageSize),
      pagination: { page, pageSize, total, totalPages },
    };
  },
};
