/**
 * Fetch selectable values from every picklist and multi-select on the
 * Lightning Lead new-record form.
 *
 * Strategy: discover + read in the same pass (no stale locators).
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { waitForSalesforceReady, scrollIntoView, scrollRecordForm } = require(
  path.resolve(__dirname, '../../lib/waitHelpers'),
);

const LOOKUP_LABELS = new Set([
  'Address Search',
  'Lead Owner',
  'Company',
  'Account Name',
  'Campaign',
  'Search',
]);

const DUAL_COLUMN_LABELS = new Set(['available', 'chosen', 'selected']);

function cleanLabel(raw) {
  return String(raw ?? '')
    .replace(/\*/g, '')
    .replace(/\s*Help\s*$/i, '')
    .replace(/\s*Info\s*$/i, '')
    .replace(/\s*Required\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSkippableComboLabel(label) {
  if (!label) return true;
  if (/__c$/i.test(label)) return true;
  if (/date.?time/i.test(label)) return true;
  return false;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ sfReadyMs?: number, untilVisible?: { timeout: number } }} [opts]
 */
async function openNewLeadForm(page, opts = {}) {
  const sfReadyMs = opts.sfReadyMs ?? 20_000;
  const untilVisible = opts.untilVisible ?? { timeout: 30_000 };

  const leadsLink = page.getByRole('link', { name: 'Leads' });
  await leadsLink.waitFor({ state: 'visible', ...untilVisible });
  await leadsLink.click();
  await waitForSalesforceReady(page, { timeout: sfReadyMs });

  const newLead = page.getByRole('button', { name: 'New', exact: true });
  await newLead.waitFor({ state: 'visible', ...untilVisible });
  await newLead.scrollIntoViewIfNeeded();
  await newLead.click();

  await page
    .getByRole('dialog')
    .filter({ hasText: /New Lead|Select a record type/i })
    .first()
    .waitFor({ state: 'visible', timeout: 60_000 })
    .catch(() => {});

  const nextBtn = page.getByRole('button', { name: 'Next', exact: true });
  if (await nextBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await nextBtn.click();
  }
  await waitForSalesforceReady(page, { timeout: sfReadyMs });

  // Wait for form fields to settle
  await page
    .getByRole('textbox', { name: /Last Name|First Name/i })
    .first()
    .waitFor({ state: 'visible', timeout: 60_000 })
    .catch(() => {});
  await page
    .locator('.slds-spinner_container, .slds-spinner')
    .first()
    .waitFor({ state: 'hidden', timeout: 30_000 })
    .catch(() => {});
  await page.waitForTimeout(1_500);
}

async function dismissOpenDropdowns(page) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(200);
}

async function getComboboxLabel(combo) {
  const aria = await combo.getAttribute('aria-label').catch(() => null);
  if (aria?.trim()) return cleanLabel(aria);

  const labelledBy = await combo.getAttribute('aria-labelledby').catch(() => null);
  if (labelledBy) {
    for (const id of labelledBy.split(/\s+/).filter(Boolean)) {
      const text = await combo
        .page()
        .locator(`#${CSS.escape(id)}`)
        .textContent()
        .catch(() => null);
      if (text?.trim()) return cleanLabel(text);
    }
  }

  const itemLabel = combo
    .locator('xpath=ancestor::records-record-layout-item[1]//label')
    .first();
  const fromItem = cleanLabel((await itemLabel.innerText().catch(() => '')) || '');
  if (fromItem) return fromItem;

  return cleanLabel((await combo.getAttribute('name').catch(() => '')) || '');
}

/**
 * Read options with Playwright locators (pierces open shadow DOM).
 * @param {import('@playwright/test').Locator} root
 * @param {import('@playwright/test').Page} page
 */
