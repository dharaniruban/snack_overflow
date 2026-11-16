import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';

const DEMO_USERS = [
  { name: 'Admin User', email: 'admin@bpf.com', password: 'Admin@123', role: 'admin' as const },
  { name: 'Member User', email: 'member@bpf.com', password: 'Member@123', role: 'member' as const },
];

const SNACKS: Array<{
  name: string;
  category: string;
  quantity: number;
  lowStockThreshold: number;
}> = [
  { name: 'Masala Peanuts', category: 'savoury', quantity: 1, lowStockThreshold: 5 },
  { name: 'Bengali Mixturen', category: 'sweet', quantity: 3, lowStockThreshold: 5 },
  { name: 'Chai Masala Latte', category: 'drink', quantity: 8, lowStockThreshold: 10 },
  { name: 'Dark Chocolate Bar', category: 'sweet', quantity: 12, lowStockThreshold: 5 },
  { name: 'Cheese Crackers', category: 'savoury', quantity: 20, lowStockThreshold: 5 },
  { name: 'Green Tea', category: 'drink', quantity: 15, lowStockThreshold: 6 },
  { name: 'Roasted Chana', category: 'healthy-ish', quantity: 9, lowStockThreshold: 10 },
  { name: 'Hummus Cups', category: 'healthy-ish', quantity: 4, lowStockThreshold: 5 },
  { name: 'Expired Granola Bars', category: 'sweet', quantity: 0, lowStockThreshold: 5 },
  { name: 'Flat Cola', category: 'drink', quantity: 0, lowStockThreshold: 4 },
  { name: 'Butter Popcorn', category: 'sweet', quantity: 18, lowStockThreshold: 6 },
  { name: 'Salted Cashews', category: 'savoury', quantity: 14, lowStockThreshold: 6 },
  { name: 'Cold Coffee', category: 'drink', quantity: 22, lowStockThreshold: 8 },
  { name: 'Oatmeal Cookies', category: 'sweet', quantity: 16, lowStockThreshold: 6 },
  { name: 'Edamame', category: 'healthy-ish', quantity: 11, lowStockThreshold: 5 },
];

const SEED_VOTES: Array<{ userEmail: string; snackName: string }> = [
  { userEmail: 'member@bpf.com', snackName: 'Masala Peanuts' },
  { userEmail: 'member@bpf.com', snackName: 'Bengali Mixturen' },
  { userEmail: 'admin@bpf.com', snackName: 'Masala Peanuts' },
];

async function ensureUser(pool: Pool, user: (typeof DEMO_USERS)[number]): Promise<string> {
  const existing = await pool.query<{ id: string }>(
    'SELECT id FROM users WHERE lower(email) = lower($1)',
    [user.email],
  );
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }
  const passwordHash = bcrypt.hashSync(user.password, 12);
  const inserted = await pool.query<{ id: string }>(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
    [user.name, user.email, passwordHash, user.role],
  );
  return inserted.rows[0].id;
}

async function ensureSnack(pool: Pool, snack: (typeof SNACKS)[number]): Promise<string> {
  const existing = await pool.query<{ id: string }>(
    'SELECT id FROM snacks WHERE lower(name) = lower($1)',
    [snack.name],
  );
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }
  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO snacks (name, category, quantity, low_stock_threshold)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [snack.name, snack.category, snack.quantity, snack.lowStockThreshold],
  );
  return inserted.rows[0].id;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required to run the seed');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  try {
    const userIds = new Map<string, string>();
    for (const user of DEMO_USERS) {
      userIds.set(user.email, await ensureUser(pool, user));
    }

    const snackIds = new Map<string, string>();
    for (const snack of SNACKS) {
      snackIds.set(snack.name, await ensureSnack(pool, snack));
    }

    for (const vote of SEED_VOTES) {
      const userId = userIds.get(vote.userEmail);
      const snackId = snackIds.get(vote.snackName);
      if (!userId || !snackId) continue;
      await pool.query(
        'INSERT INTO votes (user_id, snack_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, snackId],
      );
    }

    console.log('Seed complete');
    console.log('Demo users: admin@bpf.com / Admin@123, member@bpf.com / Member@123');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Seed failed', error);
  process.exit(1);
});
