/**
 * Scrapes all available country options from the "بلد الإقامة*" dropdown
 * @param {import('@playwright/test').Page} page
 */
async function getCountries(page) {
    // Targets the dropdown element within the container holding the text 'بلد الإقامة'
    const dropdownSelector = 'div:has-text("بلد الإقامة") select, select[name*="residence"], select[id*="residence"]';
    
    const dropdown = page.locator(dropdownSelector).first();
    // Wait up to 15 seconds for the field to render on the page
    await dropdown.waitFor({ state: 'visible', timeout: 15000 });
    
    // Extracts text names from the option elements, filtering out empty slots and placeholder 'اختر'
    return await dropdown.locator('option').evaluateAll(options => 
      options
        .map(opt => opt.textContent.trim())
        .filter(text => text && text !== '' && text !== 'اختر')
    );
  }
  
  /**
   * Handles choosing the target country from the dropdown directly
   * @param {import('@playwright/test').Page} page
   * @param {string} countryName
   */
  async function selectCountry(page, countryName) {
    const dropdownSelector = 'div:has-text("بلد الإقامة") select, select[name*="residence"], select[id*="residence"]';
    const dropdown = page.locator(dropdownSelector).first();
    
    // Selects option by its visible dropdown label text
    await dropdown.selectOption({ label: countryName });
  }
  
  module.exports = {
    getCountries,
    selectCountry
  };