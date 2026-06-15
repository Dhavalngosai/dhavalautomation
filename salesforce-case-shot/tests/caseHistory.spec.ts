import { test } from '@playwright/test';
import * as XLSX from 'xlsx';
import fs from 'fs';

test.describe('Salesforce Case History Screenshots - Skip Missing History', () => {

  test.setTimeout(10 * 60 * 1000);

  test('Take screenshots for case list', async ({ page }) => {

    // ==================================
    // CONFIG
    // ==================================
    const USERNAME = 'dgosai@horizontal.com.uat';
    const PASSWORD = 'Dhaval@123456';

    const BASE_URL =
      'https://dhe-org2--uat.sandbox.my.salesforce.com/';

    const CASE_LIST_URL =
      'https://dhe-org2--uat.sandbox.lightning.force.com/lightning/o/Case/list/?filterName=AllOpenCases';

    const EXCEL_PATH =
      './data/cases.xlsx';

    const SCREENSHOT_FOLDER =
      'C:\\Users\\dgosai\\dngautomation\\salesforce-case-shot\\screenshots';

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
        // OPEN CASE
        // ==========================
        await page.getByText(caseNo, { exact: true }).first().click();

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
          await page.goto(CASE_LIST_URL);
          await page.waitForTimeout(5000);
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
          path: `${SCREENSHOT_FOLDER}\\${caseNo}.png`,
          fullPage: true
        });

        console.log(`Saved: ${caseNo}.png`);

      } catch (error) {
        console.log(`Failed: ${caseNo}`);
      }

      // ==========================
      // RETURN TO CASE LIST
      // ==========================
      await page.goto(CASE_LIST_URL);
      await page.waitForTimeout(5000);
    }

  });

});