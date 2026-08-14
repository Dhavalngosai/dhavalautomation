# DPR CPC – Configuration

Playwright automation for **Dubai Parks and Resorts** Customer Preference Center.

---

## Identity

| Item | Value |
|------|--------|
| Folder | `DPR_CPC` |
| Package | `dpr-cpc-automation` `1.0.0` |
| Brand | Dubai Parks and Resorts |
| Env prefix | `DPR_CPC_` |
| English Cloud Page | `CPC_DPR` (CloudPagesURL **2475**) |
| Arabic Cloud Page | `cpc_dpr_ar` (CloudPagesURL **3258**) |
| Domain | `cloud.explore.dubaiparksandresorts.com` |

English URL path: `https://cloud.explore.dubaiparksandresorts.com/CPC_DPR`  
Arabic URL path: `https://cloud.explore.dubaiparksandresorts.com/cpc_dpr_ar`  

Paste the full SFMC email URL (including `qs=` token) into `.env`. Refresh when the token expires.

---

## Batch

| Locale | Offset | Limit | Items |
|--------|--------|-------|-------|
| English | `50` | `50` | **51–100** (second 50) |
| Arabic | `50` | `50` | **51–100** |

Env vars: `DPR_CPC_FIELD_OFFSET`, `DPR_CPC_FIELD_LIMIT`, `DPR_CPC_ARABIC_FIELD_OFFSET`, `DPR_CPC_ARABIC_FIELD_LIMIT`.  
Per-field overrides: `DPR_CPC_COUNTRY_CODE_*`, `DPR_CPC_NATIONALITY_*`, `DPR_CPC_COUNTRY_OF_RESIDENCE_*` (and `DPR_CPC_ARABIC_*`).

To run the first 50 instead: set `DPR_CPC_FIELD_OFFSET=0`.

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality-second-50.spec.ts` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence-second-50.spec.ts` |
| Arabic (same fields) | same | `tests/arabic/*.spec.ts` |
| Smoke | `#country-code`, `#nationality` | `tests/dpr-cpc-update-profile.spec.ts` |

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
cd DPR_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-dpr-cpc-second-50.bat --headed
run-dpr-cpc-arabic-second-50.bat --headed
run-dpr-cpc-update-profile.bat --headed
```

```bash
npm run test:second50:headed
npm run test:arabic-second50:headed
npm run report
```

Smoke defaults: Country code `+971`, Nationality `India`.

---

## Results

```
DPR_CPC_English_Results/v{version}/{timestamp}/
DPR_CPC_Arabic_Results/v{version}/{timestamp}/
```

Override roots with `DPR_CPC_ENGLISH_RESULTS_DIR` / `DPR_CPC_ARABIC_RESULTS_DIR`.
