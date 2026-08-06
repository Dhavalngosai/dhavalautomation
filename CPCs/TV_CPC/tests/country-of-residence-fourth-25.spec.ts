/**
 * TV CPC – Country of Residence* values (offset + limit): select each → Save → comparison table.
 * Default: fourth 25 values (items 76-100, offset 75, limit 25).
 *
 * Run:
 *   npm test -- tests/country-of-residence-fourth-25.spec.ts
 *   run-tv-cpc-country-of-residence-fourth-25.bat
 *
 * Env:
 *   TV_CPC_URL (optional if DEFAULT_URL still valid)
 *   TV_CPC_COUNTRY_OF_RESIDENCE_LIMIT / TV_CPC_FIELD_LIMIT (default 25)
 *   TV_CPC_COUNTRY_OF_RESIDENCE_OFFSET / TV_CPC_FIELD_OFFSET (default 75)
 */
import { expect, test } from '@playwright/test';
import { attachComparisonReport } from '../lib/comparisonReport.js';
import { formatRangeLabel, getFieldRange, sliceFieldItems, FOURTH_TWENTY_FIVE_RANGE } from '../lib/fieldRange.js';
import {
  clickProfileSave,
  getCountriesOfResidence,
  getCountryOfResidenceLabel,
  openMyProfile,
  setCountryOfResidenceByLabel,
} from '../lib/profileFields.js';

const DEFAULT_URL =
  'https://cloud.explore.theviewpalm.ae/CPC_TV?qs=ABB7InYiOjEsImQiOjQ5NTF9ADMAAAAAAJmJNwNs6Ct727vPkaH1WeP-Wdxx_NlRS-VRVSR_vWZp4Ik_XnsmK1hFfPSjBF5wyHK2nVNMpPHS_wPkasg_gi0KFuWcvQKuR12RYtAMhUMhFhIbTlKyHWvasOnBiicgfk4q1j4Od1B4YqjDHdM&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+Prod&utm_term=%%%3dRedirectTo(CloudPagesURL(3623))%3d%%&utm_EmailName=Sanity+Test+Email+Prod&Platform_Source=TV&Date=7/27/2026&utm_id=502952&sfmc_id=116255438';

const cpcUrl = (process.env.TV_CPC_URL || DEFAULT_URL).trim();
const { limit, offset } = getFieldRange(
  'TV_CPC_COUNTRY_OF_RESIDENCE_LIMIT',
  'TV_CPC_COUNTRY_OF_RESIDENCE_OFFSET',
  'TV_CPC_FIELD_LIMIT',
  'TV_CPC_FIELD_OFFSET',
  FOURTH_TWENTY_FIVE_RANGE
);
const rangeLabel = formatRangeLabel(offset, limit);

test.describe('TV CPC – Country of Residence* (offset + limit)', () => {
  test(`select & save countries of residence ${rangeLabel}`, async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set TV_CPC_URL in .env to the full Cloud Page link (including qs=).');

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
