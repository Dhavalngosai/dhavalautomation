import { test, expect } from '../fixtures/baseFixture';
import { testData } from '../utils/testData';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady } = require('../lib/waitHelpers');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { selectOpportunityEventsRecordType } = require('../lib/recordTypePicker');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { clickRecordTypeNextAndWait } = require('../pages/NewOpportunityPage');

const SANDBOX_LOGIN_URL = (process.env.SALESFORCE_BASE_URL || 'https://test.salesforce.com').replace(/\/?$/, '/');

function lightningOriginFromEnv(): string {
  const direct = (process.env.SALESFORCE_LIGHTNING_ORIGIN || '').trim().replace(/\/$/, '');
  if (direct) return direct;
  const home = (process.env.SALESFORCE_LIGHTNING_HOME_URL || '').trim();
  if (home) {
    try {
      return new URL(home).origin;
    } catch {
      /* ignore */
    }
  }
  return '';
}

const LIGHTNING_ORIGIN_ENV = lightningOriginFromEnv();

const accountOptionExact = process.env.SALESFORCE_TEST_ACCOUNT_OPTION || 'Lakshya';
const accountSearch = process.env.SALESFORCE_TEST_ACCOUNT_SEARCH || 'lakshya';
const primaryContactSearch = process.env.SALESFORCE_PRIMARY_CONTACT_SEARCH || 'laksh';
const primaryContactTitle = process.env.SALESFORCE_PRIMARY_CONTACT_TITLE || 'Lakshya Bhatnagar';
const eventBriefText = process.env.SALESFORCE_EVENT_BRIEF || 'est';
const eventTypeOption = process.env.SALESFORCE_EVENT_TYPE_OPTION || 'Conference';
const applicationRowText = process.env.SALESFORCE_APPLICATION_NUMBER_ROW || '';

