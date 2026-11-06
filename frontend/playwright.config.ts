import { defineConfig, devices } from '@playwright/test';

// Every flow runs on a desktop and a mobile project (CLAUDE.md testing rules).
// In Docker (npm run test:e2e), BASE_URL points at the frontend-e2e container of the test stack.
const baseURL = process.env.BASE_URL ?? 'http://localhost:3456';
const isCI = Boolean(process.env.CI);
const PROMO_SPECS = /promos\.spec\.ts/;
const DESKTOP = { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } };

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // The E2E stack runs `next dev` (compiles each page on its first visit); multi-user flows take 1 to 1.5 min under load
  timeout: 150_000,
  expect: { timeout: 45_000 },
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // The single `next dev` server is the bottleneck: more workers only make every page slower
  workers: isCI ? 2 : 4,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Compiles every route once before the tests (next dev compiles on first visit)
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // A running promo shows a pop-up on the home and course pages of every visitor: the promo specs have their own
  // projects, which scripts/docker-test.mjs runs as a second, separate run after every other spec
  projects: [
    {
      name: 'desktop',
      testIgnore: PROMO_SPECS,
      use: { ...DESKTOP },
    },
    {
      name: 'mobile',
      testIgnore: PROMO_SPECS,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'desktop-promos',
      testMatch: PROMO_SPECS,
      use: { ...DESKTOP },
    },
    {
      name: 'mobile-promos',
      testMatch: PROMO_SPECS,
      use: { ...devices['Pixel 7'] },
    },
  ],
});
