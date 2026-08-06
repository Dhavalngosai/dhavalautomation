/**
 * TGP Live CPC – smoke: open preference URL → change Country code + Nationality → Save (My Profile).
 *
 * Run from this folder (TGP_CPC):
 *   npm run test:smoke
 *   npm run test:smoke:headed
 *   run-tgp-cpc-update-profile.bat
 *   run-tgp-cpc-update-profile.bat --headed
 *
 * Required in .env (optional if DEFAULT_URL below is still valid):
 *   TGP_CPC_URL – full Cloud Page URL including qs=… (from the SFMC email link)
 *
 * Optional:
 *   TGP_CPC_COUNTRY_CODE – phone dial code, e.g. +971 (default +971)
 *   TGP_CPC_NATIONALITY – nationality option label, e.g. India (default India)
 *   TGP_CPC_LOCATOR_TIMEOUT_MS – default 30000
 *
 * Notes:
 *   - The qs token is subscriber-specific and can expire; paste a fresh link when needed.
 *   - Country code is #country-code (phone dial list). Nationality is #nationality.
 */
import { expect, test } from '@playwright/test';

const DEFAULT_URL =
  'https://cloud.explore.thegreenplanetdubai.com/CPC_TGP?qs=ABB7InYiOjEsImQiOjQ5Mzd9ADMAAAAAAIYL096FCn0w5steArNJi-I8UvW2jsT6hNWQJTGc1ky8fk6pD7rp_RAcuE340z98fuwgJBgMmSYadBbCDZksdf1aE2tlaqYli0tfJRkLnTgn9Puql82jWzVH0GnZAiIdEgn_SLMkCOumW5jTZgI&utm_source=sfmc&utm_medium=email&utm_campaign=Sanity+Test+Email&utm_term=%%%3dRedirectTo(CloudPagesURL(2754))%3d%%&utm_EmailName=Sanity+Test+Email&Platform_Source=TGP&Date=7/14/2026&utm_id=499177&sfmc_id=116255438';

const cpcUrl = (process.env.TGP_CPC_URL || DEFAULT_URL).trim();
const countryCode = (process.env.TGP_CPC_COUNTRY_CODE || '+971').trim();
const nationality = (process.env.TGP_CPC_NATIONALITY || 'India').trim();

const rawLocatorMs = Number(process.env.TGP_CPC_LOCATOR_TIMEOUT_MS);
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
      `Nationality option "${label}" not found in #nationality. Set TGP_CPC_NATIONALITY to an exact option label.`
    );
  }

  const value = await option.first().getAttribute('value');
  if (!value) {
    throw new Error(`Nationality option "${label}" has no value attribute.`);
  }

  await nationalitySelect.selectOption({ value });
  await expect(nationalitySelect).toHaveValue(value, untilVisible);
}

test.describe('TGP Live CPC – update Country code & Nationality', () => {
  test('change Country code and Nationality, then Save', async ({ page }) => {
    test.setTimeout(120_000);
    test.skip(!cpcUrl, 'Set TGP_CPC_URL in .env to the full Cloud Page link (including qs=).');

    await page.setDefaultTimeout(locatorTimeoutMs);

    await test.step('Open TGP Live CPC Cloud Page', async () => {
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

    await test.step(`Set Nationality to ${nationality}`, async () => {
      await selectNationality(page, nationality);
    });

    await test.step('Click Save on My Profile', async () => {
      const saveBtn = page.locator('#profile-submit');
      await saveBtn.waitFor({ state: 'visible', ...untilVisible });
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
