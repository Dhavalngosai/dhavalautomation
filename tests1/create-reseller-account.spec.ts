/**
 * Create Reseller account as Sales Manager (login-as flow in Setup).
 * Account Name is unique every run: letters, digits, and spaces only (no punctuation).
 *
 * Run: npm test -- tests1/create-reseller-account.spec.ts
 *
 * Required in .env: SALESFORCE_USERNAME, SALESFORCE_PASSWORD
 * Optional: SALESFORCE_BASE_URL (default https://test.salesforce.com/),
 *           SALESFORCE_LIGHTNING_HOME_URL,
 *           SALESFORCE_LOGIN_AS_USER_SETUP_URL (user detail / login-as page in Setup),
 *           SALESFORCE_PRIMARY_CONTACT_SEARCH (default dhaval),
 *           SALESFORCE_ASSET_TEXT (default Ain Dubai), SALESFORCE_SUB_ASSET_TEXT (default Ain Dubai),
 *           SALESFORCE_LOCATOR_TIMEOUT_MS
 *
 * Type (United Arab Emirates) and Payment Method or Payment Term (Cash) use shared Lightning combobox selection.
 * Setup opens in a new tab; navigation goes straight to SALESFORCE_LOGIN_AS_USER_SETUP_URL
 * (Quick Find → Users is skipped — the nth Users link is org/UI-specific and often not visible as a link).
 */
import { test, type Page, type Locator } from '@playwright/test';
import type { Frame } from 'playwright-core';
import { testData } from '../utils/testData';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady, waitForStable } = require('../lib/waitHelpers');

const SANDBOX_LOGIN = (process.env.SALESFORCE_BASE_URL || 'https://test.salesforce.com').replace(/\/?$/, '/');
const LIGHTNING_HOME =
  process.env.SALESFORCE_LIGHTNING_HOME_URL ||
  'https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home';
/** Setup URL that opens the target user (Sales Manager) so "Login" can run as that user. Override if user Id changes. */
const LOGIN_AS_USER_SETUP_URL =
  process.env.SALESFORCE_LOGIN_AS_USER_SETUP_URL ||
  'https://dhe-org2--qa.sandbox.my.salesforce-setup.com/lightning/setup/ManageUsers/page?address=%2F005Pw00000Czwnq%3Fnoredirect%3D1%26isUserEntityOverride%3D1';

const PRIMARY_CONTACT_SEARCH = process.env.SALESFORCE_PRIMARY_CONTACT_SEARCH || 'dhaval';
const ASSET_PICK_TEXT = process.env.SALESFORCE_ASSET_TEXT || 'Ain Dubai';
const SUB_ASSET_PICK_TEXT = process.env.SALESFORCE_SUB_ASSET_TEXT || 'Ain Dubai';

const rawLocatorMs = Number(process.env.SALESFORCE_LOCATOR_TIMEOUT_MS);
const locatorTimeoutMs = Number.isFinite(rawLocatorMs) && rawLocatorMs > 0 ? rawLocatorMs : 30_000;
const untilVisible = { timeout: locatorTimeoutMs };
const sfReadyMs = 20_000;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Lightning `lightning-combobox` / SLDS picklist on record forms: open the field, then select
 * `optionText` using listbox/option/LWC patterns, then keyboard type-ahead + Enter as fallback.
 */
