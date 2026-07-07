const { test, expect } = require('@playwright/test');
const { selectCountry, getCountries } = require('../lib/countryResidence'); 

const TARGET_URL =
  'https://cloud.explore.theroxycinemas.com/cpc_roxy_ar_qa?sfid=MDAzUXMwMDAwMGV3Y2llSUFB';

test.describe('Residence Country Dropdown Validation Suite', () => {
  const finalChangeLogTable = [];

  test('Select every residence country', async ({ page }) => {
    test.setTimeout(900000); // 15-minute global fallback run limit budget
    
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    
    const countries = await getCountries(page);
    expect(countries.length).toBeGreaterThan(0);

    const countryLimit = Number(process.env.COUNTRY_LIMIT || countries.length);
    const countriesToRun = countries.slice(0, countryLimit);
    console.log(`[Setup] Found ${countries.length} countries. Running automation for ${countriesToRun.length}...`);

    for (let i = 0; i < countriesToRun.length; i++) {
      const countryName = countriesToRun[i];
      let iterationFailed = false;

      await test.step(`[${i + 1}/${countriesToRun.length}] Target: ${countryName}`, async () => {
        try {
          const targetDropdown = page.locator('#ARCountry');
          const previousCountry = await targetDropdown.evaluate(el => el.options[el.selectedIndex]?.text || 'Empty').catch(() => 'Empty');

          await selectCountry(page, countryName);
          
          const currentSelection = await targetDropdown.evaluate(el => el.options[el.selectedIndex]?.text);
          expect(currentSelection).toBe(countryName);

          let saveStatus = 'No Save Button';
          const saveButton = page.getByRole('button', { name: 'حفظ' });
          
          if (await saveButton.count()) {
            await saveButton.click();
            await page.waitForTimeout(1000); 
            saveStatus = 'Saved';
          }

          finalChangeLogTable.push({
            'Iteration': `[${i + 1}/${countriesToRun.length}]`,
            'Field Tested': 'Country of Residence',
            'Selection Target': countryName,
            'Original Value': previousCountry,
            'New Value': countryName,
            'Status': saveStatus
          });

        } catch (error) {
          console.error(`[Error] Failed processing "${countryName}":`, error.message);
          iterationFailed = true;
          
          finalChangeLogTable.push({
            'Iteration': `[${i + 1}/${countriesToRun.length}]`,
            'Field Tested': 'Country of Residence',
            'Selection Target': countryName,
            'Original Value': 'Exception Caught',
            'New Value': countryName,
            'Status': 'Failed'
          });
        } finally {
          // Soft refreshing the page layout configuration cycle every 10 steps 
          // keeps loop iterations stable without triggering memory element stalls.
          if (iterationFailed || i % 10 === 0) {
            await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
          } else {
            await page.keyboard.press('Escape').catch(() => {});
          }
        }
      });
    }

    console.log('\n\n' + '='.repeat(95));
    console.log('                 FINAL COUNTRY OF RESIDENCE AUTOMATION CHANGE LOG SUMMARY                 ');
    console.repeat(95);
    console.table(finalChangeLogTable);
    console.log('='.repeat(95) + '\n');
  });
});