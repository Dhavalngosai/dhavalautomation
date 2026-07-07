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

    for (let i = 0; i < codesToRun.length; i++) {
      const code = codesToRun[i];

      await test.step(`[${i + 1}/${codesToRun.length}] Select ${code}`, async () => {
        // --- Added: Fetch the original value before making any changes ---
        const previousValue = await page.locator('#country-code').inputValue().catch(() => 'Unknown/Empty');

        console.log(
          `[${i + 1}/${codesToRun.length}] Changing country code | Original: "${previousValue}" -> New: "${code}"`
        );
        
        await clearAndSelectCountryCode(page, code);
        await expect(page.locator('#country-code')).toHaveValue(code);
        
        console.log(
          `[${i + 1}/${codesToRun.length}] Successfully selected "${code}" (replaced "${previousValue}")`
        );

        const saveButton = page.getByRole('button', { name: 'حفظ' });
        if (await saveButton.count()) {
          await saveButton.click();
          await page.waitForLoadState('networkidle');
          console.log(`[${i + 1}/${codesToRun.length}] Saved profile with country code ${code}`);
        } else {
          console.log(`[${i + 1}/${codesToRun.length}] Save button not found for ${code}`);
        }

        if (i < codesToRun.length - 1) {
          await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
        }
      });
    }

    console.log(`Finished processing ${codesToRun.length} country codes.`);
  });
});