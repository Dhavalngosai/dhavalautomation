/**
 * Setup → Users → search user → Login as user (impersonation).
 * Used when cases must be created under the Excel "User" identity.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady, waitForStable, scrollAndClick, scrollAndFill, scrollIntoView } = require('./waitHelpers');

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setupOriginFromLightning(lightningHome) {
  const fromEnv = process.env.SALESFORCE_SETUP_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const u = new URL(lightningHome);
  const host = u.hostname.replace(/\.lightning\.force\.com$/i, '.my.salesforce-setup.com');
  return `https://${host}`;
}

function usersListSetupUrl(setupOrigin) {
  const fromEnv = process.env.SALESFORCE_SETUP_USERS_LIST_URL?.trim();
  if (fromEnv) return fromEnv;

  const address = encodeURIComponent('/005?appLayout=setup&isUserEntityOverride=1');
  return `${setupOrigin}/lightning/setup/ManageUsers/page?address=${address}&isUserEntityOverride=1`;
}

/**
 * @param {import('@playwright/test').Page} lightningPage
 * @param {{ untilVisible?: { timeout: number }, sfReadyMs?: number }} [opts]
 * @returns {Promise<import('@playwright/test').Page>}
 */
async function openSetupInNewTab(lightningPage, opts = {}) {
  const untilVisible = opts.untilVisible ?? { timeout: 30_000 };
  const sfReadyMs = opts.sfReadyMs ?? 20_000;

  const setupBtn = lightningPage.getByRole('button', { name: 'Setup' });
  await setupBtn.waitFor({ state: 'visible', ...untilVisible });
  await waitForStable(setupBtn, 10_000);
  await scrollAndClick(setupBtn);

  const popupPromise = lightningPage.waitForEvent('popup');
  const setupMenu = lightningPage.locator('a[role="menuitem"][data-id="related_setup_app_home"]');
  await setupMenu.waitFor({ state: 'visible', ...untilVisible });
  await scrollAndClick(setupMenu);

  const setupPage = await popupPromise;
  await setupPage.waitForLoadState('domcontentloaded');
  await setupPage.setDefaultTimeout(untilVisible.timeout);
  await waitForSalesforceReady(setupPage, { timeout: sfReadyMs });

  return setupPage;
}

/**
 * @param {import('@playwright/test').Page} setupPage
 * @param {{ lightningHome: string, untilVisible?: { timeout: number }, sfReadyMs?: number }} opts
 */
async function navigateToUsersList(setupPage, opts) {
  const untilVisible = opts.untilVisible ?? { timeout: 30_000 };
  const sfReadyMs = opts.sfReadyMs ?? 20_000;

  const quickFind = setupPage.getByRole('searchbox', { name: 'Quick Find' });
  if (await quickFind.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await scrollAndClick(quickFind);
    await scrollAndFill(quickFind, 'users');
    await setupPage.waitForTimeout(800);

    const usersLink = setupPage.getByRole('link', { name: 'Users' }).nth(1);
    if (await usersLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await scrollAndClick(usersLink);
      await waitForSalesforceReady(setupPage, { timeout: sfReadyMs });
      return;
    }

    const usersLinkAlt = setupPage.getByRole('link', { name: 'Users' }).last();
    await scrollAndClick(usersLinkAlt);
    await waitForSalesforceReady(setupPage, { timeout: sfReadyMs });
    return;
  }

  const setupOrigin = setupOriginFromLightning(opts.lightningHome);
  await setupPage.goto(usersListSetupUrl(setupOrigin));
  await setupPage.waitForLoadState('domcontentloaded');
  await waitForSalesforceReady(setupPage, { timeout: sfReadyMs });
}

/**
 * @param {import('@playwright/test').Page | import('playwright-core').Frame} ctx
 * @param {string} userSearchText
 */
async function trySearchUserInContext(ctx, userSearchText) {
  const userRe = new RegExp(escapeRe(userSearchText), 'i');

  const searchLocators = [
    ctx.locator('input[name="searchBar"]'),
    ctx.locator('input[name="searchInput"]'),
    ctx.getByRole('textbox', { name: /Search/i }),
    ctx.getByPlaceholder(/search/i),
    ctx.locator('input[type="search"]'),
  ];

  for (const search of searchLocators) {
    const input = search.first();
    if (!(await input.isVisible({ timeout: 800 }).catch(() => false))) continue;

    await scrollAndClick(input);
    await input.fill('');
    await scrollAndFill(input, userSearchText);
    await input.press('Enter').catch(() => input.press('Tab'));
    await new Promise((r) => setTimeout(r, 1_500));
    break;
  }

  const userLink = ctx
    .getByRole('link', { name: userRe })
    .or(ctx.getByRole('row', { name: userRe }).getByRole('link').first())
    .or(ctx.locator('a').filter({ hasText: userRe }).first())
    .or(ctx.locator('th.dataCell a').filter({ hasText: userRe }).first());

  if (await userLink.first().isVisible({ timeout: 8_000 }).catch(() => false)) {
    await scrollAndClick(userLink.first());
    return true;
  }

  const loginOnRow = ctx.getByRole('row', { name: userRe }).locator('input[name="login"]').first();
  if (await loginOnRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await scrollAndClick(loginOnRow);
    return 'logged-in';
  }

  return false;
}

