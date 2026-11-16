import { pool, withTransaction } from '../../db/pool';
import { AppError } from '../../utils/errors';
import { isUniqueViolation } from '../../utils/pgErrors';
import { activityRepository } from '../activity/repository';
import type { z } from 'zod';
import { snackRepository, type SnackBaseRow, type SnackRow } from './repository';
import type { CreateSnackInput, SnackResponse, SnackStatus } from './types';
import type { createSnackSchema, listSnacksQuerySchema, updateSnackSchema } from './schemas';

type ListQuery = z.infer<typeof listSnacksQuerySchema>;
type CreateInput = z.infer<typeof createSnackSchema>;
type UpdateInput = z.infer<typeof updateSnackSchema>;

function toSnackResponse(row: SnackRow): SnackResponse {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    lowStockThreshold: row.low_stock_threshold,
    status: row.status as SnackStatus,
    voteCount: row.vote_count,
    hasVoted: row.has_voted > 0,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function duplicateNameError(error: unknown): never {
  if (isUniqueViolation(error)) {
    throw new AppError('DUPLICATE_NAME', 'A snack with that name already exists');
  }
  throw error;
}

export const snackService = {
  async list(query: ListQuery, userId: string) {
    const { rows, total } = await snackRepository.listSnacks(pool, {
      category: query.category,
      status: query.status,
      q: query.q,
      page: query.page,
      pageSize: query.pageSize,
      userId,
    });

    return {
      data: rows.map(toSnackResponse),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  },

  async summary(userId: string) {
    const summary = await snackRepository.getSummary(pool, userId);
    return {
      counts: {
        stocked: summary.stocked,
        runningLow: summary.running_low,
        gone: summary.gone,
      },
      snackOfWeek: summary.snackOfWeek ? toSnackResponse(summary.snackOfWeek) : null,
    };
  },

  async getById(id: string, userId: string): Promise<SnackResponse> {
    const row = await snackRepository.getById(pool, id, userId);
    if (!row) {
      throw new AppError('NOT_FOUND', 'Snack not found');
    }
    return toSnackResponse(row);
  },

  async create(input: CreateInput, userId: string): Promise<SnackResponse> {
    const createInput: Required<CreateSnackInput> = {
      name: input.name,
      category: input.category,
      quantity: input.quantity ?? 0,
      lowStockThreshold: input.lowStockThreshold ?? 5,
    };

    let created: SnackBaseRow;
    try {
      created = await snackRepository.create(pool, createInput);
    } catch (error) {
      duplicateNameError(error);
    }

    return snackService.getById(created.id, userId);
  },

  async update(id: string, input: UpdateInput, userId: string): Promise<SnackResponse> {
    if (Object.values(input).every((value) => value === undefined)) {
      throw new AppError('VALIDATION_ERROR', 'At least one field must be provided');
    }

    let updated: SnackBaseRow | undefined;
    try {
      updated = await snackRepository.update(pool, id, input);
    } catch (error) {
      duplicateNameError(error);
    }

    if (!updated) {
      throw new AppError('NOT_FOUND', 'Snack not found');
    }
    return snackService.getById(id, userId);
  },

  async remove(id: string): Promise<void> {
    const removed = await snackRepository.remove(pool, id);
    if (!removed) {
      throw new AppError('NOT_FOUND', 'Snack not found');
    }
  },

  async consume(id: string, amount: number, userId: string): Promise<SnackResponse> {
    await withTransaction(async (client) => {
      const updated = await snackRepository.consume(client, id, amount);
      if (!updated) {
        const exists = await snackRepository.exists(client, id);
        if (!exists) {
          throw new AppError('NOT_FOUND', 'Snack not found');
        }
        throw new AppError('INSUFFICIENT_STOCK', 'Someone beat you to it.');
      }

      const quantityAfter = updated.quantity;
      await activityRepository.insert(client, {
        userId,
        snackId: id,
        snackName: updated.name,
        action: 'consumed',
        amount,
        quantityBefore: quantityAfter + amount,
        quantityAfter,
      });
    });

    return snackService.getById(id, userId);
  },

  async restock(id: string, amount: number, userId: string): Promise<SnackResponse> {
    await withTransaction(async (client) => {
      const updated = await snackRepository.restock(client, id, amount);
      if (!updated) {
        throw new AppError('NOT_FOUND', 'Snack not found');
      }

      const quantityAfter = updated.quantity;
      await activityRepository.insert(client, {
        userId,
        snackId: id,
        snackName: updated.name,
        action: 'restocked',
        amount,
        quantityBefore: quantityAfter - amount,
        quantityAfter,
      });
    });

    return snackService.getById(id, userId);
  },
};