test.describe('Sandbox – Home → Opportunities → New (Events)', () => {
  test('logs in, opens New Opportunity from Sales Home, fills Events form, saves', async ({ page }) => {
    test.setTimeout(180_000);
    test.skip(!testData.username || !testData.password, 'Set SALESFORCE_USERNAME and SALESFORCE_PASSWORD in .env');

    await page.goto(SANDBOX_LOGIN_URL);
    await waitForSalesforceReady(page, { timeout: 20_000 });

    await page.getByRole('textbox', { name: 'Username' }).fill(testData.username);
    await page.getByRole('textbox', { name: 'Password' }).fill(testData.password);
    await page.getByRole('textbox', { name: 'Password' }).press('Enter');
    await waitForSalesforceReady(page, { timeout: 5000 }).catch(() => {});

    const logInToSandbox = page.getByRole('button', { name: 'Log In to Sandbox' });
    if (await logInToSandbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logInToSandbox.click();
    }

    await waitForSalesforceReady(page, { timeout: 45_000 });

    const loginRejected = page.getByText(/check your username and password/i);
    if (await loginRejected.isVisible({ timeout: 2000 }).catch(() => false)) {
      throw new Error('Salesforce rejected login. Check .env credentials and SALESFORCE_BASE_URL.');
    }

    await expect(page.getByRole('heading', { name: /^Salesforce login$/i })).not.toBeVisible({ timeout: 60_000 });

    const origin =
      LIGHTNING_ORIGIN_ENV ||
      (() => {
        try {
          const u = new URL(page.url());
          if (u.hostname.includes('lightning.force.com')) return `${u.origin}`;
        } catch {
          /* ignore */
        }
        return '';
      })();

    if (!origin) {
      throw new Error('Set SALESFORCE_LIGHTNING_ORIGIN or SALESFORCE_LIGHTNING_HOME_URL for your Lightning host.');
    }

    await page.goto(`${origin}/lightning/page/home`, { waitUntil: 'domcontentloaded' });
    await waitForSalesforceReady(page, { timeout: 30_000 });

    await page.getByRole('link', { name: 'Opportunities' }).click();
    await waitForSalesforceReady(page, { timeout: 25_000 });

    await page.getByRole('button', { name: 'New' }).first().click();
    await waitForSalesforceReady(page, { timeout: 25_000 });

    const needsRecordTypeNext = await selectOpportunityEventsRecordType(page);
    if (needsRecordTypeNext) {
      await clickRecordTypeNextAndWait(page);
    }

    const oppName = process.env.SALESFORCE_OPPORTUNITY_NAME || `Test-${Date.now()}`;
    await page.getByRole('textbox', { name: 'Opportunity Name' }).fill(oppName);

    const category = page.getByRole('combobox', { name: 'Category', exact: true });
    await category.click();
    await page.getByText('B2B').click();

    const stageCombo = page.getByRole('combobox', { name: /^Stage$/i });
    if (await stageCombo.isVisible({ timeout: 4000 }).catch(() => false)) {
      await stageCombo.click();
      await page
        .getByRole('option', { name: new RegExp(`^${process.env.SALESFORCE_OPPORTUNITY_STAGE || 'Prospecting'}$`, 'i') })
        .click();
    }

    const subCat = page.getByRole('combobox', { name: /Sub-Category/i });
    if (await subCat.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subCat.click();
      await page.getByText(/\*Sub-Category/).click().catch(() => {});
    }

    const recent = page.getByLabel('Recent Items');
    if (await recent.getByText(accountOptionExact, { exact: true }).isVisible({ timeout: 4000 }).catch(() => false)) {
      await recent.getByText(accountOptionExact, { exact: true }).click();
    } else {
      const accountCombo = page.getByRole('combobox', { name: 'Account Name' });
      await accountCombo.click();
      await accountCombo.fill(accountSearch);
      await page.getByText(accountOptionExact, { exact: true }).click();
    }

    const contactCombo = page.getByRole('combobox', { name: 'Primary Contact' });
    await contactCombo.click();
    await contactCombo.fill(primaryContactSearch);
    const contactOption = page.getByRole('option', { name: new RegExp(primaryContactTitle, 'i') });
    if (await contactOption.isVisible({ timeout: 4000 }).catch(() => false)) {
      await contactOption.click();
    } else {
      await page.getByTitle(primaryContactTitle).click();
    }

    const closeDateField = page.getByRole('textbox', { name: /Close Date/i });
    await closeDateField.click();
    await page.getByRole('button', { name: '16', exact: true }).click();

    if (applicationRowText) {
      await page.getByText(applicationRowText).click().catch(() => {});
    }

    const leadSourceCombo = page.locator('lightning-combobox').filter({ hasText: /Lead Source/i });
    if (await leadSourceCombo.isVisible({ timeout: 5000 }).catch(() => false)) {
      await leadSourceCombo.click();
      await page.getByRole('option', { name: '--None--' }).click().catch(() => {});
    }

    const assetCombo = page.getByRole('combobox', { name: 'Asset', exact: true });
    if (await assetCombo.isVisible({ timeout: 5000 }).catch(() => false)) {
      await assetCombo.click();
      await page
        .locator(
          'flexipage-component2:nth-child(2) > flexipage-field-section2 > flexipage-column2 > flexipage-field:nth-child(2) > .slds-grid > records-record-picklist > records-form-picklist > .dep-trigger-container > .dep-trigger'
        )
        .click()
        .catch(() => {});
      await page.getByRole('option', { name: '--None--' }).click().catch(() => {});
    }

    const privatePublic = page.getByRole('combobox', { name: /Private\/Public/i });
    if (await privatePublic.isVisible({ timeout: 5000 }).catch(() => false)) {
      await privatePublic.click();
      await page.getByRole('option', { name: 'Public' }).click();
    }

    const eventTiming = page.getByRole('combobox', { name: /Event Timing/i });
    if (await eventTiming.isVisible({ timeout: 5000 }).catch(() => false)) {
      await eventTiming.click();
      await page.getByText('Afternoon', { exact: true }).click();
    }

    const eventType = page.getByRole('combobox', { name: 'Event Type' });
    await eventType.click();
    await page.getByText(eventTypeOption, { exact: true }).click();

    const eventBrief = page
      .getByLabel(/^\*Event Brief$/i)
      .or(page.getByLabel(/^Event Brief$/i))
      .or(page.getByRole('textbox', { name: /Event Brief/i }));
    await eventBrief.first().click({ timeout: 5000 }).catch(() => {});
    await eventBrief.first().fill(eventBriefText);

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await waitForSalesforceReady(page, { timeout: 60_000 });

    await expect(page).toHaveURL(/\/lightning\/r\/Opportunity\//, { timeout: 45_000 });
    await expect(page.getByRole('heading', { name: new RegExp(oppName, 'i') })).toBeVisible({ timeout: 25_000 });
  });
});
