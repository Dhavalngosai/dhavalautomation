/**
 * Roxy Live CPC Arabic – Country Code + Nationality (paired save): set both fields → Save once → comparison row.
 * Verifies all country codes and all nationalities (default: no limit).
 *
 * Run:
 *   npm run test:arabic-country-code-and-nationality
 *   run-roxy-arabic-country-code-and-nationality.bat --headed
 *
 * Env:
 *   ROXY_CPC_ARABIC_URL
 *   ROXY_CPC_ARABIC_COUNTRY_CODE_LIMIT / ROXY_CPC_ARABIC_NATIONALITY_LIMIT / ROXY_CPC_ARABIC_FIELD_LIMIT (optional)
 *   ROXY_CPC_ARABIC_COUNTRY_CODE_OFFSET / ROXY_CPC_ARABIC_NATIONALITY_OFFSET / ROXY_CPC_ARABIC_FIELD_OFFSET (optional)
 */
const { expect, test } = require('@playwright/test');
const { getArabicCpcUrl } = require('../../lib/arabicCpcConfig');
const {
  clickProfileSave,
  ensureUaeCountryOfResidence,
  getArabicNationalities,
  getArabicNationalityLabel,
  getCountryCodes,
  openArabicMyProfile,
  reloadArabicMyProfile,
  setCountryCode,
  setNationalityByLabel,
} = require('../../lib/arabicProfileFields');
const { attachComparisonReport } = require('../../lib/comparisonReport');
const { formatRangeLabel, getFieldRange, sliceFieldItems } = require('../../lib/fieldRange');

const cpcUrl = getArabicCpcUrl();

const countryCodeRange = getFieldRange(
  'ROXY_CPC_ARABIC_COUNTRY_CODE_LIMIT',
  'ROXY_CPC_ARABIC_COUNTRY_CODE_OFFSET',
  'ROXY_CPC_ARABIC_FIELD_LIMIT',
  'ROXY_CPC_ARABIC_FIELD_OFFSET'
);
const nationalityRange = getFieldRange(
  'ROXY_CPC_ARABIC_NATIONALITY_LIMIT',
  'ROXY_CPC_ARABIC_NATIONALITY_OFFSET',
  'ROXY_CPC_ARABIC_FIELD_LIMIT',
  'ROXY_CPC_ARABIC_FIELD_OFFSET'
);

