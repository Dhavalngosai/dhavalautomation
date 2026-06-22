/**
 * Bulk Case creation from Excel.
 * Run via run-create-cases-from-excel.bat (or: npm test -- tests1/create-cases-from-excel.spec.ts).
 *
 * Excel: data/create-cases.xlsx — columns (header row):
 *   User, Subject, Description, Account Name, Asset, Sub Asset, Case Type, Sub Type, Case Number
 *
 * Flow per row (fresh browser each time):
 *   1. Admin login → Setup → Users → Login as Excel User
 *   2. Create Case → write Case Number back to Excel
 *   3. Close browser → repeat for next row
 *
 * Rows that already have Case Number are skipped.
 *
 * Required in .env: SALESFORCE_USERNAME, SALESFORCE_PASSWORD
 */
import { test, chromium } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import { testData } from '../utils/testData';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loginToSandboxAndOpenHome } = require('../lib/salesforceLogin');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loginAsUserFromSetup, closePageSafe } = require('../lib/salesforceLoginAsUser');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fillAndSaveCaseFromRow } = require('../lib/caseForm');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { defaultExcelPath, readCaseRows, writeCaseNumberToExcel } = require('../lib/caseExcel');

const EXCEL_PATH = defaultExcelPath();

const rawLocatorMs = Number(process.env.SALESFORCE_LOCATOR_TIMEOUT_MS);
const locatorTimeoutMs = Number.isFinite(rawLocatorMs) && rawLocatorMs > 0 ? rawLocatorMs : 30_000;
const untilVisible = { timeout: locatorTimeoutMs };
const sfReadyMs = 20_000;
const isCI = !!process.env.CI;

interface CaseRow {
  rowNumber: number;
  user: string;
  subject: string;
  description: string;
  accountName: string;
  asset: string;
  subAsset: string;
  caseType: string;
  subType: string;
  caseNumber: string;
}

function caseFormOpts() {
  return { sfReadyMs, untilVisible: { timeout: Math.max(locatorTimeoutMs, 60_000) } };
}

async function launchFreshBrowser(): Promise<{ browser: Browser; page: Page }> {
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
  return { browser, page };
}

async function closeBrowserSafe(browser: Browser | null) {
  if (browser) {
    await browser.close().catch(() => {});
  }
}

test.describe('Create Cases from Excel', () => {
  test('fresh browser per row → login-as → create case → update Excel', async () => {
    const caseRows: CaseRow[] = readCaseRows(EXCEL_PATH);
    test.setTimeout(Math.max(300_000, caseRows.length * 240_000));
    test.skip(!testData.username || !testData.password, 'Set SALESFORCE_USERNAME and SALESFORCE_PASSWORD in .env');

    const results: { row: CaseRow; ok: boolean; caseNumber?: string; error?: string; skipped?: boolean }[] = [];

    console.log(`\nCreating case(s) from ${EXCEL_PATH}\n`);

    for (let i = 0; i < caseRows.length; i++) {
      const row = caseRows[i];
      const label = `[${i + 1}/${caseRows.length}] Excel row ${row.rowNumber}: ${row.subject} (as ${row.user})`;

      if (row.caseNumber) {
        console.log(`${label} — SKIP (Case Number already set: ${row.caseNumber})`);
        results.push({ row, ok: true, caseNumber: row.caseNumber, skipped: true });
        continue;
      }

      console.log(`${label} — starting (fresh browser)`);

      let browser: Browser | null = null;
      let userPage: Page | null = null;

      try {
        const launched = await launchFreshBrowser();
        browser = launched.browser;
        const page = launched.page;

        const lightningHome = await loginToSandboxAndOpenHome(page, {
          username: testData.username,
          password: testData.password,
          sfReadyMs,
          untilVisible,
        });

        const loginAsOpts = { lightningHome, sfReadyMs, untilVisible };
        userPage = await loginAsUserFromSetup(page, row.user, loginAsOpts);
        console.log(`${label} — logged in as ${row.user}`);

        if (!userPage) {
          throw new Error('Login-as flow did not open a user session');
        }

        const caseNumber = await fillAndSaveCaseFromRow(userPage, row, lightningHome, caseFormOpts());
        writeCaseNumberToExcel(EXCEL_PATH, row.rowNumber, caseNumber);

        results.push({ row, ok: true, caseNumber });
        console.log(`${label} — PASS (Case Number: ${caseNumber})`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({ row, ok: false, error: message });
        console.error(`${label} — FAIL: ${message}`);
      } finally {
        await closePageSafe(userPage);
        await closeBrowserSafe(browser);
      }
    }

    const passed = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    const skipped = results.filter((r) => r.skipped).length;
    const created = results.filter((r) => r.ok && !r.skipped).length;

    console.log(
      `\nSummary: ${created} created, ${skipped} skipped, ${failed} failed (of ${results.length})\n`,
    );

    if (failed > 0) {
      const details = results
        .filter((r) => !r.ok)
        .map((r) => `  row ${r.row.rowNumber} (${r.row.subject}): ${r.error}`)
        .join('\n');
      throw new Error(`${failed} case(s) failed:\n${details}`);
    }
  });
});
