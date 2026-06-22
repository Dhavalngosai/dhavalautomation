/**
 * Bulk Case creation from Excel.
 * Run via run-create-cases-from-excel.bat (or: npm test -- tests1/create-cases-from-excel.spec.ts).
 *
 * Excel: data/create-cases.xlsx — columns (header row):
 *   User, Subject, Description, Account Name, Asset, Sub Asset, Case Type, Sub Type
 * User is optional (Case Owner lookup). Other fields are used when non-empty.
 *
 * Required in .env: SALESFORCE_USERNAME, SALESFORCE_PASSWORD
 * Optional: SALESFORCE_LIGHTNING_HOME_URL, SALESFORCE_CASE_LIST_URL
 */
import { test } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { testData } from '../utils/testData';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady } = require('../lib/waitHelpers');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loginToSandboxAndOpenHome } = require('../lib/salesforceLogin');

const EXCEL_PATH = path.resolve(__dirname, '..', 'data', 'create-cases.xlsx');

const rawLocatorMs = Number(process.env.SALESFORCE_LOCATOR_TIMEOUT_MS);
const locatorTimeoutMs = Number.isFinite(rawLocatorMs) && rawLocatorMs > 0 ? rawLocatorMs : 30_000;
const untilVisible = { timeout: locatorTimeoutMs };
const sfReadyMs = 20_000;

