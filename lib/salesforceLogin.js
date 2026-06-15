/**
 * Sandbox login + Lightning home navigation.
 * Avoids landing on my.salesforce.com/?startURL=… when session is not ready before goto(home).
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady } = require('./waitHelpers');

const DEFAULT_SANDBOX_LOGIN = 'https://test.salesforce.com/';
const DEFAULT_LIGHTNING_HOME =
  'https://dhe-org2--qa.sandbox.lightning.force.com/lightning/page/home';

function sandboxLoginUrl() {
  return (process.env.SALESFORCE_BASE_URL || DEFAULT_SANDBOX_LOGIN).replace(/\/?$/, '/');
}

/**
 * Normalize LIGHTNING_HOME_URL. my.salesforce.com (without /lightning/) is a login host, not Lightning home.
 * @param {string} [homeUrl]
 * @returns {string}
 */
function normalizeLightningHomeUrl(homeUrl) {
  const raw = (homeUrl || process.env.SALESFORCE_LIGHTNING_HOME_URL || DEFAULT_LIGHTNING_HOME).trim();
  if (!raw) return DEFAULT_LIGHTNING_HOME;

  let u;
  try {
    u = new URL(raw);
  } catch {
    return raw;
  }

  if (u.hostname.includes('.my.salesforce.com') && !/\/lightning\//i.test(u.pathname)) {
    const sandboxMatch = u.hostname.match(/^(.+?)\.sandbox\.my\.salesforce\.com$/i);
    if (sandboxMatch) {
      return `https://${sandboxMatch[1]}.sandbox.lightning.force.com/lightning/page/home`;
    }
  }

  return raw;
}

/** True when the browser is on Lightning for the same org host as lightningHomeUrl. */
function alreadyOnLightningApp(pageUrl, lightningHomeUrl) {
  try {
    const cur = new URL(pageUrl);
    const target = new URL(lightningHomeUrl);
    return cur.hostname === target.hostname && /\/lightning\//i.test(cur.pathname);
  } catch {
    return false;
  }
}

function lightningHostFromHomeUrl(lightningHomeUrl) {
  try {
    return new URL(lightningHomeUrl).hostname;
  } catch {
    return '';
  }
}

/**
 * Wait for Salesforce post-login redirect, then open home if needed.
 * goto() often throws ERR_ABORTED when Salesforce redirects at the same time — treat as success if Lightning loaded.
 */
async function openLightningHome(page, lightningHome, timeoutMs) {
  const targetHost = lightningHostFromHomeUrl(lightningHome);
  if (alreadyOnLightningApp(page.url(), lightningHome)) return;

  await page
    .waitForURL(
      (url) => url.hostname === targetHost && /\/lightning\//i.test(url.pathname),
      { timeout: timeoutMs }
    )
    .catch(() => {});

  if (alreadyOnLightningApp(page.url(), lightningHome)) return;

  try {
    await page.goto(lightningHome, { waitUntil: 'commit', timeout: timeoutMs });
  } catch (err) {
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
    if (alreadyOnLightningApp(page.url(), lightningHome)) return;
    const msg = err instanceof Error ? err.message : String(err);
    if (/ERR_ABORTED|Navigation interrupted|NS_BINDING_ABORTED/i.test(msg)) {
      await page
        .waitForURL(
          (url) => url.hostname === targetHost && /\/lightning\//i.test(url.pathname),
          { timeout: 15_000 }
        )
        .catch(() => {});
      if (alreadyOnLightningApp(page.url(), lightningHome)) return;
    }
    throw err;
  }
}

function isSalesforceLoginPage(url) {
  try {
    const u = new URL(url);
    if (/^login\.(salesforce|force)\.com$/i.test(u.hostname)) return true;
    if (u.hostname.includes('.my.salesforce.com') && (u.searchParams.has('startURL') || u.searchParams.get('ec') === '302')) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Log in to sandbox and open Lightning home.
 * @param {import('@playwright/test').Page} page
 * @param {{ username: string, password: string, sfReadyMs?: number, untilVisible?: { timeout: number } }} opts
 * @returns {Promise<string>} resolved Lightning home URL
 */
async function loginToSandboxAndOpenHome(page, opts) {
  const { username, password, sfReadyMs = 20_000, untilVisible = { timeout: 30_000 } } = opts;
  const lightningHome = normalizeLightningHomeUrl();

  await page.goto(sandboxLoginUrl());
  await waitForSalesforceReady(page, { timeout: sfReadyMs });

  const usernameField = page.getByRole('textbox', { name: 'Username' });
  await usernameField.waitFor({ state: 'visible', ...untilVisible });
  await usernameField.click();
  await usernameField.fill(username);
  await usernameField.press('Tab');

  const passwordField = page.getByRole('textbox', { name: 'Password' });
  await passwordField.waitFor({ state: 'visible', ...untilVisible });
  await passwordField.fill(password);
  await passwordField.press('Enter');

  const sandboxBtn = page.getByRole('button', { name: 'Log In to Sandbox' });
  if (await sandboxBtn.isVisible().catch(() => false)) {
    await sandboxBtn.waitFor({ state: 'visible', ...untilVisible });
    await Promise.all([
      page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => {}),
      sandboxBtn.click(),
    ]);
  } else {
    await page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => {});
  }

  await page
    .getByRole('heading', { name: /^Salesforce login$/i })
    .waitFor({ state: 'hidden', timeout: 60_000 })
    .catch(() => {});

  await openLightningHome(page, lightningHome, Math.max(untilVisible.timeout, 60_000));

  await waitForSalesforceReady(page, { timeout: sfReadyMs });

  if (isSalesforceLoginPage(page.url())) {
    throw new Error(
      `Still on Salesforce login after opening ${lightningHome}. ` +
        'Use SALESFORCE_BASE_URL=https://test.salesforce.com for sandboxes and ' +
        'SALESFORCE_LIGHTNING_HOME_URL=https://<org>--qa.sandbox.lightning.force.com/lightning/page/home ' +
        `(not *.my.salesforce.com). Current URL: ${page.url()}`
    );
  }

  return lightningHome;
}

module.exports = {
  sandboxLoginUrl,
  normalizeLightningHomeUrl,
  alreadyOnLightningApp,
  openLightningHome,
  loginToSandboxAndOpenHome,
};
