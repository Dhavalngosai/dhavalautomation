/**
 * DPR CPC – Country of Residence* values (offset + limit): select each → Save → comparison table.
 * Default: second 50 values (items 51–100, offset 50, limit 50).
 *
 * Run:
 *   npm test -- tests/country-of-residence-second-50.spec.ts
 *   run-dpr-cpc-country-of-residence-second-50.bat
 *
 * Env:
 *   DPR_CPC_URL (optional if DEFAULT_URL still valid)
 *   DPR_CPC_COUNTRY_OF_RESIDENCE_LIMIT / DPR_CPC_FIELD_LIMIT (default 50)
 *   DPR_CPC_COUNTRY_OF_RESIDENCE_OFFSET / DPR_CPC_FIELD_OFFSET (default 50)
 */
import { expect, test } from '@playwright/test';
import { attachComparisonReport } from '../lib/comparisonReport.js';
import { formatRangeLabel, getFieldRange, sliceFieldItems } from '../lib/fieldRange.js';
import {
  clickProfileSave,
  getCountriesOfResidence,
  getCountryOfResidenceLabel,
  openMyProfile,
  setCountryOfResidenceByLabel,
} from '../lib/profileFields.js';

const DEFAULT_URL =
  'https://cloud.explore.dubaiparksandresorts.com/CPC_DPR?qs=ABB7InYiOjEsImQiOjQ5NDd9ADMAAAAAAJTTvXT3gcJY9nGp6R84ZGnW1vQ17OH9afb1E-BvLHYk1iV-Jw_OFMi4m5SWHgd-tHImlLi4w9Zxcy-hZVoXeXOH6EaxRNmsCX4FPYybf-tF1OAxd-LHGB-FrvJwpTRTY8nIMRjH3uBiAbrdgLo&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email&utm_term=%%%3dRedirectTo(CloudPagesURL(2475))%3d%%&utm_EmailName=Sanity+Test+Email&Platform_Source=DPR&Date=7/24/2026&utm_id=502052&sfmc_id=116255438';

const cpcUrl = (process.env.DPR_CPC_URL || DEFAULT_URL).trim();
const { limit, offset } = getFieldRange(
  'DPR_CPC_COUNTRY_OF_RESIDENCE_LIMIT',
  'DPR_CPC_COUNTRY_OF_RESIDENCE_OFFSET',
  'DPR_CPC_FIELD_LIMIT',
  'DPR_CPC_FIELD_OFFSET'
);
const rangeLabel = formatRangeLabel(offset, limit);

test.describe('DPR CPC – Country of Residence* (offset + limit)', () => {
  test(`select & save countries of residence ${rangeLabel}`, async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set DPR_CPC_URL in .env to the full Cloud Page link (including qs=).');

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
