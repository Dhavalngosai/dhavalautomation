/**
 * Salesforce Lightning – New Opportunity (global action / URL new).
 * Fills standard required fields and Type = Events where applicable.
 */

const { waitForSalesforceReady, retryAction } = require('../lib/waitHelpers');
const { lightningNewObjectUrl } = require('../lib/salesforceUrl');
const { selectOpportunityEventsRecordType } = require('../lib/recordTypePicker');

class NewOpportunityPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Open the standard Lightning new Opportunity page using the same base URL as Case creation
   * (SALESFORCE_CASE_NEW_URL or SALESFORCE_LIGHTNING_HOME_URL when set; otherwise current page origin).
   */
  async gotoNew() {
    const url = lightningNewObjectUrl(this.page, 'Opportunity');
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
    });
    await waitForSalesforceReady(this.page, { timeout: 25000 });
  }

  /**
   * If the Lightning record-type picker is shown, select Events (or SALESFORCE_OPPORTUNITY_RECORD_TYPE_LABEL) and Next.
   * Does nothing when the org skips the picker (single record type — Name field appears immediately).
   */
  async selectRecordTypeEventsIfPresent() {
    const needsNext = await selectOpportunityEventsRecordType(this.page);
    if (needsNext) {
      await clickRecordTypeNextAndWait(this.page);
    }
  }

  /**
   * @param {string} name
   */
  async fillOpportunityName(name) {
    const byLabel = this.page.getByRole('textbox', { name: /Opportunity Name/i });
    const byName = this.page.locator('input[name="Name"]');
    const loc = (await byLabel.isVisible({ timeout: 3000 }).catch(() => false)) ? byLabel : byName;
    await loc.waitFor({ state: 'visible', timeout: 15000 });
    await loc.fill(name);
  }

  /**
   * Account lookup – type search text and pick first matching option.
   * @param {string} searchText
   */
  async fillAccountLookup(searchText) {
    const accountCombo = this.page
      .getByRole('combobox', { name: /^Account Name$/i })
      .or(this.page.getByRole('combobox', { name: /^Account$/i }));

    await accountCombo.waitFor({ state: 'visible', timeout: 15000 });
    await accountCombo.click();
    await accountCombo.fill(searchText);
    const option = this.page.getByRole('option').first();
    await option.waitFor({ state: 'visible', timeout: 15000 });
    await option.click();
  }

  /**
   * Close date – accepts YYYY-MM-DD.
   * @param {string} isoDate
   */
  async fillCloseDate(isoDate) {
    const close = this.page.locator('input[name="CloseDate"]').or(
      this.page.getByRole('textbox', { name: /Close Date/i })
    );
    await close.waitFor({ state: 'visible', timeout: 15000 });
    await close.fill(isoDate);
  }

  /**
   * Stage picklist – first open combobox, then option by label (e.g. Prospecting).
   * @param {string} stageLabel
   */
  async selectStage(stageLabel) {
    const stage = this.page.getByRole('combobox', { name: /^Stage$/i });
    await stage.waitFor({ state: 'visible', timeout: 15000 });
    await stage.click();
    await this.page.getByRole('option', { name: new RegExp(`^${escapeRegex(stageLabel)}$`, 'i') }).click();
  }

  /**
   * Type picklist = Events (standard field "Type").
   */
  async selectTypeEvents() {
    const typeCombo = this.page.getByRole('combobox', { name: /^Type$/i });
    await typeCombo.waitFor({ state: 'visible', timeout: 15000 });
    await typeCombo.click();
    await this.page.getByRole('option', { name: /^Events$/i }).click();
  }

  async clickSave() {
    const save = this.page.getByRole('button', { name: /^Save$/i });
    await save.waitFor({ state: 'visible', timeout: 15000 });
    await save.click();
    await waitForSalesforceReady(this.page, { timeout: 30000 });
  }

  /**
   * Full create flow after caller is on Lightning (post-login).
   * @param {Object} data
   * @param {string} data.opportunityName
   * @param {string} data.accountSearch – lookup search string (required if Account is mandatory)
   * @param {string} [data.closeDate] – YYYY-MM-DD
   * @param {string} [data.stage] – default Prospecting
   */
  async createEventsOpportunity(data) {
    const closeDate = data.closeDate || defaultCloseDateIso();
    const stage = data.stage || 'Prospecting';

    await this.gotoNew();
    await this.selectRecordTypeEventsIfPresent();
    await this.fillOpportunityName(data.opportunityName);
    if (data.accountSearch) {
      await retryAction(
        async () => {
          await this.fillAccountLookup(data.accountSearch);
        },
        { timeoutMs: 20000, intervalMs: 800 }
      );
    }
    await this.fillCloseDate(closeDate);
    await this.selectStage(stage);
    await this.selectTypeEvents();
    await this.clickSave();
  }
}

/**
 * Clicks the record-type screen "Next" (prefers the open dialog footer) and waits for Lightning to settle.
 * @param {import('@playwright/test').Page} page
 */
async function clickRecordTypeNextAndWait(page) {
  const onForm = await page
    .getByRole('textbox', { name: /Opportunity Name/i })
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  if (onForm) {
    await waitForSalesforceReady(page, { timeout: 10_000 });
    return;
  }

  const dialog = page.getByRole('dialog').last();
  await dialog.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});

  const footer = dialog.locator('.modal-footer, .slds-modal__footer, footer, [class*="footer"]');
  const nameMatchers = [/^\s*Next\s*$/i, /^\s*Continue\s*$/i, /^\s*OK\s*$/i];

  for (const re of nameMatchers) {
    const inFooter = footer.getByRole('button', { name: re }).first();
    if (await inFooter.isVisible({ timeout: 4000 }).catch(() => false)) {
      await inFooter.scrollIntoViewIfNeeded().catch(() => {});
      await inFooter.click({ timeout: 20_000, force: true });
      await waitForSalesforceReady(page, { timeout: 45_000 });
      return;
    }
    const inDialog = dialog.getByRole('button', { name: re }).first();
    if (await inDialog.isVisible({ timeout: 4000 }).catch(() => false)) {
      await inDialog.scrollIntoViewIfNeeded().catch(() => {});
      await inDialog.click({ timeout: 20_000, force: true });
      await waitForSalesforceReady(page, { timeout: 45_000 });
      return;
    }
  }

  const lightningBtn = dialog.locator('lightning-button button, button.slds-button').filter({ hasText: /^Next$/i }).first();
  if (await lightningBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await lightningBtn.click({ timeout: 20_000, force: true });
    await waitForSalesforceReady(page, { timeout: 45_000 });
    return;
  }

  const globalNext = page.getByRole('button', { name: /^Next$/i }).first();
  if (await globalNext.isVisible({ timeout: 5000 }).catch(() => false)) {
    await globalNext.scrollIntoViewIfNeeded().catch(() => {});
    await globalNext.click({ timeout: 20_000, force: true });
    await waitForSalesforceReady(page, { timeout: 45_000 });
    return;
  }

  throw new Error(
    'Record type step: could not find Next / Continue / OK in the modal footer. Check the dialog layout or add a locator.'
  );
}

function defaultCloseDateIso() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { NewOpportunityPage, clickRecordTypeNextAndWait };
