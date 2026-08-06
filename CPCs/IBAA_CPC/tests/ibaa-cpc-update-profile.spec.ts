/**
 * IBAA CPC (Customer Preference Center) QA Cloud Page:
 * open preference URL → change Country code + Nationality → Save (My Profile).
 *
 * Run from this folder (IBAA_CPC):
 *   npm test
 *   npm run test:headed
 *   run-ibaa-cpc-update-profile.bat
 *   run-ibaa-cpc-update-profile.bat --headed
 *
 * Required in .env (optional if DEFAULT_URL below is still valid):
 *   IBAA_CPC_URL – full Cloud Page URL including qs=… (from the SFMC email link)
 *
 * Optional:
 *   IBAA_CPC_COUNTRY_CODE – phone dial code, e.g. +971 (default +971)
 *   IBAA_CPC_NATIONALITY – nationality option label, e.g. India (default India)
 *   IBAA_CPC_LOCATOR_TIMEOUT_MS – default 30000
 *
 * Notes:
 *   - The qs token is subscriber-specific and can expire; paste a fresh link when needed.
 *   - Nationality is enabled only when Country of Residence is United Arab Emirates.
 */
import { expect, test } from '@playwright/test';
import { ensureUaeCountryOfResidence } from '../lib/profileFields.js';

const DEFAULT_URL =
  'https://cloud.explore.insideburjalarab.com/CPC_IBAA?qs=ABB7InYiOjEsImQiOjQ5NTF9ADMAAAAAAJjwRIgdaVCzxOP6d3Pkc7IqXEgUE-bDDPAssXYIawm_ZmTuONfFz1bT6fjBu-kkL25nskMAZDSs4CNSS2nAA7EOvADl6Fj5UE6oKgICWQte-63V_5ZhmJkRopdLOmVaOAD-N0IU9szh9XOqEGs&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email+-+Prod&utm_term=%%%3dRedirectTo(CloudPagesURL(3925))%3d%%&utm_EmailName=Sanity+Test+Email+-+Prod&Platform_Source=IBAA&Date=7/28/2026&utm_id=502968&sfmc_id=116255438';

const cpcUrl = (process.env.IBAA_CPC_URL || DEFAULT_URL).trim();
const countryCode = (process.env.IBAA_CPC_COUNTRY_CODE || '+971').trim();
const nationality = (process.env.IBAA_CPC_NATIONALITY || 'India').trim();

const rawLocatorMs = Number(process.env.IBAA_CPC_LOCATOR_TIMEOUT_MS);
const locatorTimeoutMs = Number.isFinite(rawLocatorMs) && rawLocatorMs > 0 ? rawLocatorMs : 30_000;
const untilVisible = { timeout: locatorTimeoutMs };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function selectNationality(page: import('@playwright/test').Page, label: string): Promise<void> {
  const nationalitySelect = page.locator('#nationality');
  await nationalitySelect.waitFor({ state: 'attached', ...untilVisible });

  const option = nationalitySelect.locator('option', { hasText: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`, 'i') });
  const count = await option.count();
  if (count === 0) {
    throw new Error(
      `Nationality option "${label}" not found in #nationality. Set IBAA_CPC_NATIONALITY to an exact option label.`
    );
  }

  const value = await option.first().getAttribute('value');
  if (!value) {
    throw new Error(`Nationality option "${label}" has no value attribute.`);
  }

  await nationalitySelect.selectOption({ value });
  await expect(nationalitySelect).toHaveValue(value, untilVisible);
}

test.describe('IBAA CPC – update Country code & Nationality', () => {
  test('change Country code and Nationality, then Save', async ({ page }) => {
    test.setTimeout(120_000);
    test.skip(!cpcUrl, 'Set IBAA_CPC_URL in .env to the full Cloud Page link (including qs=).');

    await page.setDefaultTimeout(locatorTimeoutMs);

    await test.step('Open IBAA CPC Cloud Page', async () => {
      await page.goto(cpcUrl, { waitUntil: 'domcontentloaded' });
      await page.locator('#my-profile-tab').waitFor({ state: 'visible', ...untilVisible });
      await page.locator('#country-code').waitFor({ state: 'visible', ...untilVisible });
      await page.locator('#nationality').waitFor({ state: 'attached', ...untilVisible });
    });

    await test.step('Ensure My Profile tab is active', async () => {
      const profileTab = page.locator('#my-profile-tab');
      await profileTab.click();
      await expect(page.locator('#country-code')).toBeVisible(untilVisible);
    });

    await test.step(`Set Country code to ${countryCode}`, async () => {
      const codeInput = page.locator('#country-code');
      await codeInput.click();
      await codeInput.fill('');
      await codeInput.fill(countryCode);
      await expect(codeInput).toHaveValue(countryCode, untilVisible);
    });

    await test.step('Set Country of Residence to United Arab Emirates (enables Nationality)', async () => {
      await ensureUaeCountryOfResidence(page);
    });

    await test.step(`Set Nationality to ${nationality}`, async () => {
      await selectNationality(page, nationality);
    });

    await test.step('Click Save on My Profile', async () => {
      const saveBtn = page
        .locator('#profile-form button#profile-submit, #my-profile button#profile-submit')
        .or(page.locator('button#profile-submit').locator('visible=true'))
        .or(page.getByRole('button', { name: /^(Save|حفظ)$/ }))
        .first();
      await saveBtn.waitFor({ state: 'visible', ...untilVisible });
      await saveBtn.scrollIntoViewIfNeeded().catch(() => undefined);
      await Promise.all([
        page.waitForLoadState('networkidle', { timeout: 45_000 }).catch(() => undefined),
        saveBtn.click(),
      ]);
    });

    await test.step('Verify values stuck after Save', async () => {
      await page.waitForTimeout(2_000);
      await page.locator('#my-profile-tab').click().catch(() => undefined);
      await expect(page.locator('#country-code')).toHaveValue(countryCode, untilVisible);

      const selectedNationality = await page.locator('#nationality').evaluate((el: HTMLSelectElement) => {
        const opt = el.options[el.selectedIndex];
        return { value: el.value, text: opt?.text?.trim() || '' };
      });
      expect(
        selectedNationality.value === nationality ||
          selectedNationality.text.toLowerCase() === nationality.toLowerCase()
      ).toBeTruthy();
    });
  });
});
