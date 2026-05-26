/**
 * DHE Opportunity lifecycle: create `TestOpp-<timestamp>` → open that same record →
 * Related: change Reservations event time → add one product → main view → Closed Won.
 * Run: npm test -- tests1/create-DHE-Opp-LifeCycle.spec.ts
 *
 * Required in .env: SALESFORCE_USERNAME, SALESFORCE_PASSWORD
 * Optional: SALESFORCE_BASE_URL (default https://test.salesforce.com), SALESFORCE_LIGHTNING_HOME_URL.
 * Opportunity name is always TestOpp + timestamp suffix (e.g. TestOpp-1730000000000).
 *
 * Date of Visit uses MM/DD/YYYY with a varying future day. Close Date is always today + 1 day (MM/DD/YYYY).
 *
 * Waits: optional SALESFORCE_LOCATOR_TIMEOUT_MS (default 30000, slightly above playwright.config actionTimeout).
 *        After big navigations, waitForSalesforceReady lets Lightning settle (networkidle, brief spinner handling).
 */
import { test, type Page } from '@playwright/test';
import { testData } from '../utils/testData';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady } = require('../lib/waitHelpers');

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

const SANDBOX_LOGIN = (process.env.SALESFORCE_BASE_URL || 'https://test.salesforce.com').replace(/\/?$/, '/');
const LIGHTNING_HOME =
  process.env.SALESFORCE_LIGHTNING_HOME_URL ||
  'https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home';

const rawLocatorMs = Number(process.env.SALESFORCE_LOCATOR_TIMEOUT_MS);
const locatorTimeoutMs = Number.isFinite(rawLocatorMs) && rawLocatorMs > 0 ? rawLocatorMs : 30_000;
const untilVisible = { timeout: locatorTimeoutMs };
const sfReadyMs = 20_000;

/** Advance multi-step Lightning modals: prefer explicit Next in footer, then codegen fallback. */
async function clickModalNext(page: Page) {
  const inFooter = page.locator('.slds-modal__footer, .slds-docked-form-footer').getByRole('button', { name: 'Next', exact: true });
  if (await inFooter.first().isVisible().catch(() => false)) {
    await inFooter.first().click();
    return;
  }
  const anyNext = page.getByRole('button', { name: 'Next', exact: true });
  if (await anyNext.first().isVisible().catch(() => false)) {
    await anyNext.first().click();
    return;
  }
  const cancelNext = page.getByText('CancelNext', { exact: true });
  if (await cancelNext.isVisible().catch(() => false)) {
    await cancelNext.click();
  }
}

async function advanceProductWizard(page: Page, steps: number) {
  for (let i = 0; i < steps; i++) {
    await clickModalNext(page);
    await waitForSalesforceReady(page, { timeout: 12_000 }).catch(() => {});
  }
}

/** First product checkbox in Add Products (IDs are org/session-specific). */
function firstProductRowCheckbox(page: Page) {
  return page.locator('[id^="check-button-label"] > .slds-checkbox_faux').first();
}

/** Always work on the same row: open list/search by `name` unless the detail page already shows that name. */
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

    await page.goto(SANDBOX_LOGIN);
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    const username = page.getByRole('textbox', { name: 'Username' });
    await username.waitFor({ state: 'visible', ...untilVisible });
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
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    await page.goto(LIGHTNING_HOME);
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    const opportunitiesLink = page.getByRole('link', { name: 'Opportunities' });
    await opportunitiesLink.waitFor({ state: 'visible', ...untilVisible });
    await opportunitiesLink.click();
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    // Substring "New" matches "new" in "(opens in new tab)" on unrelated footer links without exact: true.
    const newOpp = page.getByRole('button', { name: 'New', exact: true });
    await newOpp.waitFor({ state: 'visible', ...untilVisible });
    await newOpp.click();

    const recordTypeNext = page.getByRole('button', { name: 'Next', exact: true });
    await recordTypeNext.waitFor({ state: 'visible', ...untilVisible });
    await recordTypeNext.click();
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

    const accountName = page.getByRole('combobox', { name: 'Account Name' });
    await accountName.waitFor({ state: 'visible', ...untilVisible });
    await accountName.click();
    await accountName.fill('Lakshya ');

    // Do not use page-wide getByTitle: it can match a header link and clicks are blocked by overlays (e.g. dep-trigger-container).
    const accountLabel = 'Lakshya';
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

