# TGP Live CPC Automation

Playwright automation for verifying dropdown values on the **The Green Planet Dubai** Customer Preference Center (CPC) Live site.

**English URL:** `https://cloud.explore.thegreenplanetdubai.com/CPC_TGP?qs=...`  
**Arabic URL:** `https://cloud.explore.thegreenplanetdubai.com/CPC_TGP_AR?qs=...`

## Fields verified

| Locale | Field | Selector | Spec |
|--------|-------|----------|------|
| English | Country Code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality.spec.js` |
| English | Country of Residence | `#profileCountry` | `tests/country-of-residence.spec.js` |
| Arabic | Country Code + Nationality (paired) | `#country-code`, `#nationality` | `tests/arabic/country-code-and-nationality.spec.js` |
| Arabic | Country of Residence | `#profileCountry` / Select2 | `tests/arabic/country-of-residence.spec.js` |

The combined script verifies **all** country codes and **all** nationalities in one run — both fields are set together and saved once per iteration. When the lists differ in length, extra iterations continue verifying the remaining values. Country of Residence is a separate script.

## Setup

```bash
cd TGP_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

Update `.env` with a fresh `TGP_CPC_URL` / `TGP_CPC_ARABIC_URL` when the `qs=` token expires.

## Run (English)

### Country Code + Nationality (combined, all values)

```bash
npm run test:country-code-and-nationality
npm run test:country-code-and-nationality:headed
run-tgp-country-code-and-nationality.bat --headed
```

### Country of Residence only

```bash
npm run test:country-of-residence
npm run test:country-of-residence:headed
run-tgp-country-of-residence.bat --headed
```

### All English fields

```bash
npm run test:all-fields
npm run test:all-fields:headed
run-tgp-all-fields.bat --headed
```

## Run (Arabic)

### Country Code + Nationality (combined, all values)

```bash
npm run test:arabic-country-code-and-nationality
npm run test:arabic-country-code-and-nationality:headed
run-tgp-arabic-country-code-and-nationality.bat --headed
```

### Country of Residence only

```bash
npm run test:arabic-country-of-residence
npm run test:arabic-country-of-residence:headed
run-tgp-arabic-country-of-residence.bat --headed
```

### All Arabic fields

```bash
npm run test:arabic-all-fields
npm run test:arabic-all-fields:headed
run-tgp-arabic-all-fields.bat --headed
```

### Smoke (single country code + nationality)

```bash
npm run test:smoke:headed
run-tgp-cpc-update-profile.bat --headed
```

## Batch runs (optional)

By default, **all** values are verified. To run a subset:

```env
TGP_CPC_FIELD_LIMIT=50
TGP_CPC_FIELD_OFFSET=100

# Arabic
TGP_CPC_ARABIC_FIELD_LIMIT=50
TGP_CPC_ARABIC_FIELD_OFFSET=100
```

Per-field overrides: `TGP_CPC_COUNTRY_CODE_LIMIT`, `TGP_CPC_NATIONALITY_LIMIT`, `TGP_CPC_COUNTRY_OF_RESIDENCE_LIMIT` (and matching `_OFFSET` / `TGP_CPC_ARABIC_*` vars).

## Reports

- Terminal: `console.table` summary per test
- HTML report: `npm run report`
- Per-test artifacts: `test-results/<test>/comparison-table.html` and `.json`
- **Version-wise archives** (every run, never overwritten):

```
TGP_CPC_English_Results/v{version}/{timestamp}/
  run-metadata.json
  run-summary.json
  terminal-output.log
  playwright-report/          # full HTML report for this run
  test-results/               # videos, screenshots, per-test artifacts
  {report-slug}/
    comparison-table.html
    comparison-table.json
    report-metadata.json

TGP_CPC_Arabic_Results/v{version}/{timestamp}/
  (same layout)
```

Version comes from `package.json` (or `TGP_CPC_VERSION`). Override roots with `TGP_CPC_ENGLISH_RESULTS_DIR` / `TGP_CPC_ARABIC_RESULTS_DIR`.

## Notes

- English nationality is only enabled when **Country of Residence** is **United Arab Emirates**.
- Arabic nationality is only enabled when **Country of Residence** is **الإمارات العربية المتحدة**.
- Tests open **My Profile** via `#my-profile-tab` before interacting with fields.
- Save uses `#profile-submit` (Arabic falls back to the **حفظ** button if needed).
