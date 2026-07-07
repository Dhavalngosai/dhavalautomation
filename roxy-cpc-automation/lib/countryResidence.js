/**
 * Pick a value dynamically from a Select2 Custom Dropdown using native browser context execution.
 * @param {import('@playwright/test').Page} page
 * @param {string} countryName e.g. "المملكة العربية السعودية"
 */
async function selectCountry(page, countryName) {
  const dropdown = page.locator('#ARCountry');
  await dropdown.waitFor({ state: 'attached', timeout: 5000 });

  // Native execution bypassing the UI search input completely
  await page.evaluate((targetName) => {
    const selectEl = document.querySelector('#ARCountry');
    if (!selectEl) return;

    const targetOption = Array.from(selectEl.options).find(
      opt => opt.textContent.trim() === targetName
    );

    if (targetOption) {
      selectEl.value = targetOption.value;
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));

      if (window.$ && typeof window.$('#ARCountry').trigger === 'function') {
        window.$('#ARCountry').trigger('change');
      }
    } else {
      throw new Error(`Country option label matching "${targetName}" not found in DOM list.`);
    }
  }, countryName);
}

/**
 * Read all country values from the target select list hidden options.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>}
 */
async function getCountries(page) {
  const dropdown = page.locator('#ARCountry');
  await dropdown.waitFor({ state: 'attached', timeout: 15000 });
  
  return await dropdown.locator('option').evaluateAll(options => 
    options
      .map(opt => opt.textContent.trim())
      .filter(text => text && text !== '' && text !== 'اختر' && text !== 'اختر الدولة')
  );
}

module.exports = { selectCountry, getCountries };