async function readOptionsFromRoot(root, page) {
  const optionLoc = root.locator(
    '[role="option"], lightning-base-combobox-item, .slds-listbox__option, li.slds-listbox__item',
  );

  const listboxes = root.locator('[role="listbox"]');
  const lbCount = await listboxes.count().catch(() => 0);
  for (let i = 0; i < Math.min(lbCount, 2); i++) {
    const lb = listboxes.nth(i);
    for (let pass = 0; pass < 25; pass++) {
      await lb
        .evaluate((el) => {
          el.scrollTop = Math.min(el.scrollTop + Math.max(el.clientHeight, 100), el.scrollHeight);
        })
        .catch(() => {});
      await page.waitForTimeout(70);
    }
    await lb.evaluate((el) => { el.scrollTop = 0; }).catch(() => {});
  }

  const seen = new Set();
  let stagnant = 0;
  for (let pass = 0; pass < 30 && stagnant < 3; pass++) {
    const before = seen.size;
    const count = await optionLoc.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const opt = optionLoc.nth(i);
      await opt.scrollIntoViewIfNeeded().catch(() => {});
      const text = (await opt.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
      if (text) seen.add(text);
    }
    stagnant = seen.size === before ? stagnant + 1 : 0;
    if (lbCount > 0) {
      await listboxes
        .first()
        .evaluate((el) => {
          el.scrollTop = Math.min(el.scrollTop + 140, el.scrollHeight);
        })
        .catch(() => {});
    }
    await page.waitForTimeout(80);
  }

  return [...seen];
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} combo
 */
async function listboxForCombobox(page, combo) {
  const controls =
    (await combo.getAttribute('aria-controls').catch(() => '')) ||
    (await combo.getAttribute('aria-owns').catch(() => '')) ||
    '';

  for (const id of controls.split(/\s+/).filter(Boolean)) {
    const byId = page.locator(`#${CSS.escape(id)}`);
    if (await byId.isVisible({ timeout: 1_500 }).catch(() => false)) return byId;
  }

  const scoped = combo
    .locator(
      'xpath=ancestor::lightning-base-combobox[1]//*[@role="listbox"] | ancestor::lightning-combobox[1]//*[@role="listbox"] | ancestor::lightning-picklist[1]//*[@role="listbox"]',
    )
    .first();
  if (await scoped.isVisible({ timeout: 1_000 }).catch(() => false)) return scoped;

  // Prefer a listbox that is NOT inside a dual-listbox
  const candidates = page.locator('[role="listbox"]:visible');
  const count = await candidates.count();
  for (let i = count - 1; i >= 0; i--) {
    const lb = candidates.nth(i);
    const inDual = await lb
      .evaluate(
        (el) =>
          !!el.closest('lightning-dual-listbox, .slds-dueling-list, .slds-dueling-list__column'),
      )
      .catch(() => false);
    if (!inDual) return lb;
  }

  return page.locator('[role="listbox"]:visible').last();
}

/**
 * Open one combobox (via ElementHandle to avoid stale nth() re-query) and return options.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} combo
 * @param {string} label
 */
async function readOpenCombobox(page, combo, label) {
  if (LOOKUP_LABELS.has(label)) return { type: 'lookup', values: [] };

  const handle = await combo.elementHandle();
  if (!handle) return { type: 'not-visible', values: [] };

  try {
    const isMulti =
      (await handle.getAttribute('aria-multiselectable').catch(() => null)) === 'true';
    const disabled = (await handle.getAttribute('aria-disabled').catch(() => null)) === 'true';
    if (disabled) return { type: 'dependent-disabled', values: [] };

    await dismissOpenDropdowns(page);
    await handle.scrollIntoViewIfNeeded().catch(() => {});

    // Prefer inner button/input; fall back to the combobox element itself
    const clicked = await handle.evaluate((el) => {
      const inner = el.querySelector(
        'button.slds-combobox__input, button[role="combobox"], input[role="combobox"], input.slds-combobox__input, button, input',
      );
      const target = /** @type {HTMLElement|null} */ (inner || el);
      if (!target) return false;
      target.click();
      return true;
    });
    if (!clicked) {
      await handle.click({ force: true }).catch(() => {});
    }
    await page.waitForTimeout(500);

    // Re-resolve dropdown from page (not stale combo locator)
    const freshCombo = page.getByRole('combobox', { name: label, exact: false }).first();
    const listbox = await listboxForCombobox(page, freshCombo);
    let values = await readOptionsFromRoot(listbox, page);

    if (values.length <= 1) {
      const seen = new Set(values);
      for (let i = 0; i < 50; i++) {
        const before = seen.size;
        await page.keyboard.press('ArrowDown').catch(() => {});
        await page.waitForTimeout(45);
        for (const v of await readOptionsFromRoot(listbox, page)) seen.add(v);
        if (seen.size === before && i > 5) break;
      }
      values = [...seen];
    }

    await dismissOpenDropdowns(page);
    return {
      type: values.length ? (isMulti ? 'multi-select-combobox' : 'picklist') : 'empty',
      values,
    };
  } finally {
    await handle.dispose().catch(() => {});
  }
}

