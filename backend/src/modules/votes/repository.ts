import type { Queryable } from '../../db/pool';

interface VoteKey {
  userId: string;
  snackId: string;
}

export const voteRepository = {
  async add(
    db: Queryable,
    { userId, snackId }: VoteKey,
  ): Promise<{ snack_id: string } | undefined> {
    // The composite PRIMARY KEY (user_id, snack_id) is the real guard against
    // double voting; ON CONFLICT DO NOTHING keeps it race-safe without locks.
    const result = await db.query<{ snack_id: string }>(
      'INSERT INTO votes (user_id, snack_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING snack_id',
      [userId, snackId],
    );
    return result.rows[0];
  },

  async remove(
    db: Queryable,
    { userId, snackId }: VoteKey,
  ): Promise<{ snack_id: string } | undefined> {
    const result = await db.query<{ snack_id: string }>(
      'DELETE FROM votes WHERE user_id = $1 AND snack_id = $2 RETURNING snack_id',
      [userId, snackId],
    );
    return result.rows[0];
  },
};
