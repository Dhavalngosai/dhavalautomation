/**
 * MG CPC – Country of Residence* values (offset + limit): select each → Save → comparison table.
 * Default: first 15 values (items 1–15, offset 0, limit 15).
 *
 * Run:
 *   npm test -- tests/country-of-residence-first-15.spec.ts
 *   run-mg-cpc-country-of-residence-first-15.bat
 *
 * Env:
 *   MG_CPC_URL (optional if DEFAULT_URL still valid)
 *   MG_CPC_COUNTRY_OF_RESIDENCE_LIMIT / MG_CPC_FIELD_LIMIT (default 15)
 *   MG_CPC_COUNTRY_OF_RESIDENCE_OFFSET / MG_CPC_FIELD_OFFSET (default 0)
 */
import { expect, test } from '@playwright/test';
import { attachComparisonReport } from '../lib/comparisonReport.js';
import { formatRangeLabel, getFieldRange, sliceFieldItems, FIRST_FIFTEEN_RANGE } from '../lib/fieldRange.js';
import {
  clickProfileSave,
  getCountriesOfResidence,
  getCountryOfResidenceLabel,
  openMyProfile,
  setCountryOfResidenceByLabel,
} from '../lib/profileFields.js';

const DEFAULT_URL =
  'https://cloud.explore.motiongatedubai.com/MGQA_CPC?qs=ABB7InYiOjEsImQiOjQ5MzN9ADMAAAAAAILdOENZHPH8DW2REwRyceKAjd4ir8D4rBIxzTQRN2ABJ4xakeQWRUk79SPDkzYJnQLJgV0-FOKdOIPCLS2J_-Ba1ru41AZ-b_2JnbeDDgc9v_FAkUpCtx7XDvnBWFfXaREGjk9BfFlfbahRFH0&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+QA&utm_term=%%%3dRedirectTo(CloudPagesURL(2556))%3d%%&utm_EmailName=Sanity+Test+Email+QA&Platform_Source=MG&Date=7/10/2026&utm_id=498789&sfmc_id=116255438';

const cpcUrl = (process.env.MG_CPC_URL || DEFAULT_URL).trim();
const { limit, offset } = getFieldRange(
  'MG_CPC_COUNTRY_OF_RESIDENCE_LIMIT',
  'MG_CPC_COUNTRY_OF_RESIDENCE_OFFSET',
  'MG_CPC_FIELD_LIMIT',
  'MG_CPC_FIELD_OFFSET',
  FIRST_FIFTEEN_RANGE
);
const rangeLabel = formatRangeLabel(offset, limit);

test.describe('MG CPC – Country of Residence* (offset + limit)', () => {
  test(`select & save countries of residence ${rangeLabel}`, async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set MG_CPC_URL in .env to the full Cloud Page link (including qs=).');
    const startedAt = Date.now();

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
      `Country of Residence Value Comparison Summary (${rangeLabel})`,
      { pageUrl: cpcUrl, startedAt }
    );

    const failures = comparisonTable.filter((row) => row.Result !== 'Success');
    expect(
      failures,
      `Country of Residence failures:\n${JSON.stringify(failures, null, 2)}`
    ).toEqual([]);
  });
});
