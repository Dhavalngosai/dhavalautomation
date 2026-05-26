/**
 * Flow orchestrated by run-opportunity-tests.bat (sets SALESFORCE_OPPORTUNITY_LIST_URL, etc.).
 * On failure, test-results/opp-flow-failed.json contains { "step": N }. Re-run the same .bat to resume from step N (not from login if session was saved).
 * Full reset: delete test-results/opp-flow-failed.json and test-results/opp-flow-auth.json
 */
import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../fixtures/baseFixture';
import { testData } from '../utils/testData';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady } = require('../lib/waitHelpers');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { selectOpportunityEventsRecordType } = require('../lib/recordTypePicker');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { clickRecordTypeNextAndWait } = require('../pages/NewOpportunityPage');

const RESULTS = path.join(process.cwd(), 'test-results');
const AUTH_JSON = path.join(RESULTS, 'opp-flow-auth.json');
const FAILED_JSON = path.join(RESULTS, 'opp-flow-failed.json');

const SANDBOX_LOGIN_URL = (process.env.SALESFORCE_BASE_URL || 'https://test.salesforce.com').replace(/\/?$/, '/');
const LIST_URL =
  process.env.SALESFORCE_OPPORTUNITY_LIST_URL ||
  'https://dhe-org2--qa.sandbox.lightning.force.com/lightning/o/Opportunity/list?filterName=AllOpportunities';

const accountOptionExact = process.env.SALESFORCE_TEST_ACCOUNT_OPTION || 'Lakshya';
const accountSearch = process.env.SALESFORCE_TEST_ACCOUNT_SEARCH || 'lakshya';
const primaryContactSearch = process.env.SALESFORCE_PRIMARY_CONTACT_SEARCH || 'laksh';
const primaryContactTitle = process.env.SALESFORCE_PRIMARY_CONTACT_TITLE || 'Lakshya Bhatnagar';
const eventBriefText = process.env.SALESFORCE_EVENT_BRIEF || 'est';
const eventTypeOption = process.env.SALESFORCE_EVENT_TYPE_OPTION || 'Conference';
const applicationRowText = process.env.SALESFORCE_APPLICATION_NUMBER_ROW || '';

function readResumeStep(): number {
  try {
    const j = JSON.parse(fs.readFileSync(FAILED_JSON, 'utf8')) as { step?: number };
    return typeof j.step === 'number' && j.step >= 1 && j.step <= 7 ? j.step : 1;
  } catch {
    return 1;
  }
}

function writeFailedStep(step: number, err: unknown) {
  fs.mkdirSync(RESULTS, { recursive: true });
  const msg = err instanceof Error ? err.message : String(err);
  fs.writeFileSync(FAILED_JSON, JSON.stringify({ step, message: msg, at: new Date().toISOString() }, null, 2));
}

function clearFailed() {
  try {
    fs.unlinkSync(FAILED_JSON);
  } catch {
    /* ignore */
  }
}

