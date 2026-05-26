import path from 'path';
import { defineConfig } from '@playwright/test';

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
} catch {
  /* optional */
}

export default defineConfig({
  testDir: './tests1',
  timeout: 90000,
  retries: 1,
  workers: 1,
  use: {
    // Visible browser locally; headless on CI
    headless: !!process.env.CI,
    baseURL: process.env.SALESFORCE_BASE_URL || 'https://login.salesforce.com',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    // Keep video for every run (pass or fail); see test-results/…/video.webm in HTML report artifacts.
    video: 'on',
    trace: 'on-first-retry',
    actionTimeout: 20000,
    navigationTimeout: 45000,
  },
  reporter: [['html', { open: 'never' }], ['list']],
});