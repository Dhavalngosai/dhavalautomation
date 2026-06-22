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

/**
 * Scroll a locator into view before interaction (no-op if already visible).
 * @param {import('@playwright/test').Locator} locator
 */
async function scrollIntoView(locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
}

/**
 * @param {import('@playwright/test').Locator} locator
 * @param {import('@playwright/test').LocatorClickOptions} [options]
 */
async function scrollAndClick(locator, options) {
  await scrollIntoView(locator);
  await locator.click(options);
}

/**
 * @param {import('@playwright/test').Locator} locator
 * @param {string} value
 * @param {import('@playwright/test').LocatorFillOptions} [options]
 */
async function scrollAndFill(locator, value, options) {
  await scrollIntoView(locator);
  await locator.fill(value, options);
}

/**
 * Scroll Lightning record form containers so lower fields render.
 * @param {import('@playwright/test').Page} page
 */
async function scrollRecordForm(page) {
  const scrollTargets = [
    page.locator('records-record-layout-item').last(),
    page.locator('.slds-modal__content, .record-body-container').first(),
    page.locator('records-lwc-record-layout').first(),
  ];

  for (const target of scrollTargets) {
    if (await target.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await target.scrollIntoViewIfNeeded().catch(() => {});
    }
  }

  await page.evaluate(() => {
    const containers = document.querySelectorAll(
      '.slds-modal__content, .record-body-container, records-lwc-record-layout',
    );
    for (const el of containers) {
      if (el instanceof HTMLElement) el.scrollTop = el.scrollHeight;
    }
    window.scrollTo(0, document.body.scrollHeight);
  }).catch(() => {});

  await page.waitForTimeout(400);
}

module.exports = {
  waitForSalesforceReady,
  waitForStable,
  waitForUrl,
  retryAction,
  scrollIntoView,
  scrollAndClick,
  scrollAndFill,
  scrollRecordForm,
};
