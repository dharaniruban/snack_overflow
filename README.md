# Snack Overflow

An office pantry tracker: members vote for snacks, log what they ate, and admins keep the shelves honest. Built as a full-stack hiring assignment with correctness under concurrency, data integrity, security, and a clean API contract as first-class concerns.

- **Backend:** Node.js + Express + TypeScript (strict), `pg` with plain parameterized SQL, Zod validation, JWT + bcrypt auth.
- **Frontend:** React + TypeScript + Vite, React Router, TanStack Query, Tailwind CSS.
- **Database:** PostgreSQL 16.

## Quick start

### Option A — Docker Compose (recommended, < 5 minutes)

```bash
docker compose up --build
```

Then open <http://localhost:5173>.

- Frontend (nginx): `http://localhost:5173`
- Backend API: `http://localhost:4000` (`/health` returns `{ "ok": true }`)
- Postgres: `localhost:5432` (`postgres` / `postgres`)

The backend container runs `migrate` and `seed` automatically on every start; both are idempotent.

### Option B — Manual

You need Node.js 22+ and a PostgreSQL 16 instance.

```bash
# 1. Database
createdb snack_overflow
createdb snack_overflow_test   # used by the test suite

# 2. Backend
cd backend
cp .env.example .env           # fill in DATABASE_URL and JWT_SECRET
npm ci
npm run migrate
npm run seed
npm run dev                    # http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env           # VITE_API_URL can stay empty; the Vite dev
npm ci                         # server proxies /auth, /snacks, /activity, /events
npm run dev                    # http://localhost:5173
```

## Demo credentials

| Email            | Password     | Role   |
| ---------------- | ------------ | ------ |
| `admin@bpf.com`  | `Admin@123`  | admin  |
| `member@bpf.com` | `Member@123` | member |

New members can self-register via `POST /auth/register` (always created as `member`).

## Environment variables

### `backend/.env`

| Variable            | Required | Default                 | Notes                                                             |
| ------------------- | -------- | ----------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`      | yes      | —                       | e.g. `postgres://postgres:postgres@localhost:5432/snack_overflow` |
| `TEST_DATABASE_URL` | no       | —                       | Separate DB for Vitest                                            |
| `JWT_SECRET`        | yes      | —                       | ≥16 chars; never commit a real one                                |
| `JWT_EXPIRES_IN`    | no       | `1h`                    | Short-lived tokens                                                |
| `CORS_ORIGIN`       | no       | `http://localhost:5173` | Comma-separated allowlist                                         |
| `PORT`              | no       | `4000`                  |                                                                   |
| `DB_POOL_MAX`       | no       | `10`                    |                                                                   |
| `BCRYPT_COST`       | no       | `12`                    |                                                                   |

### `frontend/.env`

| Variable       | Required | Notes                                                          |
| -------------- | -------- | -------------------------------------------------------------- |
| `VITE_API_URL` | no       | Leave empty for same-origin (Vite proxy in dev, nginx in prod) |

## API reference

All responses are JSON. Errors share one envelope:

```json
{ "error": { "code": "INSUFFICIENT_STOCK", "message": "Someone beat you to it." } }
```

| Code                 | HTTP | Meaning                                                 |
| -------------------- | ---- | ------------------------------------------------------- |
| `VALIDATION_ERROR`   | 400  | Zod/body/param/query failure                            |
| `UNAUTHENTICATED`    | 401  | Missing/invalid/expired JWT                             |
| `FORBIDDEN`          | 403  | Valid user, insufficient role                           |
| `NOT_FOUND`          | 404  | Unknown route or resource                               |
| `INSUFFICIENT_STOCK` | 409  | Consume would drive quantity below zero                 |
| `ALREADY_VOTED`      | 409  | Duplicate vote                                          |
| `DUPLICATE_NAME`     | 409  | Snack name (or email) already exists case-insensitively |
| `RATE_LIMITED`       | 429  | Login/register rate limit hit                           |
| `INTERNAL_ERROR`     | 500  | Generic; never leaks SQL or stack traces                |

