import { test, expect } from '../fixtures/baseFixture';
import { testData } from '../utils/testData';

test.describe('Login Tests', () => {
  test('Valid Login', async ({ loginPage, page }) => {
    if (!testData.username || !testData.password) {
      test.skip();
    }
    await loginPage.goto();
    await loginPage.login(testData.username, testData.password);

    await expect(page).toHaveURL(/lightning|salesforce\.com/i);
  });
});