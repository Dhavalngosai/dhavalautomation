/**
 * DHE Opportunity lifecycle: create `TestOpp-<timestamp>` → open that same record →
 * Related: change Reservations event time → add one product → main view → Closed Won.
 * Run: npm test -- tests1/create-DHE-Opp-LifeCycle.spec.ts
 *
 * Required in .env: SALESFORCE_USERNAME, SALESFORCE_PASSWORD
 * Optional: SALESFORCE_BASE_URL (default https://test.salesforce.com), SALESFORCE_LIGHTNING_HOME_URL,
 *           SALESFORCE_TEST_PRODUCT_NAME (default DHE Product — Add Products dialog search).
 * Opportunity name is always TestOpp + timestamp suffix (e.g. TestOpp-1730000000000).
 *
 * Date of Visit uses MM/DD/YYYY with a varying future day. Close Date is always today + 1 day (MM/DD/YYYY).
 *
 * Waits: optional SALESFORCE_LOCATOR_TIMEOUT_MS (default 30000, slightly above playwright.config actionTimeout).
 *        After big navigations, waitForSalesforceReady lets Lightning settle (networkidle, brief spinner handling).
 * Retries: this spec uses retries: 0 (no full test restart). Post-create phases retry in-place via runPhase()
 *          (optional SALESFORCE_STEP_RETRY_MS, default 45000). Login + create opp are not re-run on phase retry.
 */
import { test, expect, type Locator, type Page } from '@playwright/test';
import { testData } from '../utils/testData';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady, retryAction } = require('../lib/waitHelpers');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loginToSandboxAndOpenHome } = require('../lib/salesforceLogin');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { selectOpportunityDHERecordType } = require('../lib/recordTypePicker');

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setHours(12, 0, 0, 0);
  out.setDate(out.getDate() + days);
  return out;
}

/** US-style date for Lightning text fields (MM/DD/YYYY). */
function toMmDdYyyy(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const y = d.getFullYear();
  return `${m}/${day}/${y}`;
}

/** Parse Salesforce time option labels like "12:00 AM" to minutes since midnight. */
function parseTimeOptionLabel(label: string): number | null {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'AM') {
    if (hour === 12) hour = 0;
  } else if (hour !== 12) {
    hour += 12;
  }

  return hour * 60 + minute;
}

/** Format minutes since midnight as a Salesforce time option label (e.g. "1:30 PM"). */
function formatTimeOptionLabel(totalMinutes: number): string {
  const clamped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour24 = Math.floor(clamped / 60);
  const minute = clamped % 60;
  const minuteText = String(minute).padStart(2, '0');

  if (hour24 === 0) return `12:${minuteText} AM`;
  if (hour24 < 12) return `${hour24}:${minuteText} AM`;
  if (hour24 === 12) return `12:${minuteText} PM`;
  return `${hour24 - 12}:${minuteText} PM`;
}

/** Pick random From/To reservation times with To strictly after From. */
function pickRandomReservationTimes(): { from: string; to: string } {
  const minuteSlots = [0, 15, 30, 45];
  const fromMinuteSlot = minuteSlots[Math.floor(Math.random() * minuteSlots.length)];
  const fromHour = Math.floor(Math.random() * 22);
  const fromTotal = fromHour * 60 + fromMinuteSlot;

  const minDurationMinutes = 30 + Math.floor(Math.random() * 4) * 15;
  const toTotal = Math.min(fromTotal + minDurationMinutes, 23 * 60 + 45);

  return {
    from: formatTimeOptionLabel(fromTotal),
    to: formatTimeOptionLabel(toTotal),
  };
}

async function readComboboxOptionLabels(page: Page): Promise<string[]> {
  const listbox = page.getByRole('listbox').last();
  await listbox.waitFor({ state: 'visible', timeout: 10_000 });

  const options = listbox.getByRole('option');
  const count = await options.count();
  const labels: string[] = [];

  for (let i = 0; i < count; i++) {
    const text = (await options.nth(i).innerText()).trim();
    if (text) labels.push(text);
  }

  return labels;
}

