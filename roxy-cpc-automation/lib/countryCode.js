/**
 * Clear the country-code input, then pick a value from the datalist dropdown.
 * @param {import('@playwright/test').Page} page
 * @param {string} code e.g. "+971"
 */
async function clearAndSelectCountryCode(page, code) {
  const input = page.locator('#country-code');
  await input.waitFor({ state: 'visible' });

  await input.fill('');
  await input.click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.type(code, { delay: 30 });
  await page.keyboard.press('Tab');
}

/**
 * Read all country codes from the datalist on the current page.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>}
 */
async function getCountryCodes(page) {
  return page.evaluate(() => {
    const options = document.querySelectorAll('#codedatalistOptions option');
    return Array.from(options)
      .map((opt) => opt.value)
      .filter(Boolean);
  });
}

module.exports = { clearAndSelectCountryCode, getCountryCodes };
