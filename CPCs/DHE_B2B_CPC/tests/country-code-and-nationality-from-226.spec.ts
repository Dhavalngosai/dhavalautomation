/**
 * DHE B2B CPC – Country code (offset + limit): set each code → Save → comparison row.
 * Default: from-226 (226-end) values (items 226-end, offset 225, to last value).
 *
 * Note: DHE B2B has no Nationality field; this suite covers Business Phone country code only.
 *
 * Run:
 *   npm test -- tests/country-code-and-nationality-from-226.spec.ts
 *   run-dhe-b2b-cpc-from-226.bat
 *   run-dhe-b2b-cpc-from-226.bat --headed
 *
 * Env:
 *   DHE_B2B_CPC_URL (optional if DEFAULT_URL still valid)
 *   DHE_B2B_CPC_COUNTRY_CODE_LIMIT / DHE_B2B_CPC_FIELD_LIMIT (default to-end)
 *   DHE_B2B_CPC_COUNTRY_CODE_OFFSET / DHE_B2B_CPC_FIELD_OFFSET (default 225)
 */
import { expect, test } from '@playwright/test';
import { attachComparisonReport } from '../lib/comparisonReport.js';
import { formatRangeLabel, getFieldRange, sliceFieldItems, REMAINING_FROM_226_RANGE } from '../lib/fieldRange.js';
import {
  clickProfileSave,
  getCountryCodes,
  openMyProfile,
  setCountryCode,
} from '../lib/profileFields.js';

const DEFAULT_URL =
  'https://cloud.sales.dhentertainment.ae/DHE_B2B_CPC?qs=ABB7InYiOjEsImQiOjQ5NTF9ADMAAAAAAJnCTVLiIp3SnhzaftI0FoBXU1ue5OfsVEHLspRd8v1VTF__NNoNkadoUCfvOxoW44jJBgouTH3TqgLDZJMcsHm3i6_NtncqSzT-ujViFid8FejhrrVXFGDWi26gmJcJBKZmGEsfGiWsvN-XqJI';

const cpcUrl = (process.env.DHE_B2B_CPC_URL || DEFAULT_URL).trim();

const countryCodeRange = getFieldRange(
  'DHE_B2B_CPC_COUNTRY_CODE_LIMIT',
  'DHE_B2B_CPC_COUNTRY_CODE_OFFSET',
  'DHE_B2B_CPC_FIELD_LIMIT',
  'DHE_B2B_CPC_FIELD_OFFSET',
  REMAINING_FROM_226_RANGE
);

test.describe('DHE B2B CPC – Country code (offset + limit)', () => {
  const codeRangeLabel = formatRangeLabel(countryCodeRange.offset, countryCodeRange.limit);

  test(`set & save country codes ${codeRangeLabel}`, async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set DHE_B2B_CPC_URL in .env to the full Cloud Page link (including the URL token).');

    await openMyProfile(page, cpcUrl);

    const allCodes = await getCountryCodes(page);
    expect(allCodes.length).toBeGreaterThan(countryCodeRange.offset);

    const codesToRun = sliceFieldItems(allCodes, countryCodeRange.offset, countryCodeRange.limit);
    expect(codesToRun.length).toBeGreaterThan(0);

    console.log(
      `Found ${allCodes.length} country codes. Running ${codesToRun.length} saves (${codeRangeLabel})...`
    );

    const comparisonTable: Array<Record<string, string>> = [];

    for (let i = 0; i < codesToRun.length; i++) {
      const code = codesToRun[i];
      const globalIndex = countryCodeRange.offset + i + 1;

      await test.step(`[${globalIndex}] Country code ${code}`, async () => {
        let previousCode = 'Empty';
        let newCode = 'Empty';
        let saveStatus = 'Not Attempted';
        let result = 'Failed';

        try {
          await page.locator('#country-code').waitFor({ state: 'visible', timeout: 15_000 });

          previousCode = await page.locator('#country-code').inputValue().catch(() => 'Empty');

          await setCountryCode(page, code);
          newCode = await page.locator('#country-code').inputValue();
          await expect(page.locator('#country-code')).toHaveValue(code);

          saveStatus = await clickProfileSave(page);

          newCode = await page.locator('#country-code').inputValue().catch(() => newCode);
          result = newCode === code ? 'Success' : 'Mismatch';
        } catch (err) {
          saveStatus = 'Error During Save';
          result = 'Failed';
          console.error(`[Error] Country code "${code}":`, (err as Error).message);
        }

        comparisonTable.push({
          Iteration: `[${globalIndex}/${allCodes.length}]`,
          'Target Country Code': code,
          'Original Country Code (Before Change)': previousCode,
          'New Country Code (After Change)': newCode,
          'Save Status': saveStatus,
          Result: result,
        });

        if (i < codesToRun.length - 1) {
          await openMyProfile(page, cpcUrl).catch(async () => {
            await page.goto(cpcUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => undefined);
          });
        }
      });
    }

    await attachComparisonReport(
      testInfo,
      comparisonTable,
      `Country Code Value Comparison Summary (${codeRangeLabel})`
    );

    const failures = comparisonTable.filter((row) => row.Result !== 'Success');
    expect(failures, `Country code failures:\n${JSON.stringify(failures, null, 2)}`).toEqual([]);
  });
});
