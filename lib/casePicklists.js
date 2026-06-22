/**
 * Read all picklist option labels from the Lightning Case new-record form.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { openNewCaseForm, fillAccountLookup } = require('./caseForm');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { scrollIntoView, scrollAndClick, scrollRecordForm } = require('./waitHelpers');

/** Labels that behave as lookups (search-driven), not static picklists. */
const LOOKUP_LABELS = new Set(['Account Name', 'Contact Name', 'Parent Case']);

/** Parent → child dependent picklist pairs on the Case form. */
const DEPENDENT_PAIRS = [
  { parent: 'Asset', child: 'Sub Asset' },
  { parent: 'Area', child: 'Sub Area' },
];

/** Prerequisite selections to unlock dependent picklists. */
const PREREQUISITE_ACCOUNT =
  process.env.SALESFORCE_CASE_PICKLIST_ACCOUNT?.trim() || 'Dhaval Gosai';

const DPR_ASSET =
  process.env.SALESFORCE_CASE_PICKLIST_DPR_ASSET?.trim() || 'Dubai Parks™ and Resorts';

const RIVERLAND_SUB_ASSET =
  process.env.SALESFORCE_CASE_PICKLIST_SUB_ASSET_RIVERLAND?.trim() || 'Riverland™ Dubai';

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function readOpenListboxOptions(page) {
  const listbox = page.locator('[role="listbox"]:visible').last();
  const visible = await listbox.isVisible({ timeout: 8_000 }).catch(() => false);
  if (!visible) return [];

  const optionLoc = listbox.locator('[role="option"], lightning-base-combobox-item, .slds-listbox__option');
  const count = await optionLoc.count();
  const labels = [];

  for (let i = 0; i < count; i++) {
    const text = (await optionLoc.nth(i).innerText()).replace(/\s+/g, ' ').trim();
    if (text) labels.push(text);
  }

  return [...new Set(labels)];
}

/**
 * @param {import('@playwright/test').Locator} combo
 */
async function getComboboxLabel(combo) {
  const aria = await combo.getAttribute('aria-label');
  if (aria?.trim()) return aria.trim();

  const labelledBy = await combo.getAttribute('aria-labelledby');
  if (labelledBy) {
    const ids = labelledBy.split(/\s+/).filter(Boolean);
    for (const id of ids) {
      const text = await combo
        .page()
        .locator(`#${CSS.escape(id)}`)
        .textContent()
        .catch(() => null);
      if (text?.trim()) return text.replace(/\s+/g, ' ').trim();
    }
  }

  return (await combo.getAttribute('name'))?.trim() || '(unknown field)';
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string | RegExp} label
 */
function comboboxForLabel(page, label) {
  if (label instanceof RegExp) {
    return page.getByRole('combobox', { name: label }).first();
  }
  return page.getByRole('combobox', { name: label, exact: true }).first();
}

/**
 * @param {import('@playwright/test').Locator} combo
 */
