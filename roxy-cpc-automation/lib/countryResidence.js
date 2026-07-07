/**
 * Pick a value dynamically from a Select2 Custom Dropdown.
 * @param {import('@playwright/test').Page} page
 * @param {string} countryName e.g. "الإمارات العربية المتحدة"
 */
async function selectCountry(page, countryName) {
  // Direct interaction target bypassing Select2 state visibility glitches
  const select2Trigger = page.locator('.select2-container:has(select#ARCountry), #ARCountry + .select2, select#ARCountry').first();
  
  // Force click calculation to open the option tree panel even if elements shift out of standard alignment
  await select2Trigger.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
  await select2Trigger.click({ force: true });

  // Look for the dynamic list options that drop down anywhere on the page body context
  const searchInput = page.locator('input.select2-search__field, .select2-dropdown input').first();
  await searchInput.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});

  if (await searchInput.isVisible()) {
    await searchInput.fill(countryName);
    await page.keyboard.press('Enter');
  } else {
    // Exact structural class fallback selecting matching text list items natively
    const targetOption = page.locator(`.select2-results__option:has-text("${countryName}")`).first();
    await targetOption.click({ force: true });
  }
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

module.exports = { 
  selectCountry, 
  getCountries 
};