//    await openOpportunityRecordByName(page, opportunityName);

    //const oppUrlMatch = page.url().match(/\/Opportunity\/([a-zA-Z0-9]{15,18})\//);
  //  const lightningOrigin = (() => {
   //   try {
   //     return new URL(page.url()).origin;
   //   } catch {
   //     return new URL(LIGHTNING_HOME).origin;
   //   }
   // })();

    await page.getByRole('tab', { name: 'Related' }).click();
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    // 1) Change event time (Reservations on this opportunity only).
    const reservations = page.getByLabel('Reservations');
    if ((await reservations.count()) > 0) {
      await reservations.first().scrollIntoViewIfNeeded();
      if (await reservations.first().isVisible().catch(() => false)) {
        const showActions = reservations.getByRole('button', { name: 'Show Actions' });
        await showActions.scrollIntoViewIfNeeded();
        await showActions.click();
        await page.getByRole('menuitem', { name: 'Edit' }).click();
        await waitForSalesforceReady(page, { timeout: sfReadyMs }).catch(() => {});

        const fromTime = page.getByRole('combobox', { name: 'From Time' });
        await fromTime.scrollIntoViewIfNeeded();
        await fromTime.click();
        const twelveAm = page.getByText('12:00 AM');
        await twelveAm.scrollIntoViewIfNeeded();
        await twelveAm.click();

        const toTime = page.getByRole('combobox', { name: 'To Time' });
        await toTime.scrollIntoViewIfNeeded();
        await toTime.click();
        const oneAm = page.getByRole('option', { name: '1:00 AM', exact: true });
        await oneAm.scrollIntoViewIfNeeded();
        await oneAm.click();

        const reservationSave = page.getByRole('button', { name: 'Save', exact: true });
        await reservationSave.scrollIntoViewIfNeeded();
        await reservationSave.click();
        await waitForSalesforceReady(page, { timeout: sfReadyMs });
      }
    }

    await page.getByRole('tab', { name: 'Related' }).click();
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    // 2) Add product (same opportunity — still on Related).
    await page.locator('div').filter({ hasText: 'Add Products' }).first()
    await waitForSalesforceReady(page, { timeout: sfReadyMs });
    await firstProductRowCheckbox(page).click();
    const productLink = page.locator('a[href*="/lightning/r/01u"]').first();
    if (await productLink.isVisible().catch(() => false)) {
      await productLink.click();
    }
    await advanceProductWizard(page, 4);

    const openModal = page.locator('.slds-modal.slds-fade-in-open');
    await openModal.waitFor({ state: 'visible', ...untilVisible }).catch(() => {});
    const modalSpinners = openModal.getByRole('spinbutton');
    if ((await modalSpinners.count()) > 0) {
      await modalSpinners.nth(0).fill('1');
      await modalSpinners.nth(0).press('Tab');
      if ((await modalSpinners.count()) > 1) {
        await modalSpinners.nth(1).fill('0');
        await modalSpinners.nth(1).press('Tab');
      }
    } else {
      const modalInputs = openModal.locator('input.slds-input');
      const ic = await modalInputs.count();
      if (ic > 0) {
        await modalInputs.nth(0).fill('1');
        await modalInputs.nth(0).press('Tab');
      }
      if (ic > 1) {
        await modalInputs.nth(1).fill('0');
        await modalInputs.nth(1).press('Tab');
      }
    }
    await openModal.getByRole('button', { name: 'Save', exact: true }).click();
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    const cancelModal = page.getByRole('button', { name: 'Cancel', exact: true });
    if (await cancelModal.isVisible().catch(() => false)) {
      await cancelModal.click();
      await waitForSalesforceReady(page, { timeout: sfReadyMs }).catch(() => {});
    }

    // 3) Closed Won — main opportunity view for this record id (same opp as `opportunityName`).
    if (oppUrlMatch?.[1]) {
      await page.goto(`${lightningOrigin}/lightning/r/Opportunity/${oppUrlMatch[1]}/view`);
      await waitForSalesforceReady(page, { timeout: sfReadyMs });
    }
    await openOpportunityRecordByName(page, opportunityName);

    await page.locator('a').filter({ hasText: 'Closed' }).click();
    await page.locator('button').filter({ hasText: 'Select Closed Stage' }).click();
    await page.getByLabel('Stage*').selectOption('Closed Won');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await waitForSalesforceReady(page, { timeout: sfReadyMs });
  });
});
