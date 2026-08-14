# OB CPC – Configuration

Playwright automation for **Oasis Bay Dubai** Customer Preference Center (QA).

---

## Identity

| Item | Value |
|------|--------|
| Folder | `OB_CPC` |
| Package | `ob-cpc-automation` `1.0.0` |
| Brand | Oasis Bay Dubai (QA) |
| Env prefix | `OB_CPC_` |
| English Cloud Page | `OasisBay_CPC_QA` (`sfid=` token, not `qs=`) |
| Arabic Cloud Page | `OasisBay_AR_CPC_QA` (CloudPagesURL **5236**) |
| Domain | `cloud.explore.oasisbaydubai.com` |

English URL path: `https://cloud.explore.oasisbaydubai.com/OasisBay_CPC_QA`  
Arabic URL path: `https://cloud.explore.oasisbaydubai.com/OasisBay_AR_CPC_QA`  

Paste the full SFMC email URL into `.env`. Refresh when the token expires.

---

## Batch

Two sources disagree. **`.env` wins** if present.

| Source | Offset | Limit | Items |
|--------|--------|-------|-------|
| `.env.example` | `250` | `50` | **251–300** (wraps from item 1 if the list is shorter) |
| `lib/fieldRange.js` + README | `125` | `25` | **126–150** (sixth 25) |

Specs and npm scripts are named `sixth-25` / `test:sixth25`.

Env vars: `OB_CPC_FIELD_OFFSET`, `OB_CPC_FIELD_LIMIT`, `OB_CPC_ARABIC_FIELD_OFFSET`, `OB_CPC_ARABIC_FIELD_LIMIT`.  
Per-field overrides: `OB_CPC_COUNTRY_CODE_*`, `OB_CPC_NATIONALITY_*`, `OB_CPC_COUNTRY_OF_RESIDENCE_*` (and `OB_CPC_ARABIC_*`).

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality-sixth-25.spec.ts` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence-sixth-25.spec.ts` |
| Arabic (same fields) | same | `tests/arabic/*.spec.ts` |
| Smoke | `#country-code`, `#nationality` | `tests/ob-cpc-update-profile.spec.ts` |

Nationality is enabled only when Country of Residence is **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).  
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
cd OB_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-ob-cpc-sixth-25.bat --headed
run-ob-cpc-arabic-sixth-25.bat --headed
run-ob-cpc-update-profile.bat --headed
```

```bash
npm run test:sixth25:headed
npm run test:arabic-sixth25:headed
npm run report
```

Smoke defaults: Country code `+971`, Nationality `India`.

---

## Results

```
OB_CPC_English_Results/v{version}/{timestamp}/
OB_CPC_Arabic_Results/v{version}/{timestamp}/
```

Override roots with `OB_CPC_ENGLISH_RESULTS_DIR` / `OB_CPC_ARABIC_RESULTS_DIR`.
