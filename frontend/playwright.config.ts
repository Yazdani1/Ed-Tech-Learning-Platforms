import { defineConfig, devices } from '@playwright/test';

// Every flow runs on a desktop and a mobile project (CLAUDE.md testing rules).
// In Docker (npm run test:e2e), BASE_URL points at the frontend-e2e container of the test stack.
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // The E2E stack runs `next dev`, which compiles each page on its first visit
  timeout: 90_000,
  expect: { timeout: 30_000 },
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : '50%',
  reporter: [['list'], ['html', { open: 'never' }]],
  // Compiles every route once before the tests (next dev compiles on first visit)
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
