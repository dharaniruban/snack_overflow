import { z } from 'zod';
import { SNACK_CATEGORIES, SNACK_STATUSES } from './types';

export const snackCategorySchema = z.enum(SNACK_CATEGORIES);
export const snackStatusSchema = z.enum(SNACK_STATUSES);

export const snackIdParamSchema = z.object({ id: z.string().uuid('Invalid snack id') }).strict();

// INTEGER columns are int4; capping inputs at 1e9 keeps quantity + amount
// below int4 max even after a restock, so the DB can never overflow.
const MAX_STOCK = 1_000_000_000;

export const createSnackSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    category: snackCategorySchema,
    quantity: z.number().int().min(0).max(MAX_STOCK).optional(),
    lowStockThreshold: z.number().int().min(0).max(MAX_STOCK).optional(),
    imageUrl: z.union([z.literal(''), z.string().trim().url('Image URL must be a valid URL').max(2048)]).nullish(),
  })
  .strict();

export const updateSnackSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    category: snackCategorySchema.optional(),
    quantity: z.number().int().min(0).max(MAX_STOCK).optional(),
    lowStockThreshold: z.number().int().min(0).max(MAX_STOCK).optional(),
    imageUrl: z.union([z.literal(''), z.string().trim().url('Image URL must be a valid URL').max(2048)]).nullish(),
  })
  .strict();

export const amountSchema = z
  .object({
    amount: z
      .number()
      .int()
      .positive('Amount must be a positive integer')
      .max(MAX_STOCK, 'Amount is too large'),
  })
  .strict();

export const listSnacksQuerySchema = z
  .object({
    category: snackCategorySchema.optional(),
    status: snackStatusSchema.optional(),
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
    sort: z.enum(['name', 'quantity', 'votes', 'createdAt']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  })
  .strict();
