import path from 'path';
import { defineConfig } from '@playwright/test';

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), override: true });
} catch {
  /* optional */
}

const resultsSubdir = process.env.PLAYWRIGHT_RESULTS_SUBDIR?.trim();
const resultsRoot = resultsSubdir ? path.join('..', 'results', resultsSubdir) : '';
const outputDir = resultsRoot ? path.join(resultsRoot, 'test-results') : 'test-results';
const htmlReportDir = resultsRoot ? path.join(resultsRoot, 'playwright-report') : 'playwright-report';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  timeout: 180_000,
  retries: 0,
  workers: 1,
  outputDir,
  reporter: [['html', { outputFolder: htmlReportDir, open: 'never' }], ['list']],
  use: {
    headless: isCI,
    baseURL: process.env.SALESFORCE_BASE_URL || 'https://test.salesforce.com',
    viewport: isCI ? { width: 1920, height: 1080 } : null,
    launchOptions: isCI ? undefined : { args: ['--start-maximized'] },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },
});
