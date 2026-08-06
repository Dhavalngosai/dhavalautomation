/**
 * Roxy Live CPC – Country of Residence: select each value → Save → comparison table.
 *
 * Run:
 *   npm test -- tests/country-of-residence.spec.js
 *   run-roxy-country-of-residence.bat
 *
 * Env:
 *   ROXY_CPC_URL
 *   ROXY_CPC_COUNTRY_OF_RESIDENCE_LIMIT / ROXY_CPC_FIELD_LIMIT (optional batch size)
 *   ROXY_CPC_COUNTRY_OF_RESIDENCE_OFFSET / ROXY_CPC_FIELD_OFFSET (optional batch start)
 */
const { expect, test } = require('@playwright/test');
const { attachComparisonReport } = require('../lib/comparisonReport');
const { formatRangeLabel, getFieldRange, sliceFieldItems } = require('../lib/fieldRange');
const {
  clickProfileSave,
  getCountriesOfResidence,
  getCountryOfResidenceLabel,
  openMyProfile,
  setCountryOfResidenceByLabel,
} = require('../lib/profileFields');
const { getRoxyCpcUrl } = require('../lib/roxyCpcConfig');

const cpcUrl = getRoxyCpcUrl();
const { limit, offset } = getFieldRange(
  'ROXY_CPC_COUNTRY_OF_RESIDENCE_LIMIT',
  'ROXY_CPC_COUNTRY_OF_RESIDENCE_OFFSET',
  'ROXY_CPC_FIELD_LIMIT',
  'ROXY_CPC_FIELD_OFFSET'
);

test.describe('Roxy Live CPC – Country of Residence', () => {
  test('select and save each country of residence (all values)', async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set ROXY_CPC_URL in .env to the full Cloud Page link (including qs=).');

    await openMyProfile(page, cpcUrl);

    const allCountries = await getCountriesOfResidence(page);
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
          await page.locator('#profileCountry').waitFor({ state: 'attached', timeout: 15_000 });
          previousLabel = await getCountryOfResidenceLabel(page);

          await setCountryOfResidenceByLabel(page, label);
          await page.waitForTimeout(100);
          newLabel = await getCountryOfResidenceLabel(page);

          saveStatus = await clickProfileSave(page);
          newLabel = await getCountryOfResidenceLabel(page);
          result = newLabel === label ? 'Success' : 'Mismatch';
        } catch (err) {
          saveStatus = 'Error During Save';
          result = 'Failed';
          console.error(`[Error] Country of Residence "${label}":`, err.message);
        }

        comparisonTable.push({
          Iteration: `[${offset + i + 1}/${allCountries.length}]`,
          'Target Country of Residence': label,
          'Original Label (Before Change)': previousLabel,
          'New Label (After Change)': newLabel,
          'Save Status': saveStatus,
          Result: result,
        });

        if (i < countriesToRun.length - 1) {
          await openMyProfile(page, cpcUrl).catch(async () => {
            await page.goto(cpcUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => undefined);
          });
        }
      });
    }

    await attachComparisonReport(
      testInfo,
      comparisonTable,
      `Country of Residence Value Comparison Summary (${rangeLabel})`
    );

    const failures = comparisonTable.filter((row) => row.Result !== 'Success');
    expect(
      failures,
      `Country of Residence failures:\n${JSON.stringify(failures, null, 2)}`
    ).toEqual([]);

    const testedCountries = new Set(
      comparisonTable
        .filter((row) => row.Result === 'Success')
        .map((row) => row['Target Country of Residence'])
    );
    expect(
      testedCountries.size,
      `Expected all ${countriesToRun.length} countries of residence to be verified`
    ).toBe(countriesToRun.length);
  });
});
