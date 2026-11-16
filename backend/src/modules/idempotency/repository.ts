import type { Queryable } from '../../db/pool';

export interface IdempotencyRecord {
  amount: number;
  response: unknown;
  status_code: number;
}

interface IdempotencyKey {
  userId: string;
  snackId: string;
  key: string;
}

export const idempotencyRepository = {
  async find(
    db: Queryable,
    { userId, snackId, key }: IdempotencyKey,
  ): Promise<IdempotencyRecord | undefined> {
    const result = await db.query<IdempotencyRecord>(
      `SELECT amount, response, status_code
       FROM idempotency_keys
       WHERE user_id = $1 AND snack_id = $2 AND idempotency_key = $3`,
      [userId, snackId, key],
    );
    return result.rows[0];
  },

  async insert(
    db: Queryable,
    input: IdempotencyKey & { amount: number; response: unknown; statusCode: number },
  ): Promise<void> {
    await db.query(
      `INSERT INTO idempotency_keys (user_id, snack_id, idempotency_key, amount, response, status_code)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        input.userId,
        input.snackId,
        input.key,
        input.amount,
        JSON.stringify(input.response),
        input.statusCode,
      ],
    );
  },
};
