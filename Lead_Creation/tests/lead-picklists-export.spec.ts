/**
 * Export all selectable values from the Lightning Lead new-record form:
 * picklists, multi-select / dual-listbox, radios, checkbox groups,
 * plus an inventory of other fields (text, lookup, date, etc.).
 *
 * Run: Lead_Creation\run-lead-picklists-export.bat
 *
 * Output:
 *   Lead_Creation/data/lead-picklists.json
 *   Lead_Creation/data/lead-picklists.xlsx  (Field | Type | Value)
 */
import { test } from '@playwright/test';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loginToSandboxAndOpenHome } = require(path.resolve(__dirname, '../../lib/salesforceLogin'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  collectLeadFormPicklists,
  writePicklistsJson,
  writePicklistsExcel,
} = require(path.resolve(__dirname, '../lib/leadPicklists'));

const rawLocatorMs = Number(process.env.SALESFORCE_LOCATOR_TIMEOUT_MS);
const locatorTimeoutMs = Number.isFinite(rawLocatorMs) && rawLocatorMs > 0 ? rawLocatorMs : 30_000;
const untilVisible = { timeout: locatorTimeoutMs };
const sfReadyMs = 20_000;

const USERNAME = process.env.SALESFORCE_USERNAME ?? '';
const PASSWORD = process.env.SALESFORCE_PASSWORD ?? '';

test.describe('Lead picklist export', () => {
  test('collect all field / picklist / multi-select values from Lead new form', async ({ page }) => {
    test.setTimeout(900_000);
    test.skip(!USERNAME || !PASSWORD, 'Set SALESFORCE_USERNAME and SALESFORCE_PASSWORD in .env');

    await page.setDefaultTimeout(locatorTimeoutMs);

    await loginToSandboxAndOpenHome(page, {
      username: USERNAME,
      password: PASSWORD,
      sfReadyMs,
      untilVisible,
    });

    const bundle = await collectLeadFormPicklists(page, {
      sfReadyMs,
      untilVisible: { timeout: Math.max(locatorTimeoutMs, 60_000) },
    });

    const jsonPath = writePicklistsJson(bundle);
    const xlsxPath = writePicklistsExcel(bundle);

    const summary = {
      picklists: Object.keys(bundle.picklists || {}).length,
      multiSelects: Object.keys(bundle.multiSelects || {}).length,
      radios: Object.keys(bundle.radios || {}).length,
      checkboxGroups: Object.keys(bundle.checkboxGroups || {}).length,
      otherFields: Object.keys(bundle.otherFields || {}).length,
    };

    console.log(`\nLead field values written to:`);
    console.log(`  JSON:  ${jsonPath}`);
    console.log(`  Excel: ${xlsxPath}`);
    console.log(`Summary: ${JSON.stringify(summary)}\n`);
    console.log(JSON.stringify(bundle, null, 2));
  });
});
