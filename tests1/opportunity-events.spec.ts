import { test, expect } from '../fixtures/baseFixture';
import { testData } from '../utils/testData';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { NewOpportunityPage } = require('../pages/NewOpportunityPage');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady } = require('../lib/waitHelpers');

const BASE_URL = process.env.SALESFORCE_BASE_URL || 'https://login.salesforce.com';

test.describe('Opportunity – Type Events', () => {
  test('creates opportunity with compulsory fields and Type Events, then saves', async ({
    loginPage,
    page,
  }) => {
    if (!testData.username || !testData.password) {
      test.skip();
    }

    await loginPage.login(testData.username, testData.password, BASE_URL);
    await waitForSalesforceReady(page, { timeout: 25000 });

    const loginRejected = page.getByText(/check your username and password/i);
    if (await loginRejected.isVisible({ timeout: 2000 }).catch(() => false)) {
      throw new Error(
        'Salesforce rejected login. Set SALESFORCE_BASE_URL to your org login URL (e.g. …my.salesforce.com or test.salesforce.com for sandbox) and verify SALESFORCE_USERNAME / SALESFORCE_PASSWORD in .env.'
      );
    }

    // Past the login form (URL alone is not enough — login can be on *.lightning.force.com).
    await expect(page.getByRole('heading', { name: /^Salesforce login$/i })).not.toBeVisible({ timeout: 45000 });
    await expect(page.locator('.oneHeader, header.slds-global-header').first()).toBeVisible({ timeout: 30000 });

    const oppName = `Events Opp ${Date.now()}`;
    const newOpp = new NewOpportunityPage(page);
    await newOpp.createEventsOpportunity({
      opportunityName: oppName,
      ...(testData.accountLookupSearch
        ? { accountSearch: testData.accountLookupSearch }
        : {}),
      stage: testData.opportunityStage,
    });

    await expect(page.getByRole('heading', { name: new RegExp(escapeForRegex(oppName), 'i') })).toBeVisible({
      timeout: 20000,
    });
  });
});

function escapeForRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
