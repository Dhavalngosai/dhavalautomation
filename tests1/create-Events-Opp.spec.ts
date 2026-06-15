/**
 * Events opportunity (Events record type): sandbox login → Home → Opportunities → New →
 * XPath span[normalize-space()='Events'] in the record-type dialog → Next → fill → Save.
 * Run: npm test -- tests1/create-Events-Opp.spec.ts
 *
 * Required in .env: SALESFORCE_USERNAME, SALESFORCE_PASSWORD
 * Optional: SALESFORCE_BASE_URL (default https://test.salesforce.com), SALESFORCE_LIGHTNING_HOME_URL,
 *           SALESFORCE_LOCATOR_TIMEOUT_MS, SALESFORCE_FORM_READY_MS (ms after New / after record-type → form; default 5000),
 *           SALESFORCE_PRIMARY_CONTACT_SEARCH (default laksh), SALESFORCE_PRIMARY_CONTACT_TITLE (default Lakshya Bhatnagar),
 *           SALESFORCE_EVENT_MIN_DAYS (default 40), SALESFORCE_CLOSE_DAYS_AFTER_EVENT (default 21),
 *           SALESFORCE_EVENT_TIMING_VALUES, SALESFORCE_EVENT_TYPE_VALUES (comma-separated picklist labels; defaults rotate each run).
 * Opportunity name is TestEventsOpp + timestamp (e.g. TestEventsOpp-1730000000000).
 *
 * *From Event Date is MM/DD/YYYY, 40–89 days ahead (not near-term). Close Date is MM/DD/YYYY, 21 days after that event.
 *
 * Waits: optional SALESFORCE_LOCATOR_TIMEOUT_MS (default 30000, slightly above playwright.config actionTimeout).
 *        After big navigations, waitForSalesforceReady lets Lightning settle (networkidle, brief spinner handling).
 *
 * Retries: Playwright re-runs the entire test in a new browser — it cannot continue from the failing line only.
 *          Steps below are grouped with test.step() so the HTML report shows which section failed; use --ui or
 *          trace to debug. To skip login on repeated runs, add a setup project with storageState (Playwright docs).
 */
import { test, type Page } from '@playwright/test';
import { testData } from '../utils/testData';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady } = require('../lib/waitHelpers');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { clickRecordTypeNextAndWait } = require('../pages/NewOpportunityPage');

/** Record-type row label in Lightning modal (relative to open dialog). */
const EVENTS_RECORD_TYPE_XPATH = ".//span[normalize-space()='Events']";

/** testRigor path anchor: Events field "*From Event Date" (replaces legacy "Date of Visit" label). */
const FROM_EVENT_DATE_TESTRIGOR_PATH = '*From Event Date';

/** testRigor path anchor: dual-listbox field "*Asset". */
const ASSET_TESTRIGOR_PATH = '*Asset';

/** testRigor path anchor: field "*Sub-Asset". */
const SUB_ASSET_TESTRIGOR_PATH = '*Sub-Asset';

/** Venue field accessible names (picklist vs dual listbox). */
const VENUE_COMBO_NAME = 'Venue';
const VENUE_LABEL_REQUIRED = '*Venue';

const primaryContactSearch = (process.env.SALESFORCE_PRIMARY_CONTACT_SEARCH || 'laksh').trim();
const primaryContactTitle = (process.env.SALESFORCE_PRIMARY_CONTACT_TITLE || 'Lakshya Bhatnagar').trim();

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

/** True when login already landed on Lightning for the same host as LIGHTNING_HOME (skip redundant goto). */
function alreadyOnLightningApp(pageUrl: string, lightningHomeUrl: string): boolean {
  try {
    const cur = new URL(pageUrl);
    const target = new URL(lightningHomeUrl);
    return cur.hostname === target.hostname && /\/lightning\//i.test(cur.pathname);
  } catch {
    return false;
  }
}

const DEFAULT_EVENT_TIMING_VALUES = ['Morning', 'Afternoon', 'Evening'] as const;
const DEFAULT_EVENT_TYPE_VALUES = ['Wedding', 'Conference', 'Corporate event', 'Cocktail Reception'] as const;