async function selectReservationTimeOption(page: Page, combobox: Locator, label: string) {
  await combobox.scrollIntoViewIfNeeded();
  await combobox.click();
  await page.getByRole('option', { name: label, exact: true }).click();
}

const rawLocatorMs = Number(process.env.SALESFORCE_LOCATOR_TIMEOUT_MS);
const locatorTimeoutMs = Number.isFinite(rawLocatorMs) && rawLocatorMs > 0 ? rawLocatorMs : 30_000;
const untilVisible = { timeout: locatorTimeoutMs };
const sfReadyMs = 20_000;
const stepRetryMs = Number(process.env.SALESFORCE_STEP_RETRY_MS) || 45_000;

function addProductsDialog(page: Page) {
  return page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: /^Add Products$/i }),
  });
}

function editSelectedProductsDialog(page: Page) {
  return page.getByRole('dialog', { name: /Edit Selected Products/i });
}

function blockingRecordModal(page: Page) {
  return page.locator('.slds-modal.slds-fade-in-open, [role="dialog"]');
}

/** Details/Related tablist on the opportunity record (not Activity/Chatter sidebar). */
function opportunityRecordTablist(page: Page) {
  return page
    .locator('[role="tablist"]')
    .filter({ has: page.getByRole('tab', { name: 'Details' }) })
    .filter({ has: page.getByRole('tab', { name: 'Related' }) })
    .first();
}

async function switchToRelatedTab(page: Page, untilVisible: { timeout: number }) {
  if (await blockingRecordModal(page).first().isVisible().catch(() => false)) return;

  const relatedTab = opportunityRecordTablist(page).getByRole('tab', { name: 'Related' });
  if ((await relatedTab.getAttribute('aria-selected')) !== 'true') {
    await relatedTab.click({ timeout: untilVisible.timeout });
    await page.waitForLoadState('domcontentloaded');
  }
}

function productsRelatedSection(page: Page) {
  return page.locator('article').filter({
    has: page.getByRole('heading', { name: /^Products/i }),
  });
}

/** Related tab → Products related list → click Add Products. Skips if Add Products dialog is already open. */
async function clickAddProductsButton(page: Page, untilVisible: { timeout: number }) {
  const productModal = addProductsDialog(page);
  if (await productModal.isVisible().catch(() => false)) return;

  await switchToRelatedTab(page, untilVisible);

  const products = productsRelatedSection(page);
  await products.scrollIntoViewIfNeeded();
  await products.waitFor({ state: 'visible', ...untilVisible });

  const addProductsBtn = products
    .getByRole('button', { name: 'Add Products' })
    .or(products.locator('button').filter({ hasText: /^Add Products$/ }));

  await addProductsBtn.first().waitFor({ state: 'visible', ...untilVisible });
  await addProductsBtn.first().scrollIntoViewIfNeeded();
  await addProductsBtn.first().click({ timeout: untilVisible.timeout });
}

