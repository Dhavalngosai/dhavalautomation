/**
 * OB CPC – Country of Residence* values (offset + limit): select each → Save → comparison table.
 * Default: sixth 25 values (items 126-150, offset 125, limit 25).
 *
 * Run:
 *   npm test -- tests/country-of-residence-sixth-25.spec.ts
 *   run-ob-cpc-country-of-residence-sixth-25.bat
 *
 * Env:
 *   OB_CPC_URL (optional if DEFAULT_URL still valid)
 *   OB_CPC_COUNTRY_OF_RESIDENCE_LIMIT / OB_CPC_FIELD_LIMIT (default 25)
 *   OB_CPC_COUNTRY_OF_RESIDENCE_OFFSET / OB_CPC_FIELD_OFFSET (default 75)
 */
import { expect, test } from '@playwright/test';
import { attachComparisonReport } from '../lib/comparisonReport.js';
import { formatRangeLabel, getFieldRange, sliceFieldItems, SIXTH_TWENTY_FIVE_RANGE } from '../lib/fieldRange.js';
import {
  clickProfileSave,
  getCountriesOfResidence,
  getCountryOfResidenceLabel,
  openMyProfile,
  setCountryOfResidenceByLabel,
} from '../lib/profileFields.js';

const DEFAULT_URL =
  'https://cloud.explore.oasisbaydubai.com/OasisBay_CPC?qs=ABB7InYiOjEsImQiOjQ5NTF9ADMAAAAAAJjemzuOjCcWwDIVlijGN82DTPabS3eN9E8KborctEuhDWJgvyxXMC0DoJnTxaBEuNY_EgKupwY8DuRxaGEHGUD6WhnMUdGz7c7x-TweJbnOZjD5p-WxfzWpkqIxtPR2Els_Uzg8KOvCFHvY9os&utm_source=sfmc&utm_medium=email&utm_campaign=Eng+Email+Prod&utm_term=%%%3dRedirectTo(CloudPagesURL(5310))%3d%%&utm_EmailName=Eng+Email+Prod&Platform_Source=OASISBAYDUBAI&Date=7/28/2026&utm_id=502971&sfmc_id=116255438';

const cpcUrl = (process.env.OB_CPC_URL || DEFAULT_URL).trim();
const { limit, offset } = getFieldRange(
  'OB_CPC_COUNTRY_OF_RESIDENCE_LIMIT',
  'OB_CPC_COUNTRY_OF_RESIDENCE_OFFSET',
  'OB_CPC_FIELD_LIMIT',
  'OB_CPC_FIELD_OFFSET',
  SIXTH_TWENTY_FIVE_RANGE
);
const rangeLabel = formatRangeLabel(offset, limit);

test.describe('OB CPC – Country of Residence* (offset + limit)', () => {
  test(`select & save countries of residence ${rangeLabel}`, async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set OB_CPC_URL in .env to the full Cloud Page link (including qs=).');

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
          if (newLabel !== label) {
            throw new Error(
              `Country of Residence did not stick before Save (wanted "${label}", got "${newLabel}")`
            );
          }

          saveStatus = await clickProfileSave(page, cpcUrl);
          newLabel = await getCountryOfResidenceLabel(page);
          result = newLabel === label ? 'Success' : 'Mismatch';
        } catch (err) {
          saveStatus = saveStatus === 'Not Attempted' ? 'Error During Save' : saveStatus;
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
