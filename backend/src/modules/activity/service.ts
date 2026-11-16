import type { z } from 'zod';
import { pool } from '../../db/pool';
import { activityRepository, type ActivityRow } from './repository';
import type { listActivityQuerySchema } from './schemas';

type ListQuery = z.infer<typeof listActivityQuerySchema>;

function toActivityResponse(row: ActivityRow) {
  return {
    id: row.id,
    snackName: row.snack_name,
    action: row.action,
    amount: row.amount,
    quantityBefore: row.quantity_before,
    quantityAfter: row.quantity_after,
    userName: row.user_name,
    userEmail: row.user_email,
    createdAt: row.created_at.toISOString(),
  };
}

export const activityService = {
  async list(query: ListQuery) {
    const { rows, total } = await activityRepository.list(pool, {
      page: query.page,
      pageSize: query.pageSize,
    });
    return {
      data: rows.map(toActivityResponse),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  },
};
