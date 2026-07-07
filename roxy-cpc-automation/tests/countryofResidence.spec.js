const { test, expect } = require('@playwright/test');
const { selectCountry, getCountries } = require('../lib/countryResidence'); 

const TARGET_URL =
  'https://cloud.explore.theroxycinemas.com/cpc_roxy_ar_qa?sfid=MDAzUXMwMDAwMGV3Y2llSUFB';

test.describe('Roxy CPC Country of Residence Value Modification', () => {
  // Instantiated array to accumulate all matrix data across iterations
  const finalChangeLogTable = [];

  test('Update Countries of Residence directly', async ({ page }) => {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    
    const countries = await getCountries(page);
    expect(countries.length).toBeGreaterThan(0);

    const countryLimit = Number(process.env.COUNTRY_LIMIT || countries.length);
    const countriesToRun = countries.slice(0, countryLimit);
    console.log(`[Setup] Found ${countries.length} countries. Testing ${countriesToRun.length}...`);

    const targetDropdown = page.locator('div:has-text("بلد الإقامة") select').first();

    for (let i = 0; i < countriesToRun.length; i++) {
      const countryName = countriesToRun[i];

      await test.step(`Country of Residence [${i + 1}/${countriesToRun.length}] - ${countryName}`, async () => {
        // Read the exact text label state inside the element before making adjustments
        const previousCountry = await targetDropdown.evaluate(el => el.options[el.selectedIndex]?.text || 'Empty').catch(() => 'Empty');

        // Select the direct configuration text value
        await selectCountry(page, countryName);
        
        // Robust verification matching the selected text label
        const currentSelection = await targetDropdown.evaluate(el => el.options[el.selectedIndex]?.text);
        expect(currentSelection).toBe(countryName);

        let saveStatus = 'No Save Button';
        const saveButton = page.getByRole('button', { name: 'حفظ' });
        
        if (await saveButton.count()) {
          // Promise structure handling parallel page interactions safely without context crashing
          await Promise.all([
            saveButton.click(),
            page.waitForLoadState('load').catch(() => {}),
            page.waitForTimeout(1500) // Form processing delay threshold padding
          ]);
          saveStatus = 'Saved';
        }

        // Tracking row state modifications
        finalChangeLogTable.push({
          'Field Tested': 'Country of Residence',
          'Selection Target': countryName,
          'Original Value': previousCountry,
          'New Value': countryName,
          'Status': saveStatus
        });

        if (i < countriesToRun.length - 1) {
          await page.goto(TARGET_URL, { waitUntil: 'networkidle' }).catch(() => {
            return page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
          });
        }
      });
    }

    // ==========================================
    // FINAL CHANGE REPORT MATRIX GENERATION
    // ==========================================
    console.log('\n\n' + '='.repeat(90));
    console.log('               FINAL COUNTRY OF RESIDENCE AUTOMATION CHANGE LOG SUMMARY               ');
    console.log('='.repeat(90));
    console.table(finalChangeLogTable);
    console.log('='.repeat(90) + '\n');
  });
});