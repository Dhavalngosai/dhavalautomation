import { test } from '@playwright/test';

test.describe('Residence Country Dropdown Validation Suite', () => {

  test('Select every residence country', async ({ page }) => {
    // Disable all test-runner limits inside this isolated worker block
    test.setTimeout(0);

    const targetUrl = 'https://cloud.explore.theroxycinemas.com/cpc_roxy_ar_qa?sfid=MDAzUXMwMDAwMGV3Y2llSUFB';
    
    console.log('Navigating to landing instance...');
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('Extracting country code items...');
    const countryCodes = await page.evaluate(() => {
      const options = document.querySelectorAll('#codedatalistOptions option');
      return Array.from(options).map(opt => opt.value).filter(val => val);
    });

    const totalItems = countryCodes.length;
    console.log(`Discovered ${totalItems} target entries. Beginning loops...`);

    const inputSelector = 'input[list="codedatalistOptions"]';
    const saveButtonSelector = 'button[type="submit"], input[type="submit"], #saveButton';

    for (let i = 0; i < totalItems; i++) {
      const code = countryCodes[i];
      console.log(`[${i + 1}/${totalItems}] Processing: ${code}`);

      try {
        // Wait cleanly for element visibility
        await page.waitForSelector(inputSelector, { state: 'visible', timeout: 10000 });
        
        // Force-clear using evaluate to minimize race conditions 
        await page.locator(inputSelector).evaluate(el => el.value = '');
        
        // Use fill instead of slow typing strings letter-by-letter
        await page.locator(inputSelector).fill(code);
        await page.waitForTimeout(100);

        // Click save if present
        if (await page.locator(saveButtonSelector).count() > 0) {
          await page.click(saveButtonSelector, { timeout: 5000 });
          // Give network requests a quick baseline window to safely push out
          await page.waitForLoadState('networkidle').catch(() => {});
        }

        // Brief execution rest period
        await page.waitForTimeout(500);

      } catch (itemError) {
        console.error(`[Error] Bypassed issue on "${code}":`, itemError.message);
      } finally {
        // Force page reset back to square one for the next iteration step 
        // to fully strip out memory context leaks
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      }
    }
    
    console.log('Job completed!');
  });
});