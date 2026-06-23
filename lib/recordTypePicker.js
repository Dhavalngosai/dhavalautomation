/**
 * Lightning opportunity record-type picker.
 * @param {import('@playwright/test').Page} page
 * @param {{ recordTypeLabel: string, labelForId?: string, radioIndex?: number | null, envHint?: string }} opts
 * @returns {Promise<boolean>} true when the picker was used and caller should click Next
 */
async function selectOpportunityRecordType(page, opts) {
  const { expect } = require('@playwright/test');
  const { waitForSalesforceReady } = require('./waitHelpers');

  const recordTypeLabel = opts.recordTypeLabel.trim();
  const labelForId = (opts.labelForId || '').trim();
  const radioIndex = opts.radioIndex ?? null;
  const envHint = opts.envHint || 'SALESFORCE_OPPORTUNITY_RECORD_TYPE_LABEL';

  await waitForSalesforceReady(page, { timeout: 30_000 });
  await page.waitForLoadState('domcontentloaded').catch(() => {});

  await waitForRecordTypePickerOrFormDom(page, 90_000);

  const opportunityNameField = page
    .getByRole('textbox', { name: /Opportunity Name/i })
    .or(page.locator('lightning-record-edit-form input[name="Name"]'))
    .or(page.getByRole('dialog').locator('input[name="Name"]'));

  const pickerRoot = resolvePickerRoot(page);
  const nameInput = page
    .locator('lightning-record-edit-form input[name="Name"]')
    .or(page.getByRole('dialog').locator('input[name="Name"]'))
    .or(page.locator('input[name="Name"]'));

  const dialog = page.getByRole('dialog').last();

  await expect(pickerRoot.or(nameInput).first()).toBeVisible({ timeout: 15_000 });

  await waitForSalesforceReady(page, { timeout: 15_000 });

  let pickerVisible = await pickerRoot.first().isVisible().catch(() => false);
  const nameVisible = await nameInput.first().isVisible().catch(() => false);
  const dialogRadios = await dialog.locator('input[type="radio"]').count().catch(() => 0);
  const radioCountJs = await page
    .evaluate(() => {
      const dialogs = [...document.querySelectorAll('[role="dialog"]')];
      const d = dialogs.length ? dialogs[dialogs.length - 1] : null;
      return d ? d.querySelectorAll('input[type="radio"]').length : 0;
    })
    .catch(() => 0);
  const dialogHasRecordRadios = dialogRadios > 0 || radioCountJs > 0;

  // Custom element may not report "visible" while radios are already in the dialog — still try selection.
  if (!pickerVisible && dialogHasRecordRadios) {
    pickerVisible = true;
  }

  if (nameVisible && !pickerVisible && !dialogHasRecordRadios) {
    return false;
  }

  if (!pickerVisible && !dialogHasRecordRadios) {
    if (await opportunityNameField.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      return false;
    }
    throw new Error(
      `Expected record-type picker or Opportunity Name (${page.url()}). Set SALESFORCE_LIGHTNING_ORIGIN and verify access.`
    );
  }

  const labelRe = new RegExp(escapeForRegex(recordTypeLabel), 'i');
  const labelExact = new RegExp(`^${escapeForRegex(recordTypeLabel)}$`, 'i');
  const xpathLabel = recordTypeLabel.includes("'")
    ? recordTypeLabel.replace(/'/g, '')
    : recordTypeLabel;

  const tryRobustClick = async (locator, label) => {
    const el = locator.first();
    await el.scrollIntoViewIfNeeded().catch(() => {});
    try {
      await el.click({ timeout: 12_000, force: false });
      return true;
    } catch (e1) {
      try {
        await el.click({ timeout: 12_000, force: true });
        return true;
      } catch (e2) {
        try {
          await el.evaluate((node) => {
            node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
          });
          return true;
        } catch (e3) {
          console.error(`[recordTypePicker] robust click failed for ${label}: ${e2 && e2.message}`);
          return false;
        }
      }
    }
  };

  const scope = (await pickerRoot.first().isVisible().catch(() => false)) ? pickerRoot : dialog;
  await dialog.scrollIntoViewIfNeeded().catch(() => {});

  // Fast path: "New Opportunity" dialog — exact radio / label (e.g. DHE Opportunity)
  const dialogRadioExact = dialog.getByRole('radio', { name: labelExact });
  if (await dialogRadioExact.first().isVisible({ timeout: 6_000 }).catch(() => false)) {
    if (await tryRobustClick(dialogRadioExact, 'dialog radio exact')) return true;
  }

  const dialogLabelExact = dialog.locator('label').filter({ hasText: labelExact });
  if (await dialogLabelExact.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    if (await tryRobustClick(dialogLabelExact, 'dialog label exact')) return true;
  }

  const recordTypeRow = dialog
    .locator('.slds-radio, records-record-type-item, tr')
    .filter({ hasText: labelExact });
  if (await recordTypeRow.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
    if (await tryRobustClick(recordTypeRow, 'record type row exact')) return true;
  }

  // Nth radio in dialog (0-based). DHE Opportunity defaults to index 1 (2nd option after Events).
  if (radioIndex !== null && !Number.isNaN(radioIndex)) {
    const nthRadio = dialog.locator('input[type="radio"]').nth(radioIndex);
    if (await nthRadio.isVisible({ timeout: 5_000 }).catch(() => false)) {
      if (await tryRobustClick(nthRadio, `dialog radio nth(${radioIndex})`)) return true;
    }
    const nthFaux = dialog.locator('span.slds-radio--faux').nth(radioIndex);
    if (await nthFaux.isVisible({ timeout: 5_000 }).catch(() => false)) {
      if (await tryRobustClick(nthFaux, `dialog faux nth(${radioIndex})`)) return true;
    }
  }

  // --- 1) Org-specific: label[for=id] + native radio id (when RT id is known) ---
  if (labelForId) {
    const labelForLocator = dialog.locator(`label[for="${labelForId}"]`).or(page.locator(`label[for="${labelForId}"]`));
    if (await labelForLocator.first().isVisible({ timeout: 4000 }).catch(() => false)) {
      if (await tryRobustClick(labelForLocator, 'label[for]')) return true;
    }

    const radioById = dialog
      .locator(`input[type="radio"][id="${labelForId}"]`)
      .or(page.locator(`input[type="radio"][id="${labelForId}"]`));
    if (await radioById.first().isVisible({ timeout: 4000 }).catch(() => false)) {
      if (await tryRobustClick(radioById, 'input.radio[id]')) return true;
    }

    const labelRadioFaux = dialog
      .locator(`xpath=.//label[@for='${labelForId}']//span[@class='slds-radio--faux']`)
      .or(page.locator(`xpath=//label[@for='${labelForId}']//span[@class='slds-radio--faux']`));
    if (await labelRadioFaux.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      if (await tryRobustClick(labelRadioFaux, 'label for xpath faux')) return true;
    }
  }

  // Relative XPath under the modal: .//span[normalize-space()='Events'] (scoped to dialog)
  const eventsSpanRelativeDialog = dialog.locator(`xpath=.//span[normalize-space()='${xpathLabel}']`);
  if (await eventsSpanRelativeDialog.first().isVisible({ timeout: 6000 }).catch(() => false)) {
    if (await tryRobustClick(eventsSpanRelativeDialog, `dialog .//span[normalize-space()=${xpathLabel}]`)) return true;
  }

  const eventsSpanRelativePicker = pickerRoot.locator(`xpath=.//span[normalize-space()='${xpathLabel}']`);
  if (await eventsSpanRelativePicker.first().isVisible({ timeout: 5000 }).catch(() => false)) {
    if (await tryRobustClick(eventsSpanRelativePicker, `pickerRoot .//span[normalize-space()=${xpathLabel}]`)) return true;
  }

  // --- 2) Nth radio block moved above (fast path) ---

  // Legacy Events org fallback: 3rd radio faux (index 2) — do not use for other record types.
  if (/^events$/i.test(recordTypeLabel)) {
    const fauxThirdInDialog = dialog.locator('span.slds-radio--faux').nth(2);
    if (await fauxThirdInDialog.isVisible({ timeout: 4000 }).catch(() => false)) {
      if (await tryRobustClick(fauxThirdInDialog, 'dialog span.slds-radio--faux nth(2)')) return true;
    }

    const fauxThirdGlobal = page.locator("xpath=(//span[@class='slds-radio--faux'])[3]");
    if (await fauxThirdGlobal.isVisible({ timeout: 4000 }).catch(() => false)) {
      if (await tryRobustClick(fauxThirdGlobal, 'global faux [3]')) return true;
    }
  }

  // --- 3) Standard accessibility / SLDS (picker root or dialog) ---

  const eventsSpanRelativeScope = scope.locator(`xpath=.//span[normalize-space()='${xpathLabel}']`);
  if (await eventsSpanRelativeScope.first().isVisible({ timeout: 5000 }).catch(() => false)) {
    if (await tryRobustClick(eventsSpanRelativeScope, `scope .//span[normalize-space()=${xpathLabel}]`)) return true;
  }

  const radioInPicker = scope.getByRole('radio', { name: labelRe }).first();
  if (await radioInPicker.isVisible({ timeout: 8000 }).catch(() => false)) {
    if (await tryRobustClick(radioInPicker, 'radio name')) return true;
  }

  const radioGlobal = page.getByRole('radio', { name: labelRe }).first();
  if (await radioGlobal.isVisible({ timeout: 3000 }).catch(() => false)) {
    if (await tryRobustClick(radioGlobal, 'radio global')) return true;
  }

  const sldsLabel = scope
    .locator('.slds-radio__label, label.slds-radio__label, label')
    .filter({ hasText: labelRe })
    .first();
  if (await sldsLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
    if (await tryRobustClick(sldsLabel, 'slds label')) return true;
  }

  const recordTypeItem = scope.locator('records-record-type-item').filter({ hasText: labelRe }).first();
  if (await recordTypeItem.isVisible({ timeout: 5000 }).catch(() => false)) {
    if (await tryRobustClick(recordTypeItem, 'records-record-type-item')) return true;
  }

  const row = scope
    .locator('.changeRecordTypeOptionLeftColumn, .slds-radio, tr')
    .filter({ hasText: labelRe })
    .first();
  if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
    if (await tryRobustClick(row, 'row')) return true;
  }

  const labelExactOnly = scope.locator('label').filter({ hasText: labelExact }).first();
  if (await labelExactOnly.isVisible({ timeout: 3000 }).catch(() => false)) {
    if (await tryRobustClick(labelExactOnly, 'label exact')) return true;
  }

  const textTile = scope.getByText(labelExact).or(scope.getByText(labelRe)).first();
  if (await textTile.isVisible({ timeout: 5000 }).catch(() => false)) {
    if (await tryRobustClick(textTile, 'text tile')) return true;
  }

  const faux = scope
    .locator('div:nth-child(5) > .slds-radio > .changeRecordTypeOptionLeftColumn .slds-radio--faux')
    .first();
  if (await faux.isVisible({ timeout: 3000 }).catch(() => false)) {
    if (await tryRobustClick(faux, 'nth-child(5) faux')) return true;
  }

  const eventsSpanAbsolute = page.locator(`xpath=//span[normalize-space()='${xpathLabel}']`);
  if (await eventsSpanAbsolute.first().isVisible({ timeout: 5000 }).catch(() => false)) {
    if (await tryRobustClick(eventsSpanAbsolute, `//span[normalize-space()=${xpathLabel}] (document)`)) return true;
  }

  const domResult = await clickRecordTypeRadioInTopDialog(page, labelForId, recordTypeLabel);
  if (domResult) {
    await waitForSalesforceReady(page, { timeout: 15_000 });
    return true;
  }

  throw new Error(
    `Could not select record type "${recordTypeLabel}". Try ${envHint}, a label-for id, radio index (0-based), or verify the row in the org.`,
  );
}

