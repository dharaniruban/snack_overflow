import type { Queryable } from '../../db/pool';
import { escapeLike } from '../../utils/like';
import type { CreateSnackInput, SnackCategory, SnackStatus, UpdateSnackInput } from './types';

export interface SnackRow {
  id: string;
  name: string;
  category: SnackCategory;
  quantity: number;
  low_stock_threshold: number;
  created_at: Date;
  updated_at: Date;
  status: SnackStatus;
  vote_count: number;
  has_voted: number;
}

export interface SnackBaseRow {
  id: string;
  name: string;
  category: SnackCategory;
  quantity: number;
  low_stock_threshold: number;
  created_at: Date;
  updated_at: Date;
}

export type SnackSortField = 'name' | 'quantity' | 'votes' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface ListSnacksOptions {
  category?: SnackCategory;
  status?: SnackStatus;
  q?: string;
  page: number;
  pageSize: number;
  userId: string;
  sort?: SnackSortField;
  order?: SortOrder;
}

export interface SummaryResult {
  stocked: number;
  running_low: number;
  gone: number;
  snackOfWeek: SnackRow | null;
}

// Status is derived, never stored. Keeping it in SQL means filtering and
// pagination stay server-side and consistent everywhere.
const STATUS_EXPR = `CASE
  WHEN s.quantity = 0 THEN 'gone'
  WHEN s.quantity <= s.low_stock_threshold THEN 'running_low'
  ELSE 'stocked'
END`;

const SELECT_SNACK = `
  SELECT
    s.id,
    s.name,
    s.category,
    s.quantity,
    s.low_stock_threshold,
    s.created_at,
    s.updated_at,
    ${STATUS_EXPR} AS status,
    (SELECT COUNT(*) FROM votes v WHERE v.snack_id = s.id)::int AS vote_count,
    (SELECT COUNT(*) FROM votes v WHERE v.snack_id = s.id AND v.user_id = $4)::int AS has_voted
  FROM snacks s
`;

function listWhere(): string {
  return `WHERE ($1::text IS NULL OR s.category = $1)
    AND ($2::text IS NULL OR ${STATUS_EXPR} = $2)
    AND ($3::text IS NULL OR s.name ILIKE '%' || $3 || '%' ESCAPE '\\')`;
}

// Sorting is allowlisted: user input chooses a key, never raw SQL text.
const SORT_EXPRESSIONS: Record<SnackSortField, string> = {
  name: 'lower(s.name)',
  quantity: 's.quantity',
  votes: 'vote_count',
  createdAt: 's.created_at',
};

function orderByClause(options: ListSnacksOptions): string {
  if (!options.sort) {
    return 'ORDER BY s.created_at DESC';
  }
  const direction = options.order ?? (options.sort === 'name' ? 'asc' : 'desc');
  const sqlDirection = direction === 'asc' ? 'ASC' : 'DESC';
  return `ORDER BY ${SORT_EXPRESSIONS[options.sort]} ${sqlDirection}, s.created_at DESC`;
}

