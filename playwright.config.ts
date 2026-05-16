import { defineConfig, devices } from '@playwright/test';

import dotenv from 'dotenv';
import path from 'path';

// Define which env file to use, defaulting to .env.test.local if it exists, or fallback to .env
const envPath = process.env.ENV_FILE || '.env.test.local';
dotenv.config({ path: path.resolve(__dirname, envPath) });

// Use a custom isolated port for local E2E test server to avoid collision with dev (3000)
const PORT = process.env.PORT || '3000';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 2,
  /* Opt out of parallel tests to avoid memory issues (Next.js server crash) */
  // workers: 1, (Removido da raiz para permitir paralelismo por projeto)
  
  /* Total timeout for each test */
  timeout: 180 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toBeVisible();`
     */
    timeout: 15000
  },
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: `http://localhost:${PORT}`,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',
    video: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    {
      name: 'onboarding',
      testMatch: /onboarding_resilience\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
      workers: 1,
    },

    {
      name: 'chromium',
      testIgnore: [/onboarding_resilience\.spec\.ts/, /stress\//],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
      workers: 1,
      dependencies: ['setup'],
    },

    {
      name: 'stress',
      testMatch: /stress\/.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
      workers: 15,
      fullyParallel: true,
      dependencies: ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 300000,
  },
});
