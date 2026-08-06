/**
 * Helpers for TGP Live CPC My Profile fields:
 * Country code (#country-code), Country of Residence (#profileCountry), Nationality (#nationality).
 */

const UAE_COUNTRY_OF_RESIDENCE_EN = 'United Arab Emirates';

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>}
 */
async function getCountryCodes(page) {
  return page.evaluate(() => {
    const options = document.querySelectorAll('#codedatalistOptions option');
    return Array.from(options)
      .map((opt) => (opt.value || '').trim())
      .filter(Boolean);
  });
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
async function getCountriesOfResidence(page) {
  return page.evaluate(() => {
    const selectEl = document.querySelector('#profileCountry');
    if (!selectEl) return [];
    return Array.from(selectEl.options)
      .map((opt) => ({
        value: (opt.value || '').trim(),
        label: (opt.textContent || '').trim(),
      }))
      .filter(
        (row) =>
          row.value &&
          row.label &&
          !/^select(\s+country)?$/i.test(row.label)
      );
  });
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
async function getNationalities(page) {
  return page.evaluate(() => {
    const selectEl = document.querySelector('#nationality');
    if (!selectEl) return [];
    return Array.from(selectEl.options)
      .map((opt) => ({
        value: (opt.value || '').trim(),
        label: (opt.textContent || '').trim(),
      }))
      .filter(
        (row) =>
          row.value &&
          row.label &&
          !/^select(\s+nationality)?$/i.test(row.label)
      );
  });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} code
 */
async function setCountryCode(page, code) {
  const input = page.locator('#country-code');
  await input.waitFor({ state: 'visible' });
  await input.click();
  await input.fill('');
  await input.fill(code);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} label
 */
async function setCountryOfResidenceByLabel(page, label) {
  await page.evaluate((targetName) => {
    const selectEl = document.querySelector('#profileCountry');
    if (!selectEl) throw new Error('#profileCountry not found');

    const targetOption = Array.from(selectEl.options).find(
      (opt) => (opt.textContent || '').trim() === targetName
    );
    if (!targetOption) {
      throw new Error(`Country of Residence option not found: ${targetName}`);
    }

    selectEl.value = targetOption.value;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    if (window.$ && typeof window.$('#profileCountry').trigger === 'function') {
      window.$('#profileCountry').trigger('change');
    }
  }, label);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} label
 */
async function setNationalityByLabel(page, label) {
  await page.evaluate((targetName) => {
    const selectEl = document.querySelector('#nationality');
    if (!selectEl) throw new Error('#nationality not found');

    const targetOption = Array.from(selectEl.options).find(
      (opt) => (opt.textContent || '').trim() === targetName
    );
    if (!targetOption) {
      throw new Error(`Nationality option not found: ${targetName}`);
    }

    selectEl.value = targetOption.value;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    if (window.$ && typeof window.$('#nationality').trigger === 'function') {
      window.$('#nationality').trigger('change');
    }
  }, label);
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>}
 */
async function getCountryOfResidenceLabel(page) {
  await page.locator('#profileCountry').waitFor({ state: 'attached', timeout: 15_000 }).catch(() => undefined);

  for (let attempt = 0; attempt < 5; attempt++) {
    const label = await page.evaluate(() => {
      const selectEl = document.querySelector('#profileCountry');
      const fromSelect = selectEl?.selectedOptions?.[0]?.textContent?.trim();
      if (fromSelect) return fromSelect;
      const fromSelect2 = document.querySelector('#select2-profileCountry-container')?.textContent?.trim();
      return fromSelect2 || '';
    });
    if (label) return label;
    await page.waitForTimeout(500);
  }
  return 'Empty';
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>}
 */
async function getSelectedNationalityLabel(page) {
  return page.evaluate(() => {
    const selectEl = document.querySelector('#nationality');
    return selectEl?.selectedOptions?.[0]?.textContent?.trim() || 'Empty';
  });
}

/** Nationality is only applicable when Country of Residence is UAE. */
async function ensureUaeCountryOfResidence(page) {
  const currentCountry = await getCountryOfResidenceLabel(page);
  if (currentCountry !== UAE_COUNTRY_OF_RESIDENCE_EN) {
    await setCountryOfResidenceByLabel(page, UAE_COUNTRY_OF_RESIDENCE_EN);
    await page.waitForTimeout(500);
  }

  const nationalitySelect = page.locator('#nationality');
  await nationalitySelect.waitFor({ state: 'attached', timeout: 15_000 }).catch(() => undefined);

  for (let attempt = 0; attempt < 10; attempt++) {
    const enabled = await nationalitySelect.isEnabled().catch(() => false);
    if (enabled) return;
    await page.waitForTimeout(300);
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>}
 */
async function clickProfileSave(page) {
  const saveButton = page.locator('#profile-submit');
  if (!(await saveButton.isVisible().catch(() => false))) {
    return 'No Save Button';
  }
  await saveButton.click({ noWaitAfter: true });
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
  return 'Saved Successfully';
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} cpcUrl
 */
async function openMyProfile(page, cpcUrl) {
  await page.goto(cpcUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.locator('#my-profile-tab').waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('#my-profile-tab').click();
  await page.locator('#country-code').waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('#profileCountry').waitFor({ state: 'attached', timeout: 30_000 });
  await page.locator('#nationality').waitFor({ state: 'attached', timeout: 30_000 });
}

module.exports = {
  getCountryCodes,
  getCountriesOfResidence,
  getNationalities,
  setCountryCode,
  setCountryOfResidenceByLabel,
  setNationalityByLabel,
  getCountryOfResidenceLabel,
  getSelectedNationalityLabel,
  ensureUaeCountryOfResidence,
  clickProfileSave,
  openMyProfile,
  UAE_COUNTRY_OF_RESIDENCE_EN,
};
