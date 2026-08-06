/**
 * DHE B2B CPC Arabic QA – Country code (offset + limit): set each code → Save → comparison row.
 * Default: from-226 (226-end) values (items 226-end, offset 225, to last value).
 *
 * Note: DHE B2B has no Nationality field; this suite covers Business Phone country code only.
 */
import { expect, test } from '@playwright/test';
import { getArabicCpcUrl } from '../../lib/arabicCpcConfig.js';
import {
  clickProfileSave,
  getCountryCodes,
  openArabicMyProfile,
  reloadArabicMyProfile,
  setCountryCode,
} from '../../lib/arabicProfileFields.js';
import { attachComparisonReport } from '../../lib/comparisonReport.js';
import { formatRangeLabel, getFieldRange, sliceFieldItems, REMAINING_FROM_226_RANGE } from '../../lib/fieldRange.js';

const cpcUrl = getArabicCpcUrl();

const countryCodeRange = getFieldRange(
  'DHE_B2B_CPC_ARABIC_COUNTRY_CODE_LIMIT',
  'DHE_B2B_CPC_ARABIC_COUNTRY_CODE_OFFSET',
  'DHE_B2B_CPC_ARABIC_FIELD_LIMIT',
  'DHE_B2B_CPC_ARABIC_FIELD_OFFSET',
  REMAINING_FROM_226_RANGE
);

test.describe('DHE B2B CPC Arabic – Country code (offset + limit)', () => {
  const codeRangeLabel = formatRangeLabel(countryCodeRange.offset, countryCodeRange.limit);

  test(`set & save country codes ${codeRangeLabel}`, async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set DHE_B2B_CPC_ARABIC_URL in .env to the full Arabic Cloud Page link (including the URL token).');

    await openArabicMyProfile(page, cpcUrl);

    const allCodes = await getCountryCodes(page);
    expect(allCodes.length).toBeGreaterThan(countryCodeRange.offset);

    const codesToRun = sliceFieldItems(allCodes, countryCodeRange.offset, countryCodeRange.limit);
    expect(codesToRun.length).toBeGreaterThan(0);

    console.log(
      `Found ${allCodes.length} country codes. Running ${codesToRun.length} Arabic saves (${codeRangeLabel})...`
    );

    const comparisonTable: Array<Record<string, string>> = [];

    for (let i = 0; i < codesToRun.length; i++) {
      const code = codesToRun[i];
      const globalIndex = countryCodeRange.offset + i + 1;

      await test.step(`[${globalIndex}] Country code ${code}`, async () => {
        if (i > 0) {
          await reloadArabicMyProfile(page, cpcUrl, { requireNationality: false });
        }

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
          await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);

          newCode = await page.locator('#country-code').inputValue().catch(() => newCode);
          result = newCode === code ? 'Success' : 'Mismatch';
        } catch (err) {
          saveStatus = saveStatus === 'Not Attempted' ? 'Error During Save' : saveStatus;
          result = 'Failed';
          console.error(`[Error] Arabic country code "${code}":`, (err as Error).message);
        }

        comparisonTable.push({
          Iteration: `[${globalIndex}/${allCodes.length}]`,
          'Target Country Code': code,
          'Original Country Code (Before Change)': previousCode,
          'New Country Code (After Change)': newCode,
          'Save Status': saveStatus,
          Result: result,
        });
      });
    }

    await attachComparisonReport(
      testInfo,
      comparisonTable,
      `Arabic Country Code Value Comparison Summary (${codeRangeLabel})`
    );

    const failures = comparisonTable.filter((row) => row.Result !== 'Success');
    expect(failures, `Arabic country code failures:\n${JSON.stringify(failures, null, 2)}`).toEqual([]);
  });
});
