/**
 * Open, fill, and save Lightning Case new-record forms.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  waitForSalesforceReady,
  scrollIntoView,
  scrollAndClick,
  scrollAndFill,
  scrollRecordForm,
} = require('./waitHelpers');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { lightningNewObjectUrl } = require('./salesforceUrl');

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string | RegExp} comboboxName
 */
function comboboxForName(page, comboboxName) {
  if (comboboxName instanceof RegExp) {
    return page.getByRole('combobox', { name: comboboxName }).first();
  }
  return page.getByRole('combobox', { name: comboboxName, exact: true }).first();
}

/** Sub Asset values that require Area + Sub Area (Riverland™ Dubai). */
function isRiverlandDubaiSubAsset(subAsset) {
  return /riverland.*dubai/i.test(String(subAsset ?? '').trim());
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {object} row
 */
async function fillRiverlandAreaFields(page, row) {
  if (!isRiverlandDubaiSubAsset(row.subAsset)) return;

  await scrollRecordForm(page);

  if (row.area) {
    await selectComboboxValue(page, 'Area', row.area);
    await page.waitForTimeout(1_500);
  }

  if (row.subArea) {
    await selectComboboxValue(page, 'Sub Area', row.subArea);
    await page.waitForTimeout(1_000);
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} [lightningHome]
 */
function caseNewUrl(page, lightningHome) {
  const fromEnv = process.env.SALESFORCE_CASE_NEW_URL?.trim();
  if (fromEnv) return fromEnv;

  if (lightningHome) {
    try {
      return `${new URL(lightningHome).origin}/lightning/o/Case/new`;
    } catch {
      /* fall through */
    }
  }

  return lightningNewObjectUrl(page, 'Case');
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ untilVisible?: { timeout: number } }} [opts]
 */
async function waitForCaseSubjectField(page, opts = {}) {
  const timeout = opts.untilVisible?.timeout ?? 60_000;

  const subject = page
    .getByRole('textbox', { name: 'Subject' })
    .or(page.getByLabel('Subject'))
    .or(page.locator('records-record-layout-item').filter({ hasText: /^Subject/i }).locator('input, textarea'))
    .or(page.locator('lightning-input').filter({ hasText: /^Subject/i }).locator('input'))
    .or(page.getByRole('dialog').getByRole('textbox', { name: 'Subject' }));

  const field = subject.first();
  await field.waitFor({ state: 'visible', timeout });
  await scrollIntoView(field);
  return field;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ sfReadyMs?: number, untilVisible?: { timeout: number } }} [opts]
 */
