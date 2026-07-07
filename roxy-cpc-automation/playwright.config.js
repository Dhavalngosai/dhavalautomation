/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: './tests',
  timeout: 120000,
  retries: 0,
  workers: 1,
  use: {
    headless: false,
    viewport: null,
    launchOptions: {
      args: ['--start-maximized'],
    },
    screenshot: 'only-on-failure',
    video: 'on',
    trace: 'on-first-retry',
    actionTimeout: 20000,
    navigationTimeout: 60000,
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['./reporters/terminal-output-reporter.js', { outputFile: 'test-results/terminal-output.log' }],
    ['list'],
  ],
};
