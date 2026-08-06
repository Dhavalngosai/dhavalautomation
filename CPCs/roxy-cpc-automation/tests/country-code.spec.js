/**
 * Roxy Live CPC – Country Code: select each value → Save → comparison table.
 *
 * Run:
 *   npm test -- tests/country-code.spec.js
 *   run-roxy-country-code.bat
 *
 * Env:
 *   ROXY_CPC_URL
 *   ROXY_CPC_COUNTRY_CODE_LIMIT / ROXY_CPC_FIELD_LIMIT (optional batch size)
 *   ROXY_CPC_COUNTRY_CODE_OFFSET / ROXY_CPC_FIELD_OFFSET (optional batch start)
 */
const { expect, test } = require('@playwright/test');
const { attachComparisonReport } = require('../lib/comparisonReport');
const { formatRangeLabel, getFieldRange, sliceFieldItems } = require('../lib/fieldRange');
const {
  clickProfileSave,
  getCountryCodes,
  openMyProfile,
  setCountryCode,
} = require('../lib/profileFields');
const { getRoxyCpcUrl } = require('../lib/roxyCpcConfig');

const cpcUrl = getRoxyCpcUrl();
const { limit, offset } = getFieldRange(
  'ROXY_CPC_COUNTRY_CODE_LIMIT',
  'ROXY_CPC_COUNTRY_CODE_OFFSET',
  'ROXY_CPC_FIELD_LIMIT',
  'ROXY_CPC_FIELD_OFFSET'
);

test.describe('Roxy Live CPC – Country Code', () => {
  test('select and save each country code', async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set ROXY_CPC_URL in .env to the full Cloud Page link (including qs=).');

    await openMyProfile(page, cpcUrl);

    const allCodes = await getCountryCodes(page);
    expect(allCodes.length).toBeGreaterThan(0);

    const codesToRun = sliceFieldItems(allCodes, offset, limit);
    const rangeLabel = formatRangeLabel(offset, limit, allCodes.length);
    console.log(`Found ${allCodes.length} country codes. Running ${rangeLabel} (${codesToRun.length} values)...`);

    const comparisonTable = [];

    for (let i = 0; i < codesToRun.length; i++) {
      const code = codesToRun[i];

      await test.step(`[${offset + i + 1}/${allCodes.length}] Country code ${code}`, async () => {
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
          console.error(`[Error] Country code "${code}":`, err.message);
        }

        comparisonTable.push({
          Iteration: `[${offset + i + 1}/${allCodes.length}]`,
          'Target Country Code': code,
          'Original Value (Before Change)': previousCode,
          'New Value (After Change)': newCode,
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
      `Country Code Value Comparison Summary (${rangeLabel})`
    );

    const failures = comparisonTable.filter((row) => row.Result !== 'Success');
    expect(failures, `Country code failures:\n${JSON.stringify(failures, null, 2)}`).toEqual([]);
  });
});