async function openAddProductsDialog(page: Page, untilVisible: { timeout: number }) {
  const productModal = addProductsDialog(page);
  if (await productModal.isVisible().catch(() => false)) return;

  await switchToRelatedTab(page, untilVisible);

  const products = productsRelatedSection(page);
  await products.scrollIntoViewIfNeeded();

  const choosePriceBook = products.getByRole('button', { name: 'Choose Price Book', exact: true });
  const addProductsBtn = products
    .getByRole('button', { name: 'Add Products' })
    .or(products.locator('button').filter({ hasText: /^Add Products$/ }));

  if (await choosePriceBook.isVisible().catch(() => false) && !(await addProductsBtn.first().isEnabled().catch(() => true))) {
    await choosePriceBook.click();
    const priceBookRow = page.getByRole('row', { name: /Standard Price Book/i }).first();
    await priceBookRow.waitFor({ state: 'visible', timeout: 10_000 });
    await priceBookRow.click();
    await page.getByRole('button', { name: 'Next', exact: true }).click({ timeout: 10_000 }).catch(() => {});
    await page.getByRole('button', { name: 'Save', exact: true }).click({ timeout: 10_000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded');
  }

  await addProductsBtn.first().waitFor({ state: 'visible', ...untilVisible });
  await addProductsBtn.first().scrollIntoViewIfNeeded();
  await addProductsBtn.first().click({ timeout: untilVisible.timeout });
  await productModal.waitFor({ state: 'visible', ...untilVisible });
}

type StepStatus = 'PASS' | 'FAIL';

interface StepRecord {
  label: string;
  status: StepStatus;
}

const ANSI_GREEN = '\x1b[32m';
const ANSI_RED = '\x1b[31m';
const ANSI_RESET = '\x1b[0m';

function colorPass(text: string): string {
  return `${ANSI_GREEN}${text}${ANSI_RESET}`;
}

function colorFail(text: string): string {
  return `${ANSI_RED}${text}${ANSI_RESET}`;
}

/** Re-run only this phase on failure (same browser session — does not restart login/create). */
function createStepRunner(stepResults: StepRecord[]) {
  const logStep = (label: string, status: StepStatus, detail?: string) => {
    const tag = status === 'PASS' ? colorPass('[PASS]') : colorFail('[FAIL]');
    const suffix = detail ? ` — ${status === 'FAIL' ? colorFail(detail) : detail}` : '';
    console.log(`${tag} ${label}${suffix}`);
  };

  async function runStep<T>(label: string, fn: () => Promise<T>): Promise<T> {
    try {
      const result = await test.step(label, fn);
      stepResults.push({ label, status: 'PASS' });
      logStep(label, 'PASS');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
      stepResults.push({ label, status: 'FAIL' });
      logStep(label, 'FAIL', message);
      throw error;
    }
  }

  async function runPhase<T>(label: string, fn: () => Promise<T>, timeoutMs = stepRetryMs): Promise<T> {
    try {
      const result = await retryAction(() => test.step(label, fn), { timeoutMs, intervalMs: 1_500 });
      stepResults.push({ label, status: 'PASS' });
      logStep(label, 'PASS');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
      stepResults.push({ label, status: 'FAIL' });
      logStep(label, 'FAIL', message);
      throw error;
    }
  }

  function printStepSummary() {
    const passed = stepResults.filter((s) => s.status === 'PASS').length;
    const failed = stepResults.filter((s) => s.status === 'FAIL').length;
    console.log('\n============================================');
    console.log(' STEP SUMMARY');
    for (const step of stepResults) {
      const tag = step.status === 'PASS' ? colorPass('[PASS]') : colorFail('[FAIL]');
      console.log(`  ${tag} ${step.label}`);
    }
    console.log(
      `  Total: ${stepResults.length}  Passed: ${colorPass(String(passed))}  Failed: ${colorFail(String(failed))}`,
    );
    console.log(`  OVERALL: ${failed === 0 ? colorPass('PASS') : colorFail('FAIL')}`);
    console.log('============================================\n');
  }

  return { runStep, runPhase, printStepSummary };
}

/** Click Next on the topmost open Lightning modal/dialog. */
async function clickModalNext(page: Page) {
  const dialog = page.locator('.slds-modal.slds-fade-in-open, [role="dialog"]').last();
  const nextBtn = dialog.getByRole('button', { name: 'Next', exact: true });
  await nextBtn.waitFor({ state: 'visible', timeout: 10_000 });
  await nextBtn.click({ timeout: 10_000 });
  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

async function advanceProductWizard(page: Page, steps: number) {
  for (let i = 0; i < steps; i++) {
    await clickModalNext(page);
  }
}

/** Search, select a product in the Add Products dialog, and click Next. */
async function selectFirstProductInAddProductsModal(page: Page, untilVisible: { timeout: number }) {
  const searchTimeout = Math.min(untilVisible.timeout, 30_000);
  const productModal = addProductsDialog(page);

  if (!(await productModal.isVisible().catch(() => false))) {
    await openAddProductsDialog(page, untilVisible);
  } else {
    await productModal.waitFor({ state: 'visible', ...untilVisible });
  }

  await productModal.getByRole('grid').waitFor({ state: 'visible', timeout: 15_000 });

  const productName = (process.env.SALESFORCE_TEST_PRODUCT_NAME || 'DHE Product').trim();

  const searchBox = productModal.getByRole('textbox', { name: /Search Products/i });
  await searchBox.waitFor({ state: 'visible', ...untilVisible });
  await searchBox.click();
  await searchBox.fill('');
  await searchBox.fill(productName);
  await searchBox.press('Enter').catch(() => {});

  const productHeader = productModal.getByRole('rowheader', { name: productName, exact: true });
  await productHeader.waitFor({ state: 'attached', timeout: searchTimeout });
  await productHeader.scrollIntoViewIfNeeded();
  await productHeader.waitFor({ state: 'visible', timeout: searchTimeout });

  const productRow = productModal
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader', { name: productName, exact: true }) })
    .first();

  const checkbox = productRow.getByRole('checkbox').first();
  await checkbox.scrollIntoViewIfNeeded();
  if (!(await checkbox.isChecked().catch(() => false))) {
    // SLDS overlays the native input with a label that intercepts pointer events.
    await productRow.locator('label.slds-checkbox__label').click({ timeout: untilVisible.timeout });
  }
  await expect(checkbox).toBeChecked({ timeout: untilVisible.timeout });

  const nextBtn = productModal.getByRole('button', { name: 'Next', exact: true });
  await nextBtn.waitFor({ state: 'visible', timeout: 10_000 });
  await expect(nextBtn).toBeEnabled({ timeout: untilVisible.timeout });
  await nextBtn.click({ timeout: untilVisible.timeout });
}

/** Fill quantity on the edit-selected-products step and save. */
async function saveProductQuantityInWizard(page: Page, untilVisible: { timeout: number }) {
  const productName = (process.env.SALESFORCE_TEST_PRODUCT_NAME || 'DHE Product').trim();
  const quantity = (process.env.SALESFORCE_TEST_PRODUCT_QUANTITY || '2').trim();
  const editModal = editSelectedProductsDialog(page);
  await editModal.waitFor({ state: 'visible', ...untilVisible });
  await editModal.getByRole('table').waitFor({ state: 'visible', timeout: 15_000 });

  // Data rows live in the 2nd rowgroup (1st is the header). Prefer row name; fallback to link filter.
  const dataRow = editModal
    .getByRole('row', { name: new RegExp(productName) })
    .or(
      editModal
        .getByRole('row')
        .filter({ has: page.getByRole('link', { name: productName, exact: true }) }),
    )
    .or(editModal.getByRole('rowgroup').nth(1).getByRole('row').first())
    .first();

  await dataRow.waitFor({ state: 'attached', ...untilVisible });
  await dataRow.scrollIntoViewIfNeeded();

  // Row textboxes: Sales Price (0), Quantity (1), Discount (2), Line Description (3)
  const quantityInput = dataRow.getByRole('textbox').nth(1);
  await quantityInput.waitFor({ state: 'visible', ...untilVisible });
  await quantityInput.click({ timeout: untilVisible.timeout });
  await quantityInput.press('Control+a');
  await quantityInput.pressSequentially(quantity, { delay: 50 });
  await quantityInput.press('Tab');
  await expect(quantityInput).toHaveValue(new RegExp(`^${quantity.replace('.', '\\.')}(\\.0+)?$`), {
    timeout: 10_000,
  });

  await editModal.getByRole('button', { name: 'Save', exact: true }).click({ timeout: untilVisible.timeout });
  await editModal.waitFor({ state: 'hidden', timeout: untilVisible.timeout });
}

/** Pick From/To Time on the open Reservation edit dialog and save. */
async function editReservationEventTime(page: Page, untilVisible: { timeout: number }) {
  await switchToRelatedTab(page, untilVisible);

  const reservationsArticle = page
    .getByRole('heading', { name: /Reservations/i })
    .locator('xpath=ancestor::article[1]');
    await reservationsArticle.scrollIntoViewIfNeeded();
  const showActions = reservationsArticle
    .getByRole('button', { name: /Show (more )?actions/i })
    .first();
  await showActions.scrollIntoViewIfNeeded();
  await showActions.click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();

  const editDialog = page.getByRole('dialog', { name: /Edit B-/ });
  await editDialog.waitFor({ state: 'visible', ...untilVisible });

  const fromTime = editDialog.getByRole('combobox', { name: 'From Time' });
  await fromTime.scrollIntoViewIfNeeded();
  await fromTime.click();
  const fromOptions = await readComboboxOptionLabels(page);

  let fromLabel: string;
  let toLabel: string;

  if (fromOptions.length >= 1) {
    fromLabel = fromOptions[Math.floor(Math.random() * fromOptions.length)];
    await page.getByRole('option', { name: fromLabel, exact: true }).click();
  } else {
    ({ from: fromLabel, to: toLabel } = pickRandomReservationTimes());
    await selectReservationTimeOption(page, fromTime, fromLabel);
  }

  const toTime = editDialog.getByRole('combobox', { name: 'To Time' });
  await toTime.scrollIntoViewIfNeeded();
  await toTime.click();
  const toOptions = await readComboboxOptionLabels(page);
  const fromMinutes = parseTimeOptionLabel(fromLabel) ?? 0;
  const laterToOptions = toOptions.filter((label) => {
    const minutes = parseTimeOptionLabel(label);
    return minutes !== null && minutes > fromMinutes;
  });

  if (laterToOptions.length > 0) {
    toLabel = laterToOptions[Math.floor(Math.random() * laterToOptions.length)];
  } else if (toOptions.length > 0) {
    toLabel = toOptions[toOptions.length - 1];
  } else {
    toLabel = pickRandomReservationTimes().to;
  }

  await page.getByRole('option', { name: toLabel, exact: true }).click();

  console.log(`Reservation times: From ${fromLabel} → To ${toLabel}`);

  await editDialog.getByRole('button', { name: 'Save', exact: true }).click();
  await editDialog.waitFor({ state: 'hidden', timeout: untilVisible.timeout }).catch(() => {});
}

async function waitForPathSaveComplete(page: Page, timeout: number) {
  await page.getByText('Saving...').waitFor({ state: 'hidden', timeout }).catch(() => {});
  await page.locator('.slds-spinner_container').waitFor({ state: 'hidden', timeout }).catch(() => {});
}

function opportunityPathListbox(page: Page) {
  return page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: 'Path' }) })
    .getByRole('listbox')
    .first();
}