/**
 * Read dual-listbox Available options from a layout root.
 * @param {import('@playwright/test').Locator} root
 * @param {import('@playwright/test').Page} page
 */
async function readDualFromRoot(root, page) {
  await scrollIntoView(root);
  const dualRoot =
    (await root.locator('lightning-dual-listbox, .slds-dueling-list').count().catch(() => 0)) > 0
      ? root.locator('lightning-dual-listbox, .slds-dueling-list').first()
      : root;

  const values = await readOptionsFromRoot(dualRoot, page);
  const available = dualRoot
    .locator('[role="listbox"][aria-label*="Available" i]')
    .or(dualRoot.getByRole('listbox').first())
    .first();
  const chosen = dualRoot
    .locator('[role="listbox"][aria-label*="Chosen" i]')
    .or(dualRoot.getByRole('listbox').nth(1))
    .first();

  const availableValues = (await available.count().catch(() => 0))
    ? await readOptionsFromRoot(available, page)
    : [];
  const chosenValues = (await chosen.count().catch(() => 0))
    ? await readOptionsFromRoot(chosen, page)
    : [];

  const merged = [...new Set([...values, ...availableValues, ...chosenValues])];
  return {
    type: 'dual-listbox',
    values: merged,
    available: availableValues.length ? availableValues : merged,
    chosen: chosenValues,
  };
}

async function scrollFormDown(page) {
  await scrollRecordForm(page);

  const dialog = page.getByRole('dialog').last();
  if (await dialog.isVisible().catch(() => false)) {
    await dialog
      .locator('.slds-modal__content, .modal-body, .actionBody')
      .first()
      .evaluate((el) => {
        el.scrollTop = Math.min(el.scrollTop + Math.floor(el.clientHeight * 0.8), el.scrollHeight);
      })
      .catch(() => {});
  }

  await page
    .evaluate(() => {
      const containers = [
        ...document.querySelectorAll(
          '.slds-modal__content, .modal-body, .actionBody, .record-body-container, records-lwc-record-layout',
        ),
      ];
      let scrolled = false;
      for (const el of containers) {
        if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight + 20) {
          el.scrollTop = Math.min(el.scrollTop + Math.floor(el.clientHeight * 0.75), el.scrollHeight);
          scrolled = true;
        }
      }
      if (!scrolled) window.scrollBy(0, Math.floor(window.innerHeight * 0.6));
    })
    .catch(() => {});
  await page.waitForTimeout(400);
}

/**
 * Walk the form once: for each new picklist / multi-select found, read values immediately.
 * @param {import('@playwright/test').Page} page
 * @param {{ sfReadyMs?: number, untilVisible?: { timeout: number } }} [opts]
 */