async function selectCaseRecordTypeIfShown(page, opts = {}) {
  const sfReadyMs = opts.sfReadyMs ?? 20_000;
  const untilVisible = opts.untilVisible ?? { timeout: 30_000 };
  const recordTypeLabel = (process.env.SALESFORCE_CASE_RECORD_TYPE_LABEL || '').trim();

  const subjectVisible = await page
    .getByRole('textbox', { name: 'Subject' })
    .isVisible({ timeout: 3_000 })
    .catch(() => false);
  if (subjectVisible) return;

  const dialog = page.getByRole('dialog').last();
  await scrollIntoView(dialog);

  const nextBtn = page.getByRole('button', { name: 'Next', exact: true });
  const hasNext = await nextBtn.isVisible({ timeout: 8_000 }).catch(() => false);
  const radioCount = await dialog.locator('input[type="radio"]').count().catch(() => 0);

  if (!hasNext && radioCount === 0) return;

  if (recordTypeLabel) {
    const labelRe = new RegExp(escapeRe(recordTypeLabel), 'i');
    const byRadio = dialog.getByRole('radio', { name: labelRe });
    const byLabel = dialog.locator('label').filter({ hasText: labelRe });
    const bySpan = dialog.locator('span').filter({ hasText: labelRe });

    if (await byRadio.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await scrollAndClick(byRadio.first());
    } else if (await byLabel.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await scrollAndClick(byLabel.first());
    } else if (await bySpan.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await scrollAndClick(bySpan.first());
    }
  } else if (radioCount > 0) {
    const firstRadio = dialog.locator('input[type="radio"]').first();
    const firstFaux = dialog.locator('span.slds-radio--faux').first();
    if (await firstRadio.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await scrollIntoView(firstRadio);
      await firstRadio.click({ force: true });
    } else if (await firstFaux.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await scrollAndClick(firstFaux);
    }
  }

  if (hasNext) {
    await nextBtn.waitFor({ state: 'visible', ...untilVisible });
    await scrollAndClick(nextBtn);
    await waitForSalesforceReady(page, { timeout: sfReadyMs });
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} lightningHome
 * @param {{ sfReadyMs?: number, untilVisible?: { timeout: number } }} [opts]
 */
async function openNewCaseForm(page, lightningHome, opts = {}) {
  const sfReadyMs = opts.sfReadyMs ?? 20_000;
  const untilVisible = opts.untilVisible ?? { timeout: 30_000 };

  const newUrl = caseNewUrl(page, lightningHome);
  await page.goto(newUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForURL(/\/lightning\//, { timeout: 60_000 }).catch(() => {});
  await waitForSalesforceReady(page, { timeout: sfReadyMs });

  await selectCaseRecordTypeIfShown(page, opts);
  await waitForCaseSubjectField(page, { untilVisible: { timeout: Math.max(untilVisible.timeout, 60_000) } });
  await scrollRecordForm(page);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} value
 * @param {boolean} [exact]
 */
async function clickPicklistOption(page, value, exact = false) {
  const valueRe = new RegExp(escapeRe(value), 'i');
  const pickers = [
    () => page.getByRole('option', { name: exact ? value : valueRe }).first(),
    () => page.locator('[role="listbox"]:visible [role="option"]').filter({ hasText: valueRe }).first(),
    () => page.locator('lightning-base-combobox-item').filter({ hasText: valueRe }).first(),
    () => page.locator('.slds-listbox__option').filter({ hasText: valueRe }).first(),
    () => page.locator('span').filter({ hasText: valueRe }).first(),
    () => page.getByText(value, { exact }).first(),
  ];

  for (const getPicker of pickers) {
    const loc = getPicker();
    try {
      await loc.waitFor({ state: 'visible', timeout: 6_000 });
      await scrollAndClick(loc, { timeout: 8_000 });
      await page.keyboard.press('Escape').catch(() => {});
      return true;
    } catch {
      /* try next */
    }
  }

  return false;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string | RegExp} comboboxName
 * @param {string} value
 * @param {{ lookup?: boolean, exact?: boolean }} [opts]
 */
async function selectComboboxValue(page, comboboxName, value, opts = {}) {
  if (!value) return;

  const combo = comboboxForName(page, comboboxName);
  await scrollAndClick(combo);

  if (opts.lookup) {
    const search = value.split(/\s+/)[0] || value;
    await combo.fill(search);
    await page.waitForTimeout(1_500);
  }

  const picked = await clickPicklistOption(page, value, opts.exact ?? false);
  if (!picked) {
    throw new Error(`Could not select "${value}" for combobox ${String(comboboxName)}`);
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} accountLabel
 */
async function fillAccountLookup(page, accountLabel) {
  const combobox = comboboxForName(page, 'Account Name');
  await scrollAndClick(combobox);

  const search = accountLabel.split(/\s+/)[0] || accountLabel;
  await combobox.fill(search);
  await page.waitForTimeout(1_500);

  const exactOption = page.getByRole('option', { name: accountLabel, exact: true });
  if (await exactOption.first().isVisible({ timeout: 10_000 }).catch(() => false)) {
    await scrollAndClick(exactOption.first());
    return;
  }

  const listbox = page.getByRole('listbox').filter({ has: page.getByText(accountLabel, { exact: true }) }).last();
  const row = listbox.locator('[role="option"], lightning-base-combobox-item').filter({ hasText: accountLabel }).first();
  if (await row.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await scrollAndClick(row);
    return;
  }

  const picked = await clickPicklistOption(page, accountLabel, true);
  if (!picked) {
    throw new Error(`Could not select Account "${accountLabel}"`);
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} caseType
 */
async function selectCaseType(page, caseType) {
  await scrollRecordForm(page);

  const combo = comboboxForName(page, 'Case Type');
  await scrollAndClick(combo);
  await page.waitForTimeout(500);

  const picked = await clickPicklistOption(page, caseType, false);
  if (!picked) {
    const fallback = page.locator('span').filter({ hasText: caseType }).first();
    await scrollAndClick(fallback, { timeout: 10_000 });
  }

  await page.keyboard.press('Tab').catch(() => {});
  await page.waitForTimeout(2_000);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} subType
 */
async function selectSubType(page, subType) {
  await scrollRecordForm(page);

  const combo = comboboxForName(page, 'Sub Type');
  await scrollAndClick(combo, { timeout: 15_000 });
  await page.waitForTimeout(800);

  const picked = await clickPicklistOption(page, subType, false);
  if (!picked) {
    await scrollAndClick(page.getByText(subType, { exact: true }), { timeout: 10_000 });
  }

  await page.keyboard.press('Tab').catch(() => {});
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function trySelectFirstSubAsset(page) {
  await scrollRecordForm(page);

  const combo = comboboxForName(page, 'Sub Asset');
  if (!(await combo.isVisible({ timeout: 3_000 }).catch(() => false))) return false;
  if (!(await combo.isEnabled().catch(() => false))) return false;

  await scrollAndClick(combo);

  const first = page
    .locator('[role="listbox"]:visible [role="option"]')
    .first()
    .or(page.locator('lightning-base-combobox-item').first());

  if (await first.isVisible({ timeout: 5_000 }).catch(() => false)) {
    const label = (await first.textContent())?.trim();
    await scrollAndClick(first);
    console.log(`[caseForm] Auto-selected Sub Asset: ${label || '(first option)'}`);
    return true;
  }

  return false;
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function collectValidationErrors(page) {
  const messages = [];

  const snagHeading = page.getByRole('heading', { name: 'We hit a snag.' });
  if (await snagHeading.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await scrollIntoView(snagHeading);
    messages.push('We hit a snag.');
  }

  const selectors = [
    '.errorsList li',
    'ul.errors li',
    '.forcePageErrorList li',
    '.slds-has-error .slds-form-element__help',
    '[data-error-message]',
  ];

  for (const sel of selectors) {
    const loc = page.locator(sel);
    const count = await loc.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const item = loc.nth(i);
      await scrollIntoView(item).catch(() => {});
      const text = (await item.textContent())?.replace(/\s+/g, ' ').trim();
      if (text) messages.push(text);
    }
  }

  const fieldLinks = page.locator('.forcePageErrorList a, ul.pageErrors a, .errorsList a');
  const linkCount = await fieldLinks.count().catch(() => 0);
  for (let i = 0; i < linkCount; i++) {
    const text = (await fieldLinks.nth(i).textContent())?.trim();
    if (text) messages.push(text);
  }

  return [...new Set(messages.filter(Boolean))];
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function getCreatedCaseNumber(page) {
  await page.waitForURL(/\/lightning\/r\/Case\//, { timeout: 30_000 });
  await waitForSalesforceReady(page, { timeout: 15_000 });

  const locators = [
    page.locator('[data-target-selection-name="sfdc:RecordField.Case.CaseNumber"] lightning-formatted-text'),
    page.locator('records-record-layout-item').filter({ hasText: /^Case Number/i }).locator('lightning-formatted-text, span.slds-form-element__static'),
    page.getByRole('listitem').filter({ hasText: /Case Number/i }).locator('lightning-formatted-text'),
    page.locator('.slds-page-header__title lightning-formatted-name'),
    page.locator('lightning-formatted-text').filter({ hasText: /^\d{4,}/ }),
  ];

  for (const loc of locators) {
    await scrollIntoView(loc.first()).catch(() => {});
    const text = (await loc.first().textContent({ timeout: 8_000 }).catch(() => null))?.trim();
    if (text && /\d/.test(text)) {
      return text.replace(/\s+/g, ' ').trim();
    }
  }

  throw new Error('Case saved but Case Number could not be read from the record page');
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {object} row
 * @param {{ sfReadyMs?: number }} [opts]
 */
async function saveCaseForm(page, row, opts = {}) {
  const sfReadyMs = opts.sfReadyMs ?? 20_000;
  const saveBtn = page.getByRole('button', { name: 'Save', exact: true });

  for (let attempt = 0; attempt < 4; attempt++) {
    await scrollRecordForm(page);
    await scrollAndClick(saveBtn);
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    const saved = await page
      .waitForURL(/\/lightning\/r\/Case\//, { timeout: 12_000 })
      .then(() => true)
      .catch(() => false);
    if (saved) return getCreatedCaseNumber(page);

    await page.waitForTimeout(1_500);
    await scrollRecordForm(page);

    const errors = await collectValidationErrors(page);
    const errorText = errors.join(' ').toLowerCase();

    if (row.caseType) await selectCaseType(page, row.caseType);
    if (row.subType) await selectSubType(page, row.subType);

    if (row.subAsset) {
      await selectComboboxValue(page, 'Sub Asset', row.subAsset);
    } else if (/sub asset/.test(errorText)) {
      await trySelectFirstSubAsset(page);
    }

    if (row.asset && /asset/.test(errorText)) {
      await selectComboboxValue(page, /^Asset$/i, row.asset);
    }

    if (isRiverlandDubaiSubAsset(row.subAsset)) {
      if (row.area && /area/.test(errorText)) {
        await selectComboboxValue(page, 'Area', row.area);
        await page.waitForTimeout(1_000);
      }
      if (row.subArea && /sub area/.test(errorText)) {
        await selectComboboxValue(page, 'Sub Area', row.subArea);
      }
    }

    if (attempt === 3) {
      const finalErrors = await collectValidationErrors(page);
      const detail = finalErrors.length ? finalErrors.join('; ') : 'validation errors remain on the form';
      throw new Error(`Save failed — ${detail}`);
    }
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {object} row
 * @param {{ sfReadyMs?: number, untilVisible?: { timeout: number } }} [opts]
 */
async function fillCaseFormFields(page, row, opts = {}) {
  await scrollRecordForm(page);

  const subject = page.getByRole('textbox', { name: 'Subject' });
  await scrollAndFill(subject, row.subject);

  if (row.description) {
    const description = page.getByRole('textbox', { name: 'Description' });
    await scrollAndFill(description, row.description);
  }

  if (row.accountName) {
    await fillAccountLookup(page, row.accountName);
    await waitForSalesforceReady(page, { timeout: opts.sfReadyMs ?? 20_000 });
  }

  if (row.asset) {
    await scrollRecordForm(page);
    await selectComboboxValue(page, /^Asset$/i, row.asset);
    await page.waitForTimeout(1_500);
  }

  if (row.subAsset) {
    await scrollRecordForm(page);
    await selectComboboxValue(page, 'Sub Asset', row.subAsset);
    await page.waitForTimeout(1_000);
  }

  await fillRiverlandAreaFields(page, row);

  if (row.caseType) {
    await selectCaseType(page, row.caseType);
  }

  if (row.subType) {
    await selectSubType(page, row.subType);
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {object} row
 * @param {string} lightningHome
 * @param {{ sfReadyMs?: number, untilVisible?: { timeout: number } }} [opts]
 */
async function fillAndSaveCaseFromRow(page, row, lightningHome, opts = {}) {
  await openNewCaseForm(page, lightningHome, opts);
  await fillCaseFormFields(page, row, opts);
  return saveCaseForm(page, row, opts);
}

module.exports = {
  caseNewUrl,
  openNewCaseForm,
  selectCaseRecordTypeIfShown,
  waitForCaseSubjectField,
  fillCaseFormFields,
  saveCaseForm,
  fillAndSaveCaseFromRow,
  getCreatedCaseNumber,
  collectValidationErrors,
  fillAccountLookup,
  selectComboboxValue,
  selectCaseType,
  selectSubType,
  isRiverlandDubaiSubAsset,
  fillRiverlandAreaFields,
};