Success codes: `200` reads/updates/actions, `201` creates, `204` deletes.

### Auth

```bash
# Login (public, rate-limited)
curl -X POST localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"member@bpf.com","password":"Member@123"}'
# -> { "token": "...", "user": { "id", "name", "email", "role" } }

# Register (public; role is always 'member')
curl -X POST localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"New Person","email":"new@example.com","password":"password123"}'
# -> 201 user object

# Current user
curl localhost:4000/auth/me -H "Authorization: Bearer $TOKEN"
```

### Snacks

Every snack object includes derived `status` (`stocked` | `running_low` | `gone`), `voteCount`, and `hasVoted` for the caller.

```bash
# List (paginated, filterable, sortable)
curl 'localhost:4000/snacks?category=savoury&status=running_low&q=peanut&page=1&pageSize=10&sort=votes&order=desc' \
  -H "Authorization: Bearer $TOKEN"
# -> { "data": [ ... ], "pagination": { "page":1, "pageSize":10, "total":3, "totalPages":1 } }

# Summary (counts + Snack of the Week)
curl localhost:4000/snacks/summary -H "Authorization: Bearer $TOKEN"

# Detail
curl localhost:4000/snacks/$ID -H "Authorization: Bearer $TOKEN"

# Create (admin)
curl -X POST localhost:4000/snacks -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Bhelpuri","category":"savoury","quantity":12,"lowStockThreshold":4}'

# Partial update (admin)
curl -X PATCH localhost:4000/snacks/$ID -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' -d '{"quantity":3}'

# Delete (admin) -> 204
curl -X DELETE localhost:4000/snacks/$ID -H "Authorization: Bearer $ADMIN"

# Consume (member) — Idempotency-Key header supported
curl -X POST localhost:4000/snacks/$ID/consume -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -H 'Idempotency-Key: order-123' \
  -d '{"amount":2}'

# Restock (admin)
curl -X POST localhost:4000/snacks/$ID/restock -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' -d '{"amount":10}'

# Vote / unvote (member)
curl -X POST localhost:4000/snacks/$ID/vote -H "Authorization: Bearer $TOKEN"
curl -X DELETE localhost:4000/snacks/$ID/vote -H "Authorization: Bearer $TOKEN"   # -> 204
```

### Activity (admin)

```bash
curl 'localhost:4000/activity?page=1&pageSize=20' -H "Authorization: Bearer $ADMIN"
# -> { "data": [{ "snackName", "action", "amount", "quantityBefore", "quantityAfter", "userName", "userEmail", "createdAt" }], "pagination": {...} }
```

### Realtime (SSE)

`GET /events` streams `snack` events after any consume/restock/vote/CRUD change. `EventSource` cannot send headers, so the endpoint also accepts `?token=<jwt>`.

## Schema

See `backend/migrations/001_init.sql` and `002_idempotency.sql`.

- `users` — UUID PK, `lower(email)` unique index, `role CHECK IN ('admin','member')`.
- `snacks` — UUID PK, `lower(name)` unique index, `category` and `quantity`/`low_stock_threshold` CHECK constraints.
- `votes` — composite `PRIMARY KEY (user_id, snack_id)`; this is what makes one-vote-per-person race-safe.
- `activity` — append-only audit log; `snack_id` is `ON DELETE SET NULL` and `snack_name` is a snapshot so history survives snack deletion.
- `idempotency_keys` — stores consume responses keyed by `(user_id, snack_id, idempotency_key)`.

Status is **derived in SQL**, never stored:

```sql
CASE
  WHEN quantity = 0 THEN 'gone'
  WHEN quantity <= low_stock_threshold THEN 'running_low'
  ELSE 'stocked'
END
```

## How concurrency is handled

`consume` is a single atomic statement inside a transaction:

```sql
UPDATE snacks
SET quantity = quantity - $2, updated_at = now()
WHERE id = $1 AND quantity >= $2
RETURNING ...
```

