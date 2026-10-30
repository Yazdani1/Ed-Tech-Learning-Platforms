import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Component and unit tests (Vitest + React Testing Library + MSW). Playwright specs live in e2e/.
export default defineConfig({
  plugins: [react()],
  // The `@/` alias from tsconfig.json
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    // MUI renders slowly in jsdom when many files run in parallel
    testTimeout: 30_000,
    css: false,
  },
});
