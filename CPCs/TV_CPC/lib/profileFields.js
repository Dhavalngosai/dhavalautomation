/**
 * Helpers for TV CPC My Profile fields:
 * Country code (#country-code), Country of Residence (#profileCountry), Nationality (#nationality).
 * @param {import('@playwright/test').Page} page
 */

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
 * Clear and set the country-code input (datalist-backed).
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
 * Select Country of Residence by exact option label (Select2-backed #profileCountry).
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
 * Select a nationality by exact option label (text).
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

  // Confirm the native select stuck (Select2/pages sometimes reset on the next tick).
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await page.evaluate(() => {
      const selectEl = document.querySelector('#nationality');
      return selectEl?.selectedOptions?.[0]?.textContent?.trim() || '';
    });
    if (current === label) return;
    await page.waitForTimeout(200);
    await page.evaluate((targetName) => {
      const selectEl = document.querySelector('#nationality');
      if (!selectEl) return;
      const targetOption = Array.from(selectEl.options).find(
        (opt) => (opt.textContent || '').trim() === targetName
      );
      if (!targetOption) return;
      selectEl.value = targetOption.value;
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      if (window.$ && typeof window.$('#nationality').trigger === 'function') {
        window.$('#nationality').trigger('change');
      }
    }, label);
  }
}

/**
 * Read Country of Residence label from native select or Select2 container (with brief retries).
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

/** Nationality is only applicable when Country of Residence is UAE (English label). */
const UAE_COUNTRY_OF_RESIDENCE_EN = 'United Arab Emirates';

/** Nationality field is shown for UAE residents only. */
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
 * WW (and some CPC pages) redirect to the marketing home after Save.
 * Re-open My Profile so post-save field reads do not return Empty / throw.
 * @param {import('@playwright/test').Page} page
 * @param {string} [cpcUrl]
 */
async function ensureMyProfileFieldsVisible(page, cpcUrl) {
  const isReady = async () => {
    const codeVisible = await page.locator('#country-code').isVisible().catch(() => false);
    const countryAttached = (await page.locator('#profileCountry').count().catch(() => 0)) > 0;
    return codeVisible && countryAttached;
  };

  if (await isReady()) return;

  const tab = page.locator('#my-profile-tab');
  if (await tab.isVisible().catch(() => false)) {
    await tab.click().catch(() => undefined);
    await page.waitForTimeout(500);
    if (await isReady()) return;
  }

  if (!cpcUrl) return;

  await page.goto(cpcUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => undefined);
  await page.locator('#my-profile-tab').waitFor({ state: 'visible', timeout: 30_000 }).catch(() => undefined);
  await page.locator('#my-profile-tab').click().catch(() => undefined);
  await page.locator('#country-code').waitFor({ state: 'visible', timeout: 30_000 }).catch(() => undefined);
  await page.locator('#profileCountry').waitFor({ state: 'attached', timeout: 15_000 }).catch(() => undefined);
}

/**
 * Click the My Profile Save button.
 * Some CPC pages render multiple `#profile-submit` nodes (profile + interests);
 * only the active tab's button is visible — prefer that to avoid strict-mode failures.
 * After Save, WW may navigate away from the form; optionally recover via `cpcUrl`.
 * @param {import('@playwright/test').Page} page
 * @param {string} [cpcUrl]
 */
async function clickProfileSave(page, cpcUrl) {
  const saveButton = page
    .locator('#profile-form button#profile-submit, #my-profile button#profile-submit')
    .or(page.locator('button#profile-submit').filter({ visible: true }))
    .or(page.getByRole('button', { name: /^(Save|حفظ)$/ }))
    .first();

  const visible = await saveButton.isVisible().catch(() => false);
  if (!visible) {
    await page.locator('#my-profile-tab').click().catch(() => undefined);
    await page.waitForTimeout(400);
  }

  const ready = await saveButton
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true)
    .catch(() => false);

  if (!ready) {
    return 'No Save Button';
  }

  await saveButton.scrollIntoViewIfNeeded().catch(() => undefined);
  try {
    await saveButton.click({ noWaitAfter: true });
  } catch {
    // Navigation during Save can detach the button; treat as a completed click.
  }
  await page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => undefined);
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
  await ensureMyProfileFieldsVisible(page, cpcUrl);
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
  // GV has duplicate #profile-submit IDs; wait for the profile-form Save specifically
  await page
    .locator('#profile-form button#profile-submit')
    .first()
    .waitFor({ state: 'attached', timeout: 15_000 })
    .catch(() => undefined);
}

module.exports = {
  getCountryCodes,
  getCountriesOfResidence,
  getNationalities,
  setCountryCode,
  setCountryOfResidenceByLabel,
  setNationalityByLabel,
  getCountryOfResidenceLabel,
  ensureUaeCountryOfResidence,
  clickProfileSave,
  openMyProfile,
  ensureMyProfileFieldsVisible,
  UAE_COUNTRY_OF_RESIDENCE_EN,
};