/** Select Events opportunity record type. */
async function selectOpportunityEventsRecordType(page) {
  const radioIndexEnv = process.env.SALESFORCE_EVENTS_RECORD_TYPE_RADIO_INDEX;
  const radioIndex =
    radioIndexEnv !== undefined && radioIndexEnv !== '' ? parseInt(radioIndexEnv, 10) : null;

  return selectOpportunityRecordType(page, {
    recordTypeLabel: process.env.SALESFORCE_OPPORTUNITY_RECORD_TYPE_LABEL || 'Events',
    labelForId: process.env.SALESFORCE_EVENTS_RECORD_TYPE_LABEL_FOR || '012060000015KAUAA2',
    radioIndex,
    envHint: 'SALESFORCE_OPPORTUNITY_RECORD_TYPE_LABEL / SALESFORCE_EVENTS_RECORD_TYPE_LABEL_FOR',
  });
}

/** Relative XPath under the New Opportunity dialog (same pattern as Events/Education specs). */
function dheRecordTypeXPath() {
  const raw = (
    process.env.SALESFORCE_DHE_RECORD_TYPE_XPATH ||
    process.env.RECORD_TYPE_XPATH ||
    ''
  ).trim();
  if (raw) {
    if (/^\.?\//.test(raw)) return raw;
    const label = raw.replace(/'/g, '');
    return `.//span[normalize-space()='${label}']`;
  }
  const label = (process.env.SALESFORCE_DHE_OPPORTUNITY_RECORD_TYPE_LABEL || 'DHE Opportunity')
    .trim()
    .replace(/'/g, '');
  return `.//span[normalize-space()='${label}']`;
}

/** Select DHE Opportunity record type (2nd option in New Opportunity dialog: Events, DHE Opportunity, …). */
async function selectOpportunityDHERecordType(page) {
  const { waitForSalesforceReady } = require('./waitHelpers');

  await waitForSalesforceReady(page, { timeout: 30_000 });
  await page.waitForLoadState('domcontentloaded').catch(() => {});

  const opportunityNameField = page.getByRole('textbox', { name: /Opportunity Name/i });
  if (await opportunityNameField.isVisible({ timeout: 3000 }).catch(() => false)) {
    return false;
  }

  const dialog = page.getByRole('dialog').last();
  const xpath = dheRecordTypeXPath();
  const dheOption = dialog.locator(`xpath=${xpath}`);
  if (await dheOption.first().isVisible({ timeout: 8000 }).catch(() => false)) {
    await dheOption.first().scrollIntoViewIfNeeded();
    await dheOption.first().click();
    return true;
  }

  const radioIndexEnv = process.env.SALESFORCE_DHE_RECORD_TYPE_RADIO_INDEX;
  const radioIndex =
    radioIndexEnv !== undefined && radioIndexEnv !== '' ? parseInt(radioIndexEnv, 10) : 1;

  return selectOpportunityRecordType(page, {
    recordTypeLabel: process.env.SALESFORCE_DHE_OPPORTUNITY_RECORD_TYPE_LABEL || 'DHE Opportunity',
    labelForId: process.env.SALESFORCE_DHE_RECORD_TYPE_LABEL_FOR || '',
    radioIndex,
    envHint:
      'SALESFORCE_DHE_RECORD_TYPE_XPATH / SALESFORCE_DHE_OPPORTUNITY_RECORD_TYPE_LABEL / SALESFORCE_DHE_RECORD_TYPE_RADIO_INDEX',
  });
}

/**
 * Clicks the native radio in the top-most dialog by id or by label text containing the record type name.
 * @returns {Promise<string|false>} reason string if clicked, false otherwise
 */
async function clickRecordTypeRadioInTopDialog(page, labelForId, labelText) {
  return page.evaluate(
    ({ fid, lt }) => {
      const dialogs = [...document.querySelectorAll('[role="dialog"]')];
      const d = dialogs.length ? dialogs[dialogs.length - 1] : null;
      if (!d) return false;

      if (fid) {
        const byId = d.querySelector(`input[type="radio"][id="${fid}"]`);
        if (byId) {
          byId.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
          byId.checked = true;
          byId.dispatchEvent(new Event('input', { bubbles: true }));
          byId.dispatchEvent(new Event('change', { bubbles: true }));
          return 'radio-by-id';
        }
      }

      const ltLower = (lt || '').toLowerCase();
      const radios = [...d.querySelectorAll('input[type="radio"]')];
      for (const input of radios) {
        const id = input.getAttribute('id');
        let text = '';
        if (id) {
          const lab = d.querySelector(`label[for="${id}"]`);
          if (lab) text = lab.textContent || '';
        }
        if (!text) text = input.getAttribute('aria-label') || '';
        if (text && ltLower && text.toLowerCase().includes(ltLower)) {
          input.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return 'radio-by-label-text';
        }
      }

      return false;
    },
    { fid: labelForId || '', lt: labelText || '' }
  );
}

/**
 * Waits until Lightning has attached the record-type picker, a pipeline picker, or the new-record Name field
 * (main document or same-origin iframe). Avoids racing expect() before LWC renders.
 * @param {import('@playwright/test').Page} page
 * @param {number} timeoutMs
 */
async function waitForRecordTypePickerOrFormDom(page, timeoutMs) {
  const dialogWithRadios = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('radio').first() });
  const recordTypeDialog = page.getByRole('dialog').filter({ hasText: /Select a record type/i });
  const newOppHeading = page.getByRole('heading', { name: /New Opportunity/i });
  const opportunityName = page.getByRole('textbox', { name: /Opportunity Name/i });

  const locatorWaits = [
    recordTypeDialog.first().waitFor({ state: 'visible', timeout: timeoutMs }),
    dialogWithRadios.first().waitFor({ state: 'visible', timeout: timeoutMs }),
    newOppHeading.first().waitFor({ state: 'visible', timeout: timeoutMs }),
    opportunityName.first().waitFor({ state: 'visible', timeout: timeoutMs }),
    page.locator('records-record-type-picker, lightning-record-record-type-picker').first()
      .waitFor({ state: 'attached', timeout: timeoutMs }),
  ];

  let locatorReady = false;
  for (const wait of locatorWaits) {
    try {
      await wait;
      locatorReady = true;
      break;
    } catch {
      /* try next */
    }
  }

  if (locatorReady) return;

  // DOM poll fallback — pass options as 3rd arg (2nd is pageFunction arg).
  await page.waitForFunction(
    () => {
      const q = (root) => {
        if (!root) return false;
        if (root.querySelector('records-record-type-picker')) return true;
        if (root.querySelector('runtime_pipeline_records-record-type-picker')) return true;
        if (root.querySelector('lightning-record-record-type-picker')) return true;
        if (root.querySelector('lightning-record-edit-form input[name="Name"]')) return true;
        const dlg = root.querySelector('[role="dialog"]');
        if (dlg) {
          if (/Select a record type/i.test(dlg.textContent || '')) return true;
          if (dlg.querySelector('input[type="radio"]')) return true;
          if (dlg.querySelector('span.slds-radio--faux')) return true;
          if (dlg.querySelector('input[name="Name"]')) return true;
        }
        const inp = root.querySelector('input[name="Name"]');
        if (inp) {
          const r = inp.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }
        return false;
      };
      if (q(document)) return true;
      const iframes = document.querySelectorAll('iframe');
      for (const f of iframes) {
        try {
          const d = f.contentDocument;
          if (d && q(d)) return true;
        } catch {
          /* cross-origin */
        }
      }
      return false;
    },
    undefined,
    { timeout: timeoutMs },
  );
}

function resolvePickerRoot(page) {
  return page
    .locator('records-record-type-picker')
    .or(page.locator('runtime_pipeline_records-record-type-picker'))
    .or(page.locator('lightning-record-record-type-picker'))
    .or(page.getByRole('dialog').locator('records-record-type-picker, runtime_pipeline_records-record-type-picker'));
}

function escapeForRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  selectOpportunityRecordType,
  selectOpportunityEventsRecordType,
  selectOpportunityDHERecordType,
};
