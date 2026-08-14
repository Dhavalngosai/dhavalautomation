# TGP CPC – Configuration

Playwright automation for **The Green Planet Dubai** Customer Preference Center (Live).

---

## Identity

| Item | Value |
|------|--------|
| Folder | `TGP_CPC` |
| Package | `tgp-cpc-automation` `1.0.0` |
| Brand | The Green Planet Dubai |
| Env prefix | `TGP_CPC_` |
| English Cloud Page | `CPC_TGP` (CloudPagesURL **2754**) |
| Arabic Cloud Page | `CPC_TGP_AR` (CloudPagesURL **3339**) |
| Domain | `cloud.explore.thegreenplanetdubai.com` |

English URL path: `https://cloud.explore.thegreenplanetdubai.com/CPC_TGP`  
Arabic URL path: `https://cloud.explore.thegreenplanetdubai.com/CPC_TGP_AR`  

Paste the full SFMC email URL (including `qs=` token) into `.env`. Refresh when the token expires.

---

## Batch

**All values** by default (offset `0`, no limit). Optional subset:

```env
TGP_CPC_FIELD_LIMIT=50
TGP_CPC_FIELD_OFFSET=100
TGP_CPC_ARABIC_FIELD_LIMIT=50
TGP_CPC_ARABIC_FIELD_OFFSET=100
```

Per-field overrides: `TGP_CPC_COUNTRY_CODE_*`, `TGP_CPC_NATIONALITY_*`, `TGP_CPC_COUNTRY_OF_RESIDENCE_*` (and `TGP_CPC_ARABIC_*`).

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality.spec.js` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence.spec.js` |
| Arabic (same fields) | same | `tests/arabic/*.spec.js` |
| Smoke | `#country-code`, `#nationality` | `tests/tgp-cpc-update-profile.spec.ts` |

Nationality is enabled only when Country of Residence is **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).  
Save: `#profile-submit` (Arabic may fall back to **حفظ**). Profile tab: `#my-profile-tab`.

---

## Playwright

| Setting | Value |
|---------|--------|
| Config | `playwright.config.js` |
| `testDir` | `./tests` |
| Timeout | `120000` ms |
| Workers | `1` |
| Headless | **always headed** (`headless: false`) |
| Screenshot / video / trace | `only-on-failure` / `on` / `on-first-retry` |
| Reporters | HTML + `terminal-output-reporter.js` + `versioned-results-reporter.js` + list |

The versioned reporter archives comparison tables plus the full `playwright-report` and `test-results` folders.

---

## How to run

```bash
cd TGP_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-tgp-all-fields.bat --headed
run-tgp-arabic-all-fields.bat --headed
run-tgp-cpc-update-profile.bat --headed
```

```bash
npm run test:all-fields:headed
npm run test:arabic-all-fields:headed
npm run test:smoke:headed
npm run report
```

Smoke defaults: Country code `+971`, Nationality `India`.

---

## Results

```
TGP_CPC_English_Results/v{version}/{timestamp}/
  run-metadata.json
  run-summary.json
  terminal-output.log
  playwright-report/
  test-results/
  {report-slug}/comparison-table.html|json

TGP_CPC_Arabic_Results/v{version}/{timestamp}/
  (same layout)
```

Override roots with `TGP_CPC_ENGLISH_RESULTS_DIR` / `TGP_CPC_ARABIC_RESULTS_DIR`.
