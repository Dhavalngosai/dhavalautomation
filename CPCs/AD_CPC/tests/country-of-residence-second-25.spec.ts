/**
 * AD CPC – Country of Residence* values (offset + limit): select each → Save → comparison table.
 * Default: second 25 values (items 26-50, offset 25, limit 25).
 *
 * Run:
 *   npm test -- tests/country-of-residence-second-25.spec.ts
 *   run-ad-cpc-country-of-residence-second-25.bat
 *
 * Env:
 *   AD_CPC_URL (optional if DEFAULT_URL still valid)
 *   AD_CPC_COUNTRY_OF_RESIDENCE_LIMIT / AD_CPC_FIELD_LIMIT (default 25)
 *   AD_CPC_COUNTRY_OF_RESIDENCE_OFFSET / AD_CPC_FIELD_OFFSET (default 25)
 */
import { expect, test } from '@playwright/test';
import { attachComparisonReport } from '../lib/comparisonReport.js';
import { formatRangeLabel, getFieldRange, sliceFieldItems, SECOND_TWENTY_FIVE_RANGE } from '../lib/fieldRange.js';
import {
  clickProfileSave,
  getCountriesOfResidence,
  getCountryOfResidenceLabel,
  openMyProfile,
  setCountryOfResidenceByLabel,
} from '../lib/profileFields.js';

const DEFAULT_URL =
  'https://cloud.explore.aindubai.com/CPC_AD?qs=ABB7InYiOjEsImQiOjQ5NTB9ADMAAAAAAJhtIpCytp_y4gdIwRqU9pcvtsAdvzKFABY7GHM811blSxFuBFZ4nWbVOXSJZmV7X7nU5_h6BzfI2Euso3AQAI8WBF3IFWhwoyECFAfd-mrIAVkuwHFrA3KQfreuhfDt-sBkfaklpWtb7WLPEg0&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email&utm_term=%%%3dRedirectTo(CloudPagesURL(3102))%3d%%&utm_EmailName=Sanity+Test+Email&Platform_Source=AD&Date=7/27/2026&utm_id=502699&sfmc_id=116255438';

const cpcUrl = (process.env.AD_CPC_URL || DEFAULT_URL).trim();
const { limit, offset } = getFieldRange(
  'AD_CPC_COUNTRY_OF_RESIDENCE_LIMIT',
  'AD_CPC_COUNTRY_OF_RESIDENCE_OFFSET',
  'AD_CPC_FIELD_LIMIT',
  'AD_CPC_FIELD_OFFSET',
  SECOND_TWENTY_FIVE_RANGE
);
const rangeLabel = formatRangeLabel(offset, limit);

test.describe('AD CPC – Country of Residence* (offset + limit)', () => {
  test(`select & save countries of residence ${rangeLabel}`, async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set AD_CPC_URL in .env to the full Cloud Page link (including qs=).');

    await openMyProfile(page, cpcUrl);

    const allCountries = await getCountriesOfResidence(page);
    expect(allCountries.length).toBeGreaterThan(0);

    const countriesToRun = sliceFieldItems(allCountries, offset, limit);
    expect(countriesToRun.length).toBeGreaterThan(0);
    console.log(
      `Found ${allCountries.length} countries of residence. Running ${rangeLabel} (${countriesToRun.length} values)...`
    );

    const comparisonTable: Array<Record<string, string>> = [];

    for (let i = 0; i < countriesToRun.length; i++) {
      const { label } = countriesToRun[i];

      await test.step(`[${i + 1}/${countriesToRun.length}] Country of Residence ${label}`, async () => {
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
          console.error(`[Error] Country of Residence "${label}":`, (err as Error).message);
        }

        comparisonTable.push({
          Iteration: `[${i + 1}/${countriesToRun.length}]`,
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
  });
});
