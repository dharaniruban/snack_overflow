import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/db/pool';
import { authHeaders, countRows, createSnack, createUser, getSnackQuantity } from './helpers';

async function consume(snackId: string, token: string, amount: number) {
  return request(app).post(`/snacks/${snackId}/consume`).set(authHeaders(token)).send({ amount });
}

describe('concurrency', () => {
  it('allows exactly the available stock to be consumed under parallel load', async () => {
    const member = await createUser({ email: 'member@example.com' });
    const snackId = await createSnack({ name: 'Rationed Chips', quantity: 3, lowStockThreshold: 1 });

    const results = await Promise.all(
      Array.from({ length: 10 }, () => consume(snackId, member.token, 1)),
    );

    const ok = results.filter((res) => res.status === 200);
    const conflict = results.filter((res) => res.status === 409);

    expect(ok).toHaveLength(3);
    expect(conflict).toHaveLength(7);
    expect(conflict.every((res) => res.body.error.code === 'INSUFFICIENT_STOCK')).toBe(true);
    expect(await getSnackQuantity(snackId)).toBe(0);
    expect(await countRows('activity', snackId)).toBe(3);
  });

  it('handles parallel consumes of varying amounts without overselling', async () => {
    const member = await createUser({ email: 'member@example.com' });
    const snackId = await createSnack({ name: 'Portion Pack', quantity: 5, lowStockThreshold: 1 });

    const results = await Promise.all(
      Array.from({ length: 10 }, () => consume(snackId, member.token, 2)),
    );

    const ok = results.filter((res) => res.status === 200);
    const conflict = results.filter((res) => res.status === 409);

    expect(ok).toHaveLength(2);
    expect(conflict).toHaveLength(8);
    expect(await getSnackQuantity(snackId)).toBe(1);
  });

  it('allows only one vote per user under parallel load', async () => {
    const member = await createUser({ email: 'member@example.com' });
    const snackId = await createSnack({ name: 'Ballot Snack', quantity: 10 });

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app).post(`/snacks/${snackId}/vote`).set(authHeaders(member.token)),
      ),
    );

    const ok = results.filter((res) => res.status === 200);
    const conflict = results.filter((res) => res.status === 409);

    expect(ok).toHaveLength(1);
    expect(conflict).toHaveLength(9);
    expect(conflict.every((res) => res.body.error.code === 'ALREADY_VOTED')).toBe(true);

    const voteCount = await pool.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM votes WHERE snack_id = $1 AND user_id = $2',
      [snackId, member.id],
    );
    expect(voteCount.rows[0]?.count).toBe(1);
  });
});
