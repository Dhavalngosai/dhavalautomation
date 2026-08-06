/**
 * DPR CPC Arabic QA – My Profile field helpers (Arabic labels; Select2-backed Country of Residence).
 */
const {
  clickProfileSave,
  getCountryCodes,
  setCountryCode,
  setNationalityByLabel,
} = require('./profileFields.js');

const AR_NATIONALITY_PLACEHOLDERS = new Set(['اختر الجنسية', 'اختر']);
const AR_COUNTRY_PLACEHOLDERS = new Set(['اختر الدولة', 'اختر', 'اختر البلد']);
/** Nationality field is shown for UAE residents only (Arabic label). */
const UAE_COUNTRY_OF_RESIDENCE_AR = 'الإمارات العربية المتحدة';

const PROFILE_FIELD_WAIT_MS = 30_000;
const AR_COUNTRY_PLACEHOLDER_LABELS = new Set([...AR_COUNTRY_PLACEHOLDERS]);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function waitForCountryOfResidenceField(page) {
  const deadline = Date.now() + PROFILE_FIELD_WAIT_MS;

  while (Date.now() < deadline) {
    const found = await page.evaluate(() => {
      const select2 = document.querySelector('#select2-profileCountry-container');
      const selectEl =
        document.querySelector('#profileCountry') ||
        document.querySelector('select[name="profileCountry"]');
      return Boolean(select2 || selectEl);
    });

    if (found) return;
    await page.waitForTimeout(250);
  }

  throw new Error(
    'Country of Residence field not found (native select or #select2-profileCountry-container).'
  );
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function waitForNationalityField(page) {
  const deadline = Date.now() + PROFILE_FIELD_WAIT_MS;

  while (Date.now() < deadline) {
    const found = await page.evaluate(() => Boolean(document.querySelector('#nationality')));
    if (found) return;
    await page.waitForTimeout(250);
  }

  throw new Error('Nationality field not found (#nationality).');
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
async function getArabicCountriesOfResidence(page) {
  return page.evaluate((placeholders) => {
    const skip = new Set(placeholders);
    const selectEl =
      document.querySelector('#profileCountry') ||
      document.querySelector('select[name="profileCountry"]') ||
      document.querySelector('select[id*="profileCountry"]');
    if (!selectEl) return [];

    return Array.from(selectEl.options)
      .map((opt) => ({
        value: (opt.value || '').trim(),
        label: (opt.textContent || '').trim(),
      }))
      .filter((row) => row.value && row.label && !skip.has(row.label));
  }, [...AR_COUNTRY_PLACEHOLDERS]);
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
async function getArabicNationalities(page) {
  return page.evaluate((placeholders) => {
    const selectEl = document.querySelector('#nationality');
    if (!selectEl) return [];
    const skip = new Set(placeholders);
    return Array.from(selectEl.options)
      .map((opt) => ({
        value: (opt.value || '').trim(),
        label: (opt.textContent || '').trim(),
      }))
      .filter((row) => row.value && row.label && !skip.has(row.label));
  }, [...AR_NATIONALITY_PLACEHOLDERS]);
}

/**
 * Read Country of Residence from Select2 UI or native select (with retries).
 * @param {import('@playwright/test').Page} page
 * @param {{ afterSave?: boolean }} [options]
 * @returns {Promise<string>}
 */
async function getArabicCountryOfResidenceLabel(page, options = {}) {
  const maxAttempts = options.afterSave ? 20 : 10;
  const waitMs = options.afterSave ? 800 : 500;

  if (options.afterSave) {
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => undefined);
    await page.waitForLoadState('networkidle', { timeout: 25_000 }).catch(() => undefined);
    await page.locator('#my-profile-tab').waitFor({ state: 'visible', timeout: 30_000 }).catch(() => undefined);
    await waitForCountryOfResidenceField(page).catch(() => undefined);
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const label = await page.evaluate((placeholders) => {
      const skip = new Set(placeholders);
      const selectEl =
        document.querySelector('#profileCountry') ||
        document.querySelector('select[name="profileCountry"]');
      const fromSelect = selectEl?.selectedOptions?.[0]?.textContent?.trim();
      if (fromSelect && !skip.has(fromSelect)) return fromSelect;

      const rendered = document.querySelector(
        '#select2-profileCountry-container .select2-selection__rendered'
      );
      const fromTitle = rendered?.getAttribute('title')?.trim();
      if (fromTitle && !skip.has(fromTitle)) return fromTitle;

      const fromSelect2 = document
        .querySelector('#select2-profileCountry-container')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim();
      if (fromSelect2 && !skip.has(fromSelect2)) return fromSelect2;

      return '';
    }, [...AR_COUNTRY_PLACEHOLDERS]);

    if (label && !AR_COUNTRY_PLACEHOLDER_LABELS.has(label)) return label;
    await page.waitForTimeout(waitMs);
  }

  return 'Empty';
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>}
 */
async function getArabicNationalityLabel(page) {
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const label = await page.evaluate(() => {
        const selectEl = document.querySelector('#nationality');
        return selectEl?.selectedOptions?.[0]?.textContent?.trim() || '';
      });
      if (label && label !== 'اختر الجنسية' && label !== 'اختر') return label;
    } catch {
      /* page may reload after Save */
    }
    await page.waitForTimeout(500);
  }
  return 'Empty';
}

/**
 * Select Country of Residence via Select2 UI (preferred on Arabic DPR CPC).
 * @param {import('@playwright/test').Page} page
 * @param {string} label
 */
