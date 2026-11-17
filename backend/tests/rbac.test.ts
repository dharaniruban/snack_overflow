import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { pool } from '../src/db/pool';
import { requireAuth } from '../src/middleware/auth';
import { authHeaders, countRows, createSnack, createUser, getSnackQuantity } from './helpers';

const JWT_SECRET = process.env.JWT_SECRET as string;

function expectError(
  res: { status: number; body: { error?: { code?: string; message?: string } } },
  status: number,
  code: string,
) {
  expect(res.status).toBe(status);
  expect(res.body.error?.code).toBe(code);
  expect(typeof res.body.error?.message).toBe('string');
}

async function snackCount(): Promise<number> {
  const result = await pool.query<{ count: number }>('SELECT COUNT(*)::int AS count FROM snacks');
  return result.rows[0].count;
}

async function snackExists(snackId: string): Promise<boolean> {
  const result = await pool.query('SELECT 1 FROM snacks WHERE id = $1', [snackId]);
  return result.rowCount === 1;
}

async function snackName(snackId: string): Promise<string> {
  const result = await pool.query<{ name: string }>('SELECT name FROM snacks WHERE id = $1', [
    snackId,
  ]);
  return result.rows[0].name;
}

describe('RBAC: admin-only endpoints', () => {
  it('member gets 403 and the database is unchanged on every admin route', async () => {
    const member = await createUser({ email: 'member@example.com', role: 'member' });
    const admin = await createUser({ email: 'admin@example.com', role: 'admin' });
    const snackId = await createSnack({ name: 'Guarded Snack', quantity: 8, lowStockThreshold: 4 });
    const snacksBefore = await snackCount();
    const activityBefore = await countRows('activity');

    const agent = request(app);

    // POST /snacks — create
    const create = await agent
      .post('/snacks')
      .set(authHeaders(member.token))
      .send({ name: 'Sneaky Snack', category: 'sweet' });
    expectError(create, 403, 'FORBIDDEN');
    expect(create.body.error.message).toBe("You don't have permission to do that.");

    // PATCH /snacks/:id — update
    const update = await agent
      .patch(`/snacks/${snackId}`)
      .set(authHeaders(member.token))
      .send({ name: 'Renamed', quantity: 99 });
    expectError(update, 403, 'FORBIDDEN');

    // DELETE /snacks/:id — delete
    const remove = await agent.delete(`/snacks/${snackId}`).set(authHeaders(member.token));
    expectError(remove, 403, 'FORBIDDEN');

    // POST /snacks/:id/restock — restock
    const restock = await agent
      .post(`/snacks/${snackId}/restock`)
      .set(authHeaders(member.token))
      .send({ amount: 5 });
    expectError(restock, 403, 'FORBIDDEN');

    // GET /activity — activity log
    const activity = await agent.get('/activity').set(authHeaders(member.token));
    expectError(activity, 403, 'FORBIDDEN');

    // Nothing changed.
    expect(await snackCount()).toBe(snacksBefore);
    expect(await snackName(snackId)).toBe('Guarded Snack');
    expect(await getSnackQuantity(snackId)).toBe(8);
    expect(await snackExists(snackId)).toBe(true);
    expect(await countRows('activity')).toBe(activityBefore);

    // Admin token succeeds on the same routes.
    const adminCreate = await agent
      .post('/snacks')
      .set(authHeaders(admin.token))
      .send({ name: 'Admin Snack', category: 'sweet' });
    expect(adminCreate.status).toBe(201);

    const adminUpdate = await agent
      .patch(`/snacks/${snackId}`)
      .set(authHeaders(admin.token))
      .send({ name: 'Admin Renamed' });
    expect(adminUpdate.status).toBe(200);

    const adminRestock = await agent
      .post(`/snacks/${snackId}/restock`)
      .set(authHeaders(admin.token))
      .send({ amount: 2 });
    expect(adminRestock.status).toBe(200);

    const adminActivity = await agent.get('/activity').set(authHeaders(admin.token));
    expect(adminActivity.status).toBe(200);

    const adminDelete = await agent.delete(`/snacks/${snackId}`).set(authHeaders(admin.token));
    expect(adminDelete.status).toBe(204);
  });

  it('returns 401 UNAUTHENTICATED on admin routes with no token', async () => {
    const snackId = await createSnack({ name: 'No Token Snack' });
    const cases = [
      request(app).post('/snacks').send({ name: 'X', category: 'sweet' }),
      request(app).patch(`/snacks/${snackId}`).send({ name: 'X' }),
      request(app).delete(`/snacks/${snackId}`),
      request(app).post(`/snacks/${snackId}/restock`).send({ amount: 1 }),
      request(app).get('/activity'),
    ];
    for (const pending of cases) {
      const res = await pending;
      expectError(res, 401, 'UNAUTHENTICATED');
    }
  });

  it('rejects tampered, expired and wrong-secret tokens with 401', async () => {
    const user = await createUser({ email: 'member@example.com', role: 'member' });

    const tampered = `${user.token.slice(0, -2)}xx`;
    const tamperedRes = await request(app)
      .get('/snacks')
      .set(authHeaders(tampered));
    expectError(tamperedRes, 401, 'UNAUTHENTICATED');

    const expired = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: -10,
    });
    const expiredRes = await request(app).get('/snacks').set(authHeaders(expired));
    expectError(expiredRes, 401, 'UNAUTHENTICATED');

    // Payload claims role: admin but signed with the wrong secret.
    const forged = jwt.sign({ sub: user.id, role: 'admin' }, 'wrong-secret');
    const forgedRes = await request(app)
      .post('/snacks')
      .set(authHeaders(forged))
      .send({ name: 'Forged', category: 'sweet' });
    expectError(forgedRes, 401, 'UNAUTHENTICATED');
  });

  it('gives 403 (not 400) when a member sends an invalid body to an admin route', async () => {
    const member = await createUser({ email: 'member@example.com', role: 'member' });

    const res = await request(app)
      .post('/snacks')
      .set(authHeaders(member.token))
      .send({ name: '', category: 'not-a-category', hacker: true });
    expectError(res, 403, 'FORBIDDEN');
  });

  it('re-reads the role from the DB so a demoted admin loses access immediately', async () => {
    const admin = await createUser({ email: 'admin@example.com', role: 'admin' });

    const before = await request(app)
      .post('/snacks')
      .set(authHeaders(admin.token))
      .send({ name: 'Before Demotion', category: 'sweet' });
    expect(before.status).toBe(201);

    await pool.query("UPDATE users SET role = 'member' WHERE id = $1", [admin.id]);

    const after = await request(app)
      .post('/snacks')
      .set(authHeaders(admin.token))
      .send({ name: 'After Demotion', category: 'sweet' });
    expectError(after, 403, 'FORBIDDEN');

    // ...but member-level routes still work with the same token.
    const list = await request(app).get('/snacks').set(authHeaders(admin.token));
    expect(list.status).toBe(200);
  });
});

