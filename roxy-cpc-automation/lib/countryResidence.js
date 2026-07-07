/**
 * Scrapes all available country options from the "بلد الإقامة*" dropdown
 * @param {import('@playwright/test').Page} page
 */
async function getCountries(page) {
  // Target the specific select box located below or next to the "بلد الإقامة" label container
  const dropdown = page.locator('div:has-text("بلد الإقامة") select, select:below(:text("بلد الإقامة"))').first();
  
  // Wait up to 15 seconds for the dropdown element to be fully rendered
  await dropdown.waitFor({ state: 'visible', timeout: 15000 });
  
  // Extract visible texts, filtering out empty entries and generic placeholder strings
  return await dropdown.locator('option').evaluateAll(options => 
    options
      .map(opt => opt.textContent.trim())
      .filter(text => text && text !== '' && text !== 'اختر' && text !== 'اختر الدولة')
  );
}

/**
 * Direct selection framework bypassing clear overheads
 * @param {import('@playwright/test').Page} page
 * @param {string} countryName
 */
async function selectCountry(page, countryName) {
  const dropdown = page.locator('div:has-text("بلد الإقامة") select, select:below(:text("بلد الإقامة"))').first();
  await dropdown.selectOption({ label: countryName });
}

module.exports = {
  getCountries,
  selectCountry
};