async function selectOptionFromCombobox(combo: Locator, optionText: string) {
  const page = combo.page();
  const re = new RegExp(escapeRe(optionText), 'i');

  await combo.waitFor({ state: 'visible', timeout: 25_000 });
  await combo.scrollIntoViewIfNeeded();

  const openTrigger = combo.locator('button.slds-combobox__input, button[role="combobox"]').first();
  if (await openTrigger.isVisible().catch(() => false)) {
    await openTrigger.click({ timeout: 10_000 });
  } else {
    await combo.click({ timeout: 10_000 });
  }
  await waitForSalesforceReady(page, { timeout: 6_000 }).catch(() => {});

  const pickers = [
    () => page.locator('[role="listbox"]:visible').filter({ has: page.getByText(re) }).first().locator('[role="option"], lightning-base-combobox-item').first(),
    () => page.getByRole('option', { name: re }).first(),
    () => page.locator('lightning-base-combobox-item').filter({ hasText: re }).first(),
    () => page.locator('.slds-listbox__option').filter({ hasText: re }).first(),
    () => page.getByRole('listbox').last().getByText(re).first(),
  ];

  let picked = false;
  for (const getPicker of pickers) {
    const picker = getPicker();
    try {
      await picker.waitFor({ state: 'visible', timeout: 7_000 });
      await picker.scrollIntoViewIfNeeded();
      await picker.click({ timeout: 8_000 });
      picked = true;
      break;
    } catch {
      /* try next */
    }
  }

  if (!picked) {
    if (await openTrigger.isVisible().catch(() => false)) {
      await openTrigger.click({ timeout: 5_000 });
    } else {
      await combo.click({ timeout: 5_000 });
    }
    const innerInput = combo.locator('input[role="combobox"], input.slds-combobox__input, input[type="text"]').first();
    if (await innerInput.isVisible().catch(() => false)) {
      await innerInput.click({ timeout: 3_000 });
      await innerInput.fill('').catch(() => {});
      await innerInput.pressSequentially(optionText, { delay: 35 }).catch(async () => {
        await innerInput.type(optionText, { delay: 35 });
      });
    } else {
      await page.keyboard.press('Control+a').catch(() => {});
      await page.keyboard.type(optionText, { delay: 30 });
    }
    await page.waitForTimeout(400);
    await page.keyboard.press('Enter');
    const confirm = page.getByRole('option', { name: re }).first();
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
    }
  }

  await page.keyboard.press('Escape').catch(() => {});
  await waitForSalesforceReady(page, { timeout: 5_000 }).catch(() => {});
}

/**
 * Dual listbox "Move selection to Chosen" often detaches or stays "unstable" while LWC re-renders.
 * Re-resolve the button each attempt; use title match (SLDS) and force-click after soft failures.
 */
async function clickMoveToChosenForFieldLabel(page: Page, fieldLabel: string, labelExact = false) {
  for (let attempt = 0; attempt < 8; attempt++) {
    await waitForSalesforceReady(page, { timeout: 8_000 }).catch(() => {});

    const section = labelExact ? page.getByLabel(fieldLabel, { exact: true }) : page.getByLabel(fieldLabel);
    await section.first().waitFor({ state: 'visible', timeout: 20_000 });

    const btn = section
      .first()
      .locator('button[title="Move selection to Chosen"]')
      .or(section.first().getByRole('button', { name: 'Move selection to Chosen' }))
      .first();

    try {
      await btn.scrollIntoViewIfNeeded();
      await btn.waitFor({ state: 'visible', timeout: 12_000 });
      await btn.click({ timeout: 12_000, force: attempt >= 2 });
      return;
    } catch {
      await page.waitForTimeout(500 + attempt * 150);
    }
  }

  const btn = page
    .getByLabel(fieldLabel, { exact: labelExact })
    .first()
    .locator('button[title="Move selection to Chosen"]')
    .first();
  await btn.scrollIntoViewIfNeeded();
  await btn.click({ force: true, timeout: 15_000 });
}

/**
 * SLDS dueling list: select a row in the first column (Available). Avoids matching the same label in Chosen.
 */
async function pickDualListAvailableItem(
  page: Page,
  fieldLabel: string,
  itemText: string,
  labelExact: boolean,
) {
  const section = labelExact ? page.getByLabel(fieldLabel, { exact: true }) : page.getByLabel(fieldLabel);
  await section.first().waitFor({ state: 'visible', timeout: 25_000 });
  await waitForSalesforceReady(page, { timeout: 8_000 }).catch(() => {});

  const cols = section.first().locator('.slds-dueling-list__column');
  if ((await cols.count()) >= 1) {
    const leftCol = cols.first();
    const inLeft = leftCol.getByText(itemText, { exact: false }).first();
    try {
      await inLeft.waitFor({ state: 'visible', timeout: 15_000 });
      await inLeft.scrollIntoViewIfNeeded();
      await inLeft.click({ timeout: 10_000 });
      return;
    } catch {
      /* fall through to section-wide match */
    }
  }

  const fallback = section.first().getByText(itemText, { exact: false }).first();
  await fallback.waitFor({ state: 'visible', timeout: 15_000 });
  await fallback.scrollIntoViewIfNeeded();
  await fallback.click({ timeout: 10_000 });
}