describe('RBAC: member-permitted routes', () => {
  it('lets members consume, vote, unvote, list, view one snack and the summary', async () => {
    const member = await createUser({ email: 'member@example.com', role: 'member' });
    const snackId = await createSnack({ name: 'Member Snack', quantity: 5, lowStockThreshold: 2 });

    const list = await request(app).get('/snacks').set(authHeaders(member.token));
    expect(list.status).toBe(200);

    const one = await request(app).get(`/snacks/${snackId}`).set(authHeaders(member.token));
    expect(one.status).toBe(200);

    const summary = await request(app).get('/snacks/summary').set(authHeaders(member.token));
    expect(summary.status).toBe(200);

    const consumed = await request(app)
      .post(`/snacks/${snackId}/consume`)
      .set(authHeaders(member.token))
      .send({ amount: 1 });
    expect(consumed.status).toBe(200);
    expect(consumed.body.quantity).toBe(4);

    const voted = await request(app)
      .post(`/snacks/${snackId}/vote`)
      .set(authHeaders(member.token));
    expect(voted.status).toBe(200);
    expect(voted.body.hasVoted).toBe(true);

    const unvoted = await request(app)
      .delete(`/snacks/${snackId}/vote`)
      .set(authHeaders(member.token));
    expect(unvoted.status).toBe(204);
  });

  it('lets admins consume and vote like members (admin is a superset)', async () => {
    const admin = await createUser({ email: 'admin@example.com', role: 'admin' });
    const snackId = await createSnack({ name: 'Admin Snack', quantity: 5, lowStockThreshold: 2 });

    const consumed = await request(app)
      .post(`/snacks/${snackId}/consume`)
      .set(authHeaders(admin.token))
      .send({ amount: 1 });
    expect(consumed.status).toBe(200);

    const voted = await request(app)
      .post(`/snacks/${snackId}/vote`)
      .set(authHeaders(admin.token));
    expect(voted.status).toBe(200);
    expect(voted.body.hasVoted).toBe(true);
  });
});

describe('RBAC: default deny', () => {
  // Routes that are intentionally public: login/register plus the liveness probe.
  const PUBLIC_ROUTES = new Set([
    'POST /auth/login',
    'POST /auth/register',
    'GET /health',
  ]);

  interface RouteInfo {
    method: string;
    path: string;
    middlewares: unknown[];
  }

  function collectRoutes(stack: unknown[], prefix: string, inherited: unknown[] = []): RouteInfo[] {
    const routes: RouteInfo[] = [];
    const pending: unknown[] = [...inherited];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const layer of stack as any[]) {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).filter(
          (m) => layer.route.methods[m],
        );
        for (const method of methods) {
          routes.push({
            method: method.toUpperCase(),
            path:
              (prefix + (layer.route.path === '/' ? '' : layer.route.path)) || '/',
            middlewares: [
              ...pending,
              ...layer.route.stack.map((s: { handle: unknown }) => s.handle),
            ],
          });
        }
      } else if (layer.handle?.stack) {
        // Mounted sub-router: recover its mount path from the layer regexp.
        const source: string = layer.regexp?.source ?? '';
        const match = source.match(/\^\\\/([^\\/?]*)/);
        const mount = match?.[1] ? `/${match[1]}` : '';
        routes.push(...collectRoutes(layer.handle.stack, prefix + mount, pending));
      } else {
        pending.push(layer.handle);
      }
    }
    return routes;
  }

  it('every registered route except login/register passes through requireAuth', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rootStack = (app as any)._router?.stack ?? (app as any).router?.stack;
    expect(Array.isArray(rootStack)).toBe(true);

    const routes = collectRoutes(rootStack, '');
    expect(routes.length).toBeGreaterThan(0);

    const unprotected = routes
      .filter((r) => !PUBLIC_ROUTES.has(`${r.method} ${r.path}`))
      .filter((r) => !r.middlewares.includes(requireAuth))
      .map((r) => `${r.method} ${r.path}`);

    expect(unprotected).toEqual([]);
  });
});