function closeOpportunityDialog(page: Page) {
  return page.getByRole('dialog', { name: /Close This Opportunity/i });
}

/** Path → Closed → Closed Won. Skips if already Closed Won; waits for in-flight path saves first. */
async function markOpportunityClosedWon(page: Page, untilVisible: { timeout: number }) {
  await waitForPathSaveComplete(page, untilVisible.timeout);

  if (await page.getByText('Closed Won', { exact: true }).first().isVisible().catch(() => false)) {
    return;
  }

  let closeDialog = closeOpportunityDialog(page);

  if (!(await closeDialog.isVisible().catch(() => false))) {
    const pathOptions = opportunityPathListbox(page);
    await pathOptions.waitFor({ state: 'visible', ...untilVisible });

    const closedOption = pathOptions.getByRole('option', { name: 'Closed', exact: true });
    if ((await closedOption.getAttribute('aria-selected')) !== 'true') {
      await closedOption.click();
      await waitForPathSaveComplete(page, untilVisible.timeout);
    }

    const selectClosedStageBtn = page.getByRole('button', { name: /Select Closed Stage/i });
    await selectClosedStageBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await selectClosedStageBtn.click();
    closeDialog = closeOpportunityDialog(page);
  }

  await closeDialog.waitFor({ state: 'visible', ...untilVisible });

  // "Close This Opportunity" uses a native <select>, not a Lightning listbox.
  const stageSelect = closeDialog.getByRole('combobox', { name: /^Stage/i });
  await stageSelect.selectOption({ label: 'Closed Won' });

  await closeDialog.getByRole('button', { name: 'Save', exact: true }).click({ timeout: untilVisible.timeout });
  await closeDialog.waitFor({ state: 'hidden', timeout: untilVisible.timeout });
  await waitForPathSaveComplete(page, untilVisible.timeout);

  await expect(page.getByText('Closed Won', { exact: true }).first()).toBeVisible({
    timeout: untilVisible.timeout,
  });
}

