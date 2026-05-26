/**
 * Salesforce Login - refined Playwright test.
 * Locator priority: ID → Name → Stable XPath.
 * Re-runnable; uses env for credentials (no secrets in repo).
 */

const { test, expect } = require('@playwright/test');
const { SalesforceLoginPage } = require('../pages/SalesforceLoginPage');

const BASE_URL = process.env.SALESFORCE_BASE_URL || 'https://login.salesforce.com';
const USERNAME = process.env.SALESFORCE_USERNAME || '';
const PASSWORD = process.env.SALESFORCE_PASSWORD || '';

test.describe('Salesforce Login', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start from login when testing login flow
    if (!BASE_URL.includes('login')) {
      await page.goto(BASE_URL.replace(/\/$/, '') + '/');
    }
  });

  test('login page loads and shows username/password fields', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    const loginPage = new SalesforceLoginPage(page);
    await loginPage.goto(BASE_URL);

    const username = page.locator('#username').or(page.locator('input[name="username"]'));
    const password = page.locator('#password').or(page.locator('input[name="pw"]'));
    await expect(username).toBeVisible();
    await expect(password).toBeVisible();
  });

  test('full login and redirect to app home', async ({ page }) => {
    if (!USERNAME || !PASSWORD) test.skip();

    const loginPage = new SalesforceLoginPage(page);
    await loginPage.login(USERNAME, PASSWORD, BASE_URL);

    await expect(async () => {
      const url = page.url();
      const hasHome = url.includes('lightning') || (url.includes('salesforce.com') && !url.includes('login.'));
      const verifyPage = await page.locator('text=Verify Your Identity').isVisible();
      expect(hasHome || verifyPage).toBeTruthy();
    }).toPass({ timeout: 25000 });
  });
});
