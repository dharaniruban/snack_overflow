import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['tests/env.ts', 'tests/setup.ts'],
    // Tests share one Postgres database; run files sequentially so truncates
    // and migrations cannot race each other.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});
