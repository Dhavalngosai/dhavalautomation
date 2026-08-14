# DHE B2B CPC – Configuration

Playwright automation for **DHE B2B** Customer Preference Center.

---

## Identity

| Item | Value |
|------|--------|
| Folder | `DHE_B2B_CPC` |
| Package | `dhe-b2b-cpc-automation` `1.0.0` |
| Brand | DHE B2B |
| Env prefix | `DHE_B2B_CPC_` |
| English Cloud Page | `DHE_B2B_CPC` |
| Arabic Cloud Page | `DHE_B2B_AR_Prod` |
| Domain | `cloud.sales.dhentertainment.ae` |

English URL path: `https://cloud.sales.dhentertainment.ae/DHE_B2B_CPC`  
Arabic URL path: `https://cloud.sales.dhentertainment.ae/DHE_B2B_AR_Prod`  

Paste the full SFMC email URL (including subscriber token) into `.env`. Refresh when the token expires.

This is the only B2B / sales-domain suite.

---

## Batch

| Locale | Offset | Limit | Items |
|--------|--------|-------|-------|
| English | `225` | `999999` (to last value) | **226–end** |
| Arabic | `225` | `999999` (to last value) | **226–end** |

Env vars: `DHE_B2B_CPC_FIELD_OFFSET`, `DHE_B2B_CPC_FIELD_LIMIT`, `DHE_B2B_CPC_ARABIC_FIELD_OFFSET`, `DHE_B2B_CPC_ARABIC_FIELD_LIMIT`.  
Per-field overrides: `DHE_B2B_CPC_COUNTRY_CODE_*`, `DHE_B2B_CPC_COUNTRY_OF_RESIDENCE_*` (and `DHE_B2B_CPC_ARABIC_*`).

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code (Business Phone) | `#country-code` | `tests/country-code-and-nationality-from-226.spec.ts` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence-from-226.spec.ts` |
| Arabic (same fields) | same | `tests/arabic/*.spec.ts` |
| Smoke | `#country-code` | `tests/dhe-b2b-cpc-update-profile.spec.ts` |

**No Nationality field** on the DHE B2B form.  
`openMyProfile` waits for `#country-code` and `#profileCountry` only.  
Specs keep the `country-code-and-nationality-*` name for consistency with other suites.  
Save: `#profile-submit`. Profile tab: `#my-profile-tab`.

---

## Playwright

| Setting | Value |
|---------|--------|
| Config | `playwright.config.js` |
| `testDir` | `./tests` |
| Timeout | `120000` ms |
| Workers | `1` |
| Headless | `true` when `CI` is set |
| Screenshot / video / trace | `only-on-failure` / `on` / `on-first-retry` |
| Reporters | HTML (`playwright-report`) + list |

---

## How to run

```bash
cd DHE_B2B_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-dhe-b2b-cpc-from-226.bat --headed
run-dhe-b2b-cpc-arabic-from-226.bat --headed
run-dhe-b2b-cpc-update-profile.bat --headed
```

```bash
npm run test:from226:headed
npm run test:arabic-from226:headed
npm run report
```

Smoke default: Country code `+971`.

---

## Results

```
DHE_B2B_CPC_English_Results/v{version}/{timestamp}/
DHE_B2B_CPC_Arabic_Results/v{version}/{timestamp}/
```

Override roots with `DHE_B2B_CPC_ENGLISH_RESULTS_DIR` / `DHE_B2B_CPC_ARABIC_RESULTS_DIR`.
