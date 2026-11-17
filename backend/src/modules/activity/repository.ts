import type { Queryable } from '../../db/pool';

export type ActivityAction = 'consumed' | 'restocked';

export interface InsertActivityInput {
  userId: string;
  userName: string;
  userEmail: string;
  snackId: string | null;
  snackName: string;
  action: ActivityAction;
  amount: number;
  quantityBefore: number;
  quantityAfter: number;
}

export interface ActivityRow {
  id: string;
  snack_name: string;
  action: ActivityAction;
  amount: number;
  quantity_before: number;
  quantity_after: number;
  created_at: Date;
  user_name: string;
  user_email: string;
}

export const activityRepository = {
  async insert(db: Queryable, input: InsertActivityInput): Promise<void> {
    await db.query(
      `INSERT INTO activity (user_id, user_name, user_email, snack_id, snack_name, action, amount, quantity_before, quantity_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        input.userId,
        input.userName,
        input.userEmail,
        input.snackId,
        input.snackName,
        input.action,
        input.amount,
        input.quantityBefore,
        input.quantityAfter,
      ],
    );
  },

  async list(
    db: Queryable,
    options: { page: number; pageSize: number },
  ): Promise<{ rows: ActivityRow[]; total: number }> {
    const countResult = await db.query<{ total: number }>(
      'SELECT COUNT(*)::int AS total FROM activity',
    );
    const dataResult = await db.query<ActivityRow>(
      `SELECT
        a.id,
        a.snack_name,
        a.action,
        a.amount,
        a.quantity_before,
        a.quantity_after,
        a.created_at,
        COALESCE(u.name, a.user_name) AS user_name,
        COALESCE(u.email, a.user_email) AS user_email
      FROM activity a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET $2`,
      [options.pageSize, (options.page - 1) * options.pageSize],
    );
    return { rows: dataResult.rows, total: countResult.rows[0]?.total ?? 0 };
  },
};