test.describe('Roxy Live CPC Arabic – Country Code + Nationality (paired save)', () => {
  test('set country code and nationality together, save once per iteration (all values)', async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set ROXY_CPC_ARABIC_URL in .env to the full Arabic Cloud Page link (including qs=).');

    await openArabicMyProfile(page, cpcUrl);

    const allCodes = await getCountryCodes(page);
    const allNationalities = await getArabicNationalities(page);
    expect(allCodes.length).toBeGreaterThan(0);
    expect(allNationalities.length).toBeGreaterThan(0);

    const codesToRun = sliceFieldItems(allCodes, countryCodeRange.offset, countryCodeRange.limit);
    const nationalitiesToRun = sliceFieldItems(
      allNationalities,
      nationalityRange.offset,
      nationalityRange.limit
    );
    const iterationCount = Math.max(codesToRun.length, nationalitiesToRun.length);

    const codeRangeLabel = formatRangeLabel(
      countryCodeRange.offset,
      countryCodeRange.limit,
      allCodes.length
    );
    const nationalityRangeLabel = formatRangeLabel(
      nationalityRange.offset,
      nationalityRange.limit,
      allNationalities.length
    );

    console.log(
      `Found ${allCodes.length} country codes (${codeRangeLabel}) and ${allNationalities.length} nationalities (${nationalityRangeLabel}). Running ${iterationCount} paired Arabic saves...`
    );

    const comparisonTable = [];

    for (let i = 0; i < iterationCount; i++) {
      const code = i < codesToRun.length ? codesToRun[i] : null;
      const nationalityLabel = i < nationalitiesToRun.length ? nationalitiesToRun[i].label : null;
      const stepLabel = [
        code ? `Country code ${code}` : null,
        nationalityLabel ? `Nationality ${nationalityLabel}` : null,
      ]
        .filter(Boolean)
        .join(' + ');

      await test.step(`[${i + 1}/${iterationCount}] ${stepLabel}`, async () => {
        let previousCode = 'Empty';
        let newCode = 'Empty';
        let previousNationality = 'Empty';
        let newNationality = 'Empty';
        let saveStatus = 'Not Attempted';
        let countryCodeResult = 'N/A';
        let nationalityResult = 'N/A';
        let result = 'Failed';

        try {
          if (i > 0) {
            await reloadArabicMyProfile(page, cpcUrl);
          }

          await page.locator('#country-code').waitFor({ state: 'visible', timeout: 15_000 });
          await page.locator('#nationality').waitFor({ state: 'attached', timeout: 15_000 });
          await ensureUaeCountryOfResidence(page);

          previousCode = await page.locator('#country-code').inputValue().catch(() => 'Empty');
          previousNationality = await getArabicNationalityLabel(page);

          if (code) {
            await setCountryCode(page, code);
            newCode = await page.locator('#country-code').inputValue();
            await expect(page.locator('#country-code')).toHaveValue(code);
            countryCodeResult = newCode === code ? 'Success' : 'Mismatch';
          } else {
            newCode = previousCode;
          }

          if (nationalityLabel) {
            await setNationalityByLabel(page, nationalityLabel);
            await page.waitForTimeout(100);
            newNationality = await getArabicNationalityLabel(page);
            nationalityResult = newNationality === nationalityLabel ? 'Success' : 'Mismatch';
          } else {
            newNationality = previousNationality;
          }

          saveStatus = await clickProfileSave(page);

          if (code) {
            newCode = await page.locator('#country-code').inputValue().catch(() => newCode);
            countryCodeResult = newCode === code ? 'Success' : 'Mismatch';
          }
          if (nationalityLabel) {
            newNationality = await getArabicNationalityLabel(page).catch(() => newNationality);
            nationalityResult = newNationality === nationalityLabel ? 'Success' : 'Mismatch';
          }

          const codeOk = countryCodeResult === 'Success' || countryCodeResult === 'N/A';
          const nationalityOk = nationalityResult === 'Success' || nationalityResult === 'N/A';
          result = codeOk && nationalityOk ? 'Success' : 'Mismatch';
        } catch (err) {
          saveStatus = 'Error During Save';
          result = 'Failed';
          console.error(`[Error] ${stepLabel}:`, err.message);
        }

        comparisonTable.push({
          Iteration: `[${i + 1}/${iterationCount}]`,
          'Target Country Code': code || 'N/A',
          'Original Country Code (Before Change)': previousCode,
          'New Country Code (After Change)': newCode,
          'Country Code Result': countryCodeResult,
          'Target Nationality (AR)': nationalityLabel || 'N/A',
          'Original Nationality (Before Change)': previousNationality,
          'New Nationality (After Change)': newNationality,
          'Nationality Result': nationalityResult,
          'Save Status': saveStatus,
          Result: result,
        });
      });
    }

    await attachComparisonReport(
      testInfo,
      comparisonTable,
      `Arabic Country Code + Nationality Paired Comparison Summary (all values)`
    );

    const failures = comparisonTable.filter((row) => row.Result !== 'Success');
    expect(
      failures,
      `Arabic country code + nationality paired failures:\n${JSON.stringify(failures, null, 2)}`
    ).toEqual([]);

    const testedCodes = new Set(
      comparisonTable
        .filter((row) => row['Target Country Code'] !== 'N/A' && row['Country Code Result'] === 'Success')
        .map((row) => row['Target Country Code'])
    );
    const testedNationalities = new Set(
      comparisonTable
        .filter((row) => row['Target Nationality (AR)'] !== 'N/A' && row['Nationality Result'] === 'Success')
        .map((row) => row['Target Nationality (AR)'])
    );

    expect(testedCodes.size, `Expected all ${codesToRun.length} country codes to be verified`).toBe(
      codesToRun.length
    );
    expect(
      testedNationalities.size,
      `Expected all ${nationalitiesToRun.length} nationalities to be verified`
    ).toBe(nationalitiesToRun.length);
  });
});
