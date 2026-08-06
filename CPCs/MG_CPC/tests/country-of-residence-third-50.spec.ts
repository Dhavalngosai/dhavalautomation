/**
 * MG CPC – Country of Residence* values (offset + limit): select each → Save → comparison table.
 * Default: third 50 values (items 101–150, offset 100, limit 50).
 *
 * Run:
 *   npm test -- tests/country-of-residence-third-50.spec.ts
 *   run-mg-cpc-country-of-residence-third-50.bat
 *
 * Env:
 *   MG_CPC_URL (optional if DEFAULT_URL still valid)
 *   MG_CPC_COUNTRY_OF_RESIDENCE_LIMIT / MG_CPC_FIELD_LIMIT (default 50)
 *   MG_CPC_COUNTRY_OF_RESIDENCE_OFFSET / MG_CPC_FIELD_OFFSET (default 100)
 */
import { expect, test } from '@playwright/test';
import { attachComparisonReport } from '../lib/comparisonReport.js';
import { formatRangeLabel, getFieldRange, sliceFieldItems, THIRD_FIFTY_RANGE } from '../lib/fieldRange.js';
import {
  clickProfileSave,
  getCountriesOfResidence,
  getCountryOfResidenceLabel,
  openMyProfile,
  setCountryOfResidenceByLabel,
} from '../lib/profileFields.js';

const DEFAULT_URL =
  'https://cloud.explore.motiongatedubai.com/CPC_MG?qs=ABB7InYiOjEsImQiOjQ5NDd9ADMAAAAAAJVb8GGwf_ipgr44rmGukshCP5z0weED32xNcH3I-lIX6JQgFF0nNuxBeQ-1h2NhHqPvg-K68gkpbAB1kKMzEBVb-W71ga6R8xXdI4eB1qK5Gi1qihl6z8k9rtOgepmJvAAcStNH9hQQRCyAav8&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email&utm_term=%%%3dRedirectTo(CloudPagesURL(2579))%3d%%&utm_EmailName=Sanity+Test+Email&Platform_Source=MG&Date=7/24/2026&utm_id=502359&sfmc_id=116255438';

const cpcUrl = (process.env.MG_CPC_URL || DEFAULT_URL).trim();
const { limit, offset } = getFieldRange(
  'MG_CPC_COUNTRY_OF_RESIDENCE_LIMIT',
  'MG_CPC_COUNTRY_OF_RESIDENCE_OFFSET',
  'MG_CPC_FIELD_LIMIT',
  'MG_CPC_FIELD_OFFSET',
  THIRD_FIFTY_RANGE
);
const rangeLabel = formatRangeLabel(offset, limit);

test.describe('MG CPC – Country of Residence* (offset + limit)', () => {
  test(`select & save countries of residence ${rangeLabel}`, async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set MG_CPC_URL in .env to the full Cloud Page link (including qs=).');

    await openMyProfile(page, cpcUrl);

    const allCountries = await getCountriesOfResidence(page);
    expect(allCountries.length).toBeGreaterThan(offset);

    const countriesToRun = sliceFieldItems(allCountries, offset, limit);
    console.log(
      `Found ${allCountries.length} countries of residence. Running ${rangeLabel} (${countriesToRun.length} values)...`
    );

    const comparisonTable: Array<Record<string, string>> = [];

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
          console.error(`[Error] Country of Residence "${label}":`, (err as Error).message);
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
  });
});
