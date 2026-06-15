# Salesforce (Sales Cloud) – Playwright POC

POC automation framework: **Playwright + JavaScript**, Chromium, record-and-play with refined locators for Salesforce QA/UAT.

## Requirements

- **Node.js** 18+
- **Chromium** (installed via Playwright)

## Setup

```bash
npm install
npx playwright install chromium
```

If you see "Executable doesn't exist" when running tests, run `npx playwright install chromium` (or `npx playwright install` for all browsers).

## Locator priority (refinement rule)

All refined scripts use this order:

1. **ID** – `#id` or `[id="..."]`
2. **Name** – `[name="..."]` (inputs, buttons)
3. **Stable XPath** – non-positional (by text, `@id`, `@name`, `@data-*`; no indices)

Fallbacks (e.g. `getByRole`, `getByLabel`) are used when the primary locator fails.

## Record & play (codegen)

Generate Playwright scripts by recording in the browser:

```bash
# Record and copy steps to clipboard / save to file
npm run codegen

# Optional: record and save auth state (e.g. after login) for reuse
npm run codegen:save
```

Then:

1. Paste or save the generated script into `tests/` (e.g. `tests/recorded.spec.js`).
2. Refine locators using `lib/locatorHelper.js`: prefer ID → Name → stable XPath.
3. Replace raw `page.locator(...)` with `getLocator(page, { id, name, stableXPath })` or `clickWithFallback` / `fillWithFallback` where appropriate.
4. Add waits with `lib/waitHelpers.js` (e.g. `waitForSalesforceReady`) where the DOM or network is dynamic.

## Run tests

```bash
# All tests (Chromium)
npm run test

# Chromium only (explicit)
npm run test:chromium

# Headed (see browser)
npm run test:headed

# UI mode (inspect, debug, run)
npm run test:ui
```

## Environment

Copy `.env.example` to `.env` and set:

- `SALESFORCE_BASE_URL` – e.g. `https://login.salesforce.com` or your My Domain
- `SALESFORCE_USERNAME` – login username
- `SALESFORCE_PASSWORD` – login password

Tests that need login are skipped when `SALESFORCE_USERNAME` or `SALESFORCE_PASSWORD` are not set.

## Project layout

```
├── lib/
│   ├── locatorHelper.js   # ID → Name → stable XPath; click/fill with fallback
│   ├── waitHelpers.js     # waitForSalesforceReady, waitForUrl, retryAction
│   └── errors.js          # wrapError, withErrorContext
├── pages/
│   └── SalesforceLoginPage.js   # Login page object (refined locators)
├── tests/
│   ├── salesforce-login.spec.js # Refined login tests (re-runnable)
│   └── example.spec.ts          # Default Playwright sample
├── playwright.config.js        # Chromium, timeouts, baseURL from env
├── .env.example
└── README.md
```

## Re-run and resilience

- **Waits**: `waitForSalesforceReady` (network idle + spinner handling), `waitForStable`, `waitForUrl`.
- **Retries**: Config has `retries: 1` (or 2 on CI); use `retryAction` in helpers for flaky steps.
- **Fallbacks**: `clickWithFallback` / `fillWithFallback` try primary locator then alternatives.
- **Errors**: `withErrorContext` adds context and suggestions when a step fails (e.g. alternative locator).

## When a locator fails

1. Inspect the element in DevTools: prefer **id**, then **name**, then **aria-label** or **data-***.
2. Avoid positional XPath (e.g. `//div[3]/span[2]`). Use `lib/locatorHelper.stableXPath()` for attributes/text.
3. Add a fallback in the page object (e.g. `getByRole('button', { name: /submit/i })`).
4. For LWC/dynamic DOM, add a short wait or `waitForSalesforceReady` before the action.

## Outcome

- **Working test**: `tests/salesforce-login.spec.js` – “login page loads and shows username/password fields” runs without credentials; full login runs when env is set.
- **Reusable base**: `lib/` and `pages/` can be extended for more objects and regression suites.