/** Letters, digits, spaces only — suitable when special characters are not allowed. */
function uniqueResellerAccountName(workerIndex: number): string {
  return `Reseller Test Account ${Date.now()} ${workerIndex}`.trim();
}

/**
 * Salesforce "Login" as another user may appear as classic `input[name="login"]`, a Lightning
 * button, or inside an iframe that is not named `vfFrameId_*`. Try main document, then every iframe.
 */
async function tryClickLogin(ctx: Page | Frame): Promise<boolean> {
  const candidates = [
    ctx.locator('input[name="login"]'),
    ctx.locator('input[type="submit"][name="login"]'),
    ctx.locator('input[type="submit"][value*="Login" i]'),
    ctx.getByRole('button', { name: 'Login', exact: true }),
    ctx.getByRole('button', { name: /^Log in$/i }),
    ctx.getByRole('button', { name: /Log in as this user/i }),
    ctx.getByRole('link', { name: 'Login', exact: true }),
    ctx.locator('input.slds-button[type="submit"][value="Login"]'),
    ctx.locator('lightning-button').filter({ hasText: /^Login$/i }),
    ctx.locator('button.slds-button').filter({ hasText: /^Login$/ }),
  ];

  for (const loc of candidates) {
    const target = loc.first();
    try {
      await target.waitFor({ state: 'visible', timeout: 1_500 });
      await target.click({ timeout: 5_000 });
      return true;
    } catch {
      /* next candidate */
    }
  }
  return false;
}

async function clickLoginAsUser(setupPage: Page) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    await waitForSalesforceReady(setupPage, { timeout: 10_000 }).catch(() => {});

    if (await tryClickLogin(setupPage)) return;

    const iframes = setupPage.locator('iframe');
    const n = await iframes.count();
    for (let i = 0; i < n; i++) {
      const handle = await iframes.nth(i).elementHandle({ timeout: 5_000 }).catch(() => null);
      if (!handle) continue;
      const frame = await handle.contentFrame();
      if (!frame) continue;
      if (await tryClickLogin(frame)) return;
    }

    await setupPage.waitForTimeout(500);
  }

  throw new Error(
    'Could not find Login control (input[name="login"], Lightning Login button, etc.) on the user page or inside any iframe.',
  );
}

