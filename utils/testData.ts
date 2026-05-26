export const testData = {
  username: process.env.SALESFORCE_USERNAME ?? '',
  password: process.env.SALESFORCE_PASSWORD ?? '',
  invalidUser: 'wronguser',
  invalidPassword: 'wrongpass',
  /** Partial name for Account lookup on New Opportunity (required if Account is mandatory in your org). */
  accountLookupSearch: process.env.SALESFORCE_TEST_ACCOUNT_SEARCH || '',
  /** Stage label exactly as shown in the Stage picklist (default Prospecting). */
  opportunityStage: process.env.SALESFORCE_OPPORTUNITY_STAGE || 'Prospecting',
};