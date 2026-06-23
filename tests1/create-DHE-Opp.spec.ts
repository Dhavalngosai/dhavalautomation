/**
 * DHE Opportunity: sandbox login → Home → Opportunities → New → Next → fill → Save.
 * Run via run-create-opportunity.bat (or: npm test -- tests1/create-DHE-Opp.spec.ts).
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
import { test } from '@playwright/test';
import { testData } from '../utils/testData';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady } = require('../lib/waitHelpers');
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

const rawLocatorMs = Number(process.env.SALESFORCE_LOCATOR_TIMEOUT_MS);
const locatorTimeoutMs = Number.isFinite(rawLocatorMs) && rawLocatorMs > 0 ? rawLocatorMs : 30_000;
const untilVisible = { timeout: locatorTimeoutMs };
const sfReadyMs = 20_000;

test.describe('Create DHE Opportunity', () => {
  test('login → new opportunity → save', async ({ page }) => {
    test.setTimeout(180_000);
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

    await loginToSandboxAndOpenHome(page, {
      username: testData.username,
      password: testData.password,
      sfReadyMs,
      untilVisible,
    });

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
  });
});
