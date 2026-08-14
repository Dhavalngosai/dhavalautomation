# GV CPC – Configuration

Playwright automation for **Global Village** Customer Preference Center.

---

## Identity

| Item | Value |
|------|--------|
| Folder | `GV_CPC` |
| Package | `gv-cpc-automation` `1.0.0` |
| Brand | Global Village |
| Env prefix | `GV_CPC_` |
| English Cloud Page | `EN_CPC` (CloudPagesURL **3423**) |
| Arabic Cloud Page | `AR_CPC` (CloudPagesURL **3459**) |
| Domain | `cloud.explore.globalvillage.ae` |

English URL path: `https://cloud.explore.globalvillage.ae/EN_CPC`  
Arabic URL path: `https://cloud.explore.globalvillage.ae/AR_CPC`  

Paste the full SFMC email URL (including `qs=` token) into `.env`. Refresh when the token expires.

---

## Batch

| Locale | Offset | Limit | Items |
|--------|--------|-------|-------|
| English | `0` | `25` | **1–25** (first 25) |
| Arabic | `0` | `25` | **1–25** |

Env vars: `GV_CPC_FIELD_OFFSET`, `GV_CPC_FIELD_LIMIT`, `GV_CPC_ARABIC_FIELD_OFFSET`, `GV_CPC_ARABIC_FIELD_LIMIT`.  
Per-field overrides: `GV_CPC_COUNTRY_CODE_*`, `GV_CPC_NATIONALITY_*`, `GV_CPC_COUNTRY_OF_RESIDENCE_*` (and `GV_CPC_ARABIC_*`).

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality-first-25.spec.ts` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence-first-25.spec.ts` |
| Arabic (same fields) | same | `tests/arabic/*.spec.ts` |
| Smoke | `#country-code`, `#nationality` | `tests/gv-cpc-update-profile.spec.ts` |

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
cd GV_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-gv-cpc-first-25.bat --headed
run-gv-cpc-arabic-first-25.bat --headed
run-gv-cpc-update-profile.bat --headed
```

```bash
npm run test:first25:headed
npm run test:arabic-first25:headed
npm run report
```

Smoke defaults: Country code `+971`, Nationality `India`.

---

## Results

```
GV_CPC_English_Results/v{version}/{timestamp}/
GV_CPC_Arabic_Results/v{version}/{timestamp}/
```

Override roots with `GV_CPC_ENGLISH_RESULTS_DIR` / `GV_CPC_ARABIC_RESULTS_DIR`.