function parseCommaLabelList(envVal: string | undefined, fallback: readonly string[]): string[] {
  if (!envVal?.trim()) return [...fallback];
  return envVal
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const EVENT_TIMING_VALUES = parseCommaLabelList(
  process.env.SALESFORCE_EVENT_TIMING_VALUES,
  DEFAULT_EVENT_TIMING_VALUES
);
const EVENT_TYPE_VALUES = parseCommaLabelList(
  process.env.SALESFORCE_EVENT_TYPE_VALUES,
  DEFAULT_EVENT_TYPE_VALUES
);

/**
 * After the combobox list is open: try labels in round-robin from a time-based start (different run → different first try),
 * then fall through until one option is visible in this org.
 */
async function pickRotatingListOption(page: Page, labels: string[], perOptionTimeoutMs: number): Promise<string> {
  if (labels.length === 0) throw new Error('pickRotatingListOption: empty labels');
  const start = Math.floor(Date.now() / 1000) % labels.length;
  for (let k = 0; k < labels.length; k++) {
    const label = labels[(start + k) % labels.length];
    const opt = page.getByRole('option', { name: label, exact: true }).first();
    if (await opt.isVisible({ timeout: perOptionTimeoutMs }).catch(() => false)) {
      await opt.click();
      return label;
    }
  }
  throw new Error(`No visible picklist option among: ${labels.join(', ')}`);
}

const SANDBOX_LOGIN = (process.env.SALESFORCE_BASE_URL || 'https://test.salesforce.com').replace(/\/?$/, '/');
const LIGHTNING_HOME =
  process.env.SALESFORCE_LIGHTNING_HOME_URL ||
  'https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home';

const rawLocatorMs = Number(process.env.SALESFORCE_LOCATOR_TIMEOUT_MS);
const locatorTimeoutMs = Number.isFinite(rawLocatorMs) && rawLocatorMs > 0 ? rawLocatorMs : 30_000;
const untilVisible = { timeout: locatorTimeoutMs };
const sfReadyMs = 20_000;
/** Lighter settle once the new-opp UI is up (record picker or record-edit form); avoids long networkidle vs login/navigation. */
const rawFormReadyMs = Number(process.env.SALESFORCE_FORM_READY_MS);
const sfFormReadyMs =
  Number.isFinite(rawFormReadyMs) && rawFormReadyMs > 0 ? rawFormReadyMs : 5_000;

test.describe('Create Event Opportunity', () => {
  test('login → new Events opportunity → save', async ({ page }) => {
    test.setTimeout(180_000);
    test.skip(!testData.username || !testData.password, 'Set SALESFORCE_USERNAME and SALESFORCE_PASSWORD in .env');

    await page.setDefaultTimeout(locatorTimeoutMs);

    const opportunityName = `TestEventsOpp-${Date.now()}`;

    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const rawEventMinDays = Number(process.env.SALESFORCE_EVENT_MIN_DAYS);
    const eventHorizonMinDays =
      Number.isFinite(rawEventMinDays) && rawEventMinDays > 0 ? rawEventMinDays : 40;
    const rawCloseAfterEvent = Number(process.env.SALESFORCE_CLOSE_DAYS_AFTER_EVENT);
    const closeDaysAfterEvent =
      Number.isFinite(rawCloseAfterEvent) && rawCloseAfterEvent > 0 ? rawCloseAfterEvent : 21;
    const visitDaysFromToday = eventHorizonMinDays + (Math.floor(Date.now() / 1000) % 50);
    const visitDate = addDays(today, visitDaysFromToday);
    const closeDate = addDays(visitDate, closeDaysAfterEvent);
    const visitMmDdYyyy = toMmDdYyyy(visitDate);
    const closeMmDdYyyy = toMmDdYyyy(closeDate);

    await test.step('Sandbox login + Lightning home', async () => {
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

    // "Target page, context or browser has been closed" here means the run was interrupted or the window was closed — not a bad URL.
    if (!alreadyOnLightningApp(page.url(), LIGHTNING_HOME)) {
      await page.goto(LIGHTNING_HOME, {
        waitUntil: 'domcontentloaded',
        timeout: Math.max(locatorTimeoutMs, 60_000),
      });
    }
    await waitForSalesforceReady(page, { timeout: sfReadyMs });
    });

    await test.step('Opportunities → New → Events record type', async () => {
    const opportunitiesLink = page.getByRole('link', { name: 'Opportunities' });
    await opportunitiesLink.waitFor({ state: 'visible', ...untilVisible });
    await opportunitiesLink.click();
    await waitForSalesforceReady(page, { timeout: sfReadyMs });

    // Substring "New" matches "new" in "(opens in new tab)" on unrelated footer links without exact: true.
    const newOpp = page.getByRole('button', { name: 'New', exact: true });
    await newOpp.waitFor({ state: 'visible', ...untilVisible });
    await newOpp.click();

    await waitForSalesforceReady(page, { timeout: sfFormReadyMs });
    const recordTypeDialog = page.getByRole('dialog').last();
    const eventsRecordType = recordTypeDialog.locator(`xpath=${EVENTS_RECORD_TYPE_XPATH}`);
    if (await eventsRecordType.first().isVisible({ timeout: 8000 }).catch(() => false)) {
      await eventsRecordType.first().click();
      await clickRecordTypeNextAndWait(page);
    }
    await waitForSalesforceReady(page, { timeout: sfFormReadyMs });
    });

    await test.step('Core fields (name, category, account, primary contact, stage, description)', async () => {
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

  /*  const subCategory = page.getByRole('combobox', { name: 'Sub-Category' });
    await subCategory.waitFor({ state: 'visible', ...untilVisible });
    await subCategory.click();
    const corpGov = page.getByText('Events ');
    await corpGov.waitFor({ state: 'visible', ...untilVisible });
    await corpGov.click();*/

    const accountName = page.getByRole('combobox', { name: 'Account Name' });
    await accountName.waitFor({ state: 'visible', ...untilVisible });
    await accountName.click();
    await accountName.fill('laksh');
    const lakshOption = page.getByText('Laksh', { exact: true });
    await lakshOption.waitFor({ state: 'visible', ...untilVisible });
    await lakshOption.click();

    const primaryContact = page.getByRole('combobox', { name: 'Primary Contact' });
    if (await primaryContact.isVisible({ timeout: 6000 }).catch(() => false)) {
      await primaryContact.click();
      await primaryContact.fill(primaryContactSearch);
      const contactOption = page.getByRole('option', { name: new RegExp(primaryContactTitle, 'i') });
      if (await contactOption.isVisible({ timeout: 4000 }).catch(() => false)) {
        await contactOption.click();
      } else {
        await page.getByTitle(primaryContactTitle).click();
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
    });

   /* const nextStep = page.getByRole('textbox', { name: 'Next Step' });
    await nextStep.waitFor({ state: 'visible', ...untilVisible });
    await nextStep.click();*/

    await test.step('Dates + Lead Source', async () => {
    const dateOfVisitRoot = page
      .locator(
        `xpath=//*[@aria-label='${FROM_EVENT_DATE_TESTRIGOR_PATH}']/ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' slds-form-element ')][1]`
      )
      .or(
        page.locator(
          `xpath=//*[normalize-space()='${FROM_EVENT_DATE_TESTRIGOR_PATH}'][self::label or self::legend]/ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' slds-form-element ')][1]`
        )
      );
    const dateOfVisit = dateOfVisitRoot.getByRole('textbox').first();
    await dateOfVisit.scrollIntoViewIfNeeded({ ...untilVisible }).catch(() => {});
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
    });

    await test.step('Asset, Sub-Asset, Venue', async () => {
    // *Asset: Events often uses a picklist combobox; DHE uses a dual listbox + "Move to Chosen".
    const assetCombo = page
      .getByRole('combobox', { name: 'Asset', exact: true })
      .or(page.getByRole('combobox', { name: ASSET_TESTRIGOR_PATH }));

    if (await assetCombo.isVisible({ timeout: 8000 }).catch(() => false)) {
      await assetCombo.scrollIntoViewIfNeeded({ ...untilVisible }).catch(() => {});
      await assetCombo.click();
      const ainDubaiPicklist = page.getByRole('option', { name: 'Ain Dubai', exact: true }).first();
      await ainDubaiPicklist.waitFor({ state: 'visible', ...untilVisible });
      await ainDubaiPicklist.click();
    } else {
      const assetLabel = page
        .getByLabel(ASSET_TESTRIGOR_PATH)
        .or(
          page.locator(
            `xpath=//*[@aria-label='${ASSET_TESTRIGOR_PATH}']/ancestor::*[contains(@class,'slds-form-element')][1]`
          )
        )
        .or(
          page.locator(
            `xpath=//*[normalize-space()='${ASSET_TESTRIGOR_PATH}'][self::label or self::legend]/ancestor::*[contains(@class,'slds-form-element')][1]`
          )
        )
        .or(
          page.locator(
            `xpath=//span[normalize-space()='${ASSET_TESTRIGOR_PATH}']/ancestor::*[contains(@class,'slds-form-element')][1]`
          )
        );
      await assetLabel.scrollIntoViewIfNeeded({ ...untilVisible }).catch(() => {});
      const ainDubaiAsset = assetLabel
        .getByRole('listbox')
        .first()
        .getByRole('option', { name: 'Ain Dubai', exact: true })
        .or(assetLabel.getByRole('option', { name: 'Ain Dubai', exact: true }).first())
        .or(assetLabel.locator(`xpath=.//span[normalize-space()='Ain Dubai']`).first());
      await ainDubaiAsset.waitFor({ state: 'visible', ...untilVisible });
      await ainDubaiAsset.click();
      const moveToChosenAsset = assetLabel.getByRole('button', { name: 'Move selection to Chosen' });
      await moveToChosenAsset.waitFor({ state: 'visible', ...untilVisible });
      await moveToChosenAsset.click();
      await moveToChosenAsset.waitFor({ state: 'visible', ...untilVisible });
      await moveToChosenAsset.click();
    }

    // *Sub-Asset: same split as Asset — combobox on Events, dual listbox on DHE-style forms.
    const subAssetCombo = page
      .getByRole('combobox', { name: 'Sub-Asset', exact: true })
      .or(page.getByRole('combobox', { name: SUB_ASSET_TESTRIGOR_PATH }));

    if (await subAssetCombo.isVisible({ timeout: 8000 }).catch(() => false)) {
      await subAssetCombo.scrollIntoViewIfNeeded({ ...untilVisible }).catch(() => {});
      await subAssetCombo.click();
      const ainDubaiSubPick = page.getByRole('option', { name: 'Ain Dubai', exact: true }).first();
      await ainDubaiSubPick.waitFor({ state: 'visible', ...untilVisible });
      await ainDubaiSubPick.click();
    } else {
      const subAsset = page
        .getByLabel(SUB_ASSET_TESTRIGOR_PATH)
        .or(
          page.locator(
            `xpath=//*[@aria-label='${SUB_ASSET_TESTRIGOR_PATH}']/ancestor::*[contains(@class,'slds-form-element')][1]`
          )
        )
        .or(
          page.locator(
            `xpath=//*[normalize-space()='${SUB_ASSET_TESTRIGOR_PATH}'][self::label or self::legend]/ancestor::*[contains(@class,'slds-form-element')][1]`
          )
        )
        .or(
          page.locator(
            `xpath=//span[normalize-space()='${SUB_ASSET_TESTRIGOR_PATH}']/ancestor::*[contains(@class,'slds-form-element')][1]`
          )
        );
      await subAsset.scrollIntoViewIfNeeded({ ...untilVisible }).catch(() => {});
      const ainDubaiSub = subAsset
        .getByRole('listbox')
        .first()
        .getByRole('option', { name: 'Ain Dubai', exact: true })
        .or(subAsset.getByRole('option', { name: 'Ain Dubai', exact: true }).first())
        .or(subAsset.locator(`xpath=.//span[normalize-space()='Ain Dubai']`).first());
      await ainDubaiSub.waitFor({ state: 'visible', ...untilVisible });
      await ainDubaiSub.click();
      const moveToChosenSub = subAsset.getByRole('button', { name: 'Move selection to Chosen' });
      await moveToChosenSub.waitFor({ state: 'visible', ...untilVisible });
      await moveToChosenSub.click();
    }

    // Venue: do not chain listbox off a combobox — open picklist then choose option, or use dual listbox + Chosen.
    const venueCombo = page
      .getByRole('combobox', { name: VENUE_COMBO_NAME, exact: true })
      .or(page.getByRole('combobox', { name: VENUE_LABEL_REQUIRED }))
      .or(page.getByRole('combobox', { name: /Venue/i }));

    if (await venueCombo.isVisible({ timeout: 8000 }).catch(() => false)) {
      await venueCombo.scrollIntoViewIfNeeded({ ...untilVisible }).catch(() => {});
      await venueCombo.click();
      const venuePicklistOption = page.getByRole('option', { name: 'Ain Dubai', exact: true }).first();
      await venuePicklistOption.waitFor({ state: 'visible', ...untilVisible });
      await venuePicklistOption.click();
    } else {
      const venue = page
        .getByLabel(VENUE_COMBO_NAME)
        .or(page.getByLabel(VENUE_LABEL_REQUIRED))
        .or(
          page.locator(
            `xpath=//*[@aria-label='${VENUE_COMBO_NAME}']/ancestor::*[contains(@class,'slds-form-element')][1]`
          )
        )
        .or(
          page.locator(
            `xpath=//*[@aria-label='${VENUE_LABEL_REQUIRED}']/ancestor::*[contains(@class,'slds-form-element')][1]`
          )
        )
        .or(
          page.locator(
            `xpath=//*[normalize-space()='${VENUE_LABEL_REQUIRED}'][self::label or self::legend]/ancestor::*[contains(@class,'slds-form-element')][1]`
          )
        );
      await venue.scrollIntoViewIfNeeded({ ...untilVisible }).catch(() => {});
      const venueAinDubai = venue
        .getByRole('listbox')
        .first()
        .getByRole('option', { name: 'Ain Dubai Plaza', exact: true })
        .or(venue.getByRole('option', { name: 'Ain Dubai Plaza', exact: true }).first())
        .or(venue.locator(`xpath=.//span[normalize-space()='Ain Dubai Plaza']`).first());
      await venueAinDubai.waitFor({ state: 'visible', ...untilVisible });
      await venueAinDubai.click();
      const moveVenueToChosen = venue.getByRole('button', { name: 'Move selection to Chosen' });
      await moveVenueToChosen.waitFor({ state: 'visible', ...untilVisible });
      await moveVenueToChosen.click();
    }
    });

    await test.step('Guests + Event timing, type, brief', async () => {
    const guests = page.getByRole('spinbutton', { name: 'Number of Guests' });
    await guests.waitFor({ state: 'visible', ...untilVisible });
    await guests.click();
    await guests.fill('200');

    const eventTiming = page.getByRole('combobox', { name: /Event Timing/i });
    if (await eventTiming.isVisible({ timeout: 8000 }).catch(() => false)) {
      await eventTiming.scrollIntoViewIfNeeded({ ...untilVisible }).catch(() => {});
      await eventTiming.click();
      await pickRotatingListOption(page, EVENT_TIMING_VALUES, 2500);
    }

    const eventType = page.getByRole('combobox', { name: 'Event Type' });
    if (await eventType.isVisible({ timeout: 8000 }).catch(() => false)) {
      await eventType.scrollIntoViewIfNeeded({ ...untilVisible }).catch(() => {});
      await eventType.click();
      await pickRotatingListOption(page, EVENT_TYPE_VALUES, 2500);
    }

    const eventBrief = page
      .getByLabel(/^\*Event Brief$/i)
      .or(page.getByLabel(/^Event Brief$/i))
      .or(page.getByRole('textbox', { name: /Event Brief/i }));
    if (await eventBrief.first().isVisible({ timeout: 8000 }).catch(() => false)) {
      await eventBrief.first().scrollIntoViewIfNeeded({ ...untilVisible }).catch(() => {});
      await eventBrief.first().click({ timeout: 5000 }).catch(() => {});
      await eventBrief.first().fill('Test');
    }
    });

    await test.step('Save', async () => {
    const save = page.getByRole('button', { name: 'Save', exact: true });
    await save.waitFor({ state: 'visible', ...untilVisible });
    await save.click();
    });
  });
});
