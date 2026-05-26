/**
 * Salesforce Login page (login.salesforce.com).
 * Locator priority: ID → Name → Stable XPath.
 */

const { getLocator, fillWithFallback, clickWithFallback, stableXPath } = require('../lib/locatorHelper');
const { waitForSalesforceReady, waitForUrl } = require('../lib/waitHelpers');
const { withErrorContext } = require('../lib/errors');

const SELECTORS = {
  username: { id: 'username', name: 'username' },
  password: { id: 'password', name: 'pw' },
  loginButton: { id: 'Login', name: 'Login', stableXPath: '//input[@id="Login" or @name="Login"]' },
};

class SalesforceLoginPage {
  constructor(page) {
    this.page = page;
  }

  async goto(baseUrl = process.env.SALESFORCE_BASE_URL || 'https://login.salesforce.com') {
    await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await waitForSalesforceReady(this.page);
  }

  async enterUsername(username) {
    await withErrorContext(
      () => fillWithFallback(this.page, SELECTORS.username, username, [
        () => this.page.getByLabel('Username'),
        () => this.page.locator('input[type="email"], input[name="username"]'),
      ]),
      'Salesforce login: username field',
      'Use getByLabel("Username") or input[name="username"] if ID changes'
    );
  }

  async enterPassword(password) {
    await withErrorContext(
      () => fillWithFallback(this.page, SELECTORS.password, password, [
        () => this.page.getByLabel('Password'),
        () => this.page.locator('input[type="password"], input[name="pw"]'),
      ]),
      'Salesforce login: password field',
      'Use getByLabel("Password") or input[name="pw"] if ID changes'
    );
  }

  async clickLogin() {
    await withErrorContext(
      () => clickWithFallback(this.page, SELECTORS.loginButton, [
        () => this.page.getByRole('button', { name: /log in/i }),
        () => this.page.locator('input[type="submit"][value="Log In"]'),
      ]),
      'Salesforce login: Login button',
      'Use getByRole("button", { name: /log in/i }) or input[type="submit"]'
    );
  }

  /**
   * Full login flow. After success, URL typically contains "lightning" or "salesforce.com" (home).
   */
  async login(username, password, baseUrl) {
    await this.goto(baseUrl);
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
    await waitForSalesforceReady(this.page, { timeout: 20000 });
  }

  async isLoggedIn() {
    const url = this.page.url();
    return url.includes('lightning') || (url.includes('salesforce.com') && !url.includes('login.'));
  }
}

module.exports = { SalesforceLoginPage, SELECTORS };
