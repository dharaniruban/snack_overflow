# Snack Overflow

An office pantry tracker. Members browse the pantry, grab snacks, and vote for
what should be restocked; admins manage inventory and audit every stock change.
Built as a full-stack engineering assignment where **correctness under
concurrency, data integrity, security, and a strict API contract** are the
primary design goals — not just features.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture — what does what](#architecture--what-does-what)
- [Quick start](#quick-start)
- [Demo credentials](#demo-credentials)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Database schema](#database-schema)
- [How concurrency is handled](#how-concurrency-is-handled)
- [How authorization works](#how-authorization-works)
- [Realtime updates (SSE)](#realtime-updates-sse)
- [Frontend overview](#frontend-overview)
- [Running the tests](#running-the-tests)
- [Design note — trade-offs and what breaks at 100x](#design-note--trade-offs-and-what-breaks-at-100x)
- [Assumptions](#assumptions)
- [Repository layout](#repository-layout)

---

## Features

- **Pantry inventory** — snacks with category, quantity, and a low-stock
  threshold. Status (`stocked` / `running_low` / `gone`) is *derived*, never
  stored, so it can never drift out of sync.
- **Consume** — any member takes N packets. Race-safe: ten people grabbing the
  last three packets produce exactly three successes.
- **Restock** — admins add stock back.
- **Voting** — one vote per user per snack; powers "Snack of the Week".
- **Activity log** — admin-only audit trail of every consume/restock with
  before/after quantities. Survives snack deletion via a name snapshot.
- **Idempotent consume** — optional `Idempotency-Key` header makes retries safe.
- **Realtime** — Server-Sent Events push every stock/vote change to all clients.
- **Role-aware UI** — members never see admin controls in the DOM; admins get
  add/edit/delete/restock plus the activity page.
- **Offline preview mode** — with no session token, the UI runs a self-contained
  demo pantry in `localStorage` (guest preview only; logged-in users always talk
  to the real API and see real errors).

## Tech stack

| Layer    | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| Backend  | Node.js 22+, TypeScript (strict), Express 4                       |
| Data     | PostgreSQL 16, `pg` driver, plain parameterized SQL (no ORM)     |
| Validation | Zod 4 (strict schemas, `.strict()` rejects unknown keys)        |
| Auth     | JWT (`jsonwebtoken`) + bcrypt password hashing                   |
| Security | helmet, CORS allowlist, `express-rate-limit`, 100kb body limit   |
| Realtime | Server-Sent Events (native `EventEmitter` pub/sub)               |
| Frontend | React 19, TypeScript, Vite 8, React Router 7, TanStack Query 5   |
| Styling  | Tailwind CSS 4, Motion (animations), lucide-react icons          |
| Tests    | Vitest + Supertest against a real Postgres database              |
| Ops      | Docker Compose (postgres + backend + nginx-served frontend), CI  |

## Architecture — what does what

```
browser ──HTTPS──> nginx (frontend container, port 5173)
                      ├── static SPA (React build)
                      └── /api/* ──proxy──> Express API (port 4000)
                                              ├── /auth      login, register, me
                                              ├── /snacks    CRUD, list/summary, consume, restock, vote
                                              ├── /activity  admin audit log
                                              └── /events    SSE stream
                                                        │
                                              PostgreSQL 16
                                              (users, snacks, votes, activity, idempotency_keys)
```

### Backend (`backend/src`)

Express app built by `createApp()` in `app.ts`. Every router is mounted under a
path prefix and uses `requireAuth` → `requireRole(...)` → `validate(...)` →
controller → service → repository.

| File / module | Responsibility |
| ------------- | -------------- |
| `config/env.ts` | Zod-validated env config; **fails fast** if `DATABASE_URL`/`JWT_SECRET` missing or invalid |
| `db/pool.ts` | `pg.Pool` singleton + `withTransaction()` helper (BEGIN/COMMIT/ROLLBACK, always releases client) |
| `db/migrate.ts` | Applies `migrations/*.sql` idempotently on boot |
| `middleware/auth.ts` | `requireAuth` verifies JWT **and re-reads the user from the DB** (role never trusted from token claims alone); `requireRole` enforces admin/member |
| `middleware/validate.ts` | Runs Zod schemas over `body`/`params`/`query`; failures → `400 VALIDATION_ERROR` |
| `middleware/errorHandler.ts` | Single error envelope `{error:{code,message}}`; maps malformed JSON → 400, everything else → generic 500 (never leaks SQL/stack) |
| `middleware/authUser.ts` | Typed accessor for the authenticated `req.user` |
| `modules/auth/` | Login (rate-limited, dummy bcrypt compare for unknown emails), register (always `member`), `/me` |
| `modules/snacks/` | Snack CRUD, filtered/sorted/paginated list, summary + Snack of the Week, atomic consume/restock |
| `modules/votes/` | Vote/unvote via `INSERT … ON CONFLICT DO NOTHING` against composite PK |
| `modules/activity/` | Admin-only paginated audit feed |
| `modules/events/` | SSE endpoint; bridges `?token=` into the Authorization header because `EventSource` can't set headers |
| `modules/idempotency/` | Stores consume responses keyed by `(user_id, snack_id, key)` |
| `utils/errors.ts` | `AppError` with code→HTTP-status map (the single source of truth for the API contract) |
| `utils/events.ts` | In-process `EventEmitter` pub/sub feeding SSE (single-instance only) |
| `utils/like.ts` | Escapes `%`, `_`, `\` for safe `ILIKE` search |

Route order in `snacks/routes.ts` is deliberate: `/summary` is registered before
`/:id` so it isn't parsed as an id, and `requireRole('admin')` sits **before**
body validation so members get 403 (not 400) on admin routes.

### Frontend (`frontend/src`)

| Area | Responsibility |
| ---- | -------------- |
| `lib/api.ts` | Typed fetch client: attaches Bearer token, parses the error envelope, dispatches `unauthorized`/`forbidden` window events, generates `Idempotency-Key`s. Guest (no token) calls fall back to the local demo pantry |
| `lib/pantryStore.ts` | localStorage-backed demo pantry for the unauthenticated preview mode |
| `context/AuthContext.tsx` | Session state; restores `/auth/me` on reload; clears session on 401; refreshes role on 403 |
| `context/ToastContext.tsx` | Toast notifications (success/error/warning/info, `aria-live`) |
| `context/ThemeContext.tsx` | Dark/light theme, persisted |
| `hooks/useSnacksQuery.ts` | TanStack Query keys + list/summary/activity queries |
| `hooks/useSnackMutations.ts` | consume/restock/vote/CRUD mutations with optimistic vote updates and rollback on error |
| `hooks/useSnackEvents.ts` | Opens the SSE stream and invalidates queries on `snack` events |
| `hooks/useDebounce.ts` | 260ms debounced search input |
| `components/` | `AppLayout` (nav, role badge, theme toggle), `PantryMenuSection` (filters/search/sort/pagination + modals), `SnackCard`/`SnackTable` (two view modes), `SnackStatusBadge` (icon + label, not color alone), `StockFuelGauge`, `SnackModals` (create/edit/restock/delete-with-confirm) |
| `pages/` | `DashboardPage` (stock health + Snack of the Week), `SnacksPage` (**all filters live in the URL** — shareable/reload-safe), `ActivityPage` (admin), `LoginPage` (sign in / register / guest preview roles) |
| `App.tsx` | Route guards: `RequireAuth`, `GuestOnly`, `RequireAdmin` |

URL-synced filters (`?q=…&category=…&status=…&sort=…&page=…`) mean filtered views
survive reloads and can be shared as links.

## Quick start

### Option A — Docker Compose (recommended)

```bash
docker compose up --build
```

Then open <http://localhost:5173>. Services:

- **Frontend** (nginx serving the React build + `/api` proxy): `http://localhost:5173`
- **Backend API**: `http://localhost:4000` (`GET /health` → `{ "ok": true }`)
- **Postgres 16**: `localhost:5432` (`postgres` / `postgres`, db `snack_overflow`)

The backend container runs `migrate` and `seed` on every start; both are
idempotent. Set `JWT_SECRET` in your shell env before `up` for anything beyond
local dev (a dev-only default is baked into compose).

### Option B — Manual

Requires Node.js 22+ and PostgreSQL 16.

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
cp .env.example .env           # VITE_API_URL=/api works via the Vite dev proxy
npm ci
npm run dev                    # http://localhost:5173
```

## Demo credentials

| Email            | Password     | Role   |
| ---------------- | ------------ | ------ |
| `admin@bpf.com`  | `Admin@123`  | admin  |
| `member@bpf.com` | `Member@123` | member |

Seeded via `backend/scripts/seed.ts` (idempotent). Anyone can self-register via
`POST /auth/register` — always created as `member`.

## Environment variables

### `backend/.env`

| Variable            | Required | Default                 | Notes                                                             |
| ------------------- | -------- | ----------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`      | yes      | —                       | e.g. `postgres://postgres:postgres@localhost:5432/snack_overflow` |
| `TEST_DATABASE_URL` | no       | —                       | Separate DB for Vitest                                            |
| `JWT_SECRET`        | yes      | —                       | ≥16 chars; server refuses to boot without it                      |
| `JWT_EXPIRES_IN`    | no       | `1h`                    | Short-lived tokens                                                |
| `CORS_ORIGIN`       | no       | `http://localhost:5173` | Comma-separated allowlist (never `*`)                             |
| `PORT`              | no       | `4000`                  |                                                                   |
| `DB_POOL_MAX`       | no       | `10`                    |                                                                   |
| `BCRYPT_COST`       | no       | `12`                    |                                                                   |

### `frontend/.env`

| Variable       | Required | Notes                                                          |
| -------------- | -------- | -------------------------------------------------------------- |
| `VITE_API_URL` | no       | `/api` (default) works in dev via the Vite proxy and in prod via nginx; or set an absolute URL like `http://localhost:4000` |

## API reference

All responses are JSON. **Every** error — unknown routes, malformed JSON,
validation failures, and unexpected exceptions — uses one envelope:

```json
{ "error": { "code": "INSUFFICIENT_STOCK", "message": "Someone beat you to it." } }
```

| Code                 | HTTP | Meaning                                                   |
| -------------------- | ---- | --------------------------------------------------------- |
| `VALIDATION_ERROR`   | 400  | Zod/body/param/query failure, malformed JSON, bad id     |
| `UNAUTHENTICATED`    | 401  | Missing/invalid/expired JWT                               |
| `FORBIDDEN`          | 403  | Valid user, insufficient role                             |
| `NOT_FOUND`          | 404  | Unknown route or resource                                 |
| `INSUFFICIENT_STOCK` | 409  | Consume would drive quantity below zero                   |
| `ALREADY_VOTED`      | 409  | Duplicate vote                                            |
| `DUPLICATE_NAME`     | 409  | Snack name (or email) already exists case-insensitively   |
| `RATE_LIMITED`       | 429  | Login/register rate limit (20 per 15 min per IP)          |
| `INTERNAL_ERROR`     | 500  | Generic; never leaks SQL or stack traces                  |

Success codes: `200` reads/updates/actions, `201` creates, `204` deletes.

### Auth

```bash
# Login (public, rate-limited)
curl -X POST localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"member@bpf.com","password":"Member@123"}'
# -> { "token": "...", "user": { "id", "name", "email", "role" } }

# Register (public; a "role" field in the body is rejected with 400)
curl -X POST localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"New Person","email":"new@example.com","password":"password123"}'
# -> 201 user object

# Current user — returns the user object directly (no wrapper)
curl localhost:4000/auth/me -H "Authorization: Bearer $TOKEN"
```

### Snacks

Every snack object includes derived `status` (`stocked` | `running_low` | `gone`),
`voteCount`, and `hasVoted` for the caller.

```bash
# List (paginated, filterable, sortable — sort keys are allowlisted)
curl 'localhost:4000/snacks?category=savoury&status=running_low&q=peanut&page=1&pageSize=10&sort=votes&order=desc' \
  -H "Authorization: Bearer $TOKEN"
# -> { "data": [ ... ], "pagination": { "page":1, "pageSize":10, "total":3, "totalPages":1 } }

# Summary (status counts + Snack of the Week, null when no votes)
curl localhost:4000/snacks/summary -H "Authorization: Bearer $TOKEN"

# Detail
curl localhost:4000/snacks/$ID -H "Authorization: Bearer $TOKEN"

# Create (admin) -> 201
curl -X POST localhost:4000/snacks -H "Authorization: Bearer $ADMIN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Bhelpuri","category":"savoury","quantity":12,"lowStockThreshold":4}'

# Partial update (admin); empty body -> 400
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

Categories: `sweet` | `savoury` | `drink` | `healthy-ish`.
Stock integers are capped at 1e9 so `quantity + amount` can never overflow the
`INTEGER` columns.

### Activity (admin)

```bash
curl 'localhost:4000/activity?page=1&pageSize=20' -H "Authorization: Bearer $ADMIN"
# -> { "data": [{ "snackName", "action", "amount", "quantityBefore",
#                 "quantityAfter", "userName", "userEmail", "createdAt" }],
#      "pagination": {...} }
```

### Realtime (SSE)

`GET /events` streams `snack` events (`created|updated|deleted|consumed|
restocked|voted|unvoted`) after any mutation. `EventSource` cannot send headers,
so the endpoint also accepts `?token=<jwt>` and bridges it into `Authorization`.

## Database schema

See `backend/migrations/001_init.sql` and `002_idempotency.sql`.

- **`users`** — UUID PK, `lower(email)` unique index, `role CHECK IN
  ('admin','member')`, `password_hash` (bcrypt).
- **`snacks`** — UUID PK, `lower(name)` unique index (case-insensitive duplicate
  names rejected with `DUPLICATE_NAME`), `category` CHECK, `quantity >= 0` and
  `low_stock_threshold >= 0` CHECK constraints.
- **`votes`** — composite `PRIMARY KEY (user_id, snack_id)`; this is what makes
  one-vote-per-person race-safe. `ON DELETE CASCADE` on both FKs.
- **`activity`** — append-only audit log; `snack_id` is `ON DELETE SET NULL` and
  `snack_name` is a snapshot, so history survives snack deletion.
- **`idempotency_keys`** — stores consume responses keyed by
  `(user_id, snack_id, idempotency_key)`; reusing a key with a different `amount`
  → `400`.

Status is **derived in SQL**, never stored:

```sql
CASE
  WHEN quantity = 0 THEN 'gone'
  WHEN quantity <= low_stock_threshold THEN 'running_low'
  ELSE 'stocked'
END
```

## How concurrency is handled

`consume` is a **single atomic statement** inside a transaction:

```sql
UPDATE snacks
SET quantity = quantity - $2, updated_at = now()
WHERE id = $1 AND quantity >= $2
RETURNING ...
```

Under READ COMMITTED, Postgres takes a row lock for the `UPDATE` and re-evaluates
the `WHERE` against the latest committed row after any competing transaction
commits. Ten parallel consumes against `quantity = 3` therefore produce exactly
three `200`s and seven `409 INSUFFICIENT_STOCK`s — the `quantity >= $2` predicate
*is* the lock; there is no read-then-write and no application-level mutex. The
`activity` insert runs on the same client inside `withTransaction`, so stock and
audit commit or roll back together (verified by forcing an insert failure). The
`CHECK (quantity >= 0)` constraint is a second safety net — a direct SQL
`UPDATE … SET quantity = -1` is rejected by the database itself. `restock`
mirrors this with `quantity + $2`. Votes use `INSERT … ON CONFLICT DO NOTHING
RETURNING` against the composite PK — zero returned rows means `ALREADY_VOTED`.

## How authorization works

Two roles: `admin` and `member`. Admin is a **superset** — admins are also pantry
users and can consume/vote like members.

| Capability | Endpoint | Member | Admin |
| ---------- | -------- | ------ | ----- |
| Log in / register / me | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` | yes | yes |
| List / detail / summary | `GET /snacks`, `GET /snacks/:id`, `GET /snacks/summary` | yes | yes |
| Consume | `POST /snacks/:id/consume` | yes | yes |
| Vote / unvote | `POST`, `DELETE /snacks/:id/vote` | yes | yes |
| Realtime stream | `GET /events` | yes | yes |
| Add snack | `POST /snacks` | **403** | yes |
| Edit snack | `PATCH /snacks/:id` | **403** | yes |
| Delete snack | `DELETE /snacks/:id` | **403** | yes |
| Restock | `POST /snacks/:id/restock` | **403** | yes |
| Activity log | `GET /activity` | **403** | yes |

Enforcement details:

- `requireAuth` verifies the JWT signature **and re-reads the user row from the
  DB on every request**, attaching `req.user`. Role comes only from the DB —
  demoting an admin revokes access on the very next request, and a deleted user
  is cut off immediately.
- `requireRole('admin')` runs after auth and before validation → members get
  `403 FORBIDDEN` even with an invalid body (order: authenticate → authorize →
  validate → business logic).
- **Default deny:** every router declares access per route;
  `tests/rbac.test.ts` walks the Express router stack and fails if any route
  lacks `requireAuth` (except login/register/health).
- `POST /auth/register` uses a `.strict()` schema — a `role` field is rejected
  with 400, so self-promotion is impossible.
- Passwords are bcrypt-hashed; `password_hash` never appears in responses or
  logs. Unknown-email logins run a dummy bcrypt compare and return the identical
  error as wrong-password (no user enumeration). Login/register are rate-limited
  (20/15min/IP).
- Frontend clears the session on 401 and refreshes `/auth/me` on 403.

## Realtime updates (SSE)

Any mutation emits a `snack` event on an in-process `EventEmitter`; connected
`EventSource` clients receive it and invalidate their TanStack Query caches, so
all open tabs converge to the true quantity — this is also what makes the
"someone beat you to the last packet" flow self-correcting.

## Frontend overview

- **Routing/guards** — `RequireAuth` (redirects to `/login`), `GuestOnly`,
  `RequireAdmin` (toast + redirect for members).
- **Data layer** — TanStack Query with `keepPreviousData` for smooth pagination;
  mutations invalidate `['snacks']`/`['activity']` on settle; votes update
  optimistically with snapshot rollback on error.
- **Consume safety** — each consume gets a fresh `Idempotency-Key`; buttons are
  disabled while the mutation is in flight (`isPending` → "Grabbing…").
- **Error UX** — skeleton loaders, empty states with imagery, error cards with a
  Retry button, toasts for every failure mode including the friendly
  `INSUFFICIENT_STOCK` message.
- **Accessibility** — labelled inputs, `aria-live` toast region, focus-visible
  rings, `prefers-reduced-motion` respected.
- **Guest preview** — with no token, all API calls route to `localPantryStore`
  (localStorage) so the UI is explorable offline; the moment a session exists,
  real API errors surface normally.

## Running the tests

```bash
cd backend
npm test
```

Requires `TEST_DATABASE_URL` (or `DATABASE_URL`) pointing at a **separate**
Postgres database — `tests/env.ts` defaults to `snack_overflow_test`. Migrations
run automatically before the suite and every table is truncated before each
test; `vitest.config.ts` sets `fileParallelism: false` because all files share
one DB.

Coverage includes: auth (no token → 401, member → 403 with DB provably
unchanged, tampered/expired/wrong-secret → 401, identical wrong-email/password
errors, no hash leakage, register can't self-promote, `/auth/me` contract), the
full RBAC matrix plus a router-stack default-deny walk, validation edge cases
(including oversized ints), filtering/search/pagination, status boundaries,
atomic consume+activity, restock, idempotent retries, votes, summary, sort
allowlist, and the concurrency cases (parallel consumes of equal/varied amounts,
parallel votes).

## Design note — trade-offs and what breaks at 100x

### Key decisions

- **Raw SQL over ORM** — the atomic `UPDATE … WHERE quantity >= $n` and
  `ON CONFLICT` statements *are* the correctness core; keeping them visible in
  repositories makes concurrency auditable. Cost: manual column mapping (PATCH
  uses an allowlisted column map — never user input).
- **JWT in `Authorization` header vs httpOnly cookie** — chose the header:
  simpler for a JSON API + SPA, no CSRF machinery. Trade-off: tokens in
  `localStorage` are XSS-readable; mitigated by 1h expiry and DB-side role
  checks. Higher-security deployments should move to httpOnly cookies + CSRF
  tokens.
- **Role re-read from DB per request** — costs one indexed `SELECT` per call but
  makes revocation instant. The alternative (role in JWT) can't demote users
  until expiry.
- **Offset pagination** — simple, stable `page/pageSize/total` envelope.
  `OFFSET 100000` degrades at depth; keyset pagination on `(created_at, id)` is
  the upgrade path.
- **In-memory rate limiter + SSE emitter** — correct for a single instance;
  multi-replica deployments need Redis (rate-limit store, pub/sub fan-out).
- **Derived status in SQL** — no drift between `quantity` and a stored flag;
  filters and pagination stay server-side and consistent.

### What breaks first at 100x users

1. **Hot-row contention** — a viral snack's `UPDATE` serializes on one row
   lock; throughput caps at ~1 txn/row-lock-time.
2. **Summary aggregation** — `getSummary` scans tables per request; move to a
   materialized view or cached counts.
3. **Offset pagination** on large tables → keyset.
4. **In-memory rate limiting** → shared store.
5. **JWT revocation** — stateless tokens can't be revoked pre-expiry; add
   `token_version` or shorten TTL + refresh.
6. **SSE connections** — one TCP conn per client per instance; needs a broker.
7. **Per-request role lookup** — cheap now, dominates DB load at high RPS;
   short-TTL cache, *not* JWT claims.

## Assumptions

- Self-registration always creates `member`; admins come from seed/migration.
- `Idempotency-Key` is scoped per `(user, snack)`; reuse with a different
  `amount` → 400.
- `totalPages` is 0 when there are no results; `page` beyond the end returns an
  empty list, not an error.
- SSE is single-instance; multi-instance needs a broker.
- Activity `user_id`/votes use `ON DELETE CASCADE`; snack deletion preserves
  activity via `snack_name` snapshot + `SET NULL`.

## Repository layout

```
.github/workflows/ci.yml     # lint, typecheck, tests (real PG), frontend build
docker-compose.yml           # db + backend + frontend(nginx)
docker/postgres/init/        # creates snack_overflow_test for CI/tests
backend/
  migrations/*.sql           # schema (001_init, 002_idempotency)
  scripts/{migrate,seed}.ts
  src/{config,db,middleware,modules,utils,types}
  tests/                     # vitest + supertest
frontend/
  src/{components,context,hooks,lib,pages,types}
  Dockerfile + nginx.conf    # multi-stage: vite build -> nginx + /api proxy
CODE_TOUR.md                 # guided walkthrough of the consume transaction
```

See `CODE_TOUR.md` for a narrated walkthrough of the consume transaction and the
rest of the core paths.

## License

Private hiring-assignment project — all rights reserved.