/**
 * @param {import('@playwright/test').Page} setupPage
 * @param {string} userSearchText
 */
async function searchUserAndOpenDetail(setupPage, userSearchText) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    await waitForSalesforceReady(setupPage, { timeout: 10_000 }).catch(() => {});

    const mainResult = await trySearchUserInContext(setupPage, userSearchText);
    if (mainResult === 'logged-in') return;
    if (mainResult) {
      await waitForSalesforceReady(setupPage, { timeout: 15_000 });
      return;
    }

    const iframes = setupPage.locator('iframe');
    const count = await iframes.count();
    for (let i = 0; i < count; i++) {
      const handle = await iframes.nth(i).elementHandle({ timeout: 3_000 }).catch(() => null);
      if (!handle) continue;
      const frame = await handle.contentFrame();
      if (!frame) continue;

      const frameResult = await trySearchUserInContext(frame, userSearchText);
      if (frameResult === 'logged-in') return;
      if (frameResult) {
        await waitForSalesforceReady(setupPage, { timeout: 15_000 });
        return;
      }
    }

    await setupPage.waitForTimeout(500);
  }

  throw new Error(`User not found in Setup → Users: "${userSearchText}"`);
}

/**
 * @param {import('@playwright/test').Page | import('playwright-core').Frame} ctx
 */
async function tryClickLogin(ctx) {
  const candidates = [
    ctx.locator('input[name="login"]'),
    ctx.locator('input[type="submit"][name="login"]'),
    ctx.locator('input[type="submit"][value*="Login" i]'),
    ctx.getByRole('button', { name: 'Login', exact: true }),
    ctx.getByRole('button', { name: /^Log in$/i }),
    ctx.getByRole('button', { name: /Log in as this user/i }),
    ctx.getByRole('link', { name: 'Login', exact: true }),
    ctx.locator('input.slds-button[type="submit"][value="Login"]'),
    ctx.locator('lightning-button').filter({ hasText: /^Login$/i }),
    ctx.locator('button.slds-button').filter({ hasText: /^Login$/ }),
  ];

  for (const loc of candidates) {
    const target = loc.first();
    try {
      await target.waitFor({ state: 'visible', timeout: 1_500 });
      await scrollIntoView(target);
      await target.click({ timeout: 5_000 });
      return true;
    } catch {
      /* next */
    }
  }
  return false;
}

/**
 * @param {import('@playwright/test').Page} setupPage
 */
async function clickLoginAsUser(setupPage) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    await waitForSalesforceReady(setupPage, { timeout: 10_000 }).catch(() => {});

    if (await tryClickLogin(setupPage)) return;

    const iframes = setupPage.locator('iframe');
    const n = await iframes.count();
    for (let i = 0; i < n; i++) {
      const handle = await iframes.nth(i).elementHandle({ timeout: 5_000 }).catch(() => null);
      if (!handle) continue;
      const frame = await handle.contentFrame();
      if (!frame) continue;
      if (await tryClickLogin(frame)) return;
    }

    await setupPage.waitForTimeout(500);
  }

  throw new Error(
    'Could not find Login control on the user detail page (main document or iframe).',
  );
}

/**
 * Admin Lightning tab → Setup → Users → search → Login as user.
 * Returns the setup popup page, now running as the target user.
 *
 * @param {import('@playwright/test').Page} lightningPage
 * @param {string} userSearchText
 * @param {{ lightningHome: string, untilVisible?: { timeout: number }, sfReadyMs?: number }} opts
 * @returns {Promise<import('@playwright/test').Page>}
 */
async function loginAsUserFromSetup(lightningPage, userSearchText, opts) {
  if (!userSearchText?.trim()) {
    throw new Error('User column is required for login-as flow');
  }

  const setupPage = await openSetupInNewTab(lightningPage, opts);
  await navigateToUsersList(setupPage, opts);
  await searchUserAndOpenDetail(setupPage, userSearchText.trim());
  await clickLoginAsUser(setupPage);
  await setupPage.waitForURL(/lightning\.force|my\.salesforce/i, { timeout: 90_000 }).catch(() => {});
  await waitForSalesforceReady(setupPage, { timeout: opts.sfReadyMs ?? 20_000 });

  const lightningHome = opts.lightningHome;
  if (lightningHome) {
    try {
      const onLightningApp = /\/lightning\//i.test(new URL(setupPage.url()).pathname);
      if (!onLightningApp) {
        await setupPage.goto(lightningHome, { waitUntil: 'domcontentloaded', timeout: 90_000 });
        await waitForSalesforceReady(setupPage, { timeout: opts.sfReadyMs ?? 20_000 });
      }
    } catch {
      await setupPage.goto(lightningHome, { waitUntil: 'domcontentloaded', timeout: 90_000 }).catch(() => {});
      await waitForSalesforceReady(setupPage, { timeout: opts.sfReadyMs ?? 20_000 });
    }
  }

  return setupPage;
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function closePageSafe(page) {
  if (!page.isClosed()) {
    await page.close().catch(() => {});
  }
}

module.exports = {
  setupOriginFromLightning,
  usersListSetupUrl,
  openSetupInNewTab,
  navigateToUsersList,
  searchUserAndOpenDetail,
  clickLoginAsUser,
  loginAsUserFromSetup,
  closePageSafe,
};