async function setCountryOfResidenceByLabel(page, label) {
  await waitForCountryOfResidenceField(page);

  const select2Container = page.locator('#select2-profileCountry-container');
  const hasSelect2 = await select2Container.isVisible().catch(() => false);

  if (hasSelect2) {
    await select2Container.click();
    const search = page.locator('.select2-container--open .select2-search__field');
    if (await search.isVisible().catch(() => false)) {
      await search.fill('');
      await search.fill(label);
      await page.waitForTimeout(400);
    }

    const dropdown = page.locator('.select2-container--open .select2-results__options');
    await dropdown.waitFor({ state: 'visible', timeout: 15_000 });

    const option = page
      .locator('.select2-container--open .select2-results__option')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`) })
      .first();
    await option.waitFor({ state: 'visible', timeout: 15_000 });
    await option.click();

    await page
      .locator('#select2-profileCountry-container')
      .filter({ hasText: label })
      .waitFor({ state: 'visible', timeout: 15_000 })
      .catch(() => undefined);
    await page.waitForTimeout(400);
    return;
  }

  const setViaNative = await page.evaluate((targetName) => {
    const selectEl =
      document.querySelector('#profileCountry') ||
      document.querySelector('select[name="profileCountry"]');
    if (!selectEl) return false;

    const targetOption = Array.from(selectEl.options).find(
      (opt) => (opt.textContent || '').trim() === targetName
    );
    if (!targetOption) {
      throw new Error(`Country of Residence option not found: ${targetName}`);
    }

    selectEl.value = targetOption.value;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    if (window.$ && typeof window.$ === 'function') {
      const $select = window.$('#profileCountry').length
        ? window.$('#profileCountry')
        : window.$(selectEl);
      if (typeof $select.trigger === 'function') {
        $select.trigger('change');
      }
    }
    return true;
  }, label);

  if (!setViaNative) {
    throw new Error(`Country of Residence field not found for label: ${label}`);
  }

  await page.waitForTimeout(400);
}

async function ensureArabicProfileTab(page) {
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
  await page.locator('#my-profile-tab').waitFor({ state: 'visible', timeout: 30_000 });

  for (let attempt = 0; attempt < 5; attempt++) {
    const codeVisible = await page.locator('#country-code').isVisible().catch(() => false);
    if (codeVisible) return;
    await page.locator('#my-profile-tab').click().catch(() => undefined);
    await page.waitForTimeout(500);
  }

  await page.locator('#country-code').waitFor({ state: 'visible', timeout: 30_000 });
}

/**
 * Navigate to the Arabic CPC URL. SFMC pages often stall domcontentloaded due to
 * long-running tracking scripts; commit + shell-ready fallback avoids false timeouts.
 * @param {import('@playwright/test').Page} page
 * @param {string} cpcUrl
 */
async function gotoArabicCpc(page, cpcUrl, maxAttempts = 3) {
  let lastErr;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await page.goto(cpcUrl, { waitUntil: 'commit', timeout: 90_000 });
    } catch (err) {
      lastErr = err;
      const shellReady = await page
        .locator('#my-profile-tab')
        .waitFor({ state: 'visible', timeout: 10_000 })
        .then(() => true)
        .catch(() => false);
      if (shellReady) return;
    }

    const shellReady = await page
      .locator('#my-profile-tab')
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (shellReady) return;

    if (attempt < maxAttempts - 1) {
      await page.waitForTimeout(2000 * (attempt + 1));
    }
  }

  throw lastErr || new Error('Arabic CPC page did not load after retries.');
}

/**
 * Re-open My Profile for the next iteration. Falls back to full navigation when the
 * page is blank, timed out, or otherwise missing the CPC shell.
 * @param {import('@playwright/test').Page} page
 * @param {string} [cpcUrl]
 * @param {{ requireNationality?: boolean }} [options]
 */
async function reloadArabicMyProfile(page, cpcUrl, options = {}) {
  const { requireNationality = true } = options;

  const shellReady = await page
    .locator('#my-profile-tab')
    .waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true)
    .catch(() => false);

  if (!shellReady) {
    if (!cpcUrl) {
      throw new Error('#my-profile-tab not visible and no cpcUrl was provided for recovery.');
    }
    await openArabicMyProfile(page, cpcUrl);
    return;
  }

  try {
    await ensureArabicProfileTab(page);
    await waitForCountryOfResidenceField(page);
    if (requireNationality) {
      await waitForNationalityField(page);
    }
  } catch (err) {
    if (!cpcUrl) throw err;
    await openArabicMyProfile(page, cpcUrl);
  }
}

/** Nationality is only applicable when Country of Residence is UAE. */
async function ensureUaeCountryOfResidence(page) {
  const currentCountry = await getArabicCountryOfResidenceLabel(page);
  if (currentCountry !== UAE_COUNTRY_OF_RESIDENCE_AR) {
    await setCountryOfResidenceByLabel(page, UAE_COUNTRY_OF_RESIDENCE_AR);
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
 * @param {string} cpcUrl
 */
async function openArabicMyProfile(page, cpcUrl) {
  await gotoArabicCpc(page, cpcUrl);
  await page.locator('#my-profile-tab').waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('#my-profile-tab').click();
  await page.locator('#country-code').waitFor({ state: 'visible', timeout: 30_000 });
  await waitForCountryOfResidenceField(page);
  await waitForNationalityField(page);
}

module.exports = {
  getCountryCodes,
  getArabicCountriesOfResidence,
  getArabicNationalities,
  setCountryCode,
  setCountryOfResidenceByLabel,
  setNationalityByLabel,
  getArabicCountryOfResidenceLabel,
  getArabicNationalityLabel,
  ensureArabicProfileTab,
  ensureUaeCountryOfResidence,
  clickProfileSave,
  openArabicMyProfile,
  reloadArabicMyProfile,
  UAE_COUNTRY_OF_RESIDENCE_AR,
};
