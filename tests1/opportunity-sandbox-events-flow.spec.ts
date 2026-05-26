import { test, expect } from '../fixtures/baseFixture';
import { testData } from '../utils/testData';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady } = require('../lib/waitHelpers');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { selectOpportunityEventsRecordType } = require('../lib/recordTypePicker');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { clickRecordTypeNextAndWait } = require('../pages/NewOpportunityPage');

/** Sandbox login host (override with SALESFORCE_BASE_URL in .env). */
const SANDBOX_LOGIN_URL = (process.env.SALESFORCE_BASE_URL || 'https://test.salesforce.com').replace(/\/?$/, '/');
/**
 * Lightning origin after login, e.g. https://yourorg--qa.sandbox.lightning.force.com
 * If unset, the test uses the origin of the current page once Lightning has loaded.
 */
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

/** Lookup / picklist labels from your org (override with env as needed). */
const accountSearch = process.env.SALESFORCE_TEST_ACCOUNT_SEARCH || 'lakshya';
const accountOptionExact = process.env.SALESFORCE_TEST_ACCOUNT_OPTION || 'Lakshya';
const primaryContactSearch = process.env.SALESFORCE_PRIMARY_CONTACT_SEARCH || 'lak';
const primaryContactTitle = process.env.SALESFORCE_PRIMARY_CONTACT_TITLE || 'Lakshya Bhatnagar';
const assetLabel = process.env.SALESFORCE_EVENT_ASSET_LABEL || 'Ain Dubai';
const eventBrief = process.env.SALESFORCE_EVENT_BRIEF || 'TestBrief';

test.describe('Sandbox – Opportunity (Events) extended form', () => {
  test('logs in at test.salesforce.com, opens new Events opportunity, fills fields, saves', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    test.skip(!testData.username || !testData.password, 'Set SALESFORCE_USERNAME and SALESFORCE_PASSWORD in .env');

    await page.goto(SANDBOX_LOGIN_URL);
    await waitForSalesforceReady(page, { timeout: 20000 });

    await page.getByRole('textbox', { name: 'Username' }).fill(testData.username);
    await page.getByRole('textbox', { name: 'Password' }).fill(testData.password);
    await page.getByRole('textbox', { name: 'Password' }).press('Enter');
    await waitForSalesforceReady(page, { timeout: 5000 }).catch(() => {});

    const logInToSandbox = page.getByRole('button', { name: 'Log In to Sandbox' });
    if (await logInToSandbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logInToSandbox.click();
    }

    await waitForSalesforceReady(page, { timeout: 45000 });

    const loginRejected = page.getByText(/check your username and password/i);
    if (await loginRejected.isVisible({ timeout: 2000 }).catch(() => false)) {
      throw new Error(
        'Salesforce rejected login. Verify credentials and SALESFORCE_BASE_URL (e.g. https://test.salesforce.com/).'
      );
    }

    await expect(page.getByRole('heading', { name: /^Salesforce login$/i })).not.toBeVisible({ timeout: 60000 });

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
      throw new Error(
        'Could not determine Lightning origin. Set SALESFORCE_LIGHTNING_ORIGIN (e.g. https://myorg--qa.sandbox.lightning.force.com) in .env.'
      );
    }

    if (process.env.SALESFORCE_POST_LOGIN_RELATIVE_URL) {
      await page.goto(`${origin}${process.env.SALESFORCE_POST_LOGIN_RELATIVE_URL}`);
      await waitForSalesforceReady(page, { timeout: 30000 });
    }

    // Direct "new" URL is more reliable than List → New (wrong "New", slow modals, or different shells).
    const newOppUrl = `${origin}/lightning/o/Opportunity/new`;
    await page.goto(newOppUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/lightning\/o\/Opportunity\/new/i, { timeout: 45000 }).catch(() => {});
    await waitForSalesforceReady(page, { timeout: 30000 });

    const needsRecordTypeNext = await selectOpportunityEventsRecordType(page);
    if (needsRecordTypeNext) {
      await clickRecordTypeNextAndWait(page);
    }

    const oppName = `EventsOpp_${Date.now()}`;
    await page.getByRole('textbox', { name: 'Opportunity Name' }).fill(oppName);

    const category = page.getByRole('combobox', { name: 'Category', exact: true });
    await category.click();
    await page.locator('span').filter({ hasText: 'B2B' }).first().click();

    await page.getByRole('combobox', { name: 'Stage' }).click();
    await page.getByRole('option', { name: 'In Discussion' }).click();

    await page.getByRole('combobox', { name: 'Sub-Category' }).click().catch(() => {});

    const accountCombo = page.getByRole('combobox', { name: 'Account Name' });
    await accountCombo.click();
    await accountCombo.fill(accountSearch);
    await page.getByText(accountOptionExact, { exact: true }).click();

    const contactCombo = page.getByRole('combobox', { name: 'Primary Contact' });
    await contactCombo.click();
    await contactCombo.fill(primaryContactSearch);
    await page.getByTitle(primaryContactTitle).click();

    const closeDate = page.getByRole('textbox', { name: 'Close Date' });
    const closeIso = isoDateDaysFromNow(30);
    await closeDate.click();
    await closeDate.fill(closeIso).catch(async () => {
      await page.getByRole('button', { name: '17', exact: true }).click();
    });

    await page.getByRole('combobox', { name: 'Asset', exact: true }).click();
    await page.locator('span').filter({ hasText: assetLabel }).first().click();

    await page.getByRole('combobox', { name: 'Sub-Asset' }).click().catch(() => {});

    await page.getByRole('textbox', { name: 'Event Title' }).fill('Test');

    await page.getByRole('textbox', { name: 'From Event Date' }).click();
    await page.getByRole('button', { name: '21' }).click();

    await page.getByRole('textbox', { name: 'To Event Date' }).click();
    await page.getByRole('button', { name: '23' }).click();

    await page.locator('span').filter({ hasText: 'Afternoon' }).nth(1).click();

    const eventType = page.getByRole('combobox', { name: 'Event Type' });
    await eventType.click();
    await page.getByText('Cocktail Reception').click().catch(() => {});
    await eventType.click();
    await page.getByRole('option', { name: 'Corporate event' }).click();

    await page.getByRole('textbox', { name: 'Event Brief' }).fill(eventBrief);

    await page.getByRole('combobox', { name: 'Food & Beverage' }).click().catch(() => {});

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await waitForSalesforceReady(page, { timeout: 45000 });

    await expect(page).toHaveURL(/\/lightning\/r\/Opportunity\//, { timeout: 30000 });
    await expect(page.getByRole('heading', { name: new RegExp(oppName, 'i') })).toBeVisible({ timeout: 20000 });
  });
});

function isoDateDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
