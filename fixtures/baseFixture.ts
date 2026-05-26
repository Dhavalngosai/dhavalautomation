import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SalesforceLoginPage } = require('../pages/SalesforceLoginPage');

export type LoginPage = InstanceType<typeof SalesforceLoginPage>;

type Fixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }: { page: Page }, use: (p: LoginPage) => Promise<void>) => {
    const loginPage = new SalesforceLoginPage(page);
    await use(loginPage);
  },
});

export { expect } from '@playwright/test';