Under READ COMMITTED, Postgres takes a row lock for the `UPDATE` and re-evaluates the `WHERE` against the latest committed row after any competing transaction commits. Ten parallel consumes of a snack with `quantity = 3` therefore produce exactly three `200`s and seven `409`s — the `quantity >= $2` predicate is the lock, not application code. The `activity` insert runs on the same client inside `withTransaction`, so stock and audit commit or roll back together. The `CHECK (quantity >= 0)` constraint is a second safety net. `restock` mirrors this with `quantity + $2`. Votes use `INSERT ... ON CONFLICT DO NOTHING RETURNING` against the composite PK — zero rows means `ALREADY_VOTED`.

## Authorization

There are exactly two roles: `admin` and `member`. Admin is a **superset** of member — admins are also pantry users, so they can consume and vote like members.

| Capability | Endpoint | Member | Admin |
| --- | --- | --- | --- |
| Log in | `POST /auth/login` | yes | yes |
| View snack list (filter, search, paginate) | `GET /snacks` | yes | yes |
| View one snack | `GET /snacks/:id` | yes | yes |
| View dashboard summary + Snack of the Week | `GET /snacks/summary` | yes | yes |
| Consume a snack | `POST /snacks/:id/consume` | yes | yes |
| Vote / unvote | `POST`, `DELETE /snacks/:id/vote` | yes | yes |
| Add a snack | `POST /snacks` | **403** | yes |
| Edit a snack | `PATCH /snacks/:id` | **403** | yes |
| Delete a snack | `DELETE /snacks/:id` | **403** | yes |
| Restock a snack | `POST /snacks/:id/restock` | **403** | yes |
| View activity log | `GET /activity` | **403** | yes |

### How it is enforced

- `requireAuth` (`src/middleware/auth.ts`) verifies the JWT and **re-reads the user from the DB**, attaching `req.user = { id, name, email, role }`. Missing/malformed/expired tokens get `401 UNAUTHENTICATED`.
- `requireRole(...roles)` runs after `requireAuth` and returns `403 FORBIDDEN` with the same body (`"You don't have permission to do that."`) for every forbidden case. It never leaks which role would have been allowed.
- Order on every protected route: **authenticate (401) → authorize role (403) → validate input (400) → business logic (404/409)**. A member sending an invalid body to an admin route gets 403, not 400. The role comes only from the verified token + DB row — never from the request body, query, or headers.
- **Default deny:** every router declares its access per route (visible at a glance in `src/modules/*/routes.ts`). `tests/rbac.test.ts` walks the Express router stack and fails if any route lacks `requireAuth` (except `POST /auth/login`, `POST /auth/register`, and the `GET /health` probe). `GET /events` (SSE) bridges `?token=` into the Authorization header so it uses the same middleware — `EventSource` cannot set headers.
- `POST /auth/register` always creates `role = 'member'`; the strict schema rejects a `role` field in the body, so self-promotion is impossible. Admin accounts come only from `scripts/seed.ts`.
- The login response returns `{ token, user: { id, name, email, role } }` — never `password_hash`.
- **401 vs 403:** 401 means "I don't know who you are" (bad/missing/expired token); 403 means "I know who you are, but not allowed". The frontend clears the session on 401 and shows a toast + refetches `/auth/me` on 403.

### JWT claim vs DB lookup trade-off

`requireAuth` trusts the JWT only for *identity* (`sub`); the role is re-read from the database on every request. This costs one indexed `SELECT` per request but means a demoted admin or deleted user loses access immediately instead of waiting for token expiry — the alternative (trusting `role` in the JWT) makes revocation impossible until TTL. At scale this becomes the first auth bottleneck: mitigate with a short-TTL role cache (e.g. 30–60s) or a `token_version` column checked alongside the user row.

Passwords are bcrypt-hashed (cost 12); `password_hash` is never selected into responses or logs. Unknown-email logins run a dummy bcrypt compare to reduce timing leaks, and wrong-email/wrong-password return the identical error.

## Tests

```bash
cd backend
npm test
```

Requires `TEST_DATABASE_URL` (or `DATABASE_URL`) pointing at a **separate** Postgres database; `tests/env.ts` defaults to `snack_overflow_test`. Migrations run automatically; tables are truncated before each test. `vitest.config.ts` sets `fileParallelism: false` because all files share one DB.

