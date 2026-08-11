/**
 * MG CPC Arabic QA – Country code + Nationality (offset + limit): set both fields → Save once → comparison row.
 * Default: first 15 pairs (items 1–15, offset 0, limit 15).
 */
import { expect, test } from '@playwright/test';
import { getArabicCpcUrl } from '../../lib/arabicCpcConfig.js';
import {
  clickProfileSave,
  ensureUaeCountryOfResidence,
  getArabicNationalities,
  getArabicNationalityLabel,
  getCountryCodes,
  openArabicMyProfile,
  reloadArabicMyProfile,
  setCountryCode,
  setNationalityByLabel,
} from '../../lib/arabicProfileFields.js';
import { attachComparisonReport } from '../../lib/comparisonReport.js';
import { formatRangeLabel, getFieldRange, sliceFieldItems, FIRST_FIFTEEN_RANGE } from '../../lib/fieldRange.js';

const cpcUrl = getArabicCpcUrl();

const countryCodeRange = getFieldRange(
  'MG_CPC_ARABIC_COUNTRY_CODE_LIMIT',
  'MG_CPC_ARABIC_COUNTRY_CODE_OFFSET',
  'MG_CPC_ARABIC_FIELD_LIMIT',
  'MG_CPC_ARABIC_FIELD_OFFSET',
  FIRST_FIFTEEN_RANGE
);
const nationalityRange = getFieldRange(
  'MG_CPC_ARABIC_NATIONALITY_LIMIT',
  'MG_CPC_ARABIC_NATIONALITY_OFFSET',
  'MG_CPC_ARABIC_FIELD_LIMIT',
  'MG_CPC_ARABIC_FIELD_OFFSET',
  FIRST_FIFTEEN_RANGE
);

function finalizePairResults(
  code: string,
  nationalityLabel: string,
  newCode: string,
  newNationality: string
) {
  const countryCodeResult = newCode === code ? 'Success' : 'Mismatch';
  const nationalityResult = newNationality === nationalityLabel ? 'Success' : 'Mismatch';
  const result =
    countryCodeResult === 'Success' && nationalityResult === 'Success' ? 'Success' : 'Mismatch';

  return { countryCodeResult, nationalityResult, result };
}

test.describe('MG CPC Arabic – Country code + Nationality (paired save)', () => {
  const codeRangeLabel = formatRangeLabel(countryCodeRange.offset, countryCodeRange.limit);
  const nationalityRangeLabel = formatRangeLabel(nationalityRange.offset, nationalityRange.limit);

  test(`set country code + nationality together, save once per pair (${codeRangeLabel})`, async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set MG_CPC_ARABIC_URL in .env to the full Arabic Cloud Page link (including qs=).');
    const startedAt = Date.now();

    await openArabicMyProfile(page, cpcUrl);
    await ensureUaeCountryOfResidence(page);

    const allCodes = await getCountryCodes(page);
    const allNationalities = await getArabicNationalities(page);
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
      `Found ${allCodes.length} country codes (${codeRangeLabel}) and ${allNationalities.length} nationalities (${nationalityRangeLabel}). Running ${pairCount} paired Arabic saves...`
    );

    const comparisonTable: Array<Record<string, string>> = [];

    for (let i = 0; i < pairCount; i++) {
      const code = codesToRun[i];
      const nationalityLabel = nationalitiesToRun[i].label;
      const globalIndex = Math.max(countryCodeRange.offset, nationalityRange.offset) + i + 1;

      await test.step(
        `[${globalIndex}] Country code ${code} + Nationality ${nationalityLabel}`,
        async () => {
          if (i > 0) {
            await reloadArabicMyProfile(page, cpcUrl);
          }

          let previousCode = 'Empty';
          let newCode = 'Empty';
          let previousNationality = 'Empty';
          let newNationality = 'Empty';
          let saveStatus = 'Not Attempted';
          let countryCodeResult = 'Failed';
          let nationalityResult = 'Failed';
          let result = 'Failed';

          try {
            await ensureUaeCountryOfResidence(page);
            await page.locator('#country-code').waitFor({ state: 'visible', timeout: 15_000 });
            await page.locator('#nationality').waitFor({ state: 'attached', timeout: 15_000 });

            previousCode = await page.locator('#country-code').inputValue().catch(() => 'Empty');
            previousNationality = await getArabicNationalityLabel(page);

            await setCountryCode(page, code);
            newCode = await page.locator('#country-code').inputValue();
            await expect(page.locator('#country-code')).toHaveValue(code);

            await setNationalityByLabel(page, nationalityLabel);
            await page.waitForTimeout(100);
            newNationality = await getArabicNationalityLabel(page);

            saveStatus = await clickProfileSave(page);
            await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);

            newCode = await page.locator('#country-code').inputValue().catch(() => newCode);
            newNationality = await getArabicNationalityLabel(page).catch(() => newNationality);

            ({ countryCodeResult, nationalityResult, result } = finalizePairResults(
              code,
              nationalityLabel,
              newCode,
              newNationality
            ));
          } catch (err) {
            saveStatus = saveStatus === 'Not Attempted' ? 'Error During Save' : saveStatus;
            ({ countryCodeResult, nationalityResult, result } = finalizePairResults(
              code,
              nationalityLabel,
              newCode,
              newNationality
            ));
            if (result !== 'Success') {
              result = 'Failed';
            }
            console.error(
              `[Error] Arabic pair country code "${code}" + nationality "${nationalityLabel}":`,
              (err as Error).message
            );
          }

          comparisonTable.push({
            Iteration: `[${globalIndex}/${Math.max(allCodes.length, allNationalities.length)}]`,
            'Target Country Code': code,
            'Original Country Code (Before Change)': previousCode,
            'New Country Code (After Change)': newCode,
            'Country Code Result': countryCodeResult,
            'Target Nationality (AR)': nationalityLabel,
            'Original Nationality (Before Change)': previousNationality,
            'New Nationality (After Change)': newNationality,
            'Nationality Result': nationalityResult,
            'Save Status': saveStatus,
            Result: result,
          });
        }
      );
    }

    await attachComparisonReport(
      testInfo,
      comparisonTable,
      `Arabic Country Code + Nationality Paired Comparison Summary (${codeRangeLabel})`,
      { pageUrl: cpcUrl, startedAt }
    );

    const failures = comparisonTable.filter((row) => row.Result !== 'Success');
    expect(
      failures,
      `Arabic country code + nationality paired failures:\n${JSON.stringify(failures, null, 2)}`
    ).toEqual([]);
  });
});
