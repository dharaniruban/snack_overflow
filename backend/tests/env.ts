process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/snack_overflow_test';
process.env.JWT_SECRET = 'vitest-secret-key-that-is-long-enough';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.DB_POOL_MAX = '20';
process.env.BCRYPT_COST = '12';
