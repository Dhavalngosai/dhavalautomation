import { test, type Page } from '@playwright/test';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

/** Paths relative to salesforce-case-shot/ (works when run from repo root or subfolder). */
const CASE_SHOT_ROOT = path.resolve(__dirname, '..');
const EXCEL_PATH = path.join(CASE_SHOT_ROOT, 'data', 'cases.xlsx');
const SCREENSHOT_FOLDER = path.join(CASE_SHOT_ROOT, 'screenshots');

async function returnToCaseList(page: Page, caseListUrl: string) {
  await page.goto(caseListUrl);
  await page.waitForTimeout(5000);
}

/** After list search, return true if the case row/link is visible. */
async function isCaseInSearchResults(page: Page, caseNo: string) {
  const emptyList = page.getByText(/no items to display|no results|nothing to see here/i);
  if (await emptyList.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
    return false;
  }

  const caseLink = page
    .getByRole('link', { name: caseNo, exact: true })
    .or(page.getByRole('row', { name: new RegExp(caseNo) }).getByRole('link', { name: caseNo, exact: true }));

  return caseLink
    .first()
    .isVisible({ timeout: 8_000 })
    .catch(() => false);
}

test.describe('Salesforce Case History Screenshots - Skip Missing History', () => {

  test.setTimeout(10 * 60 * 1000);

  test('Take screenshots for case list', async ({ page }) => {

    // ==================================
    // CONFIG
    // ==================================
    const USERNAME = 'dgosai@horizontal.com.qa';
    const PASSWORD = 'Dhaval@123456';

    const BASE_URL =
      'https://dhe-org2--qa.sandbox.my.salesforce.com/';

    const CASE_LIST_URL =
      'https://dhe-org2--qa.sandbox.lightning.force.com/lightning/o/Case/list/?filterName=AllOpenCases';

    if (!fs.existsSync(EXCEL_PATH)) {
      throw new Error(`Excel file not found: ${EXCEL_PATH}`);
    }

      
    // ==================================
    // CREATE FOLDER
    // ==================================
    if (!fs.existsSync(SCREENSHOT_FOLDER)) {
      fs.mkdirSync(SCREENSHOT_FOLDER, { recursive: true });
    }

    // ==================================
    // LOGIN
    // ==================================
    await page.goto(BASE_URL);

    await page.getByRole('textbox', { name: 'Username' }).fill(USERNAME);
    await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);

    await page.locator('#Login:visible').click();
    //await page.getByRole('button', { name: /Log In/i }).click();

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(8000);

    // ==================================
    // OPEN CASE LIST
    // ==================================
    await page.goto(CASE_LIST_URL);
    await page.waitForTimeout(5000);

    // ==================================
    // READ EXCEL
    // ==================================
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    console.log('Excel Rows:', rows);

    // ==================================
    // LOOP CASES
    // ==================================
    for (const row of rows) {

      const caseNo =
        String(
          row.CaseNumber ||
          row['Case Number'] ||
          Object.values(row)[0]
        ).trim();

      if (!caseNo || caseNo === 'undefined') {
        console.log('Skipped blank row');
        continue;
      }

      try {
        console.log(`Processing: ${caseNo}`);

        // ==========================
        // SEARCH CASE
        // ==========================
        const searchBox = page.getByRole('searchbox', {
          name: /Search this list/i
        });

        await searchBox.click();
        await searchBox.fill('');
        await searchBox.fill(caseNo);
        await page.keyboard.press('Enter');

        await page.waitForTimeout(4000);

        // ==========================
        // OPEN CASE (skip if not in search results)
        // ==========================
        if (!(await isCaseInSearchResults(page, caseNo))) {
          console.log(`Case not found in search: ${caseNo} - Skipped`);
          await returnToCaseList(page, CASE_LIST_URL);
          continue;
        }

        const caseLink = page
          .getByRole('link', { name: caseNo, exact: true })
          .or(page.getByText(caseNo, { exact: true }));
        await caseLink.first().click();

        await page.waitForTimeout(5000);

        // ==========================
        // RELATED TAB
        // ==========================
        await page.getByRole('tab', { name: 'Related' }).click();

        await page.waitForTimeout(3000);

        // ==========================
        // SCROLL TO FIND HISTORY
        // ==========================
        const historyLink = page.getByRole('link', {
          name: /View All Case History/i
        });

        let found = false;

        for (let i = 0; i < 8; i++) {
          if (await historyLink.isVisible().catch(() => false)) {
            found = true;
            break;
          }

          await page.mouse.wheel(0, 1200);
          await page.waitForTimeout(1500);
        }

        if (!found) {
          console.log(`Case History not found: ${caseNo} - Skipped`);
          await returnToCaseList(page, CASE_LIST_URL);
          continue;
        }

        // ==========================
        // OPEN CASE HISTORY
        // ==========================
        await historyLink.scrollIntoViewIfNeeded();
        await historyLink.click();

        await page.waitForTimeout(5000);

        // ==========================
        // SCREENSHOT
        // ==========================
        await page.screenshot({
          path: path.join(SCREENSHOT_FOLDER, `${caseNo}.png`),
          fullPage: true,
        });

        console.log(`Saved: ${caseNo}.png`);

      } catch (error) {
        const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
        console.log(`Failed: ${caseNo} - ${message}`);
        await returnToCaseList(page, CASE_LIST_URL).catch(() => {});
        continue;
      }

      // ==========================
      // RETURN TO CASE LIST
      // ==========================
      await returnToCaseList(page, CASE_LIST_URL);
    }

  });

});