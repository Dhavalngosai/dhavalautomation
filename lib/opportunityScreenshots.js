const fs = require('fs');
const path = require('path');

function slugify(text) {
  return (
    String(text)
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'stage'
  );
}

function resolveScreenshotRoot() {
  if (process.env.SALESFORCE_STATUS_SCREENSHOT_DIR) {
    return path.resolve(process.env.SALESFORCE_STATUS_SCREENSHOT_DIR);
  }
  return path.resolve(process.cwd(), 'screenshots', 'opportunity-status');
}

/**
 * Save a viewport screenshot when an opportunity stage/status changes.
 * Files: screenshots/opportunity-status/<oppName>/<timestamp>-<stage>.png
 */
async function captureOpportunityStatusScreenshot(page, options) {
  const {
    opportunityName,
    stage,
    waitForSalesforceReady,
    sfReadyMs = 20_000,
    waitForStageText,
    locatorTimeoutMs = 30_000,
  } = options;

  if (waitForSalesforceReady) {
    await waitForSalesforceReady(page, { timeout: sfReadyMs });
  }

  await page.getByText('Saving...').waitFor({ state: 'hidden', timeout: locatorTimeoutMs }).catch(() => {});
  await page.locator('.slds-spinner_container').waitFor({ state: 'hidden', timeout: locatorTimeoutMs }).catch(() => {});

  if (waitForStageText) {
    await page
      .getByText(waitForStageText, { exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: locatorTimeoutMs })
      .catch(() => {});
  }

  const pathArticle = page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: 'Path' }) })
    .first();
  if (await pathArticle.isVisible().catch(() => false)) {
    await pathArticle.scrollIntoViewIfNeeded();
  }

  const safeOppName = opportunityName.replace(/[^a-zA-Z0-9_-]+/g, '_');
  const dir = path.join(resolveScreenshotRoot(), safeOppName);
  fs.mkdirSync(dir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${timestamp}-${slugify(stage)}.png`;
  const filePath = path.join(dir, fileName);

  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[Screenshot] Opportunity stage "${stage}" → ${filePath}`);
  return filePath;
}

module.exports = { captureOpportunityStatusScreenshot };
