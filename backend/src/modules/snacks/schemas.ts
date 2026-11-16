import { z } from 'zod';
import { SNACK_CATEGORIES, SNACK_STATUSES } from './types';

export const snackCategorySchema = z.enum(SNACK_CATEGORIES);
export const snackStatusSchema = z.enum(SNACK_STATUSES);

export const snackIdParamSchema = z.object({ id: z.string().uuid('Invalid snack id') }).strict();

export const createSnackSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    category: snackCategorySchema,
    quantity: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
  })
  .strict();

export const updateSnackSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    category: snackCategorySchema.optional(),
    quantity: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
  })
  .strict();

export const amountSchema = z.object({ amount: z.number().int().positive('Amount must be a positive integer') }).strict();

export const listSnacksQuerySchema = z
  .object({
    category: snackCategorySchema.optional(),
    status: snackStatusSchema.optional(),
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();
