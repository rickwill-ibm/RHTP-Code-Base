/**
 * Playwright config for RHTP e2e smoke tests.
 *
 * Not installed by default. To run:
 *   npm i -D @playwright/test
 *   npx playwright install chromium
 *   npm run dev            # in another terminal (port 4029)
 *   npx playwright test
 *
 * Excluded from tsc (see tsconfig "exclude") so the app build stays green
 * whether or not @playwright/test is installed.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4029',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
