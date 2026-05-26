/**
 * Wait strategies for Salesforce dynamic DOM and LWC.
 * Use to avoid flakiness from async rendering and iframes.
 */

/**
 * Wait for Salesforce app to be ready (no loading spinners, network idle).
 * @param {import('@playwright/test').Page} page
 * @param {Object} [opts]
 * @param {number} [opts.timeout=15000]
 */
async function waitForSalesforceReady(page, opts = {}) {
  const timeout = opts.timeout ?? 15000;
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  // Hide common SF loading indicators so they don't block clicks
  await page.evaluate(() => {
    const spinner = document.querySelector('.slds-spinner_container, [role="status"][aria-busy="true"]');
    if (spinner && spinner.style) spinner.style.visibility = 'hidden';
  }).catch(() => {});
}

/**
 * Wait for an element to be visible and stable (no animation).
 * @param {import('@playwright/test').Locator} locator
 * @param {number} [timeout=10000]
 */
async function waitForStable(locator, timeout = 10000) {
  await locator.waitFor({ state: 'visible', timeout });
  await locator.page().waitForTimeout(300);
}

/**
 * Wait for URL to match (e.g. after login redirect).
 * @param {import('@playwright/test').Page} page
 * @param {string|RegExp} urlOrRegex
 * @param {number} [timeout=20000]
 */
async function waitForUrl(page, urlOrRegex, timeout = 20000) {
  if (typeof urlOrRegex === 'string') {
    await page.waitForURL(u => u.href === urlOrRegex || u.href.startsWith(urlOrRegex), { timeout });
  } else {
    await page.waitForURL(urlOrRegex, { timeout });
  }
}

/**
 * Retry an action until it succeeds or timeout.
 * @param {() => Promise<any>} fn
 * @param {Object} [opts] - { intervalMs, timeoutMs }
 * @returns {Promise<any>}
 */
async function retryAction(fn, opts = {}) {
  const intervalMs = opts.intervalMs ?? 500;
  const timeoutMs = opts.timeoutMs ?? 15000;
  const start = Date.now();
  let lastError;
  while (Date.now() - start < timeoutMs) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }
  throw lastError || new Error('retryAction: timeout');
}

module.exports = {
  waitForSalesforceReady,
  waitForStable,
  waitForUrl,
  retryAction,
};
