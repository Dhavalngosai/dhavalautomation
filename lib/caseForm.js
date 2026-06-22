/**
 * Open Lightning Case new-record form (record type picker + Subject field).
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady } = require('./waitHelpers');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { lightningNewObjectUrl } = require('./salesforceUrl');

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * @param {{ sfReadyMs?: number, untilVisible?: { timeout: number } }} [opts]
 */
async function waitForCaseSubjectField(page, opts = {}) {
  const timeout = opts.untilVisible?.timeout ?? 60_000;

  const subject = page
    .getByRole('textbox', { name: 'Subject' })
    .or(page.getByLabel('Subject'))
    .or(page.locator('records-record-layout-item').filter({ hasText: /^Subject/i }).locator('input, textarea'))
    .or(page.locator('lightning-input').filter({ hasText: /^Subject/i }).locator('input'))
    .or(page.getByRole('dialog').getByRole('textbox', { name: 'Subject' }));

  await subject.first().waitFor({ state: 'visible', timeout });
  return subject.first();
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
      await byRadio.first().click();
    } else if (await byLabel.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await byLabel.first().click();
    } else if (await bySpan.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await bySpan.first().click();
    }
  } else if (radioCount > 0) {
    const firstRadio = dialog.locator('input[type="radio"]').first();
    const firstFaux = dialog.locator('span.slds-radio--faux').first();
    if (await firstRadio.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await firstRadio.click({ force: true });
    } else if (await firstFaux.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await firstFaux.click();
    }
  }

  if (hasNext) {
    await nextBtn.waitFor({ state: 'visible', ...untilVisible });
    await nextBtn.click();
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
}

module.exports = {
  caseNewUrl,
  openNewCaseForm,
  selectCaseRecordTypeIfShown,
  waitForCaseSubjectField,
};
