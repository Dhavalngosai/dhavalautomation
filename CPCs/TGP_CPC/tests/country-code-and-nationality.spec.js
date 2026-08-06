/**
 * TGP Live CPC – Country Code + Nationality (paired save): set both fields → Save once → comparison row.
 * Verifies all country codes and all nationalities (default: no limit).
 *
 * Run:
 *   npm run test:country-code-and-nationality
 *   run-tgp-country-code-and-nationality.bat --headed
 *
 * Env:
 *   TGP_CPC_URL
 *   TGP_CPC_COUNTRY_CODE_LIMIT / TGP_CPC_NATIONALITY_LIMIT / TGP_CPC_FIELD_LIMIT (optional)
 *   TGP_CPC_COUNTRY_CODE_OFFSET / TGP_CPC_NATIONALITY_OFFSET / TGP_CPC_FIELD_OFFSET (optional)
 */
const { expect, test } = require('@playwright/test');
const { attachComparisonReport } = require('../lib/comparisonReport');
const { formatRangeLabel, getFieldRange, sliceFieldItems } = require('../lib/fieldRange');
const {
  clickProfileSave,
  ensureUaeCountryOfResidence,
  getCountryCodes,
  getNationalities,
  getSelectedNationalityLabel,
  openMyProfile,
  setCountryCode,
  setNationalityByLabel,
} = require('../lib/profileFields');
const { getTgpCpcUrl } = require('../lib/tgpCpcConfig');

const cpcUrl = getTgpCpcUrl();

const countryCodeRange = getFieldRange(
  'TGP_CPC_COUNTRY_CODE_LIMIT',
  'TGP_CPC_COUNTRY_CODE_OFFSET',
  'TGP_CPC_FIELD_LIMIT',
  'TGP_CPC_FIELD_OFFSET'
);
const nationalityRange = getFieldRange(
  'TGP_CPC_NATIONALITY_LIMIT',
  'TGP_CPC_NATIONALITY_OFFSET',
  'TGP_CPC_FIELD_LIMIT',
  'TGP_CPC_FIELD_OFFSET'
);

test.describe('TGP Live CPC – Country Code + Nationality (paired save)', () => {
  test('set country code and nationality together, save once per iteration (all values)', async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set TGP_CPC_URL in .env to the full Cloud Page link (including qs=).');

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
      `Found ${allCodes.length} country codes (${codeRangeLabel}) and ${allNationalities.length} nationalities (${nationalityRangeLabel}). Running ${iterationCount} paired saves...`
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
          await page.locator('#country-code').waitFor({ state: 'visible', timeout: 15_000 });
          await page.locator('#nationality').waitFor({ state: 'attached', timeout: 15_000 });
          await ensureUaeCountryOfResidence(page);

          previousCode = await page.locator('#country-code').inputValue().catch(() => 'Empty');
          previousNationality = await getSelectedNationalityLabel(page);

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
            newNationality = await getSelectedNationalityLabel(page);
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
            newNationality = await getSelectedNationalityLabel(page).catch(() => newNationality);
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
          'Target Nationality': nationalityLabel || 'N/A',
          'Original Nationality (Before Change)': previousNationality,
          'New Nationality (After Change)': newNationality,
          'Nationality Result': nationalityResult,
          'Save Status': saveStatus,
          Result: result,
        });

        if (i < iterationCount - 1) {
          await openMyProfile(page, cpcUrl).catch(async () => {
            await page.goto(cpcUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => undefined);
          });
        }
      });
    }

    await attachComparisonReport(
      testInfo,
      comparisonTable,
      `Country Code + Nationality Paired Comparison Summary (all values)`
    );

    const failures = comparisonTable.filter((row) => row.Result !== 'Success');
    expect(
      failures,
      `Country code + nationality paired failures:\n${JSON.stringify(failures, null, 2)}`
    ).toEqual([]);

    const testedCodes = new Set(
      comparisonTable
        .filter((row) => row['Target Country Code'] !== 'N/A' && row['Country Code Result'] === 'Success')
        .map((row) => row['Target Country Code'])
    );
    const testedNationalities = new Set(
      comparisonTable
        .filter((row) => row['Target Nationality'] !== 'N/A' && row['Nationality Result'] === 'Success')
        .map((row) => row['Target Nationality'])
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
