/**
 * Roxy Live CPC – Nationality (UAE residents only): select each value → Save → comparison table.
 *
 * Run:
 *   npm test -- tests/nationality.spec.js
 *   run-roxy-nationality.bat
 *
 * Env:
 *   ROXY_CPC_URL
 *   ROXY_CPC_NATIONALITY_LIMIT / ROXY_CPC_FIELD_LIMIT (optional batch size)
 *   ROXY_CPC_NATIONALITY_OFFSET / ROXY_CPC_FIELD_OFFSET (optional batch start)
 */
const { expect, test } = require('@playwright/test');
const { attachComparisonReport } = require('../lib/comparisonReport');
const { formatRangeLabel, getFieldRange, sliceFieldItems } = require('../lib/fieldRange');
const {
  clickProfileSave,
  ensureUaeCountryOfResidence,
  getNationalities,
  getSelectedNationalityLabel,
  openMyProfile,
  setNationalityByLabel,
} = require('../lib/profileFields');
const { getRoxyCpcUrl } = require('../lib/roxyCpcConfig');

const cpcUrl = getRoxyCpcUrl();
const { limit, offset } = getFieldRange(
  'ROXY_CPC_NATIONALITY_LIMIT',
  'ROXY_CPC_NATIONALITY_OFFSET',
  'ROXY_CPC_FIELD_LIMIT',
  'ROXY_CPC_FIELD_OFFSET'
);

test.describe('Roxy Live CPC – Nationality (UAE Residents only)', () => {
  test('select and save each nationality', async ({ page }, testInfo) => {
    test.setTimeout(0);
    test.skip(!cpcUrl, 'Set ROXY_CPC_URL in .env to the full Cloud Page link (including qs=).');

    await openMyProfile(page, cpcUrl);
    await ensureUaeCountryOfResidence(page);

    const allNationalities = await getNationalities(page);
    expect(allNationalities.length).toBeGreaterThan(0);

    const nationalitiesToRun = sliceFieldItems(allNationalities, offset, limit);
    const rangeLabel = formatRangeLabel(offset, limit, allNationalities.length);
    console.log(
      `Found ${allNationalities.length} nationalities. Running ${rangeLabel} (${nationalitiesToRun.length} values)...`
    );

    const comparisonTable = [];

    for (let i = 0; i < nationalitiesToRun.length; i++) {
      const { label } = nationalitiesToRun[i];

      await test.step(`[${offset + i + 1}/${allNationalities.length}] Nationality ${label}`, async () => {
        let previousLabel = 'Empty';
        let newLabel = 'Empty';
        let saveStatus = 'Not Attempted';
        let result = 'Failed';

        try {
          await page.locator('#nationality').waitFor({ state: 'attached', timeout: 15_000 });
          await ensureUaeCountryOfResidence(page);

          previousLabel = await getSelectedNationalityLabel(page);
          await setNationalityByLabel(page, label);
          await page.waitForTimeout(100);
          newLabel = await getSelectedNationalityLabel(page);

          saveStatus = await clickProfileSave(page);
          newLabel = await getSelectedNationalityLabel(page).catch(() => newLabel);
          result = newLabel === label ? 'Success' : 'Mismatch';
        } catch (err) {
          saveStatus = 'Error During Save';
          result = 'Failed';
          console.error(`[Error] Nationality "${label}":`, err.message);
        }

        comparisonTable.push({
          Iteration: `[${offset + i + 1}/${allNationalities.length}]`,
          'Target Nationality': label,
          'Original Label (Before Change)': previousLabel,
          'New Label (After Change)': newLabel,
          'Save Status': saveStatus,
          Result: result,
        });

        if (i < nationalitiesToRun.length - 1) {
          await openMyProfile(page, cpcUrl).catch(async () => {
            await page.goto(cpcUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => undefined);
          });
          await ensureUaeCountryOfResidence(page);
        }
      });
    }

    await attachComparisonReport(
      testInfo,
      comparisonTable,
      `Nationality Value Comparison Summary (${rangeLabel})`
    );

    const failures = comparisonTable.filter((row) => row.Result !== 'Success');
    expect(failures, `Nationality failures:\n${JSON.stringify(failures, null, 2)}`).toEqual([]);
  });
});
