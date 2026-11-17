import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/db/pool';
import { authHeaders, countRows, createSnack, createUser, getSnackQuantity } from './helpers';

function expectError(
  res: { status: number; body: { error?: { code?: string; message?: string } } },
  status: number,
  code: string,
) {
  expect(res.status).toBe(status);
  expect(res.body.error?.code).toBe(code);
  expect(typeof res.body.error?.message).toBe('string');
}

describe('auth', () => {
  it('logs in and never exposes the password hash', async () => {
    await createUser({
      email: 'admin@example.com',
      name: 'Admin',
      role: 'admin',
      password: 'secret123',
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('admin@example.com');
    expect(res.body.user.role).toBe('admin');
    expect(res.body.user.password_hash).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('password_hash');
    expect(JSON.stringify(res.body)).not.toContain('$2');
  });

  it('returns the same generic error for wrong password and unknown email', async () => {
    await createUser({ email: 'known@example.com', password: 'right-password' });

    const wrongPassword = await request(app).post('/auth/login').send({
      email: 'known@example.com',
      password: 'wrong-password',
    });
    const unknownEmail = await request(app).post('/auth/login').send({
      email: 'nobody@example.com',
      password: 'wrong-password',
    });

    expectError(wrongPassword, 401, 'UNAUTHENTICATED');
    expectError(unknownEmail, 401, 'UNAUTHENTICATED');
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });

  it('registers new members without trusting a role from the body', async () => {
    const created = await request(app).post('/auth/register').send({
      name: 'New Member',
      email: 'new@example.com',
      password: 'password123',
    });
    expect(created.status).toBe(201);
    expect(created.body.role).toBe('member');
    expect(created.body.password_hash).toBeUndefined();

    const duplicate = await request(app).post('/auth/register').send({
      name: 'New Member',
      email: 'new@example.com',
      password: 'password123',
    });
    expectError(duplicate, 409, 'DUPLICATE_NAME');

    const weak = await request(app).post('/auth/register').send({
      name: 'Weak',
      email: 'weak@example.com',
      password: 'short',
    });
    expectError(weak, 400, 'VALIDATION_ERROR');

    const roleAttempt = await request(app).post('/auth/register').send({
      name: 'Sneaky',
      email: 'sneaky@example.com',
      password: 'password123',
      role: 'admin',
    });
    expectError(roleAttempt, 400, 'VALIDATION_ERROR');

    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'new@example.com', password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('member');
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/snacks');
    expectError(res, 401, 'UNAUTHENTICATED');
  });

  it('GET /auth/me returns the user object directly, matching the frontend contract', async () => {
    const member = await createUser({
      email: 'me@example.com',
      name: 'Me User',
      role: 'member',
    });

    const res = await request(app).get('/auth/me').set(authHeaders(member.token));
    expect(res.status).toBe(200);
    // The endpoint returns the user object at the top level — the frontend
    // reads res.user off this payload, so a { user } wrapper would break
    // session restore on every page reload.
    expect(res.body.id).toBe(member.id);
    expect(res.body.email).toBe('me@example.com');
    expect(res.body.role).toBe('member');
    expect(res.body.password_hash).toBeUndefined();
  });

  it('forbids members from admin routes but lets them read', async () => {
    const member = await createUser({ email: 'member@example.com', role: 'member' });

    const list = await request(app).get('/snacks').set(authHeaders(member.token));
    expect(list.status).toBe(200);

    const create = await request(app)
      .post('/snacks')
      .set(authHeaders(member.token))
      .send({ name: 'Nope', category: 'sweet' });
    expectError(create, 403, 'FORBIDDEN');
  });
});

describe('snacks CRUD and validation', () => {
  it('creates, reads, updates and deletes a snack as admin', async () => {
    const admin = await createUser({ email: 'admin@example.com', role: 'admin' });

    const created = await request(app)
      .post('/snacks')
      .set(authHeaders(admin.token))
      .send({ name: 'Dark Chocolate', category: 'sweet', quantity: 7, lowStockThreshold: 3 });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('stocked');
    expect(created.body.voteCount).toBe(0);
    expect(created.body.hasVoted).toBe(false);

    const id = created.body.id as string;

    const duplicate = await request(app)
      .post('/snacks')
      .set(authHeaders(admin.token))
      .send({ name: 'dark chocolate', category: 'sweet' });
    expectError(duplicate, 409, 'DUPLICATE_NAME');

    const updated = await request(app)
      .patch(`/snacks/${id}`)
      .set(authHeaders(admin.token))
      .send({ quantity: 2, lowStockThreshold: 4 });
    expect(updated.status).toBe(200);
    expect(updated.body.quantity).toBe(2);
    expect(updated.body.status).toBe('running_low');

    const fetched = await request(app).get(`/snacks/${id}`).set(authHeaders(admin.token));
    expect(fetched.status).toBe(200);
    expect(fetched.body.name).toBe('Dark Chocolate');

    const deleted = await request(app).delete(`/snacks/${id}`).set(authHeaders(admin.token));
    expect(deleted.status).toBe(204);

    const missing = await request(app).get(`/snacks/${id}`).set(authHeaders(admin.token));
    expectError(missing, 404, 'NOT_FOUND');
  });

  it('rejects invalid snack payloads', async () => {
    const admin = await createUser({ email: 'admin@example.com', role: 'admin' });

    const badCategory = await request(app)
      .post('/snacks')
      .set(authHeaders(admin.token))
      .send({ name: 'X', category: 'spicy' });
    expectError(badCategory, 400, 'VALIDATION_ERROR');

    const negativeQuantity = await request(app)
      .post('/snacks')
      .set(authHeaders(admin.token))
      .send({ name: 'X', category: 'sweet', quantity: -1 });
    expectError(negativeQuantity, 400, 'VALIDATION_ERROR');

    const unknownField = await request(app)
      .post('/snacks')
      .set(authHeaders(admin.token))
      .send({ name: 'X', category: 'sweet', hacker: true });
    expectError(unknownField, 400, 'VALIDATION_ERROR');

    const overflowingQuantity = await request(app)
      .post('/snacks')
      .set(authHeaders(admin.token))
      .send({ name: 'X', category: 'sweet', quantity: 99999999999 });
    expectError(overflowingQuantity, 400, 'VALIDATION_ERROR');
  });

  it('returns the single error format for unknown routes and bad ids', async () => {
    const member = await createUser({ email: 'member@example.com' });

    const unknownRoute = await request(app)
      .get('/definitely-not-a-route')
      .set(authHeaders(member.token));
    expectError(unknownRoute, 404, 'NOT_FOUND');

    const badId = await request(app).get('/snacks/not-a-uuid').set(authHeaders(member.token));
    expectError(badId, 400, 'VALIDATION_ERROR');
  });
});

describe('list, filters, search and pagination', () => {
  it('filters by status, category and search with a stable pagination envelope', async () => {
    const member = await createUser({ email: 'member@example.com' });

    await createSnack({
      name: 'Gone Chips',
      category: 'savoury',
      quantity: 0,
      lowStockThreshold: 5,
    });
    await createSnack({ name: 'Last Oreo', category: 'sweet', quantity: 1, lowStockThreshold: 5 });
    await createSnack({
      name: 'At Limit Tea',
      category: 'drink',
      quantity: 5,
      lowStockThreshold: 5,
    });
    await createSnack({
      name: 'Stocked Coffee',
      category: 'drink',
      quantity: 9,
      lowStockThreshold: 5,
    });
    await createSnack({ name: 'Alpha One', category: 'sweet', quantity: 10 });
    await createSnack({ name: 'Alpha Two', category: 'sweet', quantity: 10 });
    await createSnack({ name: 'Beta Three', category: 'sweet', quantity: 10 });

    const gone = await request(app).get('/snacks?status=gone').set(authHeaders(member.token));
    expect(gone.status).toBe(200);
    expect(gone.body.data).toHaveLength(1);
    expect(gone.body.data[0].name).toBe('Gone Chips');
    expect(gone.body.pagination.total).toBe(1);

    const runningLow = await request(app)
      .get('/snacks?status=running_low')
      .set(authHeaders(member.token));
    expect(runningLow.body.data.map((s: { name: string }) => s.name).sort()).toEqual([
      'At Limit Tea',
      'Last Oreo',
    ]);

    const drinks = await request(app).get('/snacks?category=drink').set(authHeaders(member.token));
    expect(drinks.body.pagination.total).toBe(2);

    const search = await request(app).get('/snacks?q=alpha').set(authHeaders(member.token));
    expect(search.body.pagination.total).toBe(2);

    // LIKE wildcards in user input must be escaped, not treated as patterns.
    const wildcard = await request(app).get('/snacks?q=%25').set(authHeaders(member.token));
    expect(wildcard.body.pagination.total).toBe(0);

    const page1 = await request(app)
      .get('/snacks?page=1&pageSize=2')
      .set(authHeaders(member.token));
    expect(page1.body.data).toHaveLength(2);
    expect(page1.body.pagination).toMatchObject({ page: 1, pageSize: 2, total: 7, totalPages: 4 });

    const page4 = await request(app)
      .get('/snacks?page=4&pageSize=2')
      .set(authHeaders(member.token));
    expect(page4.body.data).toHaveLength(1);
  });

  it('sorts server-side by allowlisted columns only', async () => {
    const member = await createUser({ email: 'member@example.com' });

    await createSnack({ name: 'Bravo Snack', quantity: 3 });
    const alphaId = await createSnack({ name: 'Alpha Snack', quantity: 9 });
    await createSnack({ name: 'Charlie Snack', quantity: 5 });
    await request(app).post(`/snacks/${alphaId}/vote`).set(authHeaders(member.token));

    const byName = await request(app)
      .get('/snacks?sort=name&order=asc')
      .set(authHeaders(member.token));
    expect(byName.body.data[0].name).toBe('Alpha Snack');

    const byQuantity = await request(app)
      .get('/snacks?sort=quantity&order=desc')
      .set(authHeaders(member.token));
    expect(byQuantity.body.data[0].name).toBe('Alpha Snack');

    const byVotes = await request(app)
      .get('/snacks?sort=votes&order=desc')
      .set(authHeaders(member.token));
    expect(byVotes.body.data[0].name).toBe('Alpha Snack');
    expect(byVotes.body.data[0].voteCount).toBe(1);

    const injection = await request(app)
      .get('/snacks?sort=name%3BDROP%20TABLE%20snacks')
      .set(authHeaders(member.token));
    expectError(injection, 400, 'VALIDATION_ERROR');
  });

  it('derives status at the exact boundaries', async () => {
    const member = await createUser({ email: 'member@example.com' });

    const cases = [
      { name: 'Zero Stock', quantity: 0, threshold: 5, status: 'gone' },
      { name: 'One Left', quantity: 1, threshold: 5, status: 'running_low' },
      { name: 'At Threshold', quantity: 5, threshold: 5, status: 'running_low' },
      { name: 'Above Threshold', quantity: 6, threshold: 5, status: 'stocked' },
      { name: 'Zero Threshold', quantity: 1, threshold: 0, status: 'stocked' },
    ];

    for (const item of cases) {
      const id = await createSnack({
        name: item.name,
        quantity: item.quantity,
        lowStockThreshold: item.threshold,
      });
      const res = await request(app).get(`/snacks/${id}`).set(authHeaders(member.token));
      expect(res.body.status).toBe(item.status);
    }
  });
});

describe('consume, restock and activity', () => {
  it('consumes atomically and records activity in the same transaction', async () => {
    const member = await createUser({ email: 'member@example.com' });
    const admin = await createUser({ email: 'admin@example.com', role: 'admin' });
    const snackId = await createSnack({ name: 'Atomic Chips', quantity: 5, lowStockThreshold: 2 });

    const consumed = await request(app)
      .post(`/snacks/${snackId}/consume`)
      .set(authHeaders(member.token))
      .send({ amount: 2 });
    expect(consumed.status).toBe(200);
    expect(consumed.body.quantity).toBe(3);

    const activity = await pool.query<{
      action: string;
      quantity_before: number;
      quantity_after: number;
    }>('SELECT action, quantity_before, quantity_after FROM activity WHERE snack_id = $1', [
      snackId,
    ]);
    expect(activity.rows).toHaveLength(1);
    expect(activity.rows[0]).toMatchObject({
      action: 'consumed',
      quantity_before: 5,
      quantity_after: 3,
    });

    const tooMuch = await request(app)
      .post(`/snacks/${snackId}/consume`)
      .set(authHeaders(member.token))
      .send({ amount: 10 });
    expectError(tooMuch, 409, 'INSUFFICIENT_STOCK');
    expect(await getSnackQuantity(snackId)).toBe(3);
    expect(await countRows('activity', snackId)).toBe(1);

    const restocked = await request(app)
      .post(`/snacks/${snackId}/restock`)
      .set(authHeaders(admin.token))
      .send({ amount: 4 });
    expect(restocked.status).toBe(200);
    expect(restocked.body.quantity).toBe(7);
    expect(await countRows('activity', snackId)).toBe(2);

    const memberRestock = await request(app)
      .post(`/snacks/${snackId}/restock`)
      .set(authHeaders(member.token))
      .send({ amount: 1 });
    expectError(memberRestock, 403, 'FORBIDDEN');
  });

  it('rejects invalid consume amounts', async () => {
    const member = await createUser({ email: 'member@example.com' });
    const snackId = await createSnack({ name: 'Portion Control', quantity: 10 });

    for (const amount of [0, -1, 1.5, '2', 99999999999]) {
      const res = await request(app)
        .post(`/snacks/${snackId}/consume`)
        .set(authHeaders(member.token))
        .send({ amount });
      expectError(res, 400, 'VALIDATION_ERROR');
    }
    expect(await getSnackQuantity(snackId)).toBe(10);
  });

  it('does not double-count consume retries that share an Idempotency-Key', async () => {
    const member = await createUser({ email: 'member@example.com' });
    const snackId = await createSnack({ name: 'Idempotent Nuts', quantity: 5 });

    const first = await request(app)
      .post(`/snacks/${snackId}/consume`)
      .set(authHeaders(member.token))
      .set('Idempotency-Key', 'retry-key-1')
      .send({ amount: 2 });
    expect(first.status).toBe(200);
    expect(first.body.quantity).toBe(3);

    const retry = await request(app)
      .post(`/snacks/${snackId}/consume`)
      .set(authHeaders(member.token))
      .set('Idempotency-Key', 'retry-key-1')
      .send({ amount: 2 });
    expect(retry.status).toBe(200);
    expect(retry.body.quantity).toBe(3);

    expect(await getSnackQuantity(snackId)).toBe(3);
    expect(await countRows('activity', snackId)).toBe(1);

    const mismatched = await request(app)
      .post(`/snacks/${snackId}/consume`)
      .set(authHeaders(member.token))
      .set('Idempotency-Key', 'retry-key-1')
      .send({ amount: 3 });
    expectError(mismatched, 400, 'VALIDATION_ERROR');

    const fresh = await request(app)
      .post(`/snacks/${snackId}/consume`)
      .set(authHeaders(member.token))
      .send({ amount: 1 });
    expect(fresh.status).toBe(200);
    expect(await getSnackQuantity(snackId)).toBe(2);
  });

  it('never drives quantity below zero', async () => {
    const member = await createUser({ email: 'member@example.com' });
    const snackId = await createSnack({ name: 'Last One', quantity: 1 });

    const ok = await request(app)
      .post(`/snacks/${snackId}/consume`)
      .set(authHeaders(member.token))
      .send({ amount: 1 });
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('gone');

    const fail = await request(app)
      .post(`/snacks/${snackId}/consume`)
      .set(authHeaders(member.token))
      .send({ amount: 1 });
    expectError(fail, 409, 'INSUFFICIENT_STOCK');
    expect(await getSnackQuantity(snackId)).toBe(0);
  });
});

describe('votes', () => {
  it('lets a member vote once, then unvote', async () => {
    const member = await createUser({ email: 'member@example.com' });
    const other = await createUser({ email: 'other@example.com' });
    const snackId = await createSnack({ name: 'Votable Snack', quantity: 10 });

    const voted = await request(app).post(`/snacks/${snackId}/vote`).set(authHeaders(member.token));
    expect(voted.status).toBe(200);
    expect(voted.body.hasVoted).toBe(true);
    expect(voted.body.voteCount).toBe(1);

    const duplicate = await request(app)
      .post(`/snacks/${snackId}/vote`)
      .set(authHeaders(member.token));
    expectError(duplicate, 409, 'ALREADY_VOTED');

    const otherVote = await request(app)
      .post(`/snacks/${snackId}/vote`)
      .set(authHeaders(other.token));
    expect(otherVote.status).toBe(200);
    expect(otherVote.body.voteCount).toBe(2);
    expect(otherVote.body.hasVoted).toBe(true);

    const unvoted = await request(app)
      .delete(`/snacks/${snackId}/vote`)
      .set(authHeaders(member.token));
    expect(unvoted.status).toBe(204);

    const again = await request(app)
      .delete(`/snacks/${snackId}/vote`)
      .set(authHeaders(member.token));
    expectError(again, 404, 'NOT_FOUND');

    const final = await request(app).get(`/snacks/${snackId}`).set(authHeaders(member.token));
    expect(final.body.voteCount).toBe(1);
    expect(final.body.hasVoted).toBe(false);
  });
});

describe('summary', () => {
  it('returns status counts and a snack of the week', async () => {
    const admin = await createUser({ email: 'admin@example.com', role: 'admin' });
    const member = await createUser({ email: 'member@example.com' });

    const stockedId = await createSnack({
      name: 'Crowd Favorite',
      quantity: 10,
      lowStockThreshold: 2,
    });
    await createSnack({ name: 'Running Low Snack', quantity: 2, lowStockThreshold: 5 });
    await createSnack({ name: 'Gone Snack', quantity: 0, lowStockThreshold: 5 });
    await createSnack({ name: 'Other Snack', quantity: 10, lowStockThreshold: 2 });

    await request(app).post(`/snacks/${stockedId}/vote`).set(authHeaders(member.token));
    await request(app).post(`/snacks/${stockedId}/vote`).set(authHeaders(admin.token));

    const res = await request(app).get('/snacks/summary').set(authHeaders(member.token));
    expect(res.status).toBe(200);
    expect(res.body.counts).toEqual({ stocked: 2, runningLow: 1, gone: 1 });
    expect(res.body.snackOfWeek.name).toBe('Crowd Favorite');
    expect(res.body.snackOfWeek.voteCount).toBe(2);
    expect(res.body.snackOfWeek.hasVoted).toBe(true);
  });
});