async function isComboboxEnabled(combo) {
  const ariaDisabled = await combo.getAttribute('aria-disabled');
  if (ariaDisabled === 'true') return false;
  return combo.isEnabled().catch(() => false);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function scrollFormToLoadFields(page) {
  await scrollRecordForm(page);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function listVisibleComboboxes(page) {
  await scrollFormToLoadFields(page);

  const combos = page.getByRole('combobox');
  const count = await combos.count();
  const fields = [];

  for (let i = 0; i < count; i++) {
    const combo = combos.nth(i);
    if (!(await combo.isVisible().catch(() => false))) continue;

    const label = await getComboboxLabel(combo);
    fields.push({ label, combo });
  }

  const seen = new Set();
  return fields.filter((f) => {
    if (seen.has(f.label)) return false;
    seen.add(f.label);
    return true;
  });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} value
 */
async function clickListboxOption(page, value) {
  const valueRe = new RegExp(`^${escapeRe(value)}$`, 'i');
  const pickers = [
    page.getByRole('option', { name: valueRe }).first(),
    page.locator('[role="listbox"]:visible [role="option"]').filter({ hasText: valueRe }).first(),
    page.locator('lightning-base-combobox-item').filter({ hasText: valueRe }).first(),
  ];

  for (const loc of pickers) {
    if (await loc.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await scrollAndClick(loc);
      await page.keyboard.press('Escape').catch(() => {});
      return true;
    }
  }

  return false;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string | RegExp} label
 * @param {string} value
 */
async function selectComboboxOption(page, label, value) {
  const combo = comboboxForLabel(page, label);
  await scrollAndClick(combo, { timeout: 10_000 });
  await page.waitForTimeout(500);

  const picked = await clickListboxOption(page, value);
  if (!picked) {
    throw new Error(`Could not select "${value}" for ${String(label)}`);
  }

  await page.waitForTimeout(1_000);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string | RegExp} label
 */
async function selectFirstPicklistOption(page, label) {
  const combo = comboboxForLabel(page, label);
  if (!(await combo.isVisible({ timeout: 3_000 }).catch(() => false))) return false;
  if (!(await isComboboxEnabled(combo))) return false;

  await scrollIntoView(combo);

  const current = await readEnabledPicklistValues(page, label);
  const first = current.values.find((v) => v && v !== '--None--');
  if (!first) return false;

  await selectComboboxOption(page, label, first);
  return true;
}

/**
 * Unlock Area / Sub Area by selecting Dubai Parks + Riverland™ Dubai.
 * @param {import('@playwright/test').Page} page
 */
async function applyRiverlandPrerequisites(page) {
  if (PREREQUISITE_ACCOUNT) {
    await fillAccountLookup(page, PREREQUISITE_ACCOUNT).catch(() => {});
    await page.waitForTimeout(1_500);
  }

  await selectComboboxOption(page, 'Asset', DPR_ASSET);
  await page.waitForTimeout(1_000);
  await selectComboboxOption(page, 'Sub Asset', RIVERLAND_SUB_ASSET);
  await page.waitForTimeout(1_500);
}

/**
 * Area → Sub Area options when Sub Asset is Riverland™ Dubai.
 * @param {import('@playwright/test').Page} page
 */
async function collectAreaAndSubAreaForRiverland(page) {
  await applyRiverlandPrerequisites(page);

  const areaResult = await readEnabledPicklistValues(page, 'Area');
  const areas = areaResult.values.filter((v) => v && v !== '--None--');

  const areaEntry = areas.length ? areas : areaResult.type;
  const subAreaByArea = {};

  for (const area of areas) {
    try {
      await selectComboboxOption(page, 'Area', area);
      await page.waitForTimeout(800);
      const subResult = await readEnabledPicklistValues(page, 'Sub Area');
      subAreaByArea[area] = subResult.values.length ? subResult.values : subResult.type;
    } catch (err) {
      subAreaByArea[area] = { error: err instanceof Error ? err.message : String(err) };
    }
  }

  return {
    areas: { [RIVERLAND_SUB_ASSET]: areaEntry },
    subAreas: { [RIVERLAND_SUB_ASSET]: subAreaByArea },
  };
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string | RegExp} label
 */
async function readEnabledPicklistValues(page, label) {
  if (typeof label === 'string' && LOOKUP_LABELS.has(label)) {
    return { type: 'lookup', values: [] };
  }

  const combo = comboboxForLabel(page, label);
  if (!(await combo.isVisible({ timeout: 3_000 }).catch(() => false))) {
    return { type: 'not-visible', values: [] };
  }

  if (!(await isComboboxEnabled(combo))) {
    return { type: 'dependent-disabled', values: [] };
  }

  await scrollAndClick(combo, { timeout: 10_000 });
  await page.waitForTimeout(600);

  const values = await readOpenListboxOptions(page);
  await page.keyboard.press('Escape').catch(() => {});

  return {
    type: values.length ? 'picklist' : 'empty',
    values,
  };
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} parentLabel
 * @param {string} childLabel
 * @param {string[]} parentValues
 */
async function collectDependentPicklistMap(page, parentLabel, childLabel, parentValues) {
  const childField = {};
  const parents = parentValues.filter((v) => v && v !== '--None--');

  for (const parent of parents) {
    try {
      await selectComboboxOption(page, parentLabel, parent);
      const child = await readEnabledPicklistValues(page, childLabel);
      childField[parent] = child.values.length ? child.values : child.type;
    } catch (err) {
      childField[parent] = { error: err instanceof Error ? err.message : String(err) };
    }
  }

  return childField;
}

/**
 * Case Type / Sub Type depend on Account + Asset (+ Sub Asset). Collect per asset.
 * @param {import('@playwright/test').Page} page
 * @param {string[]} assetValues
 */
async function collectCaseTypeAndSubTypeByAsset(page, assetValues) {
  const caseTypesByAsset = {};
  const subTypesByAssetAndCaseType = {};
  const assets = assetValues.filter((v) => v && v !== '--None--');

  if (PREREQUISITE_ACCOUNT) {
    await fillAccountLookup(page, PREREQUISITE_ACCOUNT).catch(() => {});
    await page.waitForTimeout(1_500);
  }

  for (const asset of assets) {
    try {
      await selectComboboxOption(page, 'Asset', asset);
      await selectFirstPicklistOption(page, 'Sub Asset').catch(() => {});
      await page.waitForTimeout(1_000);

      const caseTypeResult = await readEnabledPicklistValues(page, 'Case Type');
      const caseTypes = caseTypeResult.values.filter((v) => v && v !== '--None--');
      caseTypesByAsset[asset] = caseTypeResult.values.length ? caseTypeResult.values : caseTypeResult.type;

      const subTypeMap = {};
      for (const caseType of caseTypes) {
        await selectComboboxOption(page, 'Case Type', caseType);
        await page.waitForTimeout(800);
        const subTypeResult = await readEnabledPicklistValues(page, 'Sub Type');
        subTypeMap[caseType] = subTypeResult.values.length ? subTypeResult.values : subTypeResult.type;
      }
      if (Object.keys(subTypeMap).length) {
        subTypesByAssetAndCaseType[asset] = subTypeMap;
      }
    } catch (err) {
      caseTypesByAsset[asset] = { error: err instanceof Error ? err.message : String(err) };
    }
  }

  return { caseTypesByAsset, subTypesByAssetAndCaseType };
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} lightningHome
 * @param {{ sfReadyMs?: number, untilVisible?: { timeout: number } }} [opts]
 */
async function collectCaseFormPicklists(page, lightningHome, opts = {}) {
  await openNewCaseForm(page, lightningHome, opts);

  const formRoot = page.locator('records-record-layout-item, records-lwc-record-layout').first();
  await formRoot.waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {});

  const fields = await listVisibleComboboxes(page);
  const childLabels = new Set([
    ...DEPENDENT_PAIRS.map((p) => p.child),
    'Case Type',
    'Sub Type',
  ]);
  const picklists = {};

  for (const { label } of fields) {
    if (childLabels.has(label)) continue;

    try {
      const result = await readEnabledPicklistValues(page, label);
      if (result.type === 'lookup') {
        picklists[label] = 'lookup';
      } else if (result.values.length) {
        picklists[label] = result.values;
      } else {
        picklists[label] = result.type;
      }
    } catch (err) {
      picklists[label] = { error: err instanceof Error ? err.message : String(err) };
    }
  }

  for (const { parent, child } of DEPENDENT_PAIRS) {
    if (parent === 'Asset') {
      if (!Array.isArray(picklists[parent]) || picklists[parent].length === 0) {
        const direct = await readEnabledPicklistValues(page, child);
        picklists[child] = direct.values.length ? direct.values : direct.type;
        continue;
      }
      picklists[child] = await collectDependentPicklistMap(
        page,
        parent,
        child,
        picklists[parent],
      );
      continue;
    }

    if (parent === 'Area') {
      const { areas, subAreas } = await collectAreaAndSubAreaForRiverland(page);
      picklists.Area = areas;
      picklists['Sub Area'] = subAreas;
    }
  }

  const assetValues = picklists.Asset;
  if (Array.isArray(assetValues)) {
    const { caseTypesByAsset, subTypesByAssetAndCaseType } =
      await collectCaseTypeAndSubTypeByAsset(page, assetValues);
    picklists['Case Type'] = caseTypesByAsset;
    picklists['Sub Type'] = subTypesByAssetAndCaseType;
  }

  return picklists;
}

/**
 * @param {Record<string, unknown>} picklists
 * @param {string} [outPath]
 */
function writePicklistsJson(picklists, outPath) {
  const filePath =
    outPath ||
    path.join(process.cwd(), 'data', 'case-picklists.json');

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(picklists, null, 2)}\n`, 'utf8');
  return filePath;
}

module.exports = {
  collectCaseFormPicklists,
  writePicklistsJson,
  readOpenListboxOptions,
  listVisibleComboboxes,
};
