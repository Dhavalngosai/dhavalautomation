/**
 * Roxy Live CPC Arabic – Country of Residence: select each value → Save → comparison table.
 *
 * Run:
 *   npm run test:arabic-country-of-residence
 *   run-roxy-arabic-country-of-residence.bat --headed
 *
 * Env:
 *   ROXY_CPC_ARABIC_URL
 *   ROXY_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT / ROXY_CPC_ARABIC_FIELD_LIMIT (optional batch size)
 *   ROXY_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET / ROXY_CPC_ARABIC_FIELD_OFFSET (optional batch start)
 */
const { expect, test } = require('@playwright/test');
const { getArabicCpcUrl } = require('../../lib/arabicCpcConfig');
const {
  clickProfileSave,
  getArabicCountriesOfResidence,
  getArabicCountryOfResidenceLabel,
  openArabicMyProfile,
  reloadArabicMyProfile,
  setCountryOfResidenceByLabel,
} = require('../../lib/arabicProfileFields');
const { attachComparisonReport } = require('../../lib/comparisonReport');
const { formatRangeLabel, getFieldRange, sliceFieldItems } = require('../../lib/fieldRange');

const cpcUrl = getArabicCpcUrl();
const { limit, offset } = getFieldRange(
  'ROXY_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT',
  'ROXY_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET',
  'ROXY_CPC_ARABIC_FIELD_LIMIT',
  'ROXY_CPC_ARABIC_FIELD_OFFSET'
);

test.describe('Roxy Live CPC Arabic – Country of Residence', () => {
  test('select and save each country of residence (all values)', async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set ROXY_CPC_ARABIC_URL in .env to the full Arabic Cloud Page link (including qs=).');

    await openArabicMyProfile(page, cpcUrl);

    const allCountries = await getArabicCountriesOfResidence(page);
    expect(allCountries.length).toBeGreaterThan(0);

    const countriesToRun = sliceFieldItems(allCountries, offset, limit);
    const rangeLabel = formatRangeLabel(offset, limit, allCountries.length);
    console.log(
      `Found ${allCountries.length} countries of residence. Running ${rangeLabel} (${countriesToRun.length} values)...`
    );

    const comparisonTable = [];

    for (let i = 0; i < countriesToRun.length; i++) {
      const { label } = countriesToRun[i];

      await test.step(`[${offset + i + 1}/${allCountries.length}] Country of Residence ${label}`, async () => {
        let previousLabel = 'Empty';
        let newLabel = 'Empty';
        let saveStatus = 'Not Attempted';
        let result = 'Failed';

        try {
          if (i > 0) {
            await reloadArabicMyProfile(page, cpcUrl, { requireNationality: false });
          }

          previousLabel = await getArabicCountryOfResidenceLabel(page);

          await setCountryOfResidenceByLabel(page, label);
          await page.waitForTimeout(100);
          newLabel = await getArabicCountryOfResidenceLabel(page);
          if (newLabel !== label) {
            throw new Error(
              `Country of Residence did not update before save. Expected "${label}", got "${newLabel}"`
            );
          }

          saveStatus = await clickProfileSave(page);
          newLabel = await getArabicCountryOfResidenceLabel(page, { afterSave: true });
          result = newLabel === label ? 'Success' : 'Mismatch';
        } catch (err) {
          if (saveStatus === 'Not Attempted') {
            saveStatus = 'Error During Save';
          }
          if (newLabel && newLabel !== 'Empty' && newLabel === label) {
            result = 'Success';
          } else if (newLabel && newLabel !== 'Empty') {
            result = 'Mismatch';
          } else {
            result = 'Failed';
          }
          console.error(`[Error] Country of Residence "${label}":`, err.message);
        }

        comparisonTable.push({
          Iteration: `[${offset + i + 1}/${allCountries.length}]`,
          'Target Country of Residence (AR)': label,
          'Original Label (Before Change)': previousLabel,
          'New Label (After Change)': newLabel,
          'Save Status': saveStatus,
          Result: result,
        });
      });
    }

    await attachComparisonReport(
      testInfo,
      comparisonTable,
      `Arabic Country of Residence Value Comparison Summary (${rangeLabel})`
    );

    const failures = comparisonTable.filter((row) => row.Result !== 'Success');
    expect(
      failures,
      `Arabic Country of Residence failures:\n${JSON.stringify(failures, null, 2)}`
    ).toEqual([]);

    const testedCountries = new Set(
      comparisonTable
        .filter((row) => row.Result === 'Success')
        .map((row) => row['Target Country of Residence (AR)'])
    );
    expect(
      testedCountries.size,
      `Expected all ${countriesToRun.length} countries of residence to be verified`
    ).toBe(countriesToRun.length);
  });
});
