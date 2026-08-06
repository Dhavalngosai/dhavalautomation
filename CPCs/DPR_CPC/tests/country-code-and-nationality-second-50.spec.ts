/**
 * DPR CPC – Country code + Nationality (offset + limit): set both fields → Save once → comparison row.
 * Default: second 50 pairs (items 51–100, offset 50, limit 50).
 *
 * Run:
 *   npm test -- tests/country-code-and-nationality-second-50.spec.ts
 *   run-dpr-cpc-second-50.bat
 *   run-dpr-cpc-second-50.bat --headed
 *
 * Env:
 *   DPR_CPC_URL (optional if DEFAULT_URL still valid)
 *   DPR_CPC_COUNTRY_CODE_LIMIT / DPR_CPC_NATIONALITY_LIMIT / DPR_CPC_FIELD_LIMIT (default 50)
 *   DPR_CPC_COUNTRY_CODE_OFFSET / DPR_CPC_NATIONALITY_OFFSET / DPR_CPC_FIELD_OFFSET (default 50)
 */
import { expect, test } from '@playwright/test';
import { attachComparisonReport } from '../lib/comparisonReport.js';
import { formatRangeLabel, getFieldRange, sliceFieldItems } from '../lib/fieldRange.js';
import {
  clickProfileSave,
  getCountryCodes,
  getNationalities,
  openMyProfile,
  setCountryCode,
  setNationalityByLabel,
} from '../lib/profileFields.js';

const DEFAULT_URL =
  'https://cloud.explore.dubaiparksandresorts.com/CPC_DPR?qs=ABB7InYiOjEsImQiOjQ5NDd9ADMAAAAAAJTTvXT3gcJY9nGp6R84ZGnW1vQ17OH9afb1E-BvLHYk1iV-Jw_OFMi4m5SWHgd-tHImlLi4w9Zxcy-hZVoXeXOH6EaxRNmsCX4FPYybf-tF1OAxd-LHGB-FrvJwpTRTY8nIMRjH3uBiAbrdgLo&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email&utm_term=%%%3dRedirectTo(CloudPagesURL(2475))%3d%%&utm_EmailName=Sanity+Test+Email&Platform_Source=DPR&Date=7/24/2026&utm_id=502052&sfmc_id=116255438';

const cpcUrl = (process.env.DPR_CPC_URL || DEFAULT_URL).trim();

const countryCodeRange = getFieldRange(
  'DPR_CPC_COUNTRY_CODE_LIMIT',
  'DPR_CPC_COUNTRY_CODE_OFFSET',
  'DPR_CPC_FIELD_LIMIT',
  'DPR_CPC_FIELD_OFFSET'
);
const nationalityRange = getFieldRange(
  'DPR_CPC_NATIONALITY_LIMIT',
  'DPR_CPC_NATIONALITY_OFFSET',
  'DPR_CPC_FIELD_LIMIT',
  'DPR_CPC_FIELD_OFFSET'
);

async function getSelectedNationalityLabel(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => {
    const selectEl = document.querySelector('#nationality') as HTMLSelectElement | null;
    return selectEl?.selectedOptions?.[0]?.textContent?.trim() || 'Empty';
  });
}

test.describe('DPR CPC – Country code + Nationality (paired save)', () => {
  const codeRangeLabel = formatRangeLabel(countryCodeRange.offset, countryCodeRange.limit);
  const nationalityRangeLabel = formatRangeLabel(nationalityRange.offset, nationalityRange.limit);

  test(`set country code + nationality together, save once per pair (${codeRangeLabel})`, async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set DPR_CPC_URL in .env to the full Cloud Page link (including qs=).');

    await openMyProfile(page, cpcUrl);

    const allCodes = await getCountryCodes(page);
    const allNationalities = await getNationalities(page);
    expect(allCodes.length).toBeGreaterThan(countryCodeRange.offset);
    expect(allNationalities.length).toBeGreaterThan(nationalityRange.offset);

    const codesToRun = sliceFieldItems(allCodes, countryCodeRange.offset, countryCodeRange.limit);
    const nationalitiesToRun = sliceFieldItems(
      allNationalities,
      nationalityRange.offset,
      nationalityRange.limit
    );
    const pairCount = Math.min(codesToRun.length, nationalitiesToRun.length);

    console.log(
      `Found ${allCodes.length} country codes (${codeRangeLabel}) and ${allNationalities.length} nationalities (${nationalityRangeLabel}). Running ${pairCount} paired saves...`
    );

    const comparisonTable: Array<Record<string, string>> = [];

    for (let i = 0; i < pairCount; i++) {
      const code = codesToRun[i];
      const nationalityLabel = nationalitiesToRun[i].label;
      const globalIndex = Math.max(countryCodeRange.offset, nationalityRange.offset) + i + 1;

      await test.step(
        `[${globalIndex}] Country code ${code} + Nationality ${nationalityLabel}`,
        async () => {
          let previousCode = 'Empty';
          let newCode = 'Empty';
          let previousNationality = 'Empty';
          let newNationality = 'Empty';
          let saveStatus = 'Not Attempted';
          let countryCodeResult = 'Failed';
          let nationalityResult = 'Failed';
          let result = 'Failed';

          try {
            await page.locator('#country-code').waitFor({ state: 'visible', timeout: 15_000 });
            await page.locator('#nationality').waitFor({ state: 'attached', timeout: 15_000 });

            previousCode = await page.locator('#country-code').inputValue().catch(() => 'Empty');
            previousNationality = await getSelectedNationalityLabel(page);

            await setCountryCode(page, code);
            newCode = await page.locator('#country-code').inputValue();
            await expect(page.locator('#country-code')).toHaveValue(code);

            await setNationalityByLabel(page, nationalityLabel);
            await page.waitForTimeout(100);
            newNationality = await getSelectedNationalityLabel(page);

            saveStatus = await clickProfileSave(page);

            newCode = await page.locator('#country-code').inputValue().catch(() => newCode);
            newNationality = await getSelectedNationalityLabel(page).catch(() => newNationality);

            countryCodeResult = newCode === code ? 'Success' : 'Mismatch';
            nationalityResult = newNationality === nationalityLabel ? 'Success' : 'Mismatch';
            result =
              countryCodeResult === 'Success' && nationalityResult === 'Success' ? 'Success' : 'Mismatch';
          } catch (err) {
            saveStatus = 'Error During Save';
            result = 'Failed';
            console.error(
              `[Error] Pair country code "${code}" + nationality "${nationalityLabel}":`,
              (err as Error).message
            );
          }

          comparisonTable.push({
            Iteration: `[${globalIndex}/${Math.max(allCodes.length, allNationalities.length)}]`,
            'Target Country Code': code,
            'Original Country Code (Before Change)': previousCode,
            'New Country Code (After Change)': newCode,
            'Country Code Result': countryCodeResult,
            'Target Nationality': nationalityLabel,
            'Original Nationality (Before Change)': previousNationality,
            'New Nationality (After Change)': newNationality,
            'Nationality Result': nationalityResult,
            'Save Status': saveStatus,
            Result: result,
          });

          if (i < pairCount - 1) {
            await openMyProfile(page, cpcUrl).catch(async () => {
              await page.goto(cpcUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => undefined);
            });
          }
        }
      );
    }

    await attachComparisonReport(
      testInfo,
      comparisonTable,
      `Country Code + Nationality Paired Comparison Summary (${codeRangeLabel})`
    );

    const failures = comparisonTable.filter((row) => row.Result !== 'Success');
    expect(
      failures,
      `Country code + nationality paired failures:\n${JSON.stringify(failures, null, 2)}`
    ).toEqual([]);
  });
});
