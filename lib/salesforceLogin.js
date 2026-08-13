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
 * Fill Salesforce identity verification / passkey when the post-login challenge appears.
 * Supports OTP/code fields and WebAuthn pages (via "Having Trouble?" or headed manual wait).
 * @param {import('@playwright/test').Page} page
 * @param {{ passkey?: string, untilVisible?: { timeout: number }, headedWaitMs?: number }} [opts]
 */
async function completeSalesforcePasskeyIfPresent(page, opts = {}) {
  const passkey = (opts.passkey || process.env.SALESFORCE_PASSKEY || '').trim();
  if (!passkey) return false;

  const untilVisible = opts.untilVisible || { timeout: 15_000 };
  const headedWaitMs = opts.headedWaitMs ?? (Number(process.env.SALESFORCE_PASSKEY_WAIT_MS) || 180_000);

  const verifyHeading = page.getByRole('heading', { name: /Verify Your Identity/i });
  if (!(await verifyHeading.isVisible({ timeout: 6_000 }).catch(() => false))) {
    return false;
  }

  const codeField = page
    .locator('#emc, input[name="emc"], input[name="otp"], input[id*="verification"]')
    .or(page.getByRole('textbox', { name: /Verification Code|One-Time Password|Passkey|PIN|Security Code/i }))
    .first();

  const submitPasskey = async (field) => {
    await field.waitFor({ state: 'visible', timeout: untilVisible.timeout });
    await field.click();
    await field.fill(passkey);
    const verifyBtn = page
      .getByRole('button', { name: /Verify|Continue|Log In|Submit/i })
      .or(page.locator('input[type="submit"]'))
      .first();
    if (await verifyBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await verifyBtn.click();
    } else {
      await field.press('Enter');
    }
    await page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => {});
    await waitForSalesforceReady(page, { timeout: 20_000 });
    return true;
  };

  if (await codeField.isVisible({ timeout: 2_000 }).catch(() => false)) {
    return submitPasskey(codeField);
  }

  const havingTrouble = page.getByRole('link', { name: /Having Trouble/i });
  if (await havingTrouble.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await havingTrouble.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {});
    await waitForSalesforceReady(page, { timeout: 20_000 });

    const altCodeField = page
      .locator('#emc, input[name="emc"], input[name="otp"], input[type="tel"], input[type="text"]')
      .or(page.getByRole('textbox'))
      .filter({ hasNot: page.locator('[name="username"], [name="password"]') })
      .first();
    if (await altCodeField.isVisible({ timeout: untilVisible.timeout }).catch(() => false)) {
      return submitPasskey(altCodeField);
    }
  }

  // WebAuthn passkey page: type PIN/code (e.g. Windows Hello) and/or wait for manual completion in headed runs.
  await page.keyboard.press('Tab').catch(() => {});
  await page.keyboard.type(passkey, { delay: 80 }).catch(() => {});

  const verifyBtn = page.getByRole('button', { name: /Verify Your Identity|Verify|Continue/i }).first();
  if (await verifyBtn.isEnabled({ timeout: 2_000 }).catch(() => false)) {
    await verifyBtn.click();
  }

  await verifyHeading.waitFor({ state: 'hidden', timeout: headedWaitMs }).catch(() => {});
  if (!(await verifyHeading.isVisible().catch(() => false))) {
    await waitForSalesforceReady(page, { timeout: 20_000 });
    return true;
  }

  throw new Error(
    'Salesforce passkey verification is still showing. Run with --headed and enter passkey 130986 ' +
      '(Windows Hello PIN or alternate verification), or save storageState after a manual login.'
  );
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

  const passwordField = page.getByRole('textbox', { name: 'Password' });
  const sandboxBtn = page.getByRole('button', { name: 'Log In to Sandbox' });

  // Some sandbox login pages show Password only after username + Log In click.
  let passwordVisible = await passwordField.isVisible({ timeout: 2_000 }).catch(() => false);
  if (!passwordVisible) {
    if (await sandboxBtn.isVisible().catch(() => false)) {
      await sandboxBtn.click();
    } else {
      await usernameField.press('Enter');
    }
    await passwordField.waitFor({ state: 'visible', ...untilVisible });
    passwordVisible = true;
  }

  await passwordField.click();
  await passwordField.fill(password);

  if (await sandboxBtn.isVisible().catch(() => false)) {
    await Promise.all([
      page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => {}),
      sandboxBtn.click(),
    ]);
  } else {
    await passwordField.press('Enter');
    await page.waitForLoadState('domcontentloaded', { timeout: 60_000 }).catch(() => {});
  }

  await page
    .getByRole('heading', { name: /^Salesforce login$/i })
    .waitFor({ state: 'hidden', timeout: 60_000 })
    .catch(() => {});

  await completeSalesforcePasskeyIfPresent(page, { untilVisible });

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
  completeSalesforcePasskeyIfPresent,
  loginToSandboxAndOpenHome,
};
