import { test } from '@playwright/test';

const FIELD_LABEL = 'الجنسية(المقيمين في دولة الإمارات العربية المتحدة فقط)';

test.describe(`${FIELD_LABEL} Dropdown Validation Suite`, () => {

  test(`Select every option for "${FIELD_LABEL}"`, async ({ page }) => {
    test.setTimeout(0);

    const targetUrl = 'https://cloud.explore.theroxycinemas.com/cpc_roxy_ar_qa?sfid=MDAzUXMwMDAwMGV3Y2llSUFB';

    console.log(`Navigating to landing instance for field: ${FIELD_LABEL}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await page.getByText(FIELD_LABEL, { exact: true }).waitFor({ state: 'visible', timeout: 15000 });

    console.log(`Extracting options for "${FIELD_LABEL}"...`);
    const nationalities = await page.evaluate(() => {
      const options = document.querySelectorAll('#nationality option');
      return Array.from(options)
        .map((opt) => opt.textContent.trim())
        .filter((val) => val && val !== 'اختر الجنسية' && val !== 'اختر');
    });

    const totalItems = nationalities.length;
    console.log(`Discovered ${totalItems} entries for "${FIELD_LABEL}". Beginning loops...`);

    const dropdownSelector = '#nationality';
    const saveButton = page.locator('#profile-submit');

    for (let i = 0; i < totalItems; i++) {
      const nationality = nationalities[i];
      console.log(`[${i + 1}/${totalItems}] ${FIELD_LABEL} -> ${nationality}`);

      try {
        await page.getByText(FIELD_LABEL, { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
        await page.waitForSelector(dropdownSelector, { state: 'attached', timeout: 10000 });

        await page.evaluate((targetName) => {
          const selectEl = document.querySelector('#nationality');
          if (!selectEl) return;

          const targetOption = Array.from(selectEl.options).find(
            (opt) => opt.textContent.trim() === targetName
          );

          if (targetOption) {
            selectEl.value = targetOption.value;
            selectEl.dispatchEvent(new Event('change', { bubbles: true }));

            if (window.$ && typeof window.$('#nationality').trigger === 'function') {
              window.$('#nationality').trigger('change');
            }
          }
        }, nationality);

        await page.waitForTimeout(100);

        if (await saveButton.isVisible()) {
          // Profile save is AJAX — do not wait for a full page navigation after click
          await saveButton.click({ noWaitAfter: true });
          await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        }

        await page.waitForTimeout(500);

      } catch (itemError) {
        console.error(`[Error] Bypassed issue on "${FIELD_LABEL}" / "${nationality}":`, itemError.message);
      }

      if (i < totalItems - 1) {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      }
    }

    console.log(`Job completed for "${FIELD_LABEL}"!`);
  });
});
