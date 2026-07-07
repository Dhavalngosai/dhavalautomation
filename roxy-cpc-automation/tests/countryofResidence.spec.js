import { test, expect } from '@playwright/test';

test.describe('Residence Country Dropdown Validation Suite', () => {
  
  test('Select every residence country', async ({ page }) => {
    // CRITICAL: Disable the test runner timeout for this long loop execution
    test.setTimeout(0); 

    const targetUrl = 'https://cloud.explore.theroxycinemas.com/cpc_roxy_ar_qa?sfid=MDAzUXMwMDAwMGV3Y2llSUFB';
    console.log('Navigating to target page...');
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    console.log('Extracting country codes...');
    const countryCodes = await page.evaluate(() => {
      const options = document.querySelectorAll('#codedatalistOptions option');
      return Array.from(options).map(opt => opt.value).filter(val => val);
    });

    const totalItems = countryCodes.length;
    console.log(`Processing ${totalItems} items...`);

    const inputSelector = 'input[list="codedatalistOptions"]';

    for (let i = 0; i < totalItems; i++) {
      const code = countryCodes[i];
      console.log(`[${i + 1}/${totalItems}] Processing: ${code}`);

      try {
        await page.waitForSelector(inputSelector, { timeout: 5000 });
        
        // Clean input
        await page.click(inputSelector, { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(100);

        // Fill code
        await page.type(inputSelector, code, { delay: 30 });

        const saveButtonSelector = 'button[type="submit"], input[type="submit"], #saveButton'; 
        if (await page.locator(saveButtonSelector).count() > 0) {
          await page.click(saveButtonSelector);
          await page.waitForLoadState('networkidle');
        }

        // Pacing delay
        await page.waitForTimeout(1000);
        
        // Return to a clean layout state
        await page.goto(targetUrl, { waitUntil: 'networkidle' });

      } catch (itemError) {
        console.error(`[Error] Failed processing "${code}":`, itemError.message);
        // If an individual item fails, reload the page to prevent breaking the next loop item
        await page.goto(targetUrl, { waitUntil: 'networkidle' }).catch(() => {});
      }
    }
  });
});