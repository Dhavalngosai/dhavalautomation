const { chromium } = require('playwright');
const { clearAndSelectCountryCode, getCountryCodes } = require('./lib/countryCode');

const TARGET_URL =
  'https://cloud.explore.theroxycinemas.com/CPC_Roxy_AR?qs=ABB7InYiOjEsImQiOjQ5MzZ9ADMAAAAAAIWXbmLeRLqGaDnGZuvcoWlFyRwhE8gwY1XkpyMXh9UlZSdXUtgqjkkXrZT1LzQJO96ihZznvtfzzlSMjrPJda_Mi2PTYTFjIvKxHfZXAbdZN6l4r8r_rcWMp8q9oUFCqvDg1N_eznEoRTa_P4M&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+AR&utm_term=%%%3dRedirectTo(CloudPagesURL(3481))%3d%%&utm_EmailName=Sanity+Test+Email+AR&Platform_Source=Roxy&Date=7/13/2026&utm_id=499026&sfmc_id=116255438';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  try {
    console.log('Navigating to target page...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

    const countryCodes = await getCountryCodes(page);
    const totalItems = countryCodes.length;
    console.log(`Found ${totalItems} country codes. Beginning run...`);

    for (let i = 0; i < totalItems; i++) {
      const code = countryCodes[i];
      console.log(`[${i + 1}/${totalItems}] Processing country code: ${code}`);

      await clearAndSelectCountryCode(page, code);

      const saveButton = page.getByRole('button', { name: 'حفظ' });
      if (await saveButton.count()) {
        await saveButton.click();
        await page.waitForLoadState('networkidle');
        console.log(`Saved record state for ${code}`);
      } else {
        console.log(`Save button not found for ${code}.`);
      }

      await page.waitForTimeout(1500);

      if (i < totalItems - 1) {
        await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
      }
    }

    console.log('All country codes processed.');
  } catch (error) {
    console.error('Execution stopped:', error);
    process.exitCode = 1;
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
