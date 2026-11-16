# Code Tour: Snack Overflow

This walkthrough is written so a junior developer can explain every important line out loud in an interview. Read top to bottom; each section names the file, what it does, and why it is shaped that way.

## 1. Request lifecycle

```
HTTP request
  -> helmet / cors / express.json        (app.ts)
  -> route (modules/*/routes.ts)
  -> validate() Zod middleware           (middleware/validate.ts)
  -> requireAuth / requireRole           (middleware/auth.ts)
  -> controller                         (modules/*/controller.ts)
  -> service                            (modules/*/service.ts)
  -> repository (the ONLY place with SQL) (modules/*/repository.ts)
  -> errorHandler on any throw          (middleware/errorHandler.ts)
```

The rule to memorize: **routes never contain SQL, controllers never contain SQL, services never contain SQL.** SQL lives only in `repository.ts` files. That is what makes the atomic statements reviewable.

## 2. Configuration and fail-fast startup

`backend/src/config/env.ts`

- `dotenv.config()` loads `.env`.
- A Zod schema parses `process.env`. `DATABASE_URL`, `JWT_SECRET`, etc. are required.
- If parsing fails, the process prints the issues and `process.exit(1)`. A production app should never boot half-configured.

`backend/src/db/pool.ts`

- Creates one `pg.Pool`. `max` comes from `DB_POOL_MAX`.
- `withTransaction(fn)` is the only transaction helper:
  1. `pool.connect()` grabs a dedicated client.
  2. `BEGIN`
  3. run `fn(client)` — all queries inside use that same client, so they share one transaction.
  4. `COMMIT` on success, `ROLLBACK` on any throw, `client.release()` always.

Why this matters: the consume endpoint needs an `UPDATE` and an `INSERT` to succeed or fail together. Without a transaction you could decrement stock and then crash before writing the activity row.

## 3. Errors: one shape everywhere

`backend/src/utils/errors.ts` defines `AppError` with a `code` and an HTTP `status`. `middleware/errorHandler.ts` turns any thrown `AppError` into:

```json
{ "error": { "code": "INSUFFICIENT_STOCK", "message": "Someone beat you to it." } }
```

Unknown routes hit `notFoundHandler`, which throws `NOT_FOUND`, so 404s use the same envelope. Unknown errors become `INTERNAL_ERROR` with a generic message — stack traces and SQL never reach the client.

## 4. Auth: JWT + bcrypt, role from the DB

`modules/auth/service.ts` `login()`:

- `userRepository.findByEmail` selects the row **including `password_hash`** — but only inside the repository/service layer. It is never serialized into a response.
- If no user exists, we still run `bcrypt.compare(password, DUMMY_HASH)` so an attacker cannot distinguish "email does not exist" from "wrong password" by response time.
- Wrong password and unknown email throw the _same_ `UNAUTHENTICATED` error with the same message.
- On success we sign a JWT `{ sub, role }` with `JWT_SECRET` and a short expiry.

`middleware/auth.ts` `requireAuth`:

- Verifies the Bearer token.
- **Re-reads the user from the DB** and attaches `req.user`. The role in the JWT is never trusted for authorization; the DB role is. That is why `requireRole('admin')` is safe even if a token is old.

## 5. The consume transaction — read this line by line

`modules/snacks/service.ts` → `consume()`:

```ts
await withTransaction(async (client) => {
  const updated = await snackRepository.consume(client, id, amount);
  if (!updated) {
    const exists = await snackRepository.exists(client, id);
    if (!exists) throw new AppError('NOT_FOUND', 'Snack not found');
    throw new AppError('INSUFFICIENT_STOCK', 'Someone beat you to it.');
  }
  const quantityAfter = updated.quantity;
  await activityRepository.insert(client, { ... quantityBefore: quantityAfter + amount, quantityAfter });
});
```

`modules/snacks/repository.ts` → `consume()` is the critical SQL:

```sql
UPDATE snacks
SET quantity = quantity - $2, updated_at = now()
WHERE id = $1 AND quantity >= $2
RETURNING ...
```

Why this is safe under concurrency (READ COMMITTED):

