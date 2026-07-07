const { test, expect } = require('@playwright/test');
const { clearAndSelectCountryCode, getCountryCodes } = require('../lib/countryCode');

const TARGET_URL =
  'https://cloud.explore.theroxycinemas.com/cpc_roxy_ar_qa?sfid=MDAzUXMwMDAwMGV3Y2llSUFB';

test.describe('Roxy CPC country code', () => {
  test('clear text box and select each country code from dropdown', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

    const countryCodes = await getCountryCodes(page);
    expect(countryCodes.length).toBeGreaterThan(0);

    const limit = Number(process.env.COUNTRY_CODE_LIMIT || countryCodes.length);
    const codesToRun = countryCodes.slice(0, limit);
    console.log(`Found ${countryCodes.length} country codes. Running ${codesToRun.length}...`);

    // Array to store rows for the terminal matrix table
    const comparisonTable = [];

    for (let i = 0; i < codesToRun.length; i++) {
      const code = codesToRun[i];

      await test.step(`[${i + 1}/${codesToRun.length}] Select ${code}`, async () => {
        // 1. Capture original value BEFORE clearing
        const previousValue = await page.locator('#country-code').inputValue().catch(() => 'Empty');

        // 2. Clear and select the new value
        await clearAndSelectCountryCode(page, code);
        await expect(page.locator('#country-code')).toHaveValue(code);

        // 3. Handle saving profile
        let saveStatus = 'No Save Button';
        const saveButton = page.getByRole('button', { name: 'حفظ' });
        if (await saveButton.count()) {
          await saveButton.click();
          await page.waitForLoadState('networkidle');
          saveStatus = 'Saved Successfully';
        }

        // 4. Push row object to our comparison array
        comparisonTable.push({
          'Iteration': `[${i + 1}/${codesToRun.length}]`,
          'Target Code': code,
          'Original Value (Before Clear)': previousValue,
          'New Value (After Selection)': code,
          'Save Status': saveStatus
        });

        if (i < codesToRun.length - 1) {
          await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
        }
      });
    }

    // Print the final data breakdown to the terminal in matrix grid format
    console.log('\n================ VALUE COMPARISON SUMMARY ================');
    console.table(comparisonTable);
    console.log('==========================================================\n');

    console.log(`Finished processing ${codesToRun.length} country codes.`);
  });
});