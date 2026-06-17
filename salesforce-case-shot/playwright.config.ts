import path from 'path';
import { defineConfig } from '@playwright/test';

const resultsSubdir = process.env.PLAYWRIGHT_RESULTS_SUBDIR?.trim();
const resultsRoot = resultsSubdir ? path.join('..', 'results', resultsSubdir) : '';
const outputDir = resultsRoot ? path.join(resultsRoot, 'test-results') : 'test-results';
const htmlReportDir = resultsRoot ? path.join(resultsRoot, 'playwright-report') : 'playwright-report';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  outputDir,
  reporter: [['html', { outputFolder: htmlReportDir, open: 'never' }], ['list']],
  use: {
    headless: isCI,
    viewport: isCI ? { width: 1920, height: 1080 } : null,
    launchOptions: isCI ? undefined : { args: ['--start-maximized'] },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});