export const snackRepository = {
  async listSnacks(
    db: Queryable,
    options: ListSnacksOptions,
  ): Promise<{ rows: SnackRow[]; total: number }> {
    const where = listWhere();
    const filterParams = [
      options.category ?? null,
      options.status ?? null,
      options.q ? escapeLike(options.q) : null,
    ];

    const countResult = await db.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM snacks s ${where}`,
      filterParams,
    );

    const dataResult = await db.query<SnackRow>(
      `${SELECT_SNACK} ${where} ${orderByClause(options)} LIMIT $5 OFFSET $6`,
      [...filterParams, options.userId, options.pageSize, (options.page - 1) * options.pageSize],
    );

    return { rows: dataResult.rows, total: countResult.rows[0]?.total ?? 0 };
  },

  async getById(db: Queryable, id: string, userId: string): Promise<SnackRow | undefined> {
    // Same shape as the list query, but with the snack id as $1 and the
    // current user as $2 so has_voted stays parameterized.
    const result = await db.query<SnackRow>(
      `SELECT
        s.id,
        s.name,
        s.category,
        s.quantity,
        s.low_stock_threshold,
        s.created_at,
        s.updated_at,
        ${STATUS_EXPR} AS status,
        (SELECT COUNT(*) FROM votes v WHERE v.snack_id = s.id)::int AS vote_count,
        (SELECT COUNT(*) FROM votes v WHERE v.snack_id = s.id AND v.user_id = $2)::int AS has_voted
      FROM snacks s
      WHERE s.id = $1`,
      [id, userId],
    );
    return result.rows[0];
  },

  async exists(db: Queryable, id: string): Promise<boolean> {
    const result = await db.query('SELECT 1 FROM snacks WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async create(db: Queryable, input: Required<CreateSnackInput>): Promise<SnackBaseRow> {
    const result = await db.query<SnackBaseRow>(
      `INSERT INTO snacks (name, category, quantity, low_stock_threshold)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, category, quantity, low_stock_threshold, created_at, updated_at`,
      [input.name, input.category, input.quantity, input.lowStockThreshold],
    );
    return result.rows[0] as SnackBaseRow;
  },

  async update(
    db: Queryable,
    id: string,
    input: UpdateSnackInput,
  ): Promise<SnackBaseRow | undefined> {
    const columnMap = {
      name: 'name',
      category: 'category',
      quantity: 'quantity',
      lowStockThreshold: 'low_stock_threshold',
    } as const;

    const entries = (Object.entries(input) as [keyof typeof columnMap, string | number][]).filter(
      ([, value]) => value !== undefined,
    );
    if (entries.length === 0) {
      return undefined;
    }

    const setClause = entries.map(([key], index) => `${columnMap[key]} = $${index + 2}`).join(', ');
    const values = entries.map(([, value]) => value);

    const result = await db.query<SnackBaseRow>(
      `UPDATE snacks SET ${setClause}, updated_at = now() WHERE id = $1
       RETURNING id, name, category, quantity, low_stock_threshold, created_at, updated_at`,
      [id, ...values],
    );
    return result.rows[0];
  },

  async remove(db: Queryable, id: string): Promise<boolean> {
    const result = await db.query('DELETE FROM snacks WHERE id = $1 RETURNING id', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async consume(db: Queryable, id: string, amount: number): Promise<SnackBaseRow | undefined> {
    // One atomic statement: the WHERE clause makes the decrement conditional,
    // so concurrent consumers cannot drive quantity below zero.
    const result = await db.query<SnackBaseRow>(
      `UPDATE snacks
       SET quantity = quantity - $2, updated_at = now()
       WHERE id = $1 AND quantity >= $2
       RETURNING id, name, category, quantity, low_stock_threshold, created_at, updated_at`,
      [id, amount],
    );
    return result.rows[0];
  },

  async restock(db: Queryable, id: string, amount: number): Promise<SnackBaseRow | undefined> {
    const result = await db.query<SnackBaseRow>(
      `UPDATE snacks
       SET quantity = quantity + $2, updated_at = now()
       WHERE id = $1
       RETURNING id, name, category, quantity, low_stock_threshold, created_at, updated_at`,
      [id, amount],
    );
    return result.rows[0];
  },

  async getSummary(db: Queryable, userId: string): Promise<SummaryResult> {
    const countsResult = await db.query<{ stocked: number; running_low: number; gone: number }>(
      `SELECT
        COUNT(*) FILTER (WHERE quantity > low_stock_threshold)::int AS stocked,
        COUNT(*) FILTER (WHERE quantity > 0 AND quantity <= low_stock_threshold)::int AS running_low,
        COUNT(*) FILTER (WHERE quantity = 0)::int AS gone
      FROM snacks`,
    );

    const snackOfWeekResult = await db.query<SnackRow>(
      `SELECT
        s.id,
        s.name,
        s.category,
        s.quantity,
        s.low_stock_threshold,
        s.created_at,
        s.updated_at,
        ${STATUS_EXPR} AS status,
        COUNT(v.user_id)::int AS vote_count,
        MAX(v.created_at) AS last_vote_at,
        (SELECT COUNT(*) FROM votes v2 WHERE v2.snack_id = s.id AND v2.user_id = $1)::int AS has_voted
      FROM snacks s
      JOIN votes v ON v.snack_id = s.id
      GROUP BY s.id
      ORDER BY vote_count DESC, last_vote_at DESC, lower(s.name) ASC
      LIMIT 1`,
      [userId],
    );

    return {
      ...(countsResult.rows[0] as { stocked: number; running_low: number; gone: number }),
      snackOfWeek: snackOfWeekResult.rows[0] ?? null,
    };
  },
};
