import { defineConfig } from 'vitest/config';

// API tests run against the real mongo-test container (see docker/compose.test.yml).
// Test files share one database, so files run one at a time; tests inside a file may run in parallel.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
