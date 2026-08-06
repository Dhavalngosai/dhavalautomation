/**
 * Salesforce Lead creation from Excel (QA sandbox).
 * Login once → for each Excel row → Leads → New → fill → Save → write Lead Id/URL back.
 *
 * Excel: Lead_Creation/data/create-leads.xlsx
 * Columns: Salutation, First Name, Last Name*, Email, Country Code,
 *          Description/Notes, Contact Number, Address Search,
 *          Dummy Application Number, Lead Id, Lead URL
 * (* Last Name required. Rows with Lead Id already set are skipped.)
 *
 * Run via: Lead_Creation\run-create-lead.bat
 * Sample Excel: node Lead_Creation/scripts/create-sample-leads-xlsx.js
 *
 * Required in repo-root .env: SALESFORCE_USERNAME, SALESFORCE_PASSWORD
 */
import { expect, test, type Page } from '@playwright/test';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady } = require(path.resolve(__dirname, '../../lib/waitHelpers'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loginToSandboxAndOpenHome } = require(path.resolve(__dirname, '../../lib/salesforceLogin'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  defaultExcelPath,
  readLeadRows,
  writeLeadResultToExcel,
} = require(path.resolve(__dirname, '../lib/leadExcel'));

const EXCEL_PATH = process.env.SALESFORCE_LEAD_EXCEL_PATH?.trim() || defaultExcelPath();

const rawLocatorMs = Number(process.env.SALESFORCE_LOCATOR_TIMEOUT_MS);
const locatorTimeoutMs = Number.isFinite(rawLocatorMs) && rawLocatorMs > 0 ? rawLocatorMs : 30_000;
const untilVisible = { timeout: locatorTimeoutMs };
const sfReadyMs = 20_000;

const USERNAME = process.env.SALESFORCE_USERNAME ?? '';
const PASSWORD = process.env.SALESFORCE_PASSWORD ?? '';

interface LeadRow {
  rowNumber: number;
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  description: string;
  contactNumber: string;
  addressSearch: string;
  dummyApplicationNumber: string;
  leadId: string;
  leadUrl: string;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function leadIdFromUrl(url: string) {
  const match = url.match(/\/lightning\/r\/Lead\/([^/]+)\/view/i);
  return match?.[1] || '';
}

async function openNewLeadForm(page: Page) {
  const leadsLink = page.getByRole('link', { name: 'Leads' });
  await leadsLink.waitFor({ state: 'visible', ...untilVisible });
  await leadsLink.click();
  await waitForSalesforceReady(page, { timeout: sfReadyMs });

  const newLead = page.getByRole('button', { name: 'New', exact: true });
  await newLead.waitFor({ state: 'visible', ...untilVisible });
  await newLead.scrollIntoViewIfNeeded();
  await newLead.click();

  await page
    .getByRole('dialog')
    .filter({ hasText: /New Lead|Select a record type/i })
    .first()
    .waitFor({ state: 'visible', timeout: 60_000 })
    .catch(() => {});

  const nextBtn = page.getByRole('button', { name: 'Next', exact: true });
  if (await nextBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await nextBtn.click();
  }
  await waitForSalesforceReady(page, { timeout: sfReadyMs });
}

async function fillIfVisible(
  page: Page,
  role: 'textbox' | 'combobox',
  name: string,
  value: string,
) {
  if (!value) return;
  const field = page.getByRole(role, { name });
  if (!(await field.isVisible({ timeout: 5_000 }).catch(() => false))) return;
  await field.click();
  await field.fill(value);
}

async function selectComboboxOption(page: Page, comboName: string, optionText: string) {
  if (!optionText) return;
  const combo = page.getByRole('combobox', { name: comboName });
  if (!(await combo.isVisible({ timeout: 5_000 }).catch(() => false))) return;

  await combo.click();
  const option = page
    .getByRole('option', { name: new RegExp(escapeRegex(optionText), 'i') })
    .or(page.getByText(optionText, { exact: false }));
  await option.first().waitFor({ state: 'visible', ...untilVisible });
  await option.first().click();
}

async function fillLeadForm(page: Page, row: LeadRow) {
  await selectComboboxOption(page, 'Salutation', row.salutation);

  await fillIfVisible(page, 'textbox', 'First Name', row.firstName);

  const lastNameField = page.getByRole('textbox', { name: 'Last Name' });
  await lastNameField.waitFor({ state: 'visible', ...untilVisible });
  await lastNameField.fill(row.lastName);

  await fillIfVisible(page, 'textbox', 'Email', row.email);

  if (row.countryCode) {
    await selectComboboxOption(page, 'Country Code', row.countryCode);
  }

  await fillIfVisible(page, 'textbox', 'Description/Notes', row.description);
  await fillIfVisible(page, 'textbox', 'Contact Number', row.contactNumber);
  await fillIfVisible(page, 'textbox', 'Dummy Application Number', row.dummyApplicationNumber);

  if (row.addressSearch) {
    const addressCombo = page.getByRole('combobox', { name: 'Address Search' });
    if (await addressCombo.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addressCombo.fill(row.addressSearch);
      const firstAddressOption = page.getByRole('option').first();
      if (await firstAddressOption.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await firstAddressOption.click();
      }
    }
  }
}

async function saveLeadAndCapture(page: Page) {
  const save = page.getByRole('button', { name: 'Save', exact: true });
  await save.waitFor({ state: 'visible', ...untilVisible });
  await save.click();
  await waitForSalesforceReady(page, { timeout: sfReadyMs });

  await expect(page).toHaveURL(/\/lightning\/r\/Lead\/[^/]+\/view/i, { timeout: 60_000 });
  const leadUrl = page.url();
  return { leadUrl, leadId: leadIdFromUrl(leadUrl) };
}

test.describe('Create Salesforce Leads from Excel', () => {
  test('login → create lead per Excel row → write Lead Id/URL', async ({ page }) => {
    const leadRows: LeadRow[] = readLeadRows(EXCEL_PATH);
    test.setTimeout(Math.max(180_000, leadRows.length * 120_000));
    test.skip(!USERNAME || !PASSWORD, 'Set SALESFORCE_USERNAME and SALESFORCE_PASSWORD in .env');

    await page.setDefaultTimeout(locatorTimeoutMs);

    const results: {
      row: LeadRow;
      ok: boolean;
      leadId?: string;
      leadUrl?: string;
      error?: string;
      skipped?: boolean;
    }[] = [];

    console.log(`\nCreating lead(s) from ${EXCEL_PATH}\n`);

    await loginToSandboxAndOpenHome(page, {
      username: USERNAME,
      password: PASSWORD,
      sfReadyMs,
      untilVisible,
    });

    for (let i = 0; i < leadRows.length; i++) {
      const row = leadRows[i];
      const label = `[${i + 1}/${leadRows.length}] Excel row ${row.rowNumber}: ${row.firstName} ${row.lastName}`;

      if (row.leadId) {
        console.log(`${label} — SKIP (Lead Id already set: ${row.leadId})`);
        results.push({ row, ok: true, leadId: row.leadId, leadUrl: row.leadUrl, skipped: true });
        continue;
      }

      console.log(`${label} — starting`);

      try {
        await openNewLeadForm(page);
        await fillLeadForm(page, row);
        const { leadId, leadUrl } = await saveLeadAndCapture(page);

        writeLeadResultToExcel(EXCEL_PATH, row.rowNumber, { leadId, leadUrl });
        results.push({ row, ok: true, leadId, leadUrl });
        console.log(`${label} — PASS (Lead Id: ${leadId})`);
        console.log(`  URL: ${leadUrl}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({ row, ok: false, error: message });
        console.error(`${label} — FAIL: ${message}`);
      }
    }

    const passed = results.filter((r) => r.ok && !r.skipped).length;
    const skipped = results.filter((r) => r.skipped).length;
    const failed = results.filter((r) => !r.ok).length;

    console.log(
      `\nSummary: ${passed} created, ${skipped} skipped, ${failed} failed (of ${results.length})\n`,
    );

    if (failed > 0) {
      const details = results
        .filter((r) => !r.ok)
        .map((r) => `  row ${r.row.rowNumber}: ${r.error}`)
        .join('\n');
      throw new Error(`${failed} lead(s) failed:\n${details}`);
    }
  });
});
