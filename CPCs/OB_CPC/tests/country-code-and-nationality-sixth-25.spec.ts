/**
 * OB CPC – Country code + Nationality (offset + limit): set both fields → Save once → comparison row.
 * Default: sixth 25 pairs (items 126-150, offset 125, limit 25).
 * 
 *
 * Run:
 *   npm test -- tests/country-code-and-nationality-sixth-25.spec.ts
 *   run-ob-cpc-sixth-25.bat
 *   run-ob-cpc-sixth-25.bat --headed
 *
 * Env:
 *   OB_CPC_URL (optional if DEFAULT_URL still valid)
 *   OB_CPC_COUNTRY_CODE_LIMIT / OB_CPC_NATIONALITY_LIMIT / OB_CPC_FIELD_LIMIT (default 25)
 *   OB_CPC_COUNTRY_CODE_OFFSET / OB_CPC_NATIONALITY_OFFSET / OB_CPC_FIELD_OFFSET (default 75)
 */
import { expect, test } from '@playwright/test';
import { attachComparisonReport } from '../lib/comparisonReport.js';
import { formatRangeLabel, getFieldRange, sliceFieldItems, SIXTH_TWENTY_FIVE_RANGE } from '../lib/fieldRange.js';
import {
  clickProfileSave,
  ensureUaeCountryOfResidence,
  getCountryCodes,
  getNationalities,
  openMyProfile,
  setCountryCode,
  setNationalityByLabel,
} from '../lib/profileFields.js';

const DEFAULT_URL =
  'https://cloud.explore.oasisbaydubai.com/OasisBay_CPC?qs=ABB7InYiOjEsImQiOjQ5NTF9ADMAAAAAAJjemzuOjCcWwDIVlijGN82DTPabS3eN9E8KborctEuhDWJgvyxXMC0DoJnTxaBEuNY_EgKupwY8DuRxaGEHGUD6WhnMUdGz7c7x-TweJbnOZjD5p-WxfzWpkqIxtPR2Els_Uzg8KOvCFHvY9os&utm_source=sfmc&utm_medium=email&utm_campaign=Eng+Email+Prod&utm_term=%%%3dRedirectTo(CloudPagesURL(5310))%3d%%&utm_EmailName=Eng+Email+Prod&Platform_Source=OASISBAYDUBAI&Date=7/28/2026&utm_id=502971&sfmc_id=116255438';

const cpcUrl = (process.env.OB_CPC_URL || DEFAULT_URL).trim();

const countryCodeRange = getFieldRange(
  'OB_CPC_COUNTRY_CODE_LIMIT',
  'OB_CPC_COUNTRY_CODE_OFFSET',
  'OB_CPC_FIELD_LIMIT',
  'OB_CPC_FIELD_OFFSET',
  SIXTH_TWENTY_FIVE_RANGE
);
const nationalityRange = getFieldRange(
  'OB_CPC_NATIONALITY_LIMIT',
  'OB_CPC_NATIONALITY_OFFSET',
  'OB_CPC_FIELD_LIMIT',
  'OB_CPC_FIELD_OFFSET',
  SIXTH_TWENTY_FIVE_RANGE
);

async function getSelectedNationalityLabel(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => {
    const selectEl = document.querySelector('#nationality') as HTMLSelectElement | null;
    return selectEl?.selectedOptions?.[0]?.textContent?.trim() || 'Empty';
  });
}

test.describe('OB CPC – Country code + Nationality (paired save)', () => {
  const codeRangeLabel = formatRangeLabel(countryCodeRange.offset, countryCodeRange.limit);
  const nationalityRangeLabel = formatRangeLabel(nationalityRange.offset, nationalityRange.limit);

  test(`set country code + nationality together, save once per pair (${codeRangeLabel})`, async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set OB_CPC_URL in .env to the full Cloud Page link (including qs=).');

    await openMyProfile(page, cpcUrl);

    const allCodes = await getCountryCodes(page);
    const allNationalities = await getNationalities(page);
    expect(allCodes.length).toBeGreaterThan(0);
    expect(allNationalities.length).toBeGreaterThan(0);

    const codesToRun = sliceFieldItems(allCodes, countryCodeRange.offset, countryCodeRange.limit);
    const nationalitiesToRun = sliceFieldItems(
      allNationalities,
      nationalityRange.offset,
      nationalityRange.limit
    );
    const pairCount = Math.min(codesToRun.length, nationalitiesToRun.length);
    expect(pairCount).toBeGreaterThan(0);

    console.log(
      `Found ${allCodes.length} country codes (${codeRangeLabel}) and ${allNationalities.length} nationalities (${nationalityRangeLabel}). Running ${pairCount} paired saves...`
    );

    const comparisonTable: Array<Record<string, string>> = [];

    for (let i = 0; i < pairCount; i++) {
      const code = codesToRun[i];
      const nationalityLabel = nationalitiesToRun[i].label;
      const globalIndex = i + 1;

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

            await ensureUaeCountryOfResidence(page);

            previousCode = await page.locator('#country-code').inputValue().catch(() => 'Empty');
            previousNationality = await getSelectedNationalityLabel(page);

            await setCountryCode(page, code);
            newCode = await page.locator('#country-code').inputValue();
            await expect(page.locator('#country-code')).toHaveValue(code);

            await setNationalityByLabel(page, nationalityLabel);
            await page.waitForTimeout(100);
            newNationality = await getSelectedNationalityLabel(page);
            if (newNationality !== nationalityLabel) {
              throw new Error(
                `Nationality did not stick before Save (wanted "${nationalityLabel}", got "${newNationality}")`
              );
            }

            saveStatus = await clickProfileSave(page, cpcUrl);

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
            Iteration: `[${globalIndex}/${pairCount}]`,
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
