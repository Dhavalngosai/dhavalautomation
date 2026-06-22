/**
 * Export all picklist values from the Lightning Case new-record form.
 * Run: npm test -- tests1/case-picklists-export.spec.ts --headed
 */
import { test, chromium } from '@playwright/test';
import { testData } from '../utils/testData';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loginToSandboxAndOpenHome } = require('../lib/salesforceLogin');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { collectCaseFormPicklists, writePicklistsJson } = require('../lib/casePicklists');

const rawLocatorMs = Number(process.env.SALESFORCE_LOCATOR_TIMEOUT_MS);
const locatorTimeoutMs = Number.isFinite(rawLocatorMs) && rawLocatorMs > 0 ? rawLocatorMs : 30_000;
const untilVisible = { timeout: locatorTimeoutMs };
const sfReadyMs = 20_000;
const isCI = !!process.env.CI;

test.describe('Case picklist export', () => {
  test('collect all picklist values from Case new form', async () => {
    test.setTimeout(900_000);
    test.skip(!testData.username || !testData.password, 'Set SALESFORCE_USERNAME and SALESFORCE_PASSWORD in .env');

    const browser = await chromium.launch({
      headless: isCI,
      args: isCI ? [] : ['--start-maximized'],
    });

    const context = await browser.newContext({
      viewport: isCI ? { width: 1920, height: 1080 } : null,
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    await page.setDefaultTimeout(locatorTimeoutMs);

    try {
      const lightningHome = await loginToSandboxAndOpenHome(page, {
        username: testData.username,
        password: testData.password,
        sfReadyMs,
        untilVisible,
      });

      const picklists = await collectCaseFormPicklists(page, lightningHome, {
        sfReadyMs,
        untilVisible: { timeout: Math.max(locatorTimeoutMs, 60_000) },
      });

      const outPath = writePicklistsJson(picklists);
      console.log(`\nCase picklists written to ${outPath}\n`);
      console.log(JSON.stringify(picklists, null, 2));
    } finally {
      await browser.close().catch(() => {});
    }
  });
});
