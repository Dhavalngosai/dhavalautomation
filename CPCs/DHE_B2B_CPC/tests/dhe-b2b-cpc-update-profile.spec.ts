/**
 * DHE B2B CPC (Customer Preference Center) QA Cloud Page:
 * open preference URL → change Country code → Save (My Profile).
 *
 * Run from this folder (DHE_B2B_CPC):
 *   npm test
 *   npm run test:headed
 *   run-dhe-b2b-cpc-update-profile.bat
 *   run-dhe-b2b-cpc-update-profile.bat --headed
 *
 * Required in .env (optional if DEFAULT_URL below is still valid):
 *   DHE_B2B_CPC_URL – full Cloud Page URL including the URL token… (from the SFMC email link)
 *
 * Optional:
 *   DHE_B2B_CPC_COUNTRY_CODE – phone dial code, e.g. +971 (default +971)
 *   DHE_B2B_CPC_LOCATOR_TIMEOUT_MS – default 30000
 *
 * Notes:
 *   - The URL token is subscriber-specific and can expire; paste a fresh link when needed.
 *   - DHE B2B has no Nationality field (unlike consumer CPCs).
 */
import { expect, test } from '@playwright/test';

const DEFAULT_URL =
  'https://cloud.sales.dhentertainment.ae/DHE_B2B_CPC?qs=ABB7InYiOjEsImQiOjQ5NTF9ADMAAAAAAJnCTVLiIp3SnhzaftI0FoBXU1ue5OfsVEHLspRd8v1VTF__NNoNkadoUCfvOxoW44jJBgouTH3TqgLDZJMcsHm3i6_NtncqSzT-ujViFid8FejhrrVXFGDWi26gmJcJBKZmGEsfGiWsvN-XqJI';

const cpcUrl = (process.env.DHE_B2B_CPC_URL || DEFAULT_URL).trim();
const countryCode = (process.env.DHE_B2B_CPC_COUNTRY_CODE || '+971').trim();

const rawLocatorMs = Number(process.env.DHE_B2B_CPC_LOCATOR_TIMEOUT_MS);
const locatorTimeoutMs = Number.isFinite(rawLocatorMs) && rawLocatorMs > 0 ? rawLocatorMs : 30_000;
const untilVisible = { timeout: locatorTimeoutMs };

test.describe('DHE B2B CPC – update Country code', () => {
  test('change Country code, then Save', async ({ page }) => {
    test.setTimeout(120_000);
    test.skip(!cpcUrl, 'Set DHE_B2B_CPC_URL in .env to the full Cloud Page link (including the URL token).');

    await page.setDefaultTimeout(locatorTimeoutMs);

    await test.step('Open DHE B2B CPC Cloud Page', async () => {
      await page.goto(cpcUrl, { waitUntil: 'domcontentloaded' });
      await page.locator('#my-profile-tab').waitFor({ state: 'visible', ...untilVisible });
      await page.locator('#country-code').waitFor({ state: 'visible', ...untilVisible });
      await page.locator('#profileCountry').waitFor({ state: 'attached', ...untilVisible });
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
    });
  });
});
