/**
 * DHE B2B CPC – Country of Residence* values (offset + limit): select each → Save → comparison table.
 * Default: from-226 (226-end) values (items 226-end, offset 225, to last value).
 *
 * Run:
 *   npm test -- tests/country-of-residence-from-226.spec.ts
 *   run-dhe-b2b-cpc-country-of-residence-from-226.bat
 *
 * Env:
 *   DHE_B2B_CPC_URL (optional if DEFAULT_URL still valid)
 *   DHE_B2B_CPC_COUNTRY_OF_RESIDENCE_LIMIT / DHE_B2B_CPC_FIELD_LIMIT (default to-end)
 *   DHE_B2B_CPC_COUNTRY_OF_RESIDENCE_OFFSET / DHE_B2B_CPC_FIELD_OFFSET (default 225)
 */
import { expect, test } from '@playwright/test';
import { attachComparisonReport } from '../lib/comparisonReport.js';
import { formatRangeLabel, getFieldRange, sliceFieldItems, REMAINING_FROM_226_RANGE } from '../lib/fieldRange.js';
import {
  clickProfileSave,
  getCountriesOfResidence,
  getCountryOfResidenceLabel,
  openMyProfile,
  setCountryOfResidenceByLabel,
} from '../lib/profileFields.js';

const DEFAULT_URL =
  'https://cloud.sales.dhentertainment.ae/DHE_B2B_CPC?qs=ABB7InYiOjEsImQiOjQ5NTF9ADMAAAAAAJnCTVLiIp3SnhzaftI0FoBXU1ue5OfsVEHLspRd8v1VTF__NNoNkadoUCfvOxoW44jJBgouTH3TqgLDZJMcsHm3i6_NtncqSzT-ujViFid8FejhrrVXFGDWi26gmJcJBKZmGEsfGiWsvN-XqJI';

const cpcUrl = (process.env.DHE_B2B_CPC_URL || DEFAULT_URL).trim();
const { limit, offset } = getFieldRange(
  'DHE_B2B_CPC_COUNTRY_OF_RESIDENCE_LIMIT',
  'DHE_B2B_CPC_COUNTRY_OF_RESIDENCE_OFFSET',
  'DHE_B2B_CPC_FIELD_LIMIT',
  'DHE_B2B_CPC_FIELD_OFFSET',
  REMAINING_FROM_226_RANGE
);
const rangeLabel = formatRangeLabel(offset, limit);

test.describe('DHE B2B CPC – Country of Residence* (offset + limit)', () => {
  test(`select & save countries of residence ${rangeLabel}`, async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set DHE_B2B_CPC_URL in .env to the full Cloud Page link (including the URL token).');

    await openMyProfile(page, cpcUrl);

    const allCountries = await getCountriesOfResidence(page);
    expect(allCountries.length).toBeGreaterThan(0);

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
