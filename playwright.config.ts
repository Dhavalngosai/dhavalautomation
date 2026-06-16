import path from 'path';
import { defineConfig } from '@playwright/test';

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
} catch {
  /* optional */
}

const isCI = !!process.env.CI;

// Set PLAYWRIGHT_RESULTS_SUBDIR in batch runners → results/<subdir>/test-results + playwright-report
const resultsSubdir = process.env.PLAYWRIGHT_RESULTS_SUBDIR?.trim();
const resultsRoot = resultsSubdir ? path.join('results', resultsSubdir) : '';
const outputDir = resultsRoot ? path.join(resultsRoot, 'test-results') : 'test-results';
const htmlReportDir = resultsRoot ? path.join(resultsRoot, 'playwright-report') : 'playwright-report';

export default defineConfig({
  testDir: './tests1',
  testMatch: ['**/*.spec.ts', '**/*.test.ts', '**/*.aspx.ts'],
  timeout: 90000,
  retries: 1,
  workers: 1,
  outputDir,
  use: {
    // Visible browser locally; headless on CI
    headless: isCI,
    baseURL: process.env.SALESFORCE_BASE_URL || 'https://test.salesforce.com',
    // Local headed runs: maximize the real browser window (no fixed 1280x720 frame).
    viewport: isCI ? { width: 1920, height: 1080 } : null,
    launchOptions: isCI ? undefined : { args: ['--start-maximized'] },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    // Keep video for every run (pass or fail); see test-results/…/video.webm in HTML report artifacts.
    video: 'on',
    trace: 'on-first-retry',
    actionTimeout: 20000,
    navigationTimeout: 45000,
  },
  reporter: [['html', { outputFolder: htmlReportDir, open: 'never' }], ['list']],
});