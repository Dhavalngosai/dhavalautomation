/**
 * Resolve Lightning URLs the same way as Case creation: prefer env that points at your org.
 *
 * Priority:
 * 1. SALESFORCE_CASE_NEW_URL – full URL used for Case (e.g. .../lightning/o/Case/new); same origin for Opportunity
 * 2. SALESFORCE_LIGHTNING_HOME_URL – home URL; origin used for /lightning/o/Opportunity/new
 * 3. Current page URL origin (after login redirect)
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} objectApiName - e.g. 'Opportunity', 'Case'
 * @returns {string}
 */
function lightningNewObjectUrl(page, objectApiName) {
  const caseNew = process.env.SALESFORCE_CASE_NEW_URL;
  if (caseNew && String(caseNew).trim()) {
    try {
      const u = new URL(caseNew.trim());
      return `${u.origin}/lightning/o/${objectApiName}/new`;
    } catch {
      /* fall through */
    }
  }

  const home = process.env.SALESFORCE_LIGHTNING_HOME_URL;
  if (home && String(home).trim()) {
    try {
      return `${new URL(home.trim()).origin}/lightning/o/${objectApiName}/new`;
    } catch {
      /* fall through */
    }
  }

  return `${new URL(page.url()).origin}/lightning/o/${objectApiName}/new`;
}

module.exports = { lightningNewObjectUrl };
