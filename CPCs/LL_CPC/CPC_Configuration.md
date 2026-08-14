# LL CPC – Configuration

Playwright automation for **LEGOLAND Dubai** Customer Preference Center.

---

## Identity

| Item | Value |
|------|--------|
| Folder | `LL_CPC` |
| Package | `ll-cpc-automation` `1.0.0` |
| Brand | LEGOLAND Dubai |
| Env prefix | `LL_CPC_` |
| English Cloud Page | `CPC_LL` (CloudPagesURL **2857**) |
| Arabic Cloud Page | `CPC_LL_AR` (CloudPagesURL **3515**) |
| Domain | `cloud.explore.legoland.ae` |

English URL path: `https://cloud.explore.legoland.ae/CPC_LL`  
Arabic URL path: `https://cloud.explore.legoland.ae/CPC_LL_AR`  

Paste the full SFMC email URL (including `qs=` token) into `.env`. Refresh when the token expires.

---

## Batch

| Locale | Offset | Limit | Items |
|--------|--------|-------|-------|
| English | `0` | `50` | **1–50** (first 50) |
| Arabic | `0` | `50` | **1–50** |

Env vars: `LL_CPC_FIELD_OFFSET`, `LL_CPC_FIELD_LIMIT`, `LL_CPC_ARABIC_FIELD_OFFSET`, `LL_CPC_ARABIC_FIELD_LIMIT`.  
Per-field overrides: `LL_CPC_COUNTRY_CODE_*`, `LL_CPC_NATIONALITY_*`, `LL_CPC_COUNTRY_OF_RESIDENCE_*` (and `LL_CPC_ARABIC_*`).

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality-first-50.spec.ts` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence-first-50.spec.ts` |
| Arabic (same fields) | same | `tests/arabic/*.spec.ts` |
| Smoke | `#country-code`, `#nationality` | `tests/ll-cpc-update-profile.spec.ts` |

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
cd LL_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-ll-cpc-first-50.bat --headed
run-ll-cpc-arabic-first-50.bat --headed
run-ll-cpc-update-profile.bat --headed
```

```bash
npm run test:first50:headed
npm run test:arabic-first50:headed
npm run report
```

Smoke defaults: Country code `+971`, Nationality `India`.

---

## Results

```
LL_CPC_English_Results/v{version}/{timestamp}/
LL_CPC_Arabic_Results/v{version}/{timestamp}/
```

Override roots with `LL_CPC_ENGLISH_RESULTS_DIR` / `LL_CPC_ARABIC_RESULTS_DIR`.
