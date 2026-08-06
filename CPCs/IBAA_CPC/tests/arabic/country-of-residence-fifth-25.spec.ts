/**
 * IBAA CPC Arabic QA – Country of Residence* values (offset + limit): select each → Save → comparison table.
 * Default: fifth 25 values (items 101-125, offset 100, limit 25).
 */
import { expect, test } from '@playwright/test';
import { getArabicCpcUrl } from '../../lib/arabicCpcConfig.js';
import {
  clickProfileSave,
  getArabicCountriesOfResidence,
  getArabicCountryOfResidenceLabel,
  openArabicMyProfile,
  reloadArabicMyProfile,
  setCountryOfResidenceByLabel,
} from '../../lib/arabicProfileFields.js';
import { attachComparisonReport } from '../../lib/comparisonReport.js';
import { formatRangeLabel, getFieldRange, sliceFieldItems, FIFTH_TWENTY_FIVE_RANGE } from '../../lib/fieldRange.js';

const cpcUrl = getArabicCpcUrl();
const { limit, offset } = getFieldRange(
  'IBAA_CPC_ARABIC_COUNTRY_OF_RESIDENCE_LIMIT',
  'IBAA_CPC_ARABIC_COUNTRY_OF_RESIDENCE_OFFSET',
  'IBAA_CPC_ARABIC_FIELD_LIMIT',
  'IBAA_CPC_ARABIC_FIELD_OFFSET',
  FIFTH_TWENTY_FIVE_RANGE
);
const rangeLabel = formatRangeLabel(offset, limit);

test.describe('IBAA CPC Arabic – Country of Residence* (offset + limit)', () => {
  test(`select & save countries of residence ${rangeLabel}`, async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set IBAA_CPC_ARABIC_URL in .env to the full Arabic Cloud Page link (including qs=).');

    await openArabicMyProfile(page, cpcUrl);

    const allCountries = await getArabicCountriesOfResidence(page);
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
        if (i > 0) {
          await reloadArabicMyProfile(page, cpcUrl, { requireNationality: false });
        }

        let previousLabel = 'Empty';
        let newLabel = 'Empty';
        let saveStatus = 'Not Attempted';
        let result = 'Failed';

        try {
          previousLabel = await getArabicCountryOfResidenceLabel(page);

          await setCountryOfResidenceByLabel(page, label);
          newLabel = await getArabicCountryOfResidenceLabel(page);
          if (newLabel !== label) {
            throw new Error(`Country of Residence did not update before save. Expected "${label}", got "${newLabel}"`);
          }

          saveStatus = await clickProfileSave(page, cpcUrl);
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
          console.error(`[Error] Country of Residence "${label}":`, (err as Error).message);
        }

        comparisonTable.push({
          Iteration: `[${i + 1}/${countriesToRun.length}]`,
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
      `Arabic country of residence failures:\n${JSON.stringify(failures, null, 2)}`
    ).toEqual([]);
  });
});