export interface CaseRow {
  rowNumber: number;
  user: string;
  subject: string;
  description: string;
  accountName: string;
  asset: string;
  subAsset: string;
  caseType: string;
  subType: string;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function pickCell(row: Record<string, unknown>, ...aliases: string[]): string {
  const wanted = new Set(aliases.map((a) => normalizeHeader(a)));
  for (const [key, value] of Object.entries(row)) {
    if (wanted.has(normalizeHeader(key))) {
      const text = String(value ?? '').trim();
      if (text) return text;
    }
  }
  return '';
}

function readCaseRows(excelPath: string): CaseRow[] {
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel file not found: ${excelPath}. Run: node scripts/create-sample-cases-xlsx.js`);
  }

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const cases: CaseRow[] = [];
  rawRows.forEach((row, index) => {
    const subject = pickCell(row, 'Subject');
    if (!subject) return;

    cases.push({
      rowNumber: index + 2,
      user: pickCell(row, 'User', 'Case Owner', 'Owner'),
      subject,
      description: pickCell(row, 'Description'),
      accountName: pickCell(row, 'Account Name', 'Account', 'AccountName'),
      asset: pickCell(row, 'Asset', 'ASSET'),
      subAsset: pickCell(row, 'Sub Asset', 'SubAsset', 'SUB ASSET'),
      caseType: pickCell(row, 'Case Type', 'CaseType'),
      subType: pickCell(row, 'Sub Type', 'Sub Type', 'SubType', 'Subtype', 'Case Sub Type'),
    });
  });

  if (cases.length === 0) {
    throw new Error(`No data rows with Subject in ${excelPath}`);
  }

  return cases;
}

function caseListUrl(lightningHome: string): string {
  const fromEnv = process.env.SALESFORCE_CASE_LIST_URL?.trim();
  if (fromEnv) return fromEnv;
  const origin = new URL(lightningHome).origin;
  return `${origin}/lightning/o/Case/list?filterName=__Recent`;
}

async function openNewCaseForm(page: Page, listUrl: string): Promise<void> {
  await page.goto(listUrl);
  await waitForSalesforceReady(page, { timeout: sfReadyMs });

  const newBtn = page.getByRole('button', { name: 'New', exact: true });
  await newBtn.waitFor({ state: 'visible', ...untilVisible });
  await newBtn.click();

  const nextBtn = page.getByRole('button', { name: 'Next', exact: true });
  if (await nextBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await nextBtn.click();
    await waitForSalesforceReady(page, { timeout: sfReadyMs });
  }
}

async function pickComboboxOption(
  page: Page,
  comboboxName: string | RegExp,
  value: string,
  opts?: { lookup?: boolean; exact?: boolean }
): Promise<void> {
  if (!value) return;

  const combobox = page.getByRole('combobox', { name: comboboxName });
  await combobox.scrollIntoViewIfNeeded();
  await combobox.click();

  if (opts?.lookup) {
    await combobox.fill(value);
    await page.waitForTimeout(1_500);
    const option = page
      .getByRole('option', { name: value, exact: opts.exact ?? true })
      .or(page.locator('[role="option"]').filter({ hasText: value }))
      .or(page.getByTitle(value, { exact: opts.exact ?? true }));
    await option.first().click({ timeout: locatorTimeoutMs });
    return;
  }

  const option = page
    .getByRole('option', { name: value, exact: opts?.exact ?? true })
    .or(page.locator('span').filter({ hasText: value }).first())
    .or(page.getByText(value, { exact: opts?.exact ?? true }));
  await option.first().click({ timeout: locatorTimeoutMs });
}

async function fillCaseOwner(page: Page, userName: string): Promise<void> {
  if (!userName) return;

  const ownerCombobox = page
    .getByRole('combobox', { name: /Case Owner|Owner/i })
    .or(page.getByRole('combobox', { name: 'User' }));
  if (!(await ownerCombobox.first().isVisible({ timeout: 3_000 }).catch(() => false))) {
    return;
  }

  await pickComboboxOption(page, /Case Owner|Owner|^User$/i, userName, { lookup: true });
}

async function createCaseFromRow(page: Page, row: CaseRow, listUrl: string): Promise<void> {
  await openNewCaseForm(page, listUrl);

  await fillCaseOwner(page, row.user);

  const subjectField = page.getByRole('textbox', { name: 'Subject' });
  await subjectField.waitFor({ state: 'visible', ...untilVisible });
  await subjectField.fill(row.subject);

  if (row.description) {
    await page.getByRole('textbox', { name: 'Description' }).fill(row.description);
  }

  if (row.accountName) {
    await pickComboboxOption(page, 'Account Name', row.accountName, { lookup: true });
  }

  if (row.asset) {
    await pickComboboxOption(page, /^Asset$/i, row.asset);
  }

  if (row.subAsset) {
    await pickComboboxOption(page, 'Sub Asset', row.subAsset);
  }

  if (row.caseType) {
    await pickComboboxOption(page, 'Case Type', row.caseType, { exact: false });
  }

  if (row.subType) {
    await pickComboboxOption(page, 'Sub Type', row.subType, { exact: false });
  }

  const saveBtn = page.getByRole('button', { name: 'Save', exact: true });
  await saveBtn.click();
  await waitForSalesforceReady(page, { timeout: sfReadyMs });

  const snag = page.getByRole('heading', { name: 'We hit a snag.' });
  if (await snag.isVisible({ timeout: 3_000 }).catch(() => false)) {
    if (row.subType) {
      await pickComboboxOption(page, 'Sub Type', row.subType, { exact: false });
      await saveBtn.click();
      await waitForSalesforceReady(page, { timeout: sfReadyMs });
    }
    if (await snag.isVisible({ timeout: 2_000 }).catch(() => false)) {
      throw new Error('Save failed — validation errors remain on the form');
    }
  }

  await page.waitForURL(/\/lightning\/r\/Case\//, { timeout: locatorTimeoutMs }).catch(() => {});
}

test.describe('Create Cases from Excel', () => {
  test('login → create each case row from Excel', async ({ page }) => {
    const caseRows = readCaseRows(EXCEL_PATH);
    test.setTimeout(Math.max(300_000, caseRows.length * 120_000));
    test.skip(!testData.username || !testData.password, 'Set SALESFORCE_USERNAME and SALESFORCE_PASSWORD in .env');

    await page.setDefaultTimeout(locatorTimeoutMs);

    const lightningHome = await loginToSandboxAndOpenHome(page, {
      username: testData.username,
      password: testData.password,
      sfReadyMs,
      untilVisible,
    });

    const listUrl = caseListUrl(lightningHome);
    const results: { row: CaseRow; ok: boolean; error?: string }[] = [];

    console.log(`\nCreating ${caseRows.length} case(s) from ${EXCEL_PATH}\n`);

    for (let i = 0; i < caseRows.length; i++) {
      const row = caseRows[i];
      const label = `[${i + 1}/${caseRows.length}] Excel row ${row.rowNumber}: ${row.subject}`;
      console.log(`${label} — starting`);

      try {
        await createCaseFromRow(page, row, listUrl);
        results.push({ row, ok: true });
        console.log(`${label} — PASS`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({ row, ok: false, error: message });
        console.error(`${label} — FAIL: ${message}`);
      }
    }

    const passed = results.filter((r) => r.ok).length;
    const failed = results.length - passed;

    console.log(`\nSummary: ${passed} passed, ${failed} failed (of ${results.length})\n`);

    if (failed > 0) {
      const details = results
        .filter((r) => !r.ok)
        .map((r) => `  row ${r.row.rowNumber} (${r.row.subject}): ${r.error}`)
        .join('\n');
      throw new Error(`${failed} case(s) failed:\n${details}`);
    }
  });
});