- The `WHERE quantity >= $2` clause is evaluated **while holding a row lock** on that snack row.
- If ten requests race, Postgres serializes them on the row lock. Each one re-reads the latest committed `quantity` after the previous transaction commits, so the condition is checked against fresh data — not a stale snapshot.
- Only the requests that still see enough stock get a row back from `RETURNING`. Everyone else gets zero rows and we translate that into `409 INSUFFICIENT_STOCK` (or `404` if the snack is gone).
- There is no read-then-write, no in-memory counter, no `SELECT ... FOR UPDATE` needed — the conditional `UPDATE` _is_ the lock.
- The `CHECK (quantity >= 0)` constraint is a second safety net if a bug ever bypassed the `WHERE`.
- Because the activity `INSERT` runs on the same `client` inside `withTransaction`, it commits or rolls back with the `UPDATE`. You can never have stock decremented without an audit row, or an audit row without stock changed.

`restock()` is the same pattern with `quantity + $2`.

## 6. One vote per person

`modules/votes/repository.ts` → `add()`:

```sql
INSERT INTO votes (user_id, snack_id) VALUES ($1, $2)
ON CONFLICT DO NOTHING
RETURNING snack_id
```

The composite `PRIMARY KEY (user_id, snack_id)` is the enforcement. Ten parallel votes from the same user produce exactly one `RETURNING` row; the other nine return zero rows and become `409 ALREADY_VOTED`. No application-level lock needed.

## 7. Derived status in SQL

Status is never stored. `repository.ts` computes it everywhere:

```sql
CASE
  WHEN s.quantity = 0 THEN 'gone'
  WHEN s.quantity <= s.low_stock_threshold THEN 'running_low'
  ELSE 'stocked'
END AS status
```

Because it is a SQL expression, `WHERE status = 'gone'` filters and paginates server-side. Storing it would risk it drifting out of sync with `quantity`.

## 8. Validation and the API contract

Every route uses `validate({ body/params/query })` with a strict Zod schema (`.strict()` rejects unknown fields). Responses share one pagination envelope:

```json
{ "data": [...], "pagination": { "page": 1, "pageSize": 10, "total": 42, "totalPages": 5 } }
```

## 9. Tests that matter

`tests/concurrency.test.ts` fires `Promise.all` of 10 consume/vote requests at a real Postgres test DB and asserts exact counts of 200s/409s plus final DB state. `tests/setup.ts` truncates tables before each test so cases are isolated. `tests/env.ts` points the app at `snack_overflow_test`, never the dev database.

## 10. Frontend data flow

- `lib/api.ts` `apiFetch` is the only fetch wrapper: attaches the JWT, parses the error envelope, and dispatches a global `unauthorized` event on 401.
- `lib/auth.tsx` `AuthProvider` owns the session, restores it via `GET /auth/me`, and redirects to `/login` on 401.
- `pages/SnacksPage.tsx` keeps filters in the URL (`useSearchParams`), debounces search, and uses TanStack Query so every mutation invalidates `['snacks']` and `['snack-summary']` — the UI always refetches the true quantity after a `409`.
- Admin controls are simply not rendered for members (`isAdmin`); the server enforces the same rule independently.

## 11. Bonus features, briefly

- **Sorting:** `sort`/`order` are Zod enums; the repository maps them through `SORT_EXPRESSIONS`, an allowlist of SQL fragments — user input never becomes SQL text.
- **Idempotent consume:** `Idempotency-Key` is stored in `idempotency_keys` inside the same transaction as the stock update. A retry finds the row first and returns the stored response JSON without decrementing again.
- **Optimistic votes:** the vote mutation snapshots the `['snacks', queryString]` cache entry in `onMutate`, flips `hasVoted`/`voteCount`, and restores the snapshot in `onError` before invalidating.
- **SSE:** `utils/events.ts` is a tiny `EventEmitter` bus; services emit after commits, `GET /events` streams them (accepts `?token=` because `EventSource` cannot send headers), and the frontend hook invalidates queries on each event.
- **Register:** `POST /auth/register` hashes with bcrypt and hard-codes `role: 'member'` — the role is never read from the body.
- **Activity log:** `GET /activity` is admin-only, paginated, and joins `users` for display names while keeping the `snack_name` snapshot for deleted snacks.