function logStepError(step: number, name: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[Opportunity flow] Step ${step} (${name}) FAILED: ${msg}`);
  if (err instanceof Error && err.stack) console.error(err.stack);
}

test.describe('Opportunity list flow (run-opportunity-tests.bat)', () => {
  test('1 Login → 2 List → 3 New → 4 Events → 5 Next → 6 Fill → 7 Save', async ({ browser }) => {
    test.setTimeout(180_000);
    test.skip(!testData.username || !testData.password, 'Set SALESFORCE_USERNAME and SALESFORCE_PASSWORD in .env');

    let resumeFrom = readResumeStep();
    // Save failed: new run loses in-memory form — redo list through fill before save again.
    if (resumeFrom === 7) resumeFrom = 6;

    if (resumeFrom > 1 && !fs.existsSync(AUTH_JSON)) {
      throw new Error(
        `[Opportunity flow] Cannot resume from step ${resumeFrom} without ${AUTH_JSON}. Delete ${FAILED_JSON} to start from step 1.`
      );
    }

    const context = await browser.newContext({
      storageState: fs.existsSync(AUTH_JSON) ? AUTH_JSON : undefined,
    });
    let page = await context.newPage();

    const wrap = async (step: number, name: string, fn: () => Promise<void>) => {
      try {
        await fn();
      } catch (e) {
        logStepError(step, name, e);
        writeFailedStep(step, e);
        throw e;
      }
    };

    const oppName = process.env.SALESFORCE_OPPORTUNITY_NAME || `ListFlow-${Date.now()}`;

    try {
      // Step 1 — Login (skipped on resume when auth file exists and resumeFrom > 1)
      if (resumeFrom <= 1 || !fs.existsSync(AUTH_JSON)) {
        await wrap(1, 'Login', async () => {
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
            throw new Error('Salesforce rejected login.');
          }
          await expect(page.getByRole('heading', { name: /^Salesforce login$/i })).not.toBeVisible({ timeout: 60_000 });
          fs.mkdirSync(RESULTS, { recursive: true });
          await context.storageState({ path: AUTH_JSON });
        });
      }

      // Steps 2–6: replay from list whenever resume is mid-flow so locators match a known screen.
      if (resumeFrom <= 6) {
        await wrap(2, 'Navigate to Opportunity list URL', async () => {
          await page.goto(LIST_URL, { waitUntil: 'domcontentloaded' });
          await waitForSalesforceReady(page, { timeout: 45_000 });
        });
      }

      if (resumeFrom <= 6) {
        await wrap(3, 'Click New', async () => {
          const newPagePromise = context.waitForEvent('page', { timeout: 12_000 }).catch(() => null);
          await page.getByRole('button', { name: 'New' }).first().click();
          const newPage = await newPagePromise;
          if (newPage) {
            await newPage.waitForLoadState('domcontentloaded');
            page = newPage;
          }
          await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {});
          await waitForSalesforceReady(page, { timeout: 25_000 });
        });
      }

      if (resumeFrom <= 6) {
        await wrap(4, 'Select record type Events', async () => {
          await selectOpportunityEventsRecordType(page);
        });
      }

      if (resumeFrom <= 6) {
        await wrap(5, 'Click Next', async () => {
          await clickRecordTypeNextAndWait(page);
        });
      }

      if (resumeFrom <= 6) {
        await wrap(6, 'Fill field values', async () => {
          await page.getByRole('textbox', { name: 'Opportunity Name' }).fill(oppName);

          const category = page.getByRole('combobox', { name: 'Category', exact: true });
          if (await category.isVisible({ timeout: 8000 }).catch(() => false)) {
            await category.click();
            await page.getByText('B2B').click();
          }

          const stageCombo = page.getByRole('combobox', { name: /^Stage$/i });
          if (await stageCombo.isVisible({ timeout: 4000 }).catch(() => false)) {
            await stageCombo.click();
            await page
              .getByRole('option', {
                name: new RegExp(`^${process.env.SALESFORCE_OPPORTUNITY_STAGE || 'Prospecting'}$`, 'i'),
              })
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
          if (await contactCombo.isVisible({ timeout: 5000 }).catch(() => false)) {
            await contactCombo.click();
            await contactCombo.fill(primaryContactSearch);
            const contactOption = page.getByRole('option', { name: new RegExp(primaryContactTitle, 'i') });
            if (await contactOption.isVisible({ timeout: 4000 }).catch(() => false)) {
              await contactOption.click();
            } else {
              await page.getByTitle(primaryContactTitle).click();
            }
          }

          const closeDateField = page.getByRole('textbox', { name: /Close Date/i });
          if (await closeDateField.isVisible({ timeout: 5000 }).catch(() => false)) {
            await closeDateField.click();
            await page.getByRole('button', { name: '16', exact: true }).click();
          }

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
          if (await eventType.isVisible({ timeout: 5000 }).catch(() => false)) {
            await eventType.click();
            await page.getByText(eventTypeOption, { exact: true }).click();
          }

          const eventBrief = page
            .getByLabel(/^\*Event Brief$/i)
            .or(page.getByLabel(/^Event Brief$/i))
            .or(page.getByRole('textbox', { name: /Event Brief/i }));
          if (await eventBrief.first().isVisible({ timeout: 5000 }).catch(() => false)) {
            await eventBrief.first().click({ timeout: 5000 }).catch(() => {});
            await eventBrief.first().fill(eventBriefText);
          }
        });
      }

      await wrap(7, 'Save record', async () => {
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await waitForSalesforceReady(page, { timeout: 60_000 });
        await expect(page).toHaveURL(/\/lightning\/r\/Opportunity\//, { timeout: 45_000 });
        await expect(page.getByRole('heading', { name: new RegExp(oppName, 'i') })).toBeVisible({ timeout: 25_000 });
      });

      clearFailed();
    } finally {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
    }
  });
});
