// @ts-check
const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
} catch (_) {}

/**
 * Playwright config for Salesforce (Sales Cloud) POC.
 * Chromium-only; tuned for dynamic DOM, waits, and re-runnable tests.
 */
module.exports = defineConfig({
  testDir: './tests',
  testMatch: /.*\.(spec|test)\.(js|ts)/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.SALESFORCE_BASE_URL || 'https://login.salesforce.com',
    browserName: 'chromium',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  timeout: 60000,
  expect: { timeout: 10000 },
});