Covered: auth (no token 401, member→admin 403, wrong password 401, no hash leakage, register cannot self-promote), the full RBAC matrix (table-driven: no token → 401, tampered/expired/wrong-secret token → 401, member → 403 with the database provably unchanged, admin → success; members and admins can consume/vote; invalid body on an admin route → 403 not 400; DB role demotion takes effect on the next request; router-stack walk asserting default-deny), validation (bad amounts, unknown category, duplicate names), filtering/search/pagination, status boundaries (0 / 1 / threshold / threshold+1), atomic consume+activity, restock, votes, summary, idempotent consume retries, sorting allowlist, and the required concurrency cases (10 parallel consumes, 10 parallel votes).

## Design note

### Key decisions and trade-offs

- **Raw SQL over ORM:** the atomic `UPDATE ... WHERE quantity >= $n` and `ON CONFLICT` statements are the correctness core; keeping them visible in repositories makes concurrency auditable. The cost is manual mapping and dynamic `SET` clauses for PATCH (handled with an allowlist of column names — never user input).
- **JWT in `Authorization` header vs httpOnly cookie:** we chose the header. Cookies would give CSRF exposure and require SameSite/CSRF-token machinery; header tokens are simpler for a JSON API + SPA on the same origin. XSS can still steal a token from `localStorage`, mitigated by short expiry (1h) and the fact that roles are re-read from the DB per request. For a higher-security deployment, move to httpOnly cookies + CSRF tokens.
- **Offset pagination vs keyset:** we use `LIMIT/OFFSET` for simplicity and stable `page/pageSize/total` envelopes. At depth this degrades (`OFFSET 100000` scans); keyset pagination on `(created_at, id)` is the documented upgrade path.
- **In-memory rate limiter:** `express-rate-limit` is per-process. Fine for one instance; behind multiple replicas it needs a shared store (Redis) to be accurate.
- **Derived status:** computed in SQL so filters/pagination stay correct and there is no drift between `quantity` and a stored flag.

### What breaks first at 100x

1. **Hot-row contention:** a viral snack's `UPDATE` serializes on one row lock — throughput caps at ~1 txn/row-lock-time. Mitigate with per-snack sharding or accepting queued consumption.
2. **Summary aggregation:** `getSummary` scans `snacks`/`votes` per request. Add a materialized view or cached counts refreshed on write/SSE.
3. **Offset pagination** on large tables — switch to keyset.
4. **In-memory rate limiting** — move to Redis.
5. **JWT revocation:** stateless tokens can't be revoked before expiry; add a `token_version`/denylist or shorten TTL + refresh flow.
6. **SSE connection limits:** one TCP connection per client per instance; scale via Redis pub/sub fan-out or a dedicated realtime tier.
7. **Per-request role lookup:** `requireAuth` does one indexed `users` SELECT per request — cheap now, but at high RPS it dominates DB load. Mitigate with a short-TTL role cache or a `token_version` column; do **not** move the role back into the JWT, or demotions stop taking effect until token expiry.

## Assumptions

- Self-registration always creates `member`; admins are provisioned via seed/migration only.
- `Idempotency-Key` is scoped per `(user, snack)`; reusing a key with a different `amount` returns `400`.
- Pagination `totalPages` is `0` when there are no results.
- SSE is single-instance (in-process emitter); multi-instance needs a broker.
- Activity `user_id`/`votes.user_id` use `ON DELETE CASCADE`; snack deletion preserves activity via `snack_name` snapshot + `SET NULL`.

## Repository layout

```
backend/src/{config,db,middleware,modules/{auth,snacks,votes,activity,events,idempotency},utils,types}
backend/migrations/*.sql
backend/scripts/{migrate,seed}.ts
backend/tests/
frontend/src/{api,components,pages,hooks,lib}
docker-compose.yml, docker/postgres/init/
.github/workflows/ci.yml
```

See `CODE_TOUR.md` for a guided walkthrough of the consume transaction and the rest of the core.