async function collectLeadFormPicklists(page, opts = {}) {
  await openNewLeadForm(page, opts);

  /** @type {Record<string, unknown>} */
  const picklists = {};
  /** @type {Record<string, unknown>} */
  const multiSelects = {};
  const seenCombo = new Set();
  const seenMulti = new Set();

  // Start at top of form
  await page
    .evaluate(() => {
      for (const el of document.querySelectorAll(
        '.slds-modal__content, .modal-body, .actionBody, .record-body-container',
      )) {
        if (el instanceof HTMLElement) el.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    })
    .catch(() => {});
  await page.waitForTimeout(400);

  for (let pass = 0; pass < 10; pass++) {
    // ----- Combobox picklists visible in this viewport -----
    const combos = page.getByRole('combobox');
    const comboCount = await combos.count();

    for (let i = 0; i < comboCount; i++) {
      const combo = combos.nth(i);
      if (!(await combo.isVisible().catch(() => false))) continue;

      const inDual = await combo
        .evaluate((el) => !!el.closest('lightning-dual-listbox, .slds-dueling-list'))
        .catch(() => false);
      if (inDual) continue;

      const label = await getComboboxLabel(combo);
      if (!label || seenCombo.has(label) || isSkippableComboLabel(label)) continue;
      seenCombo.add(label);

      console.log(`  Reading picklist: ${label}`);
      try {
        const result = await readOpenCombobox(page, combo, label);
        if (result.type === 'lookup') {
          picklists[label] = 'lookup';
          console.log(`    → lookup`);
        } else if (result.values.length) {
          if (result.type === 'multi-select-combobox') {
            multiSelects[label] = result.values;
            console.log(`    → multi-select ${result.values.length} value(s)`);
          } else {
            picklists[label] = result.values;
            console.log(`    → ${result.values.length} value(s)`);
          }
          console.log(`       sample: ${result.values.slice(0, 5).join(' | ')}`);
        } else {
          picklists[label] = result.type;
          console.log(`    → ${result.type}`);
        }
      } catch (err) {
        picklists[label] = { error: err instanceof Error ? err.message : String(err) };
        console.log(`    → error: ${(err instanceof Error ? err.message : String(err)).split('\n')[0]}`);
      }
      await dismissOpenDropdowns(page);
    }

    // ----- Dual-listbox / multi-selects visible in this viewport -----
    const items = page.locator('records-record-layout-item');
    const itemCount = await items.count();
    for (let i = 0; i < itemCount; i++) {
      const item = items.nth(i);
      if (!(await item.isVisible().catch(() => false))) continue;

      const hasDual =
        (await item.locator('lightning-dual-listbox, .slds-dueling-list').count().catch(() => 0)) > 0;
      const hasMove =
        (await item
          .getByRole('button', { name: /Move selection|Move to Chosen|Move to Available/i })
          .count()
          .catch(() => 0)) > 0;
      const lbCount = await item.locator('[role="listbox"]').count().catch(() => 0);
      if (!hasDual && !hasMove && lbCount < 2) continue;

      const labelEl = item.locator('label, legend, .slds-form-element__label').first();
      const label = cleanLabel((await labelEl.innerText().catch(() => '')) || '');
      if (!label || DUAL_COLUMN_LABELS.has(label.toLowerCase()) || seenMulti.has(label)) continue;
      seenMulti.add(label);

      console.log(`  Reading multi-select: ${label}`);
      try {
        const result = await readDualFromRoot(item, page);
        multiSelects[label] = result;
        console.log(`    → ${result.values.length} value(s)`);
        if (result.values.length) {
          console.log(`       sample: ${result.values.slice(0, 5).join(' | ')}`);
        }
      } catch (err) {
        multiSelects[label] = { error: err instanceof Error ? err.message : String(err) };
        console.log(`    → error: ${(err instanceof Error ? err.message : String(err)).split('\n')[0]}`);
      }
    }

    // Also standalone lightning-dual-listbox
    const duals = page.locator('lightning-dual-listbox');
    const dualCount = await duals.count();
    for (let i = 0; i < dualCount; i++) {
      const dual = duals.nth(i);
      if (!(await dual.isVisible().catch(() => false))) continue;
      let label = cleanLabel(
        (await dual.getAttribute('label').catch(() => '')) ||
          (await dual.getAttribute('aria-label').catch(() => '')) ||
          '',
      );
      if (!label) {
        label = cleanLabel(
          (await dual.locator('label, legend').first().innerText().catch(() => '')) || '',
        );
      }
      if (!label || DUAL_COLUMN_LABELS.has(label.toLowerCase()) || seenMulti.has(label)) continue;
      seenMulti.add(label);

      console.log(`  Reading multi-select: ${label}`);
      try {
        const result = await readDualFromRoot(dual, page);
        multiSelects[label] = result;
        console.log(`    → ${result.values.length} value(s)`);
        if (result.values.length) {
          console.log(`       sample: ${result.values.slice(0, 5).join(' | ')}`);
        }
      } catch (err) {
        multiSelects[label] = { error: err instanceof Error ? err.message : String(err) };
        console.log(`    → error`);
      }
    }

    await scrollFormDown(page);
  }

  console.log(
    `\nCollected picklists=${Object.keys(picklists).length}, multiSelects=${Object.keys(multiSelects).length}`,
  );

  const all = {
    ...Object.fromEntries(
      Object.entries(picklists).map(([k, v]) => [
        k,
        Array.isArray(v)
          ? { type: 'picklist', values: v }
          : { type: typeof v === 'string' ? v : 'error', values: [], detail: v },
      ]),
    ),
    ...Object.fromEntries(
      Object.entries(multiSelects).map(([k, v]) => {
        if (Array.isArray(v)) return [k, { type: 'multi-select', values: v }];
        if (v && typeof v === 'object' && Array.isArray(v.values)) {
          return [k, { type: 'multi-select', values: v.values, available: v.available, chosen: v.chosen }];
        }
        return [k, { type: 'multi-select', values: [], detail: v }];
      }),
    ),
  };

  return { picklists, multiSelects, radios: {}, checkboxGroups: {}, otherFields: {}, all };
}

function writePicklistsJson(picklistsOrBundle, outPath) {
  const filePath = outPath || path.resolve(__dirname, '..', 'data', 'lead-picklists.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(picklistsOrBundle, null, 2)}\n`, 'utf8');
  return filePath;
}

function flattenToRows(picklistsOrBundle) {
  const rows = [];
  const pushValues = (field, type, values) => {
    if (Array.isArray(values) && values.length) {
      for (const v of values) rows.push({ Field: field, Type: type, Value: v });
    } else {
      rows.push({ Field: field, Type: type, Value: '' });
    }
  };

  const bundle = /** @type {any} */ (picklistsOrBundle);
  if (bundle && (bundle.picklists || bundle.multiSelects)) {
    for (const [field, value] of Object.entries(bundle.picklists || {})) {
      if (Array.isArray(value)) pushValues(field, 'picklist', value);
      else if (value && typeof value === 'object' && value.error) {
        rows.push({ Field: field, Type: 'picklist', Value: `ERROR: ${String(value.error).split('\n')[0]}` });
      } else {
        rows.push({ Field: field, Type: String(value), Value: '' });
      }
    }
    for (const [field, value] of Object.entries(bundle.multiSelects || {})) {
      if (Array.isArray(value)) pushValues(field, 'multi-select', value);
      else if (value && typeof value === 'object' && Array.isArray(value.values)) {
        pushValues(field, 'multi-select', value.values);
      } else if (value && typeof value === 'object' && value.error) {
        rows.push({ Field: field, Type: 'multi-select', Value: `ERROR: ${String(value.error).split('\n')[0]}` });
      } else {
        rows.push({ Field: field, Type: 'multi-select', Value: '' });
      }
    }
    return rows;
  }
  return rows;
}

function writePicklistsExcel(picklistsOrBundle, outPath) {
  const filePath = outPath || path.resolve(__dirname, '..', 'data', 'lead-picklists.xlsx');
  const rows = flattenToRows(picklistsOrBundle);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Field: '', Type: '', Value: '' }]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lead Picklists');
  XLSX.writeFile(wb, filePath);
  return filePath;
}

module.exports = {
  openNewLeadForm,
  collectLeadFormPicklists,
  writePicklistsJson,
  writePicklistsExcel,
  LOOKUP_LABELS,
};