test.describe('Create Reseller account', () => {
  test('Sales Manager creates reseller with unique Account Name', async ({ page }, testInfo) => {
    test.setTimeout(300_000);
    test.skip(!testData.username || !testData.password, 'Set SALESFORCE_USERNAME and SALESFORCE_PASSWORD in .env');

    await page.setDefaultTimeout(locatorTimeoutMs);

    const accountName = uniqueResellerAccountName(testInfo.workerIndex);

    await page.goto(SANDBOX_LOGIN);
    await page.waitForLoadState('domcontentloaded');
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    const username = page.getByRole('textbox', { name: 'Username' });
    await username.waitFor({ state: 'visible', ...untilVisible });
    await waitForStable(username, 10_000);
    await username.click();
    await username.fill(testData.username);
    await username.press('Tab');

    const password = page.getByRole('textbox', { name: 'Password' });
    await password.waitFor({ state: 'visible', ...untilVisible });
    await password.fill(testData.password);
    await password.press('Enter');

    const sandboxBtn = page.getByRole('button', { name: 'Log In to Sandbox' });
    if (await sandboxBtn.isVisible().catch(() => false)) {
      await sandboxBtn.waitFor({ state: 'visible', ...untilVisible });
      await sandboxBtn.click();
    }
    await page.waitForURL(/salesforce|lightning/i, { timeout: 90_000 }).catch(() => {});
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    await page.goto(LIGHTNING_HOME);
    await page.waitForLoadState('domcontentloaded');
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    const setupBtn = page.getByRole('button', { name: 'Setup' });
    await setupBtn.waitFor({ state: 'visible', ...untilVisible });
    await waitForStable(setupBtn, 10_000);
    await setupBtn.click();
    const page1Promise = page.waitForEvent('popup');
    // Not a substring match: "Service Setup Opens in a new tab" also matches /Setup Opens…/i.
    const setupMenu = page.locator('a[role="menuitem"][data-id="related_setup_app_home"]');
    await setupMenu.waitFor({ state: 'visible', ...untilVisible });
    await setupMenu.click();
    const page1 = await page1Promise;
    await page1.waitForLoadState('domcontentloaded');
    await page1.setDefaultTimeout(locatorTimeoutMs);
    await waitForSalesforceReady(page1, { timeout: sfReadyMs });

    await page1.goto(LOGIN_AS_USER_SETUP_URL);
    await page1.waitForLoadState('domcontentloaded');
    await waitForSalesforceReady(page1, { timeout: sfReadyMs });

    await clickLoginAsUser(page1);
    await waitForSalesforceReady(page1, { timeout: sfReadyMs });
    await page1.waitForURL(/lightning\.force|my\.salesforce/i, { timeout: 90_000 }).catch(() => {});
    await waitForSalesforceReady(page1, { timeout: sfReadyMs });

    const accountsLink = page1.getByRole('link', { name: 'Accounts' });
    await accountsLink.waitFor({ state: 'visible', ...untilVisible });
    await accountsLink.click();
    await waitForSalesforceReady(page1, { timeout: sfReadyMs });

    const newAccountBtn = page1.getByRole('button', { name: 'New', exact: true });
    await newAccountBtn.waitFor({ state: 'visible', ...untilVisible });
    await newAccountBtn.click();
    await waitForSalesforceReady(page1, { timeout: sfReadyMs });

    const recordTypeRadio = page1.locator('div:nth-child(7) > .slds-radio > .changeRecordTypeOptionLeftColumn > .slds-radio--faux');
    await recordTypeRadio.waitFor({ state: 'visible', ...untilVisible });
    await recordTypeRadio.click();

    const recordTypeNext = page1.getByRole('button', { name: 'Next', exact: true });
    await recordTypeNext.waitFor({ state: 'visible', ...untilVisible });
    await recordTypeNext.click();
    await waitForSalesforceReady(page1, { timeout: sfReadyMs });

    const accountNameField = page1.getByRole('textbox', { name: 'Account Name' });
    await accountNameField.waitFor({ state: 'visible', ...untilVisible });
    await waitForStable(accountNameField, 10_000);
    await accountNameField.click();
    await accountNameField.fill(accountName);
    await accountNameField.press('Tab');
    await waitForSalesforceReady(page1, { timeout: 12_000 }).catch(() => {});

    const primaryContact = page1.getByRole('combobox', { name: 'Primary Contact' });
    await primaryContact.waitFor({ state: 'visible', ...untilVisible });
    await primaryContact.click();
    await primaryContact.fill(PRIMARY_CONTACT_SEARCH);
    await waitForSalesforceReady(page1, { timeout: 10_000 }).catch(() => {});

    const contactOption = page1.getByRole('option', { name: /Dhaval Gosai/i }).first();
    await contactOption.waitFor({ state: 'visible', timeout: 20_000 });
    await contactOption.getByRole('strong').click();
    await waitForSalesforceReady(page1, { timeout: 10_000 }).catch(() => {});

    const expiryDate = page1.getByRole('textbox', { name: 'Expiry Date', exact: true });
    await expiryDate.waitFor({ state: 'visible', ...untilVisible });
    await expiryDate.click();
    const day31 = page1.getByRole('button', { name: '31' });
    await day31.waitFor({ state: 'visible', timeout: 15_000 });
    await day31.click();
    await waitForSalesforceReady(page1, { timeout: 8_000 }).catch(() => {});

    const commencementDate = page1.getByRole('textbox', { name: 'Commencement Date', exact: true });
    await commencementDate.waitFor({ state: 'visible', ...untilVisible });
    await commencementDate.click();
    const monthNav = page1.getByText('Previous MonthMayNext MonthPick a');
    await monthNav.waitFor({ state: 'visible', timeout: 15_000 });
    await monthNav.click();
    const day14 = page1.getByRole('button', { name: '14' });
    await day14.waitFor({ state: 'visible', timeout: 15_000 });
    await day14.click();
    await waitForSalesforceReady(page1, { timeout: 8_000 }).catch(() => {});

    const assetLabel = page1.getByLabel('Asset', { exact: true });
    await assetLabel.waitFor({ state: 'visible', timeout: 20_000 });
    await pickDualListAvailableItem(page1, 'Asset', ASSET_PICK_TEXT, true);
    await clickMoveToChosenForFieldLabel(page1, 'Asset', true);
    await page1.locator('.slds-col.slds-p-horizontal_small').first().click();
    await waitForSalesforceReady(page1, { timeout: 12_000 }).catch(() => {});

    // Sub Asset list loads after Asset; Move must be scoped to Sub Asset (not Asset — previous bug).
    await page1.getByLabel('Sub Asset', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
    await pickDualListAvailableItem(page1, 'Sub Asset', SUB_ASSET_PICK_TEXT, true);
    await clickMoveToChosenForFieldLabel(page1, 'Sub Asset', true);
    await waitForSalesforceReady(page1, { timeout: 10_000 }).catch(() => {});

    const subLeft = page1.getByLabel('Sub Asset', { exact: true }).locator('.slds-dueling-list__column').first();
    const secondAvailable = subLeft.locator('li, [role="option"]').first();
    if (await secondAvailable.isVisible().catch(() => false)) {
      await secondAvailable.click();
      await clickMoveToChosenForFieldLabel(page1, 'Sub Asset', true);
    }

    await page1.locator('.slds-col.slds-p-horizontal_small').first().click();
    await waitForSalesforceReady(page1, { timeout: 8_000 }).catch(() => {});

    const typeCombo = page1.getByRole('combobox', { name: /^Type\b/i }).first();
    await selectOptionFromCombobox(typeCombo, 'United Arab Emirates');
    await waitForSalesforceReady(page1, { timeout: 10_000 }).catch(() => {});

    await clickMoveToChosenForFieldLabel(page1, 'Key Markets', false);
    await waitForSalesforceReady(page1, { timeout: 8_000 }).catch(() => {});

    const agrCommence = page1.getByRole('textbox', { name: 'Agreement Commencement Date' });
    await agrCommence.waitFor({ state: 'visible', ...untilVisible });
    await agrCommence.click();
    const agrDay14 = page1.getByRole('button', { name: '14' });
    await agrDay14.waitFor({ state: 'visible', timeout: 15_000 });
    await agrDay14.click();

    const agrExpiry = page1.getByRole('textbox', { name: 'Agreement Expiry Date' });
    await agrExpiry.waitFor({ state: 'visible', ...untilVisible });
    await agrExpiry.click();
    const agrDay31 = page1.getByRole('button', { name: '31' });
    await agrDay31.waitFor({ state: 'visible', timeout: 15_000 });
    await agrDay31.click();
    await waitForSalesforceReady(page1, { timeout: 8_000 }).catch(() => {});

    const acctStatusStrip = page1.getByText('Account StatusProspectExpiry');
    await acctStatusStrip.waitFor({ state: 'visible', timeout: 15_000 });
    await acctStatusStrip.click();
    await waitForSalesforceReady(page1, { timeout: 8_000 }).catch(() => {});

    const tradeFrom = page1.getByRole('textbox', { name: 'Trade License Validity From' });
    await tradeFrom.waitFor({ state: 'visible', ...untilVisible });
    await tradeFrom.click();
    const day1 = page1.getByRole('button', { name: '1' }).first();
    await day1.waitFor({ state: 'visible', timeout: 15_000 });
    await day1.click();

    const tradeTo = page1.getByRole('textbox', { name: 'Trade License Validity To' });
    await tradeTo.waitFor({ state: 'visible', ...untilVisible });
    await tradeTo.click();
    const tradeDay31 = page1.getByRole('button', { name: '31' });
    await tradeDay31.waitFor({ state: 'visible', timeout: 15_000 });
    await tradeDay31.click();
    await waitForSalesforceReady(page1, { timeout: 8_000 }).catch(() => {});

    const statusPicklist = page1.getByText('Account StatusProspect--None--ProspectCustomerLapsedExpiry DateSelect a date');
    await statusPicklist.waitFor({ state: 'visible', timeout: 15_000 });
    await statusPicklist.click();
    await waitForSalesforceReady(page1, { timeout: 8_000 }).catch(() => {});

    const agreementType = page1.getByLabel('*Agreement Type');
    const agreementMoveChosen = agreementType.getByRole('button', { name: 'Move selection to Chosen' });
    await agreementMoveChosen.first().waitFor({ state: 'visible', ...untilVisible });
    await agreementMoveChosen.first().click();
    await agreementMoveChosen.first().click();
    await agreementType.getByTitle('OTA').waitFor({ state: 'visible', timeout: 10_000 });
    await agreementType.getByTitle('OTA').click();
    await agreementMoveChosen.first().click();
    await waitForSalesforceReady(page1, { timeout: 10_000 }).catch(() => {});

    const paymentCombo = page1.getByRole('combobox', { name: /^Payment (Method|Term)\b/i }).first();
    await selectOptionFromCombobox(paymentCombo, 'Cash');

    const addressSearch = page1.getByRole('combobox', { name: 'Address Search' });
    await addressSearch.waitFor({ state: 'visible', ...untilVisible });
    await addressSearch.click();
    await addressSearch.fill('116');
    await waitForSalesforceReady(page1, { timeout: 10_000 }).catch(() => {});

    const addressSuggestion = page1.getByText('1160 Battery StreetSan');
    await addressSuggestion.waitFor({ state: 'visible', timeout: 20_000 });
    await addressSuggestion.click();
    await waitForSalesforceReady(page1, { timeout: 8_000 }).catch(() => {});

    const saveMain = page1.getByRole('button', { name: 'Save', exact: true });
    await saveMain.waitFor({ state: 'visible', ...untilVisible });
    await saveMain.click();
    await waitForSalesforceReady(page1, { timeout: sfReadyMs });

    const companyNameLink = page1.getByRole('link', { name: 'Company Name' });
    await companyNameLink.waitFor({ state: 'visible', timeout: 25_000 });
    await companyNameLink.click();
    const companyField = page1.getByRole('textbox', { name: 'Company Name' });
    await companyField.waitFor({ state: 'visible', ...untilVisible });
    await waitForStable(companyField, 10_000);
    await companyField.click();
    await companyField.fill('TestCompany');
    await companyField.press('Tab');
    const saveCompany = page1.getByRole('button', { name: 'Save', exact: true });
    await saveCompany.waitFor({ state: 'visible', ...untilVisible });
    await saveCompany.click();
    await waitForSalesforceReady(page1, { timeout: sfReadyMs });

    const phoneLink = page1.getByRole('link', { name: 'Phone' });
    await phoneLink.waitFor({ state: 'visible', timeout: 25_000 });
    await phoneLink.click();
    const phoneField = page1.getByRole('textbox', { name: 'Phone' });
    await phoneField.waitFor({ state: 'visible', ...untilVisible });
    await waitForStable(phoneField, 10_000);
    await phoneField.click();
    await phoneField.fill('32652145');
    const savePhone = page1.getByRole('button', { name: 'Save', exact: true });
    await savePhone.waitFor({ state: 'visible', ...untilVisible });
    await savePhone.click();
    await waitForSalesforceReady(page1, { timeout: sfReadyMs });
  });
});
