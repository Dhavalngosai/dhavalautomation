# WW CPC – Configuration

Playwright automation for **Wild Wadi** Customer Preference Center.

---

## Identity

| Item | Value |
|------|--------|
| Folder | `WW_CPC` |
| Package | `ww-cpc-automation` `1.0.0` |
| Brand | Wild Wadi |
| Env prefix | `WW_CPC_` |
| English Cloud Page | `CPC_WW` (CloudPagesURL **3048**) |
| Arabic Cloud Page | `CPC_WW_AR` (CloudPagesURL **3799**) |
| Domain | `cloud.explore.wildwadi.com` |

English URL path: `https://cloud.explore.wildwadi.com/CPC_WW`  
Arabic URL path: `https://cloud.explore.wildwadi.com/CPC_WW_AR`  

Paste the full SFMC email URL (including `qs=` token) into `.env`. Refresh when the token expires.

---

## Batch

| Locale | Offset | Limit | Items |
|--------|--------|-------|-------|
| English | `50` | `25` | **51–75** (third 25) |
| Arabic | `50` | `25` | **51–75** |

Env vars: `WW_CPC_FIELD_OFFSET`, `WW_CPC_FIELD_LIMIT`, `WW_CPC_ARABIC_FIELD_OFFSET`, `WW_CPC_ARABIC_FIELD_LIMIT`.  
Per-field overrides: `WW_CPC_COUNTRY_CODE_*`, `WW_CPC_NATIONALITY_*`, `WW_CPC_COUNTRY_OF_RESIDENCE_*` (and `WW_CPC_ARABIC_*`).

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality-third-25.spec.ts` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence-third-25.spec.ts` |
| Arabic (same fields) | same | `tests/arabic/*.spec.ts` |
| Smoke | `#country-code`, `#nationality` | `tests/ww-cpc-update-profile.spec.ts` |

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
cd WW_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-ww-cpc-third-25.bat --headed
run-ww-cpc-arabic-third-25.bat --headed
run-ww-cpc-update-profile.bat --headed
```

```bash
npm run test:third25:headed
npm run test:arabic-third25:headed
npm run report
```

Smoke defaults: Country code `+971`, Nationality `India`.

---

## Results

```
WW_CPC_English_Results/v{version}/{timestamp}/
WW_CPC_Arabic_Results/v{version}/{timestamp}/
```

Override roots with `WW_CPC_ENGLISH_RESULTS_DIR` / `WW_CPC_ARABIC_RESULTS_DIR`.
