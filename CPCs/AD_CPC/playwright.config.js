const path = require('path');

try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
} catch {
  /* optional */
}

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: './tests',
  timeout: 120000,
  retries: 0,
  workers: 1,
  use: {
    headless: !!process.env.CI,
    viewport: process.env.CI ? { width: 1280, height: 720 } : null,
    launchOptions: process.env.CI ? undefined : { args: ['--start-maximized'] },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'on',
    trace: 'on-first-retry',
    actionTimeout: 20000,
    navigationTimeout: 60000,
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
};
