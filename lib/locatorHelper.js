/**
 * Locator priority for Salesforce / dynamic DOM:
 * 1. ID
 * 2. Name
 * 3. Stable XPath (non-positional: by text, role, attribute; no indices)
 */

/**
 * Build a locator using priority: ID → Name → Stable XPath.
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} options
 * @param {string} [options.id] - Element id attribute
 * @param {string} [options.name] - name attribute (e.g. input name)
 * @param {string} [options.stableXPath] - XPath that avoids position (e.g. by text, @id, @name, role)
 * @param {string} [options.role] - ARIA role (e.g. 'button', 'textbox')
 * @param {string} [options.roleName] - Name for getByRole (e.g. label text)
 * @returns {import('@playwright/test').Locator}
 */
function getLocator(page, options = {}) {
  const { id, name, stableXPath, role, roleName } = options;
  if (id) {
    return page.locator(`#${id.replace(/^#/, '')}`);
  }
  if (name) {
    const byName = page.locator(`[name="${name}"]`);
    if (byName) return byName;
  }
  if (role && roleName != null) {
    return page.getByRole(role, { name: roleName });
  }
  if (stableXPath) {
    return page.locator(`xpath=${stableXPath}`);
  }
  throw new Error('getLocator: provide at least one of id, name, stableXPath, or role+roleName');
}

/**
 * Click with fallback: try primary locator, then optional fallbacks.
 * @param {import('@playwright/test').Page} page
 * @param {Object} options - same as getLocator
 * @param {Array<() => import('@playwright/test').Locator>} [fallbacks] - functions returning alternative locators
 */
async function clickWithFallback(page, options, fallbacks = []) {
  const locators = [() => getLocator(page, options), ...fallbacks];
  let lastError;
  for (const getLoc of locators) {
    try {
      const loc = getLoc();
      await loc.waitFor({ state: 'visible', timeout: 10000 });
      await loc.click({ timeout: 10000 });
      return;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('clickWithFallback: all locators failed');
}

/**
 * Fill with fallback (same pattern as click).
 */
async function fillWithFallback(page, options, value, fallbacks = []) {
  const locators = [() => getLocator(page, options), ...fallbacks];
  let lastError;
  for (const getLoc of locators) {
    try {
      const loc = getLoc();
      await loc.waitFor({ state: 'visible', timeout: 10000 });
      await loc.fill(value, { timeout: 10000 });
      return;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('fillWithFallback: all locators failed');
}

/**
 * Build a stable XPath (no positional indices).
 * Prefer: text(), @id, @name, @data-*, @aria-label.
 * @param {string} tag - e.g. 'input', 'button', '*'
 * @param {Object} attrs - e.g. { id: 'x', name: 'y', 'aria-label': 'z' }
 * @param {string} [text] - exact text content
 */
function stableXPath(tag = '*', attrs = {}, text) {
  const parts = [];
  if (tag !== '*') parts.push(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v != null && v !== '') parts.push(`[@${k}="${v}"]`);
  }
  if (text != null && text !== '') parts.push(`[normalize-space()="${text}"]`);
  return `//${parts.join('')}`;
}

module.exports = {
  getLocator,
  clickWithFallback,
  fillWithFallback,
  stableXPath,
};