async function openOpportunityRecordByName(page: Page, name: string) {
  await waitForSalesforceReady(page, { timeout: sfReadyMs });

  const onOppDetail = /\/lightning\/r\/Opportunity\//i.test(page.url());
  const showsName = await page.getByText(name, { exact: true }).first().isVisible().catch(() => false);
  if (onOppDetail && showsName) return;

  await page.getByRole('link', { name: 'Opportunities' }).click();
  await waitForSalesforceReady(page, { timeout: sfReadyMs });

  const listSearch = page.getByRole('searchbox', { name: 'Search this list...' });
  if (await listSearch.isVisible().catch(() => false)) {
    await listSearch.fill(name);
    await listSearch.press('Enter');
    await waitForSalesforceReady(page, { timeout: sfReadyMs });
  }

  await page.getByRole('link', { name: name }).first().click();
  await waitForSalesforceReady(page, { timeout: sfReadyMs });
  await page.getByText(name, { exact: true }).first().waitFor({ state: 'visible', ...untilVisible }).catch(() => {});
}

test.describe('Create DHE Opportunity', () => {
  test.describe.configure({ retries: 0 });

  test('create opp by name → event time → add product → Closed Won', async ({ page }) => {
    test.setTimeout(300_000);
    test.skip(!testData.username || !testData.password, 'Set SALESFORCE_USERNAME and SALESFORCE_PASSWORD in .env');

    await page.setDefaultTimeout(locatorTimeoutMs);

    const opportunityName = `TestOpp-${Date.now()}`;

    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const visitDaysFromToday = 1 + (Date.now() % 25);
    const visitDate = addDays(today, visitDaysFromToday);
    const closeDate = addDays(today, 1);
    const visitMmDdYyyy = toMmDdYyyy(visitDate);
    const closeMmDdYyyy = toMmDdYyyy(closeDate);

    const stepResults: StepRecord[] = [];
    const { runStep, runPhase, printStepSummary } = createStepRunner(stepResults);

    try {
    await runStep('Login and open Salesforce home', async () => {
      await loginToSandboxAndOpenHome(page, {
        username: testData.username,
        password: testData.password,
        sfReadyMs,
        untilVisible,
      });
    });

    await runStep('Create DHE Opportunity', async () => {
    const opportunitiesLink = page.getByRole('link', { name: 'Opportunities' });
    await opportunitiesLink.waitFor({ state: 'visible', ...untilVisible });
    await opportunitiesLink.click();
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    // Substring "New" matches "new" in "(opens in new tab)" on unrelated footer links without exact: true.
    const newOpp = page.getByRole('button', { name: 'New', exact: true });
    await newOpp.waitFor({ state: 'visible', ...untilVisible });
    await newOpp.scrollIntoViewIfNeeded();
    await newOpp.click();

    await page.getByRole('dialog').filter({ hasText: /New Opportunity|Select a record type/i })
      .first()
      .waitFor({ state: 'visible', timeout: 60_000 })
      .catch(() => {});

    const needsRecordTypeNext = await selectOpportunityDHERecordType(page);
    if (needsRecordTypeNext) {
      const recordTypeNext = page.getByRole('button', { name: 'Next', exact: true });
      await recordTypeNext.waitFor({ state: 'visible', ...untilVisible });
      await recordTypeNext.click();
    }
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    const opportunityNameInput = page.getByRole('textbox', { name: 'Opportunity Name' });
    await opportunityNameInput.waitFor({ state: 'visible', ...untilVisible });
    await opportunityNameInput.click();
    await opportunityNameInput.fill(opportunityName);
    await opportunityNameInput.press('Tab');

    const category = page.getByRole('combobox', { name: 'Category', exact: true });
    await category.waitFor({ state: 'visible', ...untilVisible });
    await category.click();
    const b2b = page.locator('span').filter({ hasText: 'B2B' }).first();
    await b2b.waitFor({ state: 'visible', ...untilVisible });
    await b2b.click();

    const subCategory = page.getByRole('combobox', { name: 'Sub-Category' });
    await subCategory.waitFor({ state: 'visible', ...untilVisible });
    await subCategory.click();
    const corpGov = page.getByText('Corporate/Government');
    await corpGov.waitFor({ state: 'visible', ...untilVisible });
    await corpGov.click();

    const accountSearch = (testData.accountLookupSearch || 'Lakshya').trim();
    const accountLabel = (process.env.SALESFORCE_TEST_ACCOUNT_LABEL || 'Lakshya').trim();

    const accountName = page.getByRole('combobox', { name: 'Account Name' });
    await accountName.waitFor({ state: 'visible', ...untilVisible });
    await accountName.click();
    await accountName.fill(accountSearch);

    const accountOption = page.getByRole('option', { name: accountLabel, exact: true });
    if (await accountOption.first().isVisible({ timeout: 10_000 }).catch(() => false)) {
      await accountOption.first().click();
    } else {
      const lookupList = page
        .getByRole('listbox')
        .filter({ has: page.getByText(accountLabel, { exact: true }) })
        .last();
      await lookupList.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

      const accountRow = lookupList
        .locator('[role="option"], li.slds-listbox__item, lightning-base-combobox-item')
        .filter({ hasText: accountLabel })
        .first();

      if ((await accountRow.count()) > 0 && (await accountRow.isVisible().catch(() => false))) {
        await accountRow.scrollIntoViewIfNeeded();
        await accountRow.click({ timeout: 5_000 }).catch(async () => {
          await accountRow.click({ force: true });
        });
      } else {
        await accountName.press('ArrowDown');
        await accountName.press('Enter');
      }
    }

    const stage = page.getByRole('combobox', { name: 'Stage' });
    await stage.waitFor({ state: 'visible', ...untilVisible });
    await stage.click();
    const inDiscussion = page.getByText('In Discussion');
    await inDiscussion.waitFor({ state: 'visible', ...untilVisible });
    await inDiscussion.click();

    const description = page.getByRole('textbox', { name: 'Description/Notes' });
    await description.waitFor({ state: 'visible', ...untilVisible });
    await description.click();
    await description.fill('Test');

    const nextStep = page.getByRole('textbox', { name: 'Next Step' });
    await nextStep.waitFor({ state: 'visible', ...untilVisible });
    await nextStep.click();
    await nextStep.fill('Follow-up call scheduled');

    const guests = page.getByRole('spinbutton', { name: 'Number of Guests' });
    await guests.waitFor({ state: 'visible', ...untilVisible });
    await guests.click();
    await guests.fill('200');

    const dateOfVisit = page.getByRole('textbox', { name: 'Date of Visit' });
    await dateOfVisit.waitFor({ state: 'visible', ...untilVisible });
    await dateOfVisit.click();
    await dateOfVisit.fill(visitMmDdYyyy);
    await dateOfVisit.press('Tab');

    const closeDateField = page.getByRole('textbox', { name: 'Close Date' });
    await closeDateField.waitFor({ state: 'visible', ...untilVisible });
    await closeDateField.click();
    await closeDateField.fill(closeMmDdYyyy);
    await closeDateField.press('Tab');

    const leadSource = page.getByRole('combobox', { name: 'Lead Source' });
    await leadSource.waitFor({ state: 'visible', ...untilVisible });
    await leadSource.click();
    const advertisement = page.getByRole('option', { name: 'Advertisement' });
    await advertisement.waitFor({ state: 'visible', ...untilVisible });
    await advertisement.click();

    const assetLabel = page.getByLabel('*Asset');
    const ainDubaiAsset = assetLabel.getByText('Ain Dubai');
    await ainDubaiAsset.waitFor({ state: 'visible', ...untilVisible });
    await ainDubaiAsset.click();
    const moveToChosenAsset = assetLabel.getByRole('button', { name: 'Move selection to Chosen' });
    await moveToChosenAsset.waitFor({ state: 'visible', ...untilVisible });
    await moveToChosenAsset.click();
    await moveToChosenAsset.waitFor({ state: 'visible', ...untilVisible });
    await moveToChosenAsset.click();

    const subAsset = page.getByLabel('*Sub-Asset');
    const ainDubaiSub = subAsset.getByRole('option', { name: 'Ain Dubai' });
    await ainDubaiSub.waitFor({ state: 'visible', ...untilVisible });
    await ainDubaiSub.click();
    const moveToChosenSub = subAsset.getByRole('button', { name: 'Move selection to Chosen' });
    await moveToChosenSub.waitFor({ state: 'visible', ...untilVisible });
    await moveToChosenSub.click();

    // Venue is a dual listbox (Available / Chosen): pick Ain Dubai in Available, then move to Chosen.
    const venue = page.getByLabel('Venue');
    const venueAvailable = venue.getByRole('listbox').first();
    const venueAinDubai = venueAvailable.getByRole('option', { name: 'Ain Dubai', exact: true });
    await venueAinDubai.waitFor({ state: 'visible', ...untilVisible });
    await venueAinDubai.click();
    const moveVenueToChosen = venue.getByRole('button', { name: 'Move selection to Chosen' });
    await moveVenueToChosen.waitFor({ state: 'visible', ...untilVisible });
    await moveVenueToChosen.click();

    const save = page.getByRole('button', { name: 'Save', exact: true });
    await save.waitFor({ state: 'visible', ...untilVisible });
    await save.click();
    
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    await openOpportunityRecordByName(page, opportunityName);
    });

    const oppUrlMatch = page.url().match(/\/Opportunity\/([a-zA-Z0-9]{15,18})\//);
    const lightningOrigin = new URL(page.url()).origin;

    await runPhase('Related: edit Reservations event time', async () => {
      await editReservationEventTime(page, untilVisible);
    });

    await runPhase('Related: add DHE Product', async () => {
      if (await editSelectedProductsDialog(page).isVisible().catch(() => false)) {
        await saveProductQuantityInWizard(page, untilVisible);
      } else {
        await selectFirstProductInAddProductsModal(page, untilVisible);
        await advanceProductWizard(page, 2);
        await saveProductQuantityInWizard(page, untilVisible);
      }

      await editSelectedProductsDialog(page).waitFor({ state: 'hidden', timeout: untilVisible.timeout });
      await switchToRelatedTab(page, untilVisible);
      await productsRelatedSection(page).getByRole('link', { name: /Products \([1-9]/ }).waitFor({
        state: 'visible',
        timeout: untilVisible.timeout,
      });
    });

    await runPhase('Main view: Closed Won', async () => {
      const onOppDetail = /\/lightning\/r\/Opportunity\//i.test(page.url());
      const showsName = await page.getByText(opportunityName, { exact: true }).first().isVisible().catch(() => false);

      if (!onOppDetail || !showsName) {
        if (oppUrlMatch?.[1]) {
          await page.goto(`${lightningOrigin}/lightning/r/Opportunity/${oppUrlMatch[1]}/view`);
          await waitForSalesforceReady(page, { timeout: sfReadyMs });
        }
        await openOpportunityRecordByName(page, opportunityName);
      }

      await markOpportunityClosedWon(page, untilVisible);
    });
    } finally {
      printStepSummary();
    }
